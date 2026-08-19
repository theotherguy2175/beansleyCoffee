import nodemailer from "nodemailer";
import { env } from "../env.js";
import { getSetting, SETTINGS_KEYS } from "./settings.service.js";
import { renderEmailShell, renderEmailShellText, type EmailDetailRow } from "./emailTemplates.js";
import type { User } from "../db/schema.js";
import type { OrderWithSyrups } from "./order.service.js";

function getSmtpCredentials() {
  const user = getSetting(SETTINGS_KEYS.SMTP_USER) || env.SMTP_USER;
  const pass = getSetting(SETTINGS_KEYS.SMTP_PASS) || env.SMTP_PASS;
  return { user, pass };
}

function getTransporter() {
  const { user, pass } = getSmtpCredentials();
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

export function getMakerNotificationEmail() {
  return getSetting(SETTINGS_KEYS.MAKER_NOTIFICATION_EMAIL) || env.MAKER_NOTIFICATION_EMAIL;
}

function formatPickupTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function orderDetailRows(order: OrderWithSyrups): EmailDetailRow[] {
  const pickup = formatPickupTime(order.pickupTime);
  return [
    { label: "Coffee", value: order.coffeeNameSnapshot },
    ...(order.sizeOz ? [{ label: "Size", value: `${order.sizeOz} oz` }] : []),
    ...(order.strengthLabel ? [{ label: "Strength", value: order.strengthLabel }] : []),
    ...(order.syrupNames.length > 0 ? [{ label: "Syrup", value: order.syrupNames.join(", ") }] : []),
    ...(order.notes ? [{ label: "Notes", value: order.notes }] : []),
    { label: "Pickup time", value: pickup },
  ];
}

export async function sendOrderNotification(order: OrderWithSyrups, customer: User): Promise<boolean> {
  const recipient = getMakerNotificationEmail();
  if (!recipient) {
    console.warn("No maker notification email configured; skipping order notification email");
    return false;
  }

  const rows = orderDetailRows(order);
  const heading = "New order";
  const intro = `<strong>${customer.name}</strong> (${customer.email}) just placed an order.`;
  const footerNote = "Sent automatically by BeansleyCoffee when an order is placed.";

  try {
    const { user } = getSmtpCredentials();
    await getTransporter().sendMail({
      from: `BeansleyCoffee <${user}>`,
      to: recipient,
      subject: `New order: ${order.coffeeNameSnapshot} — pickup ${formatPickupTime(order.pickupTime)}`,
      text: renderEmailShellText({ heading, intro: `${customer.name} (${customer.email}) just placed an order.`, rows, footerNote }),
      html: renderEmailShell({ preheader: `New order from ${customer.name}`, heading, intro, rows, footerNote }),
    });
    return true;
  } catch (err) {
    console.error("Failed to send order notification email:", err);
    return false;
  }
}

export async function sendCustomerReceipt(order: OrderWithSyrups, customer: User): Promise<boolean> {
  const rows = orderDetailRows(order);
  const heading = "Order confirmed!";
  const intro = `Thanks, ${customer.name.split(" ")[0]} — your order is in. Here's your receipt.`;
  const footerNote = "This is an automatic receipt from BeansleyCoffee. No reply necessary.";

  try {
    const { user } = getSmtpCredentials();
    await getTransporter().sendMail({
      from: `BeansleyCoffee <${user}>`,
      to: customer.email,
      subject: `Your order: ${order.coffeeNameSnapshot} — pickup ${formatPickupTime(order.pickupTime)}`,
      text: renderEmailShellText({ heading, intro, rows, footerNote }),
      html: renderEmailShell({ preheader: "Your BeansleyCoffee order is confirmed", heading, intro, rows, footerNote }),
    });
    return true;
  } catch (err) {
    console.error("Failed to send customer receipt email:", err);
    return false;
  }
}

export async function sendOrderReadyEmail(order: OrderWithSyrups, customer: User): Promise<boolean> {
  const rows = orderDetailRows(order);
  const heading = "Your coffee is ready! ☕";
  const intro = `Hey ${customer.name.split(" ")[0]} — your order is ready for pickup.`;
  const footerNote = "This is an automatic notification from BeansleyCoffee. No reply necessary.";

  try {
    const { user } = getSmtpCredentials();
    await getTransporter().sendMail({
      from: `BeansleyCoffee <${user}>`,
      to: customer.email,
      subject: `Ready for pickup: ${order.coffeeNameSnapshot}`,
      text: renderEmailShellText({ heading, intro, rows, footerNote }),
      html: renderEmailShell({ preheader: "Your order is ready for pickup", heading, intro, rows, footerNote }),
    });
    return true;
  } catch (err) {
    console.error("Failed to send order-ready email:", err);
    return false;
  }
}

export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = getSmtpCredentials();
    if (!user) {
      return { success: false, error: "No SMTP address configured" };
    }
    await getTransporter().sendMail({
      from: `BeansleyCoffee <${user}>`,
      to,
      subject: "BeansleyCoffee — test email",
      text: "If you're reading this, your SMTP settings are working.",
      html: renderEmailShell({
        preheader: "SMTP test email",
        heading: "Test email",
        intro: "If you're reading this, your SMTP settings are working.",
        rows: [],
        footerNote: "Sent from the BeansleyCoffee admin settings page.",
      }),
    });
    return { success: true };
  } catch (err) {
    console.error("Test email failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
