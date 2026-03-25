import useSWR, { mutate } from 'swr';
import { api } from './api';

export function useFetch<T>(path: string | null) {
  const { data, error, isLoading } = useSWR<T>(
    path,
    (p: string) => api.get<T>(p),
    {}
  );
  return { data, error, isLoading };
}

export { mutate };
