import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function AdminLayout() {
  const { data } = useQuery({
    queryKey: ["admin", "version"],
    queryFn: () => api.get<{ version: string }>("/admin/version"),
    staleTime: Infinity,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <Outlet />
      {data && <div className="mt-8 pb-4 text-center text-xs text-muted-foreground">{data.version}</div>}
    </div>
  );
}
