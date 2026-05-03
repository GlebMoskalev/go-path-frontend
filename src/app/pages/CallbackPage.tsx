import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { setTokens } from '../api';
import { useAuth } from '../context/AuthContext';
import { Eyebrow } from '../design';

export function CallbackPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
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
    run();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen grid place-items-center" style={{ background: 'var(--gp-bg)' }}>
      <div className="text-center">
        {error ? (
          <>
            <Eyebrow marker={false}>Ошибка авторизации</Eyebrow>
            <h2 className="gp-display mt-3" style={{ fontSize: '28px' }}>
              <em>{error}</em>
            </h2>
            <p className="mt-3 text-[13px]" style={{ color: 'var(--gp-ink-3)' }}>
              Возвращаем на главную…
            </p>
          </>
        ) : (
          <>
            <Eyebrow>Подключаемся</Eyebrow>
            <div className="mt-6 inline-flex items-center justify-center">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                aria-hidden
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: '2px solid var(--gp-surface-strong)',
                  borderTopColor: 'var(--gp-ink)',
                  display: 'inline-block',
                }}
              />
            </div>
            <p className="mt-4 text-[13px]" style={{ color: 'var(--gp-ink-3)' }}>
              Ставим подпись на путь…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
