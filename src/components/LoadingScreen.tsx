import React from 'react';

export function LoadingScreen() {
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
      fontFamily: 'monospace',
    }}>
      <div style={{ textAlign: 'center' }}>
        {/* Animated Accent Box */}
        <div style={{
          fontSize: 18,
          color: 'var(--color-accent)',
          textShadow: '0 0 20px var(--color-accent-glow)',
          letterSpacing: 4,
          marginBottom: 16,
          fontWeight: 'bold',
          animation: 'pulse 2s infinite ease-in-out'
        }}>
          CODE REALM
        </div>

        {/* Subtext */}
        <div style={{
          fontSize: 10,
          color: 'var(--color-text-muted)',
          letterSpacing: 2,
          opacity: 0.8
        }}>
          INITIALIZING_SYSTEM...
        </div>

        {/* Simple CSS Loader bar */}
        <div style={{
          width: '120px',
          height: '2px',
          background: 'rgba(255, 255, 255, 0.1)',
          margin: '20px auto 0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            width: '40%',
            height: '100%',
            background: 'var(--color-accent)',
            boxShadow: '0 0 10px var(--color-accent)',
            animation: 'loading-bar 1.5s infinite linear'
          }} />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.98); }
        }
        @keyframes loading-bar {
          0% { left: -40%; }
          100% { left: 140%; }
        }
      `}</style>
    </div>
  );
}