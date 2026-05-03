import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { LogOut, User, ChevronDown, Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../design/Button';
import { dur, ease } from '../design/motion';
import { GopherAvatar } from './GopherAvatar';

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
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (to: string) => location.pathname.startsWith(to);

  return (
    <header
      className="sticky top-0 z-50 transition-[border-color,background-color] duration-200"
      style={{
        background: 'var(--gp-header-bg)',
        borderBottom: scrolled ? '1px solid var(--gp-border)' : '1px solid transparent',
        backdropFilter: 'saturate(140%) blur(14px)',
        WebkitBackdropFilter: 'saturate(140%) blur(14px)',
      }}
    >
      <div className="gp-container h-[60px] flex items-center justify-between gap-6 !px-5">
        {/* Wordmark — typographic only, no gradient. The accent dot is the only color. */}
        <Link to="/" className="flex items-center gap-2 select-none no-underline" aria-label="Go Path home">
          <span
            aria-hidden
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--gp-accent)' }}
          />
          <span
            className="font-medium text-[15px] tracking-tight"
            style={{ color: 'var(--gp-ink)' }}
          >
            Go Path
          </span>
        </Link>

        {/* Desktop Nav */}
        <LayoutGroup id="nav">
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="relative px-3 py-1.5 text-[13px] rounded-md transition-colors no-underline"
                  style={{
                    color: active ? 'var(--gp-ink)' : 'var(--gp-ink-3)',
                    fontWeight: active ? 500 : 450,
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--gp-ink)'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--gp-ink-3)'; }}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute left-2 right-2 -bottom-[14px] h-px"
                      style={{ background: 'var(--gp-ink)' }}
                      transition={{ duration: dur.slow, ease: ease.emphasized }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </LayoutGroup>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="w-9 h-9 inline-flex items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--gp-ink-3)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gp-surface-muted)'; e.currentTarget.style.color = 'var(--gp-ink)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gp-ink-3)'; }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={resolved}
                initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                transition={{ duration: dur.base, ease: ease.standard }}
                className="inline-flex"
              >
                {resolved === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </motion.span>
            </AnimatePresence>
          </button>

          {isLoading ? (
            <div className="w-[88px] h-8 rounded-md gp-skel" />
          ) : user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-md transition-colors"
                style={{
                  background: dropdownOpen ? 'var(--gp-surface-muted)' : 'transparent',
                  color: 'var(--gp-ink)',
                }}
                onMouseEnter={(e) => { if (!dropdownOpen) e.currentTarget.style.background = 'var(--gp-surface-muted)'; }}
                onMouseLeave={(e) => { if (!dropdownOpen) e.currentTarget.style.background = 'transparent'; }}
              >
                <GopherAvatar size={26} />
                <span className="text-[13px] font-medium max-w-[110px] truncate hidden sm:block">
                  {user.name.split(' ')[0]}
                </span>
                <motion.span animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: dur.fast }}>
                  <ChevronDown size={13} style={{ color: 'var(--gp-ink-4)' }} />
                </motion.span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: dur.base, ease: ease.emphasized }}
                    className="absolute right-0 mt-2 w-[228px] rounded-lg overflow-hidden"
                    style={{
                      background: 'var(--gp-surface)',
                      border: '1px solid var(--gp-border)',
                      boxShadow: 'var(--gp-shadow-lg)',
                    }}
                  >
                    <div className="px-3 pt-3 pb-2.5 border-b" style={{ borderColor: 'var(--gp-border)' }}>
                      <div className="text-[13px] font-medium" style={{ color: 'var(--gp-ink)' }}>{user.name}</div>
                      <div className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--gp-ink-3)' }}>{user.email}</div>
                    </div>
                    <div className="p-1.5">
                      <DropdownItem to="/profile" icon={<User size={14} />} onClick={() => setDropdownOpen(false)}>
                        Профиль
                      </DropdownItem>
                      <DropdownItem onClick={() => { logout(); setDropdownOpen(false); }} icon={<LogOut size={14} />} danger>
                        Выйти
                      </DropdownItem>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={login}
              iconLeft={<GoogleMark />}
            >
              Войти
            </Button>
          )}

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden ml-1 inline-flex items-center justify-center w-9 h-9 rounded-md"
            style={{ color: 'var(--gp-ink-3)' }}
            aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: dur.base, ease: ease.emphasized }}
            className="md:hidden overflow-hidden border-t"
            style={{ borderColor: 'var(--gp-border)', background: 'var(--gp-surface)' }}
          >
            <div className="p-3 grid gap-0.5">
              {navLinks.map((link) => {
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center justify-between px-3 py-2.5 rounded-md no-underline transition-colors"
                    style={{
                      color: active ? 'var(--gp-ink)' : 'var(--gp-ink-3)',
                      background: active ? 'var(--gp-surface-muted)' : 'transparent',
                      fontWeight: active ? 500 : 450,
                      fontSize: '14px',
                    }}
                  >
                    <span>{link.label}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gp-accent)' }} />}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function DropdownItem({
  to, onClick, icon, danger, children,
}: {
  to?: string; onClick?: () => void; icon?: React.ReactNode; danger?: boolean; children: React.ReactNode;
}) {
  const baseStyle: React.CSSProperties = {
    color: danger ? 'var(--gp-danger)' : 'var(--gp-ink-2)',
    fontSize: '13px',
    fontWeight: 500,
    background: 'transparent',
  };
  const cls = 'flex items-center gap-2 w-full px-2.5 py-2 rounded-md no-underline transition-colors';
  const handleHoverEnter = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = 'var(--gp-surface-muted)';
    if (!danger) e.currentTarget.style.color = 'var(--gp-ink)';
  };
  const handleHoverLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.color = danger ? 'var(--gp-danger)' : 'var(--gp-ink-2)';
  };
  if (to) {
    return (
      <Link to={to} className={cls} style={baseStyle} onClick={onClick} onMouseEnter={handleHoverEnter} onMouseLeave={handleHoverLeave}>
        {icon}{children}
      </Link>
    );
  }
  return (
    <button className={cls} style={{ ...baseStyle, border: 'none', cursor: 'pointer' }} onClick={onClick} onMouseEnter={handleHoverEnter} onMouseLeave={handleHoverLeave}>
      {icon}{children}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
