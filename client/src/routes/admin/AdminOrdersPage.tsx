import { OrdersBoard } from "@/components/shared/OrdersBoard";

export function AdminOrdersPage() {
  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <div className="mt-6">
        <OrdersBoard />
      </div>
    </div>
  );
}
