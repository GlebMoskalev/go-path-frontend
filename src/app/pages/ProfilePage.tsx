import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Edit2, Check, X, Calendar, Clock, Mail, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', background: 'var(--go-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ color: 'var(--go-text)', marginBottom: '8px' }}>Требуется авторизация</h2>
          <p style={{ color: 'var(--go-muted)', marginBottom: '20px' }}>Войдите через Google для просмотра профиля</p>
          <Link to="/" style={{ color: 'var(--go-cyan)', textDecoration: 'none' }}>← На главную</Link>
        </div>
      </div>
    );
  }

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateUser({ name: nameInput.trim() });
    }
    setEditingName(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ background: 'var(--go-bg)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--go-text)', letterSpacing: '-0.02em', marginBottom: '32px' }}>
          Профиль
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            background: 'var(--go-surface)',
            border: '1px solid var(--go-border)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={user.picture}
                alt={user.name}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '2px solid var(--go-border-2)',
                  background: 'var(--go-surface-2)',
                }}
              />
              {user.is_active && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--go-green)',
                    border: '2px solid var(--go-surface)',
                  }}
                />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--go-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                  Имя
                </div>
                {editingName ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') { setEditingName(false); setNameInput(user.name); }
                      }}
                      autoFocus
                      style={{
                        background: 'var(--go-surface-2)',
                        border: '1px solid var(--go-cyan)',
                        borderRadius: '8px',
                        color: 'var(--go-text)',
                        fontSize: '16px',
                        fontWeight: 700,
                        padding: '6px 10px',
                        outline: 'none',
                        fontFamily: 'Manrope, sans-serif',
                        width: '200px',
                      }}
                    />
                    <button
                      onClick={handleSaveName}
                      style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        background: 'var(--go-green-muted)', border: '1px solid var(--go-green-muted)',
                        color: 'var(--go-green)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => { setEditingName(false); setNameInput(user.name); }}
                      style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        color: 'var(--go-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--go-text)' }}>{user.name}</span>
                    <button
                      onClick={() => { setEditingName(true); setNameInput(user.name); }}
                      style={{
                        background: 'none', border: 'none', color: 'var(--go-muted)', cursor: 'pointer',
                        padding: '3px', borderRadius: '6px', display: 'flex', alignItems: 'center',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--go-text)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--go-muted)')}
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'var(--go-surface-2)',
                  borderRadius: '9px',
                  border: '1px solid var(--go-border-2)',
                  width: 'fit-content',
                }}
              >
                <Mail size={13} style={{ color: 'var(--go-muted)' }} />
                <span style={{ fontSize: '13px', color: 'var(--go-muted)' }}>{user.email}</span>
                <span style={{ fontSize: '10px', color: 'var(--go-subtle)', background: 'var(--go-border-2)', padding: '1px 6px', borderRadius: '5px' }}>только чтение</span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              paddingTop: '24px',
              borderTop: '1px solid var(--go-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={15} style={{ color: 'var(--go-subtle)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--go-subtle)', marginBottom: '2px' }}>Регистрация</div>
                <div style={{ fontSize: '13px', color: 'var(--go-muted)' }}>{formatDate(user.created_at)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={15} style={{ color: 'var(--go-subtle)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--go-subtle)', marginBottom: '2px' }}>Последний вход</div>
                <div style={{ fontSize: '13px', color: 'var(--go-muted)' }}>{formatDate(user.last_login_at)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={15} style={{ color: 'var(--go-subtle)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--go-subtle)', marginBottom: '2px' }}>ID</div>
                <div style={{ fontSize: '13px', color: 'var(--go-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {user.id.slice(0, 8)}...
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
