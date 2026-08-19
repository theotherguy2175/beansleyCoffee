import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { useCancelOrder, useMyOrders } from "@/hooks/useOrders";
import { ApiError } from "@/lib/api";
import { formatOrderDetails } from "@/lib/orderFormat";
import type { ReorderState } from "@/routes/customer/OrderPage";
import type { Order } from "@/types/api";

export function OrderHistoryPage() {
  const { data: orders, isLoading } = useMyOrders();
  const cancelOrder = useCancelOrder();
  const navigate = useNavigate();
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  function handleReorder(order: Order) {
    const reorder: ReorderState = {
      notes: order.notes,
      syrupNames: order.syrupNames,
      sizeOz: order.sizeOz,
      strengthLabel: order.strengthLabel,
    };
    navigate(`/order/${order.coffeeId}`, { state: { reorder } });
  }

  async function handleCancel(id: number) {
    setCancellingId(id);
    try {
      await cancelOrder.mutateAsync(id);
      toast.success("Order cancelled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't cancel order");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">My Orders</h1>

      {isLoading && (
        <div className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {!isLoading && orders?.length === 0 && (
        <p className="text-muted-foreground mt-8">
          You haven't ordered anything yet.{" "}
          <Link to="/menu" className="underline underline-offset-4">
            Browse the menu
          </Link>
          .
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {orders?.map((order) => (
          <Card key={order.id}>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{order.coffeeNameSnapshot}</p>
                {formatOrderDetails(order) && (
                  <p className="text-muted-foreground text-sm">{formatOrderDetails(order)}</p>
                )}
                <p className="text-muted-foreground text-sm">Pickup: {new Date(order.pickupTime).toLocaleString()}</p>
                {order.notes && <p className="text-muted-foreground text-sm">Notes: {order.notes}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <OrderStatusBadge status={order.status} />
                <div className="flex gap-2">
                  {order.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(order.id)}
                      loading={cancelOrder.isPending && cancellingId === order.id}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleReorder(order)}>
                    Reorder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
