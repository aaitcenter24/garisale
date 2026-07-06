import React from 'react';

export default function Page() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'radial-gradient(circle at center, #1e1b4b 0%, #09090b 100%)',
      color: '#f4f4f5',
      fontFamily: '"Outfit", "Inter", system-ui, sans-serif',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '3rem 4rem',
        maxWidth: '600px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          background: 'linear-gradient(to right, #38bdf8, #818cf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 1rem 0',
          letterSpacing: '-0.025em'
        }}>
          Garisale Marketplace
        </h1>
        <p style={{
          fontSize: '1.125rem',
          color: '#a1a1aa',
          lineHeight: '1.75',
          margin: '0 0 2rem 0'
        }}>
          Welcome to the future of automotive sales in Bangladesh. The premium dealership ecosystem is currently launching.
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'linear-gradient(to right, #2563eb, #4f46e5)',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
          border: 'none',
          cursor: 'pointer'
        }}>
          Platform Initialized
        </div>
      </div>
    </div>
  );
}
