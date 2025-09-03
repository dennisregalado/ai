import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export async function getOrCreateAnonymousUser(): Promise<User | null> {
  const supabase = await createClient();

  // Check if user is already authenticated (including anonymous)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return user;
  }

  // Create anonymous user
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error('Failed to create anonymous user:', error);
    return null;
  }

  return data.user;
}

export async function convertAnonymousToUser(email: string, password: string) {
  const supabase = await createClient();

  // Link email identity to anonymous user
  const { data, error } = await supabase.auth.updateUser({
    email: email,
  });

  if (error) {
    throw error;
  }

  // After email verification, update with password
  return data;
}

export function isAnonymousUser(user: User | null): boolean {
  if (!user) return false;

  // Check for is_anonymous claim in JWT
  return user.is_anonymous === true;
}
