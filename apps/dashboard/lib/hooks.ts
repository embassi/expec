import useSWR, { mutate } from 'swr';
import { api } from './api';

export function useFetch<T>(path: string | null, options?: { fallbackData?: T }) {
  const { data, error, isLoading } = useSWR<T>(
    path,
    (p: string) => api.get<T>(p),
    {
      fallbackData: options?.fallbackData,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );
  return { data, error, isLoading };
}

export { mutate };
