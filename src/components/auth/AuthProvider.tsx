import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../stores/authStore';
import { mapSupabaseUser } from '../../lib/auth';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { login, logout, setLoading } = useAuth();

  useEffect(() => {
    let mounted = true;

    // Safety #1: Check existing session (page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) login(mapSupabaseUser(session.user));
      if (mounted) setLoading(false);
    });

    // Safety #2: Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          login(mapSupabaseUser(session.user));
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          logout();
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          login(mapSupabaseUser(session.user));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [login, logout, setLoading]);

  return <>{children}</>;
};
