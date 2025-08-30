import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export async function getUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

export async function getSession() {
  try {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

export async function signOut() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to sign out:', error);
    throw error;
  }
}