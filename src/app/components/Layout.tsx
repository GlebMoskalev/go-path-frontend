import { Outlet } from 'react-router';
import { Header } from './Header';

export function Layout() {
  return (
    <div style={{ minHeight: '100vh', background: '#0F111A' }}>
      <Header />
      <Outlet />
    </div>
  );
}
