import { Toaster } from "@/components/ui/toaster"
import { useState } from 'react';
import SplashScreen from '@/components/SplashScreen';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import Teams from '@/pages/Teams';
import Schedule from '@/pages/Schedule';
import Standings from '@/pages/Standings';
import PlayerStats from '@/pages/PlayerStats';
import Media from '@/pages/Media';
import AboutUs from '@/pages/AboutUs';
import TeamChat from '@/pages/TeamChat';
import Admin from '@/pages/Admin';
import TeamRoster from '@/pages/TeamRoster';
import Login from '@/pages/Login';

// Redirects unauthenticated users to /Login
function RequireAuth({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/Login" replace />;
  return children;
}

// Redirects non-admins to /Home (Admin.jsx also has its own role-check UI)
function RequireAdmin({ children }) {
  const { user, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return null;
  if (user?.role !== 'admin') return <Navigate to="/Home" replace />;
  return children;
}

const AppRoutes = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/Login" element={<Login />} />
      <Route element={<AppLayout />}>
        {/* Public routes — accessible without login */}
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/Teams" element={<Teams />} />
        <Route path="/Schedule" element={<Schedule />} />
        <Route path="/Standings" element={<Standings />} />
        <Route path="/PlayerStats" element={<PlayerStats />} />
        <Route path="/Media" element={<Media />} />
        <Route path="/AboutUs" element={<AboutUs />} />
        <Route path="/TeamRoster/:teamId" element={<TeamRoster />} />
        {/* Auth-required routes */}
        <Route path="/TeamChat" element={
          <RequireAuth><TeamChat /></RequireAuth>
        } />
        {/* Admin-only routes */}
        <Route path="/Admin" element={
          <RequireAuth><RequireAdmin><Admin /></RequireAdmin></RequireAuth>
        } />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App
