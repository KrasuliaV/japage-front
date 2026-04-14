import { useGameStore } from '@/stores/gameStore'

const ZONE_LABELS: Record<string, string> = {
    CREATIONAL: '🌿 Entering Creational Forest...',
    STRUCTURAL: '🏰 Entering Structural Castle...',
    BEHAVIORAL: '☠  Entering Behavioral Dungeon...',
}

const ZONE_COLORS: Record<string, string> = {
    CREATIONAL: 'var(--color-hp-high)',
    STRUCTURAL: 'var(--color-accent)',
    BEHAVIORAL: 'var(--color-danger)',
}

export function ZoneLoadingOverlay() {
    const isZoneLoading = useGameStore(s => s.isZoneLoading)
    const zoneTarget = useGameStore(s => s.zoneLoadingTarget)

    if (!isZoneLoading) return null

    const label = (zoneTarget && ZONE_LABELS[zoneTarget]) ?? 'Loading...'
    const color = (zoneTarget && ZONE_COLORS[zoneTarget]) ?? 'var(--color-accent)'

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(10, 14, 26, 0.92)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 200,
                pointerEvents: 'all',
            }}
        >
            {/* Spinner */}
            <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: `3px solid var(--color-border)`,
                borderTopColor: color,
                animation: 'spin 0.8s linear infinite',
                marginBottom: 24,
            }} />

            <div style={{
                fontSize: 12,
                color,
                textShadow: `0 0 12px ${color}`,
                letterSpacing: 2,
                marginBottom: 8,
            }}>
                {label}
            </div>

            <div style={{
                fontSize: 8,
                color: 'var(--color-text-muted)',
                letterSpacing: 1,
            }}>
                Preparing dungeon assets...
            </div>
        </div>
    )
}