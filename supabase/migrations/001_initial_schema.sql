-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  email VARCHAR(64) NOT NULL,
  name VARCHAR(64),
  image VARCHAR(256),
  credits INTEGER NOT NULL DEFAULT 100,
  reserved_credits INTEGER NOT NULL DEFAULT 0
);

-- Create chats table
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  title TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  visibility VARCHAR(10) NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  is_pinned BOOLEAN NOT NULL DEFAULT false
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  parent_message_id UUID,
  role VARCHAR(20) NOT NULL,
  parts JSONB NOT NULL,
  attachments JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  annotations JSONB,
  is_partial BOOLEAN NOT NULL DEFAULT false,
  selected_model VARCHAR(256) DEFAULT '',
  selected_tool VARCHAR(256) DEFAULT ''
);

-- Create votes table
CREATE TABLE public.votes (
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  is_upvoted BOOLEAN NOT NULL,
  PRIMARY KEY (chat_id, message_id)
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  title TEXT NOT NULL,
  content TEXT,
  kind VARCHAR(10) NOT NULL DEFAULT 'text' CHECK (kind IN ('text', 'code', 'sheet')),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  PRIMARY KEY (id, created_at)
);

-- Create suggestions table
CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  document_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  original_text TEXT NOT NULL,
  suggested_text TEXT NOT NULL,
  description TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (document_id, document_created_at) REFERENCES public.documents(id, created_at) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_chats_updated_at ON public.chats(updated_at);
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_votes_chat_id ON public.votes(chat_id);
CREATE INDEX idx_votes_message_id ON public.votes(message_id);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_message_id ON public.documents(message_id);
CREATE INDEX idx_suggestions_document_id ON public.suggestions(document_id);
CREATE INDEX idx_suggestions_user_id ON public.suggestions(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see/modify their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Chats: users can see their own chats + public chats
CREATE POLICY "Users can view own chats" ON public.chats
  FOR SELECT USING (user_id = auth.uid() OR visibility = 'public');

CREATE POLICY "Users can modify own chats" ON public.chats
  FOR ALL USING (user_id = auth.uid());

-- Messages: users can see messages from their chats + public chats
CREATE POLICY "Users can view messages from accessible chats" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND (chats.user_id = auth.uid() OR chats.visibility = 'public')
    )
  );

CREATE POLICY "Users can modify messages from own chats" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- Votes: follow same pattern as messages
CREATE POLICY "Users can view votes from accessible chats" ON public.votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = votes.chat_id 
      AND (chats.user_id = auth.uid() OR chats.visibility = 'public')
    )
  );

CREATE POLICY "Users can modify votes from own chats" ON public.votes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = votes.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- Documents: users can see documents from accessible chats
CREATE POLICY "Users can view documents from accessible chats" ON public.documents
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.chats c ON c.id = m.chat_id
      WHERE m.id = documents.message_id 
      AND c.visibility = 'public'
    )
  );

CREATE POLICY "Users can modify own documents" ON public.documents
  FOR ALL USING (user_id = auth.uid());

-- Suggestions: users can only see/modify their own suggestions
CREATE POLICY "Users can view own suggestions" ON public.suggestions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can modify own suggestions" ON public.suggestions
  FOR ALL USING (user_id = auth.uid());

-- Function to automatically create user profile when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, image)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to atomically reserve credits
CREATE OR REPLACE FUNCTION public.reserve_credits(
  user_id UUID,
  amount_to_reserve INTEGER,
  required_available INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
  current_reserved INTEGER;
  available_credits INTEGER;
BEGIN
  -- Get current credits with row lock
  SELECT credits, reserved_credits INTO current_credits, current_reserved
  FROM public.users
  WHERE id = user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  available_credits := current_credits - current_reserved;
  
  -- Check if we have enough available credits
  IF available_credits < required_available THEN
    RETURN FALSE;
  END IF;
  
  -- Update reserved credits
  UPDATE public.users
  SET reserved_credits = reserved_credits + amount_to_reserve
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to finalize credit usage
CREATE OR REPLACE FUNCTION public.finalize_credit_usage(
  user_id UUID,
  reserved_amount INTEGER,
  actual_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update credits: subtract actual amount, unreserve the reserved amount
  UPDATE public.users
  SET 
    credits = credits - actual_amount,
    reserved_credits = reserved_credits - reserved_amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release reserved credits without consuming them
CREATE OR REPLACE FUNCTION public.release_reserved_credits(
  user_id UUID,
  reserved_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Just unreserve the credits without consuming them
  UPDATE public.users
  SET reserved_credits = reserved_credits - reserved_amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;