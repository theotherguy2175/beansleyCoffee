import { eq, desc, and } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "../db/client.js";
import { orders, users, type Order } from "../db/schema.js";
import { getCoffeeById } from "./coffee.service.js";
import { findUserById } from "./auth.service.js";
import { listSizes, listSyrups } from "./options.service.js";
import { sendCustomerReceipt, sendOrderNotification, sendOrderReadyEmail } from "./email.service.js";
import { HttpError } from "../middleware/errorHandler.js";

export interface CreateOrderInput {
  coffeeId: number;
  baristaId: number;
  notes?: string;
  pickupTime: string;
  syrupNames?: string[];
  sizeOz?: number;
  strengthLabel?: string;
}

export type OrderWithSyrups = Omit<Order, "syrupNames"> & { syrupNames: string[] };

function withParsedSyrups(order: Order): OrderWithSyrups {
  return { ...order, syrupNames: order.syrupNames ? (JSON.parse(order.syrupNames) as string[]) : [] };
}

export async function createOrder(userId: number, input: CreateOrderInput) {
  const coffee = getCoffeeById(input.coffeeId);
  if (!coffee || !coffee.isAvailable) {
    throw new HttpError(400, "Selected coffee is not available");
  }

  const customer = findUserById(userId);
  if (!customer) {
    throw new HttpError(401, "Unauthorized");
  }

  const barista = findUserById(input.baristaId);
  if (!barista || barista.role === "customer" || !barista.isBarista) {
    throw new HttpError(400, "Selected barista is not available");
  }

  const syrupNames = input.syrupNames?.filter(Boolean) ?? [];
  const availableSyrups = new Set(listSyrups().map((s) => s.name));
  if (syrupNames.some((name) => !availableSyrups.has(name))) {
    throw new HttpError(400, "Selected syrup is not available");
  }
  if (input.sizeOz && !listSizes().some((s) => s.ounces === input.sizeOz)) {
    throw new HttpError(400, "Selected size is not available");
  }
  if (input.strengthLabel && !coffee.strengthOptions.some((s) => s.label === input.strengthLabel)) {
    throw new HttpError(400, "Selected strength is not available for this coffee");
  }

  const order = db
    .insert(orders)
    .values({
      userId,
      coffeeId: coffee.id,
      baristaId: barista.id,
      coffeeNameSnapshot: coffee.name,
      syrupNames: syrupNames.length > 0 ? JSON.stringify(syrupNames) : null,
      sizeOz: input.sizeOz,
      strengthLabel: input.strengthLabel,
      notes: input.notes,
      pickupTime: input.pickupTime,
      status: "pending",
      notificationSent: false,
      createdAt: new Date().toISOString(),
    })
    .returning()
    .get();

  const parsedOrder = withParsedSyrups(order);
  const sent = await sendOrderNotification(parsedOrder, customer, barista);
  if (sent) {
    db.update(orders).set({ notificationSent: true }).where(eq(orders.id, order.id)).run();
    parsedOrder.notificationSent = true;
  }
  await sendCustomerReceipt(parsedOrder, customer);

  return parsedOrder;
}

export function listOrdersForUser(userId: number): OrderWithSyrups[] {
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).all().map(withParsedSyrups);
}

export type OrderWithCustomer = OrderWithSyrups & {
  customerName: string;
  customerEmail: string;
  baristaName: string | null;
};

const orderColumns = {
  id: orders.id,
  userId: orders.userId,
  coffeeId: orders.coffeeId,
  baristaId: orders.baristaId,
  coffeeNameSnapshot: orders.coffeeNameSnapshot,
  syrupNames: orders.syrupNames,
  sizeOz: orders.sizeOz,
  strengthLabel: orders.strengthLabel,
  notes: orders.notes,
  pickupTime: orders.pickupTime,
  status: orders.status,
  notificationSent: orders.notificationSent,
  createdAt: orders.createdAt,
};

const baristas = alias(users, "baristas");

export function listAllOrders(): OrderWithCustomer[] {
  return db
    .select({ ...orderColumns, customerName: users.name, customerEmail: users.email, baristaName: baristas.name })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .leftJoin(baristas, eq(orders.baristaId, baristas.id))
    .orderBy(desc(orders.createdAt))
    .all()
    .map(({ customerName, customerEmail, baristaName, ...order }) => ({
      ...withParsedSyrups(order),
      customerName,
      customerEmail,
      baristaName: baristaName ?? null,
    }));
}

export function getOrderById(id: number): OrderWithSyrups | undefined {
  const order = db.select().from(orders).where(eq(orders.id, id)).get();
  return order ? withParsedSyrups(order) : undefined;
}

export async function updateOrderStatus(id: number, status: Order["status"]) {
  const existing = db.select().from(orders).where(eq(orders.id, id)).get();
  const order = db.update(orders).set({ status }).where(eq(orders.id, id)).returning().get();
  const parsedOrder = withParsedSyrups(order);

  if (status === "ready" && existing?.status !== "ready") {
    const customer = findUserById(order.userId);
    if (customer) await sendOrderReadyEmail(parsedOrder, customer);
  }

  return parsedOrder;
}

export function cancelOwnPendingOrder(id: number, userId: number) {
  const order = db
    .update(orders)
    .set({ status: "cancelled" })
    .where(and(eq(orders.id, id), eq(orders.userId, userId), eq(orders.status, "pending")))
    .returning()
    .get();
  return order ? withParsedSyrups(order) : undefined;
}
