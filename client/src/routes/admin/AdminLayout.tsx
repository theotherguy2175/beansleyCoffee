import { Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <Outlet />
    </div>
  );
}
