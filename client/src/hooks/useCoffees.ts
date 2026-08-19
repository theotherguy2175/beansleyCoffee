import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Coffee } from "@/types/api";

export function useMenu() {
  return useQuery({
    queryKey: ["coffees", "menu"],
    queryFn: () => api.get<Coffee[]>("/coffees"),
  });
}

export function useAllCoffees() {
  return useQuery({
    queryKey: ["coffees", "all"],
    queryFn: () => api.get<Coffee[]>("/coffees/all"),
  });
}

export function useCoffee(id: number | undefined) {
  return useQuery({
    queryKey: ["coffees", id],
    queryFn: () => api.get<Coffee>(`/coffees/${id}`),
    enabled: id !== undefined,
  });
}

function invalidateCoffees(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["coffees"] });
}

export function useCreateCoffee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.post<Coffee>("/coffees", formData),
    onSuccess: () => invalidateCoffees(queryClient),
  });
}

export function useUpdateCoffee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => api.put<Coffee>(`/coffees/${id}`, formData),
    onSuccess: () => invalidateCoffees(queryClient),
  });
}

export function useSetCoffeeAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: number; isAvailable: boolean }) =>
      api.patch<Coffee>(`/coffees/${id}/availability`, { isAvailable }),
    onSuccess: () => invalidateCoffees(queryClient),
  });
}

export function useDeleteCoffee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/coffees/${id}`),
    onSuccess: () => invalidateCoffees(queryClient),
  });
}
