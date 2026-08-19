import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatusBadge, STATUS_LABEL } from "@/components/shared/OrderStatusBadge";
import { useAllOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { ApiError } from "@/lib/api";
import { formatOrderDetails } from "@/lib/orderFormat";
import type { OrderStatus } from "@/types/api";

const STATUS_OPTIONS: OrderStatus[] = ["pending", "in_progress", "ready", "completed", "cancelled"];

type FilterValue = OrderStatus | "all" | "active";

const FILTER_OPTIONS: FilterValue[] = ["active", "all", ...STATUS_OPTIONS];

const FILTER_LABEL: Record<FilterValue, string> = {
  active: "Pending & Ready",
  all: "All statuses",
  ...STATUS_LABEL,
};

function matchesFilter(status: OrderStatus, filter: FilterValue) {
  if (filter === "all") return true;
  if (filter === "active") return status === "pending" || status === "ready";
  return status === filter;
}

export function OrdersBoard() {
  const { data: orders, isLoading } = useAllOrders();
  const updateStatus = useUpdateOrderStatus();
  const [statusFilter, setStatusFilter] = useState<FilterValue>("active");

  async function handleStatusChange(id: number, status: OrderStatus) {
    try {
      await updateStatus.mutateAsync({ id, status });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update order status");
    }
  }

  const filteredOrders = orders?.filter((order) => matchesFilter(order.status, statusFilter));

  const filterControl = (
    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterValue)}>
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {FILTER_OPTIONS.map((filter) => (
          <SelectItem key={filter} value={filter}>
            {FILTER_LABEL[filter]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {filterControl}
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {filterControl}
      {filteredOrders?.length === 0 && (
        <p className="text-muted-foreground">
          {statusFilter === "all"
            ? "No orders yet."
            : statusFilter === "active"
              ? "No pending or ready orders."
              : `No ${FILTER_LABEL[statusFilter].toLowerCase()} orders.`}
        </p>
      )}
      {filteredOrders?.map((order) => (
        <Card key={order.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium">{order.coffeeNameSnapshot}</p>
              {order.customerName && (
                <p className="text-muted-foreground text-sm">
                  {order.customerName}
                  {order.customerEmail && ` · ${order.customerEmail}`}
                </p>
              )}
              {formatOrderDetails(order) && (
                <p className="text-muted-foreground text-sm">{formatOrderDetails(order)}</p>
              )}
              <p className="text-muted-foreground text-sm">Pickup: {new Date(order.pickupTime).toLocaleString()}</p>
              {order.notes && <p className="text-muted-foreground text-sm">Notes: {order.notes}</p>}
            </div>
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={order.status} />
              <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}>
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
