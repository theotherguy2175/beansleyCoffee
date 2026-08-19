import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/api";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  in_progress: "default",
  ready: "default",
  completed: "outline",
  cancelled: "destructive",
};

// "Ready" needs to stand out from the rest at a glance — a barista scanning the
// board should spot ready-for-pickup orders instantly, so it gets its own color
// instead of sharing the default brown with "in progress".
const STATUS_CLASSNAME: Partial<Record<OrderStatus, string>> = {
  ready: "bg-green-600 text-white dark:bg-green-500 dark:text-green-950",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={STATUS_CLASSNAME[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
