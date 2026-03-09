import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Edit2, Check, X, Calendar, Clock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', background: '#0F111A' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ color: '#F1F5F9', marginBottom: '8px' }}>Требуется авторизация</h2>
          <p style={{ color: '#94A3B8', marginBottom: '20px' }}>Войдите через Google для просмотра профиля</p>
          <Link to="/" style={{ color: '#00ADD8', textDecoration: 'none' }}>← На главную</Link>
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
    <div style={{ background: '#0F111A', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em', marginBottom: '32px' }}>
          Профиль
        </h1>

        {/* Profile card */}
        <div
          style={{
            background: '#141824',
            border: '1px solid #1E2A3A',
            borderRadius: '14px',
            padding: '32px',
            marginBottom: '20px',
          }}
        >
          {/* Avatar + info */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={user.picture}
                alt={user.name}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '2px solid #253047',
                  background: '#1A2035',
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
                    background: '#10B981',
                    border: '2px solid #141824',
                  }}
                />
              )}
            </div>

            <div style={{ flex: 1 }}>
              {/* Name */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
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
                        background: '#1A2035',
                        border: '1px solid #00ADD8',
                        borderRadius: '6px',
                        color: '#F1F5F9',
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
                        width: '30px', height: '30px', borderRadius: '6px',
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                        color: '#10B981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => { setEditingName(false); setNameInput(user.name); }}
                      style={{
                        width: '30px', height: '30px', borderRadius: '6px',
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#F1F5F9' }}>{user.name}</span>
                    <button
                      onClick={() => { setEditingName(true); setNameInput(user.name); }}
                      style={{
                        background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer',
                        padding: '3px', borderRadius: '4px', display: 'flex', alignItems: 'center',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: '#1A2035',
                  borderRadius: '7px',
                  border: '1px solid #253047',
                  width: 'fit-content',
                }}
              >
                <Mail size={13} style={{ color: '#94A3B8' }} />
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>{user.email}</span>
                <span style={{ fontSize: '10px', color: '#64748B', background: '#253047', padding: '1px 6px', borderRadius: '3px' }}>только чтение</span>
              </div>
            </div>
          </div>

          {/* Meta info */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              paddingTop: '24px',
              borderTop: '1px solid #1E2A3A',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={15} style={{ color: '#64748B', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>Регистрация</div>
                <div style={{ fontSize: '13px', color: '#94A3B8' }}>{formatDate(user.created_at)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={15} style={{ color: '#64748B', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>Последний вход</div>
                <div style={{ fontSize: '13px', color: '#94A3B8' }}>{formatDate(user.last_login_at)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={15} style={{ color: '#64748B', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>ID</div>
                <div style={{ fontSize: '13px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>
                  {user.id.slice(0, 8)}...
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
