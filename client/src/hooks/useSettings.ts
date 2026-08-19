import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SystemSettings } from "@/types/api";

export function useSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<SystemSettings>("/admin/settings"),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, string>) => api.put<SystemSettings>("/admin/settings", settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "settings"] }),
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: (to?: string) => api.post<{ success: boolean; error?: string }>("/admin/settings/test-email", { to }),
  });
}
