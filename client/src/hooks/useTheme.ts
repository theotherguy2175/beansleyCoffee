import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SystemSettings, ThemeColors } from "@/types/api";

export function useTheme() {
  return useQuery({
    queryKey: ["theme"],
    queryFn: () => api.get<ThemeColors>("/theme"),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (theme: ThemeColors) => api.put<SystemSettings>("/admin/settings", theme),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });
}

export function useResetTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<SystemSettings>("/admin/settings/theme"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });
}
