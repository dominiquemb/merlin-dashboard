import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] Initializing auth, hash:', window.location.hash);
    
    // Check active sessions and sets the user
    // This also handles OAuth callback with hash fragments (#access_token=...)
    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Getting session...');
        // Get session - Supabase automatically processes hash fragments
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('[AuthContext] Session:', session ? 'exists' : 'none', error ? `error: ${error.message}` : '');
        
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Clean up hash fragment after session is loaded
        if (window.location.hash) {
          console.log('[AuthContext] Cleaning up hash fragment');
          const path = window.location.pathname;
          const search = window.location.search;
          window.history.replaceState(null, '', path + search);
        }
      } catch (err) {
        console.error('[AuthContext] Error initializing auth:', err);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] Auth state changed:', event, session ? 'has session' : 'no session');
      
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle OAuth callback - clean up hash fragment after Supabase processes it
      if (event === 'SIGNED_IN' && session) {
        console.log('[AuthContext] User signed in, cleaning hash');
        // Clean up hash fragment after successful sign in
        setTimeout(() => {
          if (window.location.hash) {
            const path = window.location.pathname;
            const search = window.location.search;
            window.history.replaceState(null, '', path + search);
            console.log('[AuthContext] Hash cleaned, new URL:', path + search);
          }
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up with email and password
  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  };

  // Sign in with Microsoft OAuth
  const signInWithMicrosoft = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: 'email',
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithMicrosoft,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
