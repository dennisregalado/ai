# Supabase Anonymous Authentication Migration

## Current Issues ❌

Your current implementation has these problems:

1. **Manual user creation** - Chat route manually checks/creates users, but your `handle_new_user()` trigger already handles this automatically
2. **Custom anonymous system** - Using cookies (`lib/anonymous-session-server.ts`) instead of Supabase's native anonymous auth
3. **Fighting Supabase** - Working against Supabase's built-in features instead of leveraging them

## Migration Steps 🔄

### 1. Enable Anonymous Auth in Supabase Dashboard
```bash
# In your Supabase dashboard:
Authentication → Settings → Enable Anonymous sign-ins
```

### 2. Run Database Migration
```bash
supabase migration new anonymous_users
# Copy content from supabase/migrations/002_anonymous_users.sql
supabase db push
```

### 3. Replace Files

**Remove these files:**
- `lib/anonymous-session-server.ts`
- `lib/types/anonymous.ts`
- Any other custom anonymous session logic

**Add these new files:**
- `lib/auth/anonymous-auth.ts` (created above)
- `components/anonymous-auth.tsx` (created above)
- `supabase/migrations/002_anonymous_users.sql` (created above)

### 4. Update Chat Route

Replace the anonymous logic in your chat route:

```typescript
// REMOVE this block (lines ~144-200):
if (userId) {
  const user = await getUserById({ userId });
  if (!user) {
    return new Response('User not found', { status: 404 });
  }
} else {
  // Custom anonymous session logic...
  anonymousSession = await getAnonymousSession();
  // ... etc
}

// REPLACE with:
let user = await getUser();
if (!user) {
  user = await getOrCreateAnonymousUser();
  if (!user) {
    return new Response('Failed to create user session', { status: 500 });
  }
}

const userId = user.id;
const isAnonymous = isAnonymousUser(user);
```

### 5. Update Client Components

Add anonymous auth handler to your layout:

```typescript
// In app/(chat)/layout.tsx
import { AnonymousAuthHandler } from '@/components/anonymous-auth';

export default function ChatLayout({ children }) {
  return (
    <div>
      <AnonymousAuthHandler />
      {children}
    </div>
  );
}
```

### 6. Update RLS Policies

The new migration adds policies that:
- Allow anonymous users to create chats (but they're private-only)
- Restrict anonymous users from modifying user data
- Provide cleanup functions for anonymous users

### 7. Environment Variables

No new environment variables needed! Supabase handles anonymous auth automatically.

## Benefits of This Approach ✅

1. **Native Supabase** - Uses built-in anonymous authentication
2. **Automatic cleanup** - Supabase can automatically clean up anonymous users
3. **Seamless conversion** - Anonymous users can easily convert to permanent accounts
4. **Better security** - RLS policies automatically protect data
5. **No cookies** - No custom session management needed
6. **JWT claims** - Use `is_anonymous` claim to distinguish users

## Usage Examples

### Anonymous User Creation
```typescript
// Automatic - happens when user visits app without auth
const user = await getOrCreateAnonymousUser();
```

### Convert Anonymous to Permanent
```typescript
// Link email to anonymous user
const { data, error } = await supabase.auth.updateUser({
  email: 'user@example.com',
});

// After email verification, add password
const { data: passwordData } = await supabase.auth.updateUser({
  password: 'securepassword',
});
```

### Check if User is Anonymous
```typescript
const isAnon = isAnonymousUser(user);
if (isAnon) {
  // Show upgrade prompt
  // Limit features
}
```

## Testing

1. **Anonymous Flow**: Visit app without signing in - should auto-create anonymous user
2. **Chat Creation**: Anonymous users should be able to create private chats
3. **Conversion**: Anonymous users should be able to sign up and keep their data
4. **Limitations**: Anonymous users should have restricted model/tool access

## Cleanup

To remove old anonymous users:
```sql
SELECT cleanup_anonymous_users(1); -- Remove anonymous users older than 1 day
```

## Key Differences

| Old (Custom) | New (Supabase Native) |
|-------------|----------------------|
| Cookie-based sessions | JWT-based authentication |
| Manual credit tracking | Database-enforced limits |
| Custom cleanup logic | Built-in Supabase features |
| Client-server state sync | Automatic auth state management |
| Manual rate limiting | Can use Supabase's built-in limits |

This migration will make your anonymous user system much more robust and aligned with Supabase best practices!
