import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Edit2, Check, X, Trash2, AlertTriangle, Calendar, Clock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const { user, logout, updateUser, deleteUser } = useAuth();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

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

  const handleDelete = async () => {
    if (deleteConfirm.toLowerCase() === 'удалить') {
      try {
        await deleteUser();
        navigate('/');
      } catch (error) {
        console.error('Delete account error:', error);
      }
    }
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

        {/* Danger zone */}
        <div
          style={{
            background: '#141824',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '14px',
            padding: '24px 28px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#EF4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            Опасная зона
          </h2>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '16px', lineHeight: '1.5' }}>
            Удаление аккаунта необратимо. Все данные о прогрессе, решённых задачах и проектах будут потеряны.
          </p>
          <button
            onClick={() => setShowDeleteDialog(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '8px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#EF4444',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
          >
            <Trash2 size={14} />
            Удалить аккаунт
          </button>
        </div>
      </div>

      {/* Delete dialog */}
      {showDeleteDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteDialog(false); }}
        >
          <div
            style={{
              background: '#141824',
              border: '1px solid #1E2A3A',
              borderRadius: '14px',
              padding: '32px',
              maxWidth: '440px',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={16} style={{ color: '#EF4444' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.01em' }}>
                Удалить аккаунт?
              </h3>
            </div>

            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.6', marginBottom: '20px' }}>
              Это действие нельзя отменить. Все данные будут удалены навсегда.
              Для подтверждения введите слово <strong style={{ color: '#EF4444' }}>удалить</strong>:
            </p>

            <input
              type="text"
              placeholder="удалить"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#1A2035',
                border: '1px solid #253047',
                borderRadius: '8px',
                color: '#F1F5F9',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '16px',
                fontFamily: 'Manrope, sans-serif',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#EF4444')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#253047')}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowDeleteDialog(false); setDeleteConfirm(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid #253047',
                  color: '#94A3B8',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirm.toLowerCase() !== 'удалить'}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: deleteConfirm.toLowerCase() === 'удалить' ? '#EF4444' : '#253047',
                  border: 'none',
                  color: deleteConfirm.toLowerCase() === 'удалить' ? '#fff' : '#64748B',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: deleteConfirm.toLowerCase() === 'удалить' ? 'pointer' : 'not-allowed',
                  fontFamily: 'Manrope, sans-serif',
                }}
              >
                Удалить навсегда
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
