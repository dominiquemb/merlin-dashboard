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
    let mounted = true;
    
    // Check active sessions and sets the user
    // This also handles OAuth callback with hash fragments (#access_token=...)
    const initializeAuth = async () => {
      try {
        // Get session - Supabase automatically processes hash fragments
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event, session ? 'has session' : 'no session');
      
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle OAuth callback - clean up hash fragment after Supabase processes it
      if (event === 'SIGNED_IN' && session) {
        // Clean up hash after a delay to ensure everything is processed
        setTimeout(() => {
          if (!mounted) return;
          const hash = window.location.hash;
          if (hash && hash.includes('access_token')) {
            const path = window.location.pathname;
            const search = window.location.search;
            window.history.replaceState(null, '', path + search);
          }
        }, 100);
      }
      
      // Handle sign out
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing user state');
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
      if (error) {
        // Check if the error is due to account being created via OAuth
        if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
          // Try to get user info to check if account exists
          const { data: userData } = await supabase.auth.admin?.getUserByEmail(email) || { data: null };
          if (!userData) {
            // Check if user exists via OAuth
            return { 
              data: null, 
              error: 'Invalid login credentials. If you signed up with Google or Microsoft, please use "Continue with Google" or "Continue with Microsoft" to sign in.' 
            };
          }
        }
        throw error;
      }
      return { data, error: null };
    } catch (error) {
      // Provide more helpful error messages
      let errorMessage = error.message;
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid login credentials. If you signed up with Google or Microsoft, please use the OAuth buttons to sign in. Otherwise, please check your email and password, or use "Forgot password?" to reset it.';
      }
      return { data: null, error: errorMessage };
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
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
      // Try to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // Even if there's an error, clear the user state locally
      // This handles cases where the session is already expired
      setUser(null);
      
      if (error) {
        // Log the error but don't throw - we'll still clear local state
        console.warn('Supabase signOut error (but clearing local state anyway):', error.message);
        return { error: error.message };
      }
      
      return { error: null };
    } catch (error) {
      // Clear user state even on exception
      setUser(null);
      console.warn('SignOut exception (but clearing local state anyway):', error);
      return { error: error.message || 'Unknown error' };
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
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
