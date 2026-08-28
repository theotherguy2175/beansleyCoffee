import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Barista, PublicUser, Role } from "@/types/api";

export function useUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.get<PublicUser[]>("/admin/users"),
  });
}

export function useBaristas() {
  return useQuery({
    queryKey: ["baristas"],
    queryFn: () => api.get<Barista[]>("/baristas"),
  });
}

export function useUser(id: number | undefined) {
  return useQuery({
    queryKey: ["admin", "users", id],
    queryFn: () => api.get<PublicUser>(`/admin/users/${id}`),
    enabled: id !== undefined,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string; name: string; role: Role; isBarista?: boolean }) =>
      api.post<PublicUser>("/admin/users", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number; email?: string; name?: string; role?: Role; isBarista?: boolean }) =>
      api.put<PublicUser>(`/admin/users/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["baristas"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) =>
      api.post(`/admin/users/${id}/reset-password`, { newPassword }),
  });
}
