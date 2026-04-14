import { ErrorResponse } from '@/types'
export interface AxiosErrorResponse {
  response?: {
    status: number;
    data: ErrorResponse;
  };
}

export function isAxiosError(e: unknown): e is AxiosErrorResponse {
  return (
    typeof e === 'object' &&
    e !== null &&
    'response' in e &&
    typeof (e as any).response?.data === 'object'
  );
}