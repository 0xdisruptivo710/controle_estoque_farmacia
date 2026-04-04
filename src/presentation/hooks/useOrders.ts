'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/infrastructure/supabase/client';
import { SupabaseOrderRepository } from '@/infrastructure/repositories/SupabaseOrderRepository';
import { SupabaseStockRepository } from '@/infrastructure/repositories/SupabaseStockRepository';
import { SupabaseCustomerRepository } from '@/infrastructure/repositories/SupabaseCustomerRepository';
import { CreateOrderUseCase } from '@/application/use-cases/orders/CreateOrderUseCase';
import { UpdateOrderStatusUseCase } from '@/application/use-cases/orders/UpdateOrderStatusUseCase';
import type { CreateOrderDTO, UpdateOrderStatusDTO } from '@/application/dtos/OrderDTO';
import { useAuthStore } from '@/store/authStore';

function getOrderRepo() {
  return new SupabaseOrderRepository(createClient());
}

export function useOrders(filters: { status?: string; page?: number; limit?: number } = {}) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['orders', user?.pharmacyId, filters],
    queryFn: () => getOrderRepo().findByPharmacy(user!.pharmacyId, filters),
    enabled: !!user?.pharmacyId,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderRepo().findById(id),
    enabled: !!id,
  });
}

export function useCustomerOrders(customerId: string, filters: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['customer-orders', customerId, filters],
    queryFn: () => getOrderRepo().findByCustomer(customerId, filters),
    enabled: !!customerId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateOrderDTO) => {
      const supabase = createClient();
      const useCase = new CreateOrderUseCase(
        new SupabaseOrderRepository(supabase),
        new SupabaseStockRepository(supabase),
        new SupabaseCustomerRepository(supabase),
      );
      return useCase.execute(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto: UpdateOrderStatusDTO }) => {
      const useCase = new UpdateOrderStatusUseCase(getOrderRepo());
      return useCase.execute(orderId, dto);
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['stock-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}
