'use client';

import { create } from 'zustand';

interface UserProfile {
  id: string;
  pharmacyId: string;
  fullName: string;
  role: 'admin' | 'pharmacist' | 'attendant';
  email: string;
  avatarUrl?: string;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isLoading: false }),
}));
