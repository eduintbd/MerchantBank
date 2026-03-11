import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isInvestor: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
    isAdmin: false,
    isInvestor: false,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setState({ user: null, loading: false, isAuthenticated: false, isAdmin: false, isInvestor: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Profile missing — create a basic one from auth metadata
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const meta = authUser.user_metadata || {};
        const fallback = {
          id: userId,
          email: authUser.email || '',
          full_name: meta.full_name || '',
          phone: meta.phone || '',
          role: 'investor' as const,
          kyc_status: 'pending' as const,
          referral_code: 'HERO-' + userId.substring(0, 6).toUpperCase(),
        };
        await supabase.from('profiles').upsert(fallback, { onConflict: 'id' });
        setState({
          user: { ...fallback, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_approved: false } as User,
          loading: false,
          isAuthenticated: true,
          isAdmin: false,
          isInvestor: true,
        });
        return;
      }
      setState(s => ({ ...s, loading: false }));
      return;
    }

    const user = data as User;
    setState({
      user,
      loading: false,
      isAuthenticated: true,
      isAdmin: user.role === 'admin' || user.role === 'manager',
      isInvestor: user.role === 'investor',
    });
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }

  async function signUp(email: string, password: string, fullName: string, phone?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    if (error) return { error: error.message };

    // Auto-create profile (fallback if DB trigger doesn't exist)
    if (data.user) {
      const code = 'HERO-' + data.user.id.substring(0, 6).toUpperCase();
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        phone: phone || '',
        role: 'investor',
        kyc_status: 'pending',
        referral_code: code,
      }, { onConflict: 'id' });
    }

    // If email confirmation is required, user won't be auto-logged-in
    if (data.user && !data.session) {
      return { error: 'Check your email to confirm your account, then login.' };
    }

    return {};
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function updateProfile(data: Partial<User>) {
    if (!state.user) return { error: 'Not authenticated' };
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', state.user.id);
    if (error) return { error: error.message };
    setState(s => ({ ...s, user: s.user ? { ...s.user, ...data } : null }));
    return {};
  }

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
