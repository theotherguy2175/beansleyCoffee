import { Link, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { useOrder } from "@/hooks/useOrders";
import { formatOrderDetails } from "@/lib/orderFormat";

export function OrderReceiptPage() {
  const { orderId } = useParams();
  const { data: order, isLoading } = useOrder(Number(orderId));

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!order) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center text-muted-foreground">Order not found.</div>;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="text-primary size-10" />
          <CardTitle className="mt-2">Order placed!</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <Separator />
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Coffee</dt>
              <dd className="font-medium">{order.coffeeNameSnapshot}</dd>
            </div>
            {formatOrderDetails(order) && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Details</dt>
                <dd className="font-medium">{formatOrderDetails(order)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Pickup time</dt>
              <dd className="font-medium">{new Date(order.pickupTime).toLocaleString()}</dd>
            </div>
            {order.notes && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground shrink-0">Notes</dt>
                <dd className="text-right font-medium">{order.notes}</dd>
              </div>
            )}
          </dl>
          <Separator />
          <p className="text-muted-foreground text-xs">
            {order.notificationSent
              ? "The maker has been notified of your order."
              : "We placed your order, but couldn't confirm the maker's email notification went through."}
          </p>
          <Button asChild variant="outline">
            <Link to="/orders">View order history</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
