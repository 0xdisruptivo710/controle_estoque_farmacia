'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/infrastructure/supabase/client';
import { SupabaseReminderRepository } from '@/infrastructure/repositories/SupabaseReminderRepository';
import { ScheduleReminderUseCase } from '@/application/use-cases/reminders/ScheduleReminderUseCase';
import type { ScheduleReminderDTO, UpdateReminderDTO } from '@/application/dtos/ReminderDTO';
import { useAuthStore } from '@/store/authStore';

function getRepo() {
  return new SupabaseReminderRepository(createClient());
}

export function useReminders(filters: { status?: string; page?: number; limit?: number } = {}) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['reminders', user?.pharmacyId, filters],
    queryFn: () => getRepo().findByPharmacy(user!.pharmacyId, filters),
    enabled: !!user?.pharmacyId,
  });
}

export function useReminder(id: string) {
  return useQuery({
    queryKey: ['reminder', id],
    queryFn: () => getRepo().findById(id),
    enabled: !!id,
  });
}

export function useScheduleReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: ScheduleReminderDTO) => {
      const useCase = new ScheduleReminderUseCase(getRepo());
      return useCase.execute(dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useUpdateReminderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string; extras?: UpdateReminderDTO }) => {
      return getRepo().updateStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}
