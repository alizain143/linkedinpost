'use client';

import { useAuth } from '@clerk/nextjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

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

    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof payload.error === 'string'
          ? payload.error
          : 'API request failed',
      );
    }

    return payload.data as T;
  }

  return { request };
}
