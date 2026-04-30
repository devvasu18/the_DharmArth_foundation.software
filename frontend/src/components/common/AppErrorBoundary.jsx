import React from 'react';
import { useRouteError } from 'react-router-dom';

const AppErrorBoundary = () => {
  const error = useRouteError();
  
  // Log the error for debugging
  console.error('Route Error:', error);

  // Handle "Failed to fetch dynamically imported module"
  // This typically happens when a new version is deployed and the user is on an old version
  // The browser tries to fetch a chunk that no longer exists on the server.
  const isChunkLoadFailed = 
    (error instanceof TypeError && 
      (error.message.includes('Failed to fetch dynamically imported module') || 
       error.message.includes('Importing a module script failed') ||
       error.message.includes('error loading dynamically imported module'))) ||
    (error?.name === 'ChunkLoadError') ||
    (error?.message?.includes('chunk')) ||
    (error?.message?.toLowerCase().includes('failed to fetch') && error?.message?.toLowerCase().includes('.js'));

  if (isChunkLoadFailed) {
    // Only reload once to avoid infinite loops if it's a real network error
    const lastReload = sessionStorage.getItem('last-chunk-reload');
    const now = Date.now();
    
    if (!lastReload || now - parseInt(lastReload) > 10000) {
      sessionStorage.setItem('last-chunk-reload', now.toString());
      window.location.reload();
      return null;
    }
  }

  return (
    <div style={{ 
      padding: '40px 20px', 
      textAlign: 'center', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-family, sans-serif)',
      backgroundColor: 'var(--bg-light, #f9f9f9)',
      color: 'var(--text-main, #333)'
    }}>
      <div style={{ 
        maxWidth: '500px',
        padding: '40px',
        backgroundColor: 'var(--bg-white, #fff)',
        borderRadius: 'var(--radius-lg, 12px)',
        boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))'
      }}>
        <div style={{ 
          fontSize: '64px', 
          marginBottom: '24px' 
        }}>
          ✨
        </div>
        <h1 style={{ 
          fontSize: 'var(--text-2xl, 1.5rem)', 
          fontWeight: '700',
          marginBottom: '16px',
          color: 'var(--primary, #00bfa5)'
        }}>
          Application Update
        </h1>
        <p style={{ 
          color: 'var(--text-muted, #666)', 
          fontSize: 'var(--text-base, 1rem)',
          lineHeight: '1.6',
          marginBottom: '32px' 
        }}>
          A new version of the application is available or we've encountered a temporary loading issue. Please refresh to continue.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: 'var(--primary, #00bfa5)',
              color: 'white',
              padding: '12px 32px',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: 'var(--text-base, 1rem)',
              fontWeight: '600',
              transition: 'transform 0.2s, background-color 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-hover, #009e89)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary, #00bfa5)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Refresh & Update
          </button>
        </div>

        {import.meta.env.DEV && (
          <div style={{ 
            marginTop: '32px', 
            textAlign: 'left', 
            backgroundColor: '#f8fafc', 
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            overflow: 'auto'
          }}>
            <p style={{ fontWeight: '600', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
              Developer Debug Information
            </p>
            <pre style={{ 
              fontSize: '12px',
              color: 'var(--danger, #d9534f)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0
            }}>
              {error?.stack || error?.message || String(error)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppErrorBoundary;
