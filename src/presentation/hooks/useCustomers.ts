'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/infrastructure/supabase/client';
import { SupabaseCustomerRepository } from '@/infrastructure/repositories/SupabaseCustomerRepository';
import { CreateCustomerUseCase } from '@/application/use-cases/customers/CreateCustomerUseCase';
import { UpdateCustomerUseCase } from '@/application/use-cases/customers/UpdateCustomerUseCase';
import type { CreateCustomerDTO, UpdateCustomerDTO } from '@/application/dtos/CustomerDTO';
import type { CustomerFilters } from '@/domain/repositories/ICustomerRepository';
import { useAuthStore } from '@/store/authStore';

function getRepo() {
  return new SupabaseCustomerRepository(createClient());
}

export function useCustomers(filters: CustomerFilters = {}) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['customers', user?.pharmacyId, filters],
    queryFn: () => getRepo().findByPharmacy(user!.pharmacyId, filters),
    enabled: !!user?.pharmacyId,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => getRepo().findById(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCustomerDTO) => {
      const useCase = new CreateCustomerUseCase(getRepo());
      return useCase.execute(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCustomerDTO }) => {
      const useCase = new UpdateCustomerUseCase(getRepo());
      return useCase.execute(id, dto);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => getRepo().softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
