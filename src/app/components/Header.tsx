import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { LogOut, User, ChevronDown, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/theory', label: 'Теория' },
  { to: '/tasks', label: 'Задачи' },
  { to: '/quiz', label: 'Квизы' },
  { to: '/projects', label: 'Проекты' },
];

export function Header() {
  const { user, login, logout, isLoading } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (to: string) => location.pathname.startsWith(to);

  return (
    <header
      style={{
        background: 'rgba(15,17,26,0.92)',
        borderBottom: '1px solid #1E2A3A',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link
          to="/"
          className="flex-shrink-0 select-none"
          style={{ textDecoration: 'none' }}
        >
          <span
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 800,
              fontSize: '22px',
              letterSpacing: '-0.04em',
              color: '#00ADD8',
            }}
          >
            GO
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                color: isActive(link.to) ? '#F1F5F9' : '#94A3B8',
                fontWeight: isActive(link.to) ? 600 : 500,
                fontSize: '14px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: isActive(link.to) ? '#1A2035' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isActive(link.to)) {
                  (e.currentTarget as HTMLElement).style.color = '#F1F5F9';
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#141824';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(link.to)) {
                  (e.currentTarget as HTMLElement).style.color = '#94A3B8';
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div
              style={{
                width: '84px',
                height: '32px',
                borderRadius: '6px',
                background: '#1A2035',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ) : user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px 4px 4px',
                  borderRadius: '8px',
                  background: dropdownOpen ? '#1A2035' : 'transparent',
                  border: '1px solid',
                  borderColor: dropdownOpen ? '#253047' : 'transparent',
                  cursor: 'pointer',
                  color: '#F1F5F9',
                }}
              >
                <img
                  src={user.picture}
                  alt={user.name}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#1A2035',
                    border: '1px solid #253047',
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 500, maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '200px',
                    background: '#141824',
                    border: '1px solid #1E2A3A',
                    borderRadius: '10px',
                    padding: '6px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                >
                  <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid #1E2A3A', marginBottom: '4px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{user.email}</div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      color: '#94A3B8',
                      fontSize: '13px',
                      fontWeight: 500,
                      textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#1A2035';
                      (e.currentTarget as HTMLElement).style.color = '#F1F5F9';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = '#94A3B8';
                    }}
                  >
                    <User size={14} />
                    Профиль
                  </Link>
                  <button
                    onClick={() => { logout(); setDropdownOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      color: '#94A3B8',
                      fontSize: '13px',
                      fontWeight: 500,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#1A2035';
                      (e.currentTarget as HTMLElement).style.color = '#EF4444';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = '#94A3B8';
                    }}
                  >
                    <LogOut size={14} />
                    Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={login}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 16px',
                borderRadius: '8px',
                background: '#00ADD8',
                border: 'none',
                color: '#0F111A',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#00C4F5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#00ADD8')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Войти через Google
            </button>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden"
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div
          style={{
            background: '#141824',
            borderTop: '1px solid #1E2A3A',
            padding: '12px 16px',
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: 'block',
                padding: '10px 12px',
                borderRadius: '6px',
                color: isActive(link.to) ? '#00ADD8' : '#94A3B8',
                fontWeight: isActive(link.to) ? 600 : 500,
                fontSize: '15px',
                textDecoration: 'none',
                marginBottom: '2px',
                background: isActive(link.to) ? '#1A2035' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
