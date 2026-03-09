import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { setTokens } from '../api';
import { useAuth } from '../context/AuthContext';

export function CallbackPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          setTokens(accessToken, refreshToken);
          await refreshUser();
          navigate('/', { replace: true });
        } else {
          throw new Error('Токены не получены');
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError(err instanceof Error ? err.message : 'Ошибка авторизации');
        setTimeout(() => navigate('/', { replace: true }), 2000);
      }
    };

    handleCallback();
  }, [navigate, refreshUser]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--go-bg)',
    }}>
      <div style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <div style={{ fontSize: '16px', color: 'var(--go-red)', marginBottom: '8px' }}>
              {error}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--go-muted)' }}>
              Перенаправление...
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '14px', color: 'var(--go-muted)', marginBottom: '16px' }}>
              Авторизация...
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid var(--go-border)',
                borderTopColor: 'var(--go-cyan)',
                borderRadius: '50%',
                margin: '0 auto',
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
