import { CoffeeManageList } from "@/components/shared/CoffeeManageList";

export function AdminMenuPage() {
  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold">Manage Menu</h1>
      <div className="mt-6">
        <CoffeeManageList basePath="/admin/menu" />
      </div>
    </div>
  );
}
