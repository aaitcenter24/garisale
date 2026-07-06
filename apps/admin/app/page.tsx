import React from 'react';

export default function Page() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
      color: '#f8fafc',
      fontFamily: '"Outfit", "Inter", system-ui, sans-serif',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.2)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        padding: '3rem 4rem',
        maxWidth: '600px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          background: 'linear-gradient(to right, #34d399, #059669)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 1rem 0',
          letterSpacing: '-0.025em'
        }}>
          Garisale Dealer OS
        </h1>
        <p style={{
          fontSize: '1.125rem',
          color: '#94a3b8',
          lineHeight: '1.75',
          margin: '0 0 2rem 0'
        }}>
          Admin Panel & Control Hub. Manage dealer accounts, monitor vehicle inventory, and orchestrate automation rules.
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'linear-gradient(to right, #059669, #10b981)',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
          border: 'none',
          cursor: 'pointer'
        }}>
          Control Center Initialized
        </div>
      </div>
    </div>
  );
}
