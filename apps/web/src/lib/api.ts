'use client';

import { useAuth } from '@clerk/nextjs';
import { apiBaseUrl, authHeaders, parseApiResponse } from '@/lib/api/client';

export function useApiClient() {
  const { getToken } = useAuth();

  async function request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const token = await getToken();
    const headers = new Headers(init.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      headers,
    });

    return parseApiResponse<T>(response);
  }

  return { request };
}
