export type AlertVariant = 'error' | 'warning' | 'info'

export const GLOBAL_ALERT_EVENT = 'global-ui-alert'

export type GlobalAlertDetail = {
  title?: string
  message: string
  variant?: AlertVariant
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error
  if (typeof error === 'string') return new Error(error)

  try {
    return new Error(JSON.stringify(error))
  } catch {
    return new Error('An unknown error occurred')
  }
}

export function dispatchGlobalAlert(detail: GlobalAlertDetail) {
  window.dispatchEvent(
    new CustomEvent<GlobalAlertDetail>(GLOBAL_ALERT_EVENT, {
      detail: {
        variant: 'error',
        ...detail,
      },
    }),
  )
}

export function notifyGlobalError(error: unknown, title = 'Something went wrong') {
  const normalizedError = toError(error)

  dispatchGlobalAlert({
    title,
    message: normalizedError.message || 'A background task failed. Please try again.',
    variant: 'error',
  })
}
