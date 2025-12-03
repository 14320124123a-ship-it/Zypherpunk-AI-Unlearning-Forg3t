import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kremibownwjkayasrfrq.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZW1pYm93bndqa2F5YXNyZnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDg1MTQsImV4cCI6MjA4MDMyNDUxNH0.ZIak0dOdvZSlbtKcRSV6M2JNo_dC1TUaXgNypaVwiW4';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const authService = {
  signUp: async (email: string, password: string, packageType: 'individual' | 'enterprise') => {
    console.log('🔐 Starting signup process for:', email.substring(0, 3) + '***');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          package_type: packageType
        },
        emailRedirectTo: undefined // Disable email confirmation
      }
    });
    
    if (data.user && !error) {
      console.log('✅ Auth signup successful, user ID:', data.user.id);
      
      // Ensure user profile exists in users table
      try {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email || email,
            package_type: packageType
          });
          
        if (profileError && profileError.code !== '23505') { // Ignore duplicate key errors
          console.warn('⚠️ Failed to create user profile:', profileError.message);
        } else {
          console.log('✅ User profile created successfully');
        }
      } catch (profileError) {
        console.warn('⚠️ Profile creation error:', profileError);
      }
    }
    
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
};