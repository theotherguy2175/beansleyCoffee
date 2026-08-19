import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CoffeeType, SizeOption, Syrup } from "@/types/api";

export function useCoffeeTypes() {
  return useQuery({ queryKey: ["coffee-types"], queryFn: () => api.get<CoffeeType[]>("/coffee-types") });
}

export function useCreateCoffeeType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<CoffeeType>("/coffee-types", { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coffee-types"] }),
  });
}

export function useDeleteCoffeeType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/coffee-types/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coffee-types"] }),
  });
}

export function useSyrups() {
  return useQuery({ queryKey: ["syrups"], queryFn: () => api.get<Syrup[]>("/syrups") });
}

export function useCreateSyrup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<Syrup>("/syrups", { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["syrups"] }),
  });
}

export function useDeleteSyrup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/syrups/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["syrups"] }),
  });
}

export function useSizes() {
  return useQuery({ queryKey: ["sizes"], queryFn: () => api.get<SizeOption[]>("/sizes") });
}

export function useCreateSize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ounces: number) => api.post<SizeOption>("/sizes", { ounces }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sizes"] }),
  });
}

export function useDeleteSize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/sizes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sizes"] }),
  });
}
