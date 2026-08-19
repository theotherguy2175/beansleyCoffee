import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "staff", "customer"] })
    .notNull()
    .default("customer"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const coffeeTypes = sqliteTable("coffee_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const syrups = sqliteTable("syrups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const sizes = sqliteTable("sizes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ounces: integer("ounces").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const coffees = sqliteTable("coffees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  imagePath: text("image_path"),
  isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  coffeeTypeId: integer("coffee_type_id").references(() => coffeeTypes.id, { onDelete: "set null" }),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const coffeeStrengthOptions = sqliteTable("coffee_strength_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  coffeeId: integer("coffee_id")
    .notNull()
    .references(() => coffees.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  coffeeId: integer("coffee_id")
    .notNull()
    .references(() => coffees.id),
  coffeeNameSnapshot: text("coffee_name_snapshot").notNull(),
  syrupNames: text("syrup_names"), // JSON-encoded string[]
  sizeOz: integer("size_oz"),
  strengthLabel: text("strength_label"),
  notes: text("notes"),
  pickupTime: text("pickup_time").notNull(),
  status: text("status", {
    enum: ["pending", "in_progress", "ready", "completed", "cancelled"],
  })
    .notNull()
    .default("pending"),
  notificationSent: integer("notification_sent", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Coffee = typeof coffees.$inferSelect;
export type NewCoffee = typeof coffees.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type CoffeeType = typeof coffeeTypes.$inferSelect;
export type Syrup = typeof syrups.$inferSelect;
export type SizeOption = typeof sizes.$inferSelect;
export type CoffeeStrengthOption = typeof coffeeStrengthOptions.$inferSelect;
