import { MenuOptionsManager } from "@/components/shared/MenuOptionsManager";

export function AdminMenuOptionsPage() {
  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold">Menu Options</h1>
      <div className="mt-6">
        <MenuOptionsManager />
      </div>
    </div>
  );
}
