import type { Order } from "@/types/api";

export function formatOrderDetails(order: Order): string | null {
  const parts = [
    order.sizeOz ? `${order.sizeOz} oz` : null,
    order.strengthLabel,
    order.syrupNames.length > 0 ? `${order.syrupNames.join(", ")} syrup` : null,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}
