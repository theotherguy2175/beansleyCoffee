import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/types/api";

export function useMyOrders() {
  return useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => api.get<Order[]>("/orders/mine"),
  });
}

export function useAllOrders() {
  return useQuery({
    queryKey: ["orders", "all"],
    queryFn: () => api.get<Order[]>("/orders"),
    refetchInterval: 15_000,
  });
}

export function useOrder(id: number | undefined) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => api.get<Order>(`/orders/${id}`),
    enabled: id !== undefined,
  });
}

export interface CreateOrderInput {
  coffeeId: number;
  baristaId: number;
  notes?: string;
  pickupTime: string;
  syrupNames?: string[];
  sizeOz?: number;
  strengthLabel?: string;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => api.post<Order>("/orders", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch<Order>(`/orders/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) => api.patch<Order>(`/orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}
