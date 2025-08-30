import Form from 'next/form';

import { signOut } from '@/lib/auth/supabase-auth';
import { redirect } from 'next/navigation';

export const SignOutForm = () => {
  return (
    <Form
      className="w-full"
      action={async () => {
        'use server';

        await signOut();
        redirect('/');
      }}
    >
      <button
        type="submit"
        className="w-full text-left px-1 py-0.5 text-red-500"
      >
        Sign out
      </button>
    </Form>
  );
};
