import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { LogOut, User, ChevronDown, Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navLinks = [
  { to: '/theory', label: 'Теория' },
  { to: '/tasks', label: 'Задачи' },
  { to: '/quiz', label: 'Квизы' },
  { to: '/projects', label: 'Проекты' },
];

export function Header() {
  const { user, login, logout, isLoading } = useAuth();
  const { resolved, toggle } = useTheme();
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
      className="sticky top-0 z-50"
      style={{
        background: 'var(--go-header-bg)',
        borderBottom: '1px solid var(--go-border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 select-none" style={{ textDecoration: 'none' }}>
          <span style={{
            fontWeight: 800,
            fontSize: '22px',
            letterSpacing: '-0.04em',
            color: 'var(--go-cyan)',
          }}>
            GO
          </span>
          <span style={{
            fontWeight: 600,
            fontSize: '22px',
            letterSpacing: '-0.04em',
            color: 'var(--go-text)',
            marginLeft: '2px',
          }}>
            PATH
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                position: 'relative',
                color: isActive(link.to) ? 'var(--go-text)' : 'var(--go-muted)',
                fontWeight: isActive(link.to) ? 600 : 500,
                fontSize: '14px',
                padding: '6px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'color 0.2s, background-color 0.2s',
                backgroundColor: isActive(link.to) ? 'var(--go-cyan-muted)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive(link.to)) {
                  e.currentTarget.style.color = 'var(--go-text)';
                  e.currentTarget.style.backgroundColor = 'var(--go-surface)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(link.to)) {
                  e.currentTarget.style.color = 'var(--go-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'transparent',
              border: '1px solid transparent',
              color: 'var(--go-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--go-text)';
              e.currentTarget.style.backgroundColor = 'var(--go-surface)';
              e.currentTarget.style.borderColor = 'var(--go-border)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--go-muted)';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={resolved}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {resolved === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </motion.div>
            </AnimatePresence>
          </button>

          {isLoading ? (
            <div style={{
              width: '84px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--go-surface)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ) : user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 10px 4px 4px',
                  borderRadius: '10px',
                  background: dropdownOpen ? 'var(--go-surface)' : 'transparent',
                  border: '1px solid',
                  borderColor: dropdownOpen ? 'var(--go-border)' : 'transparent',
                  cursor: 'pointer',
                  color: 'var(--go-text)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!dropdownOpen) {
                    e.currentTarget.style.background = 'var(--go-surface)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!dropdownOpen) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <img
                  src={user.picture}
                  alt={user.name}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--go-surface)',
                    border: '1px solid var(--go-border)',
                  }}
                />
                <span style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  maxWidth: '110px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {user.name.split(' ')[0]}
                </span>
                <motion.div
                  animate={{ rotate: dropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={14} style={{ color: 'var(--go-subtle)' }} />
                </motion.div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '200px',
                      background: 'var(--go-surface)',
                      border: '1px solid var(--go-border)',
                      borderRadius: '12px',
                      padding: '6px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    }}
                  >
                    <div style={{
                      padding: '8px 10px 10px',
                      borderBottom: '1px solid var(--go-border)',
                      marginBottom: '4px',
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--go-text)' }}>{user.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--go-muted)', marginTop: '2px' }}>{user.email}</div>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        color: 'var(--go-muted)',
                        fontSize: '13px',
                        fontWeight: 500,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--go-surface-2)';
                        e.currentTarget.style.color = 'var(--go-text)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--go-muted)';
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
                        borderRadius: '8px',
                        color: 'var(--go-muted)',
                        fontSize: '13px',
                        fontWeight: 500,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--go-surface-2)';
                        e.currentTarget.style.color = 'var(--go-red)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--go-muted)';
                      }}
                    >
                      <LogOut size={14} />
                      Выйти
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={login}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 16px',
                borderRadius: '10px',
                background: 'var(--go-cyan)',
                border: 'none',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.01em',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--go-cyan-hover)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--go-cyan)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Войти
            </button>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--go-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              overflow: 'hidden',
              background: 'var(--go-surface)',
              borderTop: '1px solid var(--go-border)',
            }}
          >
            <div style={{ padding: '12px 16px' }}>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    display: 'block',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    color: isActive(link.to) ? 'var(--go-cyan)' : 'var(--go-muted)',
                    fontWeight: isActive(link.to) ? 600 : 500,
                    fontSize: '15px',
                    textDecoration: 'none',
                    marginBottom: '2px',
                    background: isActive(link.to) ? 'var(--go-cyan-muted)' : 'transparent',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
