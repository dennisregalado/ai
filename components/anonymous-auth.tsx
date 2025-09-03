'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function AnonymousAuthHandler() {
  const router = useRouter();

  useEffect(() => {
    async function ensureAuth() {
      const supabase = createClient();

      // Check if user is already authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Create anonymous user if none exists
        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
          console.error('Failed to create anonymous session:', error);
          return;
        }

        console.log('Created anonymous user:', data.user?.id);
        // Optionally refresh to update auth state
        router.refresh();
      }
    }

    ensureAuth();
  }, [router]);

  return null; // This is a utility component with no UI
}

export function ConvertAnonymousUserButton() {
  const handleConvert = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.is_anonymous) {
      // Redirect to sign up with a flag to convert anonymous user
      window.location.href = '/auth/signup?convert=true';
    }
  };

  return (
    <button
      onClick={handleConvert}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Create Account
    </button>
  );
}
