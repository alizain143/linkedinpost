'use client';

import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api/fetch';

export function useApiClient() {
  const { getToken } = useAuth();

  async function request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    return apiFetch<T>(token, path, init);
  }

  return { request };
}
