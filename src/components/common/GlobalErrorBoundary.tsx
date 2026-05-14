import { Component, type CSSProperties, type ErrorInfo, type ReactNode } from 'react'
import { GLOBAL_ALERT_EVENT, type GlobalAlertDetail } from './errorAlerts'

type GlobalAlertState = Required<GlobalAlertDetail> & {
  id: number
}

type Props = {
  children: ReactNode
  /**
   * Optional label used in console logs and fallback copy for localized boundaries.
   */
  boundaryName?: string
  /**
   * If true, only this subtree is replaced by the fallback instead of the full app shell.
   */
  localized?: boolean
}

type State = {
  hasError: boolean
  error?: Error
  alert?: GlobalAlertState
}

const baseButtonStyle = {
  border: 0,
  borderRadius: '999px',
  cursor: 'pointer',
  fontWeight: 700,
  padding: '0.75rem 1.1rem',
} satisfies CSSProperties

export class GlobalErrorBoundary extends Component<Props, State> {
  private alertTimer?: number

  state: State = {
    hasError: false,
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      alert: {
        id: Date.now(),
        title: 'Something went wrong',
        message: error.message || 'The application hit an unexpected rendering error.',
        variant: 'error',
      },
    }
  }

  componentDidMount() {
    window.addEventListener(GLOBAL_ALERT_EVENT, this.handleGlobalAlert as EventListener)
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[${this.props.boundaryName ?? 'GlobalErrorBoundary'}] Render error:`, error)
    console.error(`[${this.props.boundaryName ?? 'GlobalErrorBoundary'}] Component stack:${errorInfo.componentStack}`)
  }

  componentWillUnmount() {
    window.removeEventListener(GLOBAL_ALERT_EVENT, this.handleGlobalAlert as EventListener)

    if (this.alertTimer) {
      window.clearTimeout(this.alertTimer)
    }
  }

  private handleGlobalAlert = (event: CustomEvent<GlobalAlertDetail>) => {
    const detail = event.detail

    if (!detail?.message) return

    if (this.alertTimer) {
      window.clearTimeout(this.alertTimer)
    }

    this.setState({
      alert: {
        id: Date.now(),
        title: detail.title ?? 'Something went wrong',
        message: detail.message,
        variant: detail.variant ?? 'error',
      },
    })

    this.alertTimer = window.setTimeout(() => {
      this.setState({ alert: undefined })
    }, 7000)
  }

  private resetError = () => {
    if (this.alertTimer) {
      window.clearTimeout(this.alertTimer)
    }

    this.setState({
      hasError: false,
      error: undefined,
      alert: undefined,
    })
  }

  private dismissAlert = () => {
    if (this.alertTimer) {
      window.clearTimeout(this.alertTimer)
    }

    this.setState({ alert: undefined })
  }

  render() {
    const { hasError, error, alert } = this.state
    const { children, boundaryName, localized = false } = this.props

    return (
      <>
        {hasError ? (
          <ErrorFallback
            error={error}
            localized={localized}
            boundaryName={boundaryName}
            onReset={this.resetError}
          />
        ) : (
          children
        )}
        {alert ? <InlineAlert alert={alert} onDismiss={this.dismissAlert} /> : null}
      </>
    )
  }
}

function ErrorFallback({
  error,
  localized,
  boundaryName,
  onReset,
}: {
  error?: Error
  localized: boolean
  boundaryName?: string
  onReset: () => void
}) {
  return (
    <section
      role="alert"
      aria-live="assertive"
      style={{
        minHeight: localized ? 'auto' : '100vh',
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: localized ? '1.5rem' : '2rem',
        background: localized
          ? 'rgba(15, 23, 42, 0.92)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)',
        color: '#f8fafc',
        position: localized ? 'relative' : 'fixed',
        inset: localized ? undefined : 0,
        zIndex: localized ? 20 : 9999,
      }}
    >
      <div
        style={{
          maxWidth: '34rem',
          border: '1px solid rgba(248, 250, 252, 0.16)',
          borderRadius: '1.5rem',
          padding: '2rem',
          background: 'rgba(15, 23, 42, 0.78)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: '0 0 0.75rem', color: '#fca5a5', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {localized ? `${boundaryName ?? 'This section'} failed` : 'Application error'}
        </p>
        <h1 style={{ margin: '0 0 1rem', fontSize: localized ? '1.5rem' : '2.25rem' }}>Something went wrong</h1>
        <p style={{ margin: '0 0 1.5rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          {localized
            ? 'This module could not be displayed, but the rest of the app is still available.'
            : 'We hit an unexpected problem while rendering the app. Please try again.'}
        </p>
        {error?.message ? (
          <pre
            style={{
              margin: '0 0 1.5rem',
              maxHeight: '8rem',
              overflow: 'auto',
              borderRadius: '0.75rem',
              background: 'rgba(2, 6, 23, 0.72)',
              color: '#fecaca',
              padding: '0.9rem',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              fontSize: '0.85rem',
            }}
          >
            {error.message}
          </pre>
        ) : null}
        <button
          type="button"
          onClick={onReset}
          style={{
            ...baseButtonStyle,
            background: '#f8fafc',
            color: '#0f172a',
          }}
        >
          Try Again
        </button>
      </div>
    </section>
  )
}

function InlineAlert({ alert, onDismiss }: { alert: GlobalAlertState; onDismiss: () => void }) {
  const isError = alert.variant === 'error'

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: '1rem',
        bottom: '1rem',
        zIndex: 10000,
        maxWidth: 'min(28rem, calc(100vw - 2rem))',
        borderRadius: '1rem',
        border: `1px solid ${isError ? 'rgba(248, 113, 113, 0.45)' : 'rgba(96, 165, 250, 0.45)'}`,
        background: 'rgba(15, 23, 42, 0.96)',
        color: '#f8fafc',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
        padding: '1rem',
      }}
    >
      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
        <div
          aria-hidden="true"
          style={{
            width: '0.75rem',
            height: '0.75rem',
            borderRadius: '999px',
            marginTop: '0.35rem',
            background: isError ? '#f87171' : '#60a5fa',
            flex: '0 0 auto',
          }}
        />
        <div style={{ flex: 1 }}>
          <strong style={{ display: 'block', marginBottom: '0.35rem' }}>{alert.title}</strong>
          <span style={{ color: '#cbd5e1', lineHeight: 1.5 }}>{alert.message}</span>
        </div>
        <button
          type="button"
          aria-label="Dismiss alert"
          onClick={onDismiss}
          style={{
            ...baseButtonStyle,
            padding: '0.25rem 0.5rem',
            background: 'transparent',
            color: '#cbd5e1',
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
