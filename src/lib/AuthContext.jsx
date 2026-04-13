import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  // Ref so the onAuthStateChange closure always sees the latest user value
  // without needing to re-subscribe every time user changes.
  const userRef = useRef(null);

  // Merge auth.user + profiles row into the shape the rest of the app expects:
  // user.email, user.full_name, user.role, user.team_id, user.team_name
  const buildUser = async (authUser) => {
    if (!authUser) return null;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('profiles query timeout')), 8000)
    );
    const query = supabase.from('profiles').select('*').eq('id', authUser.id).single();
    const { data: profile } = await Promise.race([query, timeoutPromise]).catch(() => ({ data: null }));

    if (!profile) {
      // Profile fetch failed or timed out. If we already have a cached user for
      // this auth ID, return it unchanged so the role is never silently downgraded.
      // This covers token refreshes, tab switches, and any transient network hiccup.
      if (userRef.current?.id === authUser.id) return userRef.current;
      // Fresh login with no cached user (e.g. first-time OAuth login) — create a
      // profile row so subsequent logins find it, using Google metadata if available.
      const newProfile = {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        role: 'user',
        team_id: null,
        team_name: null,
      };
      await supabase.from('profiles').upsert(newProfile);
      return { ...newProfile, email: authUser.email };
    }

    return {
      id: authUser.id,
      email: authUser.email,
      full_name: profile.full_name || '',
      role: profile.role || 'user',
      team_id: profile.team_id || null,
      team_name: profile.team_name || null,
    };
  };

  const refreshUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const u = await buildUser(authUser);
      userRef.current = u;
      setUser(u);
    }
  };

  useEffect(() => {
    // Safety net: never hang on loading forever
    const timeout = setTimeout(() => setIsLoadingAuth(false), 5000);

    // Restore session on mount
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        try {
          if (session?.user) {
            const u = await buildUser(session.user);
            userRef.current = u;
            setUser(u);
            setIsAuthenticated(true);
          }
        } catch (err) {
          console.error('AuthContext: error restoring session', err);
        } finally {
          clearTimeout(timeout);
          setIsLoadingAuth(false);
        }
      })
      .catch((err) => {
        console.error('AuthContext: getSession failed', err);
        clearTimeout(timeout);
        setIsLoadingAuth(false);
      });

    // Keep in sync with Supabase auth events (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            const u = await buildUser(session.user);
            // buildUser falls back to userRef.current if the profile fetch fails,
            // so u is always a valid user object — never silently demotes the role.
            userRef.current = u;
            setUser(u);
            setIsAuthenticated(true);
          } else {
            userRef.current = null;
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error('AuthContext: error in auth state change', err);
        } finally {
          setIsLoadingAuth(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Replaces base44.auth.updateMe({ team_id, team_name, full_name })
  const updateMe = async (updates) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (error) throw error;
    await refreshUser();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('gsl-auth');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Kept for API compatibility — components call navigateToLogin() to send
  // unauthenticated users to the login page.
  const navigateToLogin = () => {
    window.location.href = '/Login';
  };

  // Legacy alias — PlayerProfileForm calls checkAppState() after saving
  const checkAppState = refreshUser;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      // Legacy compat stubs so components that check these don't error
      isLoadingPublicSettings: false,
      authError: null,
      logout,
      navigateToLogin,
      refreshUser,
      updateMe,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
