import { Outlet } from 'react-router';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="min-h-screen relative" style={{ background: 'var(--gp-bg)', color: 'var(--gp-ink)' }}>
      <Header />
      <main className="relative">
        <Outlet />
      </main>
    </div>
  );
}
