import { Outlet } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { GopherMoodProvider } from '../context/GopherMoodContext';

export function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GopherMoodProvider>
          <Outlet />
        </GopherMoodProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
