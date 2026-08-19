import { CoffeeManageList } from "@/components/shared/CoffeeManageList";

export function StaffMenuListPage() {
  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold">Manage Menu</h1>
      <div className="mt-6">
        <CoffeeManageList basePath="/staff/menu" />
      </div>
    </div>
  );
}
