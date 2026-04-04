'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/infrastructure/supabase/client';
import { SupabaseStockRepository } from '@/infrastructure/repositories/SupabaseStockRepository';
import { RegisterStockMovementUseCase } from '@/application/use-cases/stock/RegisterStockMovementUseCase';
import { GetStockDashboardUseCase } from '@/application/use-cases/stock/GetStockDashboardUseCase';
import { CheckStockAlertsUseCase } from '@/application/use-cases/stock/CheckStockAlertsUseCase';
import type { RegisterStockMovementDTO, CreateStockItemDTO } from '@/application/dtos/StockDTO';
import { useAuthStore } from '@/store/authStore';

function getRepo() {
  return new SupabaseStockRepository(createClient());
}

export function useStockDashboard() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['stock-dashboard', user?.pharmacyId],
    queryFn: () => {
      const useCase = new GetStockDashboardUseCase(getRepo());
      return useCase.execute(user!.pharmacyId);
    },
    enabled: !!user?.pharmacyId,
  });
}

export function useStockAlerts() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['stock-alerts', user?.pharmacyId],
    queryFn: () => {
      const useCase = new CheckStockAlertsUseCase(getRepo());
      return useCase.execute(user!.pharmacyId);
    },
    enabled: !!user?.pharmacyId,
    refetchInterval: 60000,
  });
}

export function useStockItemsByProduct(productId: string) {
  return useQuery({
    queryKey: ['stock-items', productId],
    queryFn: () => getRepo().findStockItemsByProduct(productId),
    enabled: !!productId,
  });
}

export function useCreateStockItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateStockItemDTO) => getRepo().createStockItem(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    },
  });
}

export function useRegisterStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: RegisterStockMovementDTO) => {
      const useCase = new RegisterStockMovementUseCase(getRepo());
      return useCase.execute(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    },
  });
}
