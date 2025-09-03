-- Enable anonymous authentication in Supabase dashboard or via config

-- Update RLS policies to handle anonymous users
-- Anonymous users should have more restrictive access

-- Drop existing policies that need updates
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can modify own chats" ON public.chats;

-- Recreate user policies with anonymous restrictions
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Authenticated users can modify own data" ON public.users
  FOR UPDATE USING (
    auth.uid() = id AND 
    (auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE
  );

-- Anonymous users can create chats but with restrictions
CREATE POLICY "Users can view own chats" ON public.chats
  FOR SELECT USING (user_id = auth.uid() OR visibility = 'public');

CREATE POLICY "Authenticated users can modify own chats" ON public.chats
  FOR ALL USING (
    user_id = auth.uid() AND
    (auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE
  );

-- Anonymous users can create chats (but they'll be temporary/limited)
CREATE POLICY "Anonymous users can create chats" ON public.chats
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    (auth.jwt()->>'is_anonymous')::boolean IS TRUE AND
    visibility = 'private'  -- Anonymous chats are always private
  );

-- Add function to cleanup anonymous user data
CREATE OR REPLACE FUNCTION public.cleanup_anonymous_users(older_than_days INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete anonymous users older than specified days
  WITH deleted_users AS (
    DELETE FROM auth.users 
    WHERE is_anonymous = true 
    AND created_at < NOW() - (older_than_days || ' days')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted_users;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add credits limit for anonymous users (optional, can be handled in app logic)
CREATE OR REPLACE FUNCTION public.get_user_credits_limit(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  is_anon BOOLEAN;
BEGIN
  -- Get user info
  SELECT * INTO user_record FROM auth.users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  is_anon := user_record.is_anonymous;
  
  -- Return appropriate credit limit
  IF is_anon THEN
    RETURN 10;  -- Anonymous users get 10 credits max
  ELSE
    RETURN 1000; -- Regular users get higher limit
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
