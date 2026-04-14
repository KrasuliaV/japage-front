export function getApiErrorStatus(error: unknown): number | undefined {
    return (error as { response?: { status?: number } })?.response?.status
}

export function getApiErrorMessage(error: unknown): string | undefined {
    return (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
}

export function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};