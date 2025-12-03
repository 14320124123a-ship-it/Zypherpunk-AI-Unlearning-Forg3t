-- Complete Supabase Setup for Forg3t Application
-- This script sets up all necessary tables and configurations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS public.unlearning_proof_log;
DROP TABLE IF EXISTS public.unlearning_requests;
DROP TABLE IF EXISTS public.models;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.profiles;

-- 1. Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Grant permissions
GRANT ALL ON TABLE profiles TO authenticated;

-- 2. Create users table (alternative to profiles, for backward compatibility)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  package_type TEXT DEFAULT 'individual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users
DROP POLICY IF EXISTS "Users can view their own user record" ON public.users;
CREATE POLICY "Users can view their own user record" 
ON users FOR SELECT 
TO authenticated 
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own user record" ON public.users;
CREATE POLICY "Users can insert their own user record" 
ON users FOR INSERT 
TO authenticated 
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own user record" ON public.users;
CREATE POLICY "Users can update their own user record" 
ON users FOR UPDATE 
TO authenticated 
USING (id = auth.uid());

-- Grant permissions
GRANT ALL ON TABLE users TO authenticated;

-- 3. Create models table for ML models
CREATE TABLE IF NOT EXISTS public.models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT false,
  model_data JSONB
);

-- Create indexes for models
CREATE INDEX IF NOT EXISTS idx_models_owner_id ON models(owner_id);
CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);
CREATE INDEX IF NOT EXISTS idx_models_created_at ON models(created_at);
CREATE INDEX IF NOT EXISTS idx_models_is_public ON models(is_public);

-- Enable RLS for models
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Create policies for models
DROP POLICY IF EXISTS "Everyone can view public models" ON public.models;
CREATE POLICY "Everyone can view public models" 
ON models FOR SELECT 
USING (is_public = true);

DROP POLICY IF EXISTS "Users can view their own models" ON public.models;
CREATE POLICY "Users can view their own models" 
ON models FOR SELECT 
TO authenticated 
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own models" ON public.models;
CREATE POLICY "Users can insert their own models" 
ON models FOR INSERT 
TO authenticated 
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own models" ON public.models;
CREATE POLICY "Users can update their own models" 
ON models FOR UPDATE 
TO authenticated 
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own models" ON public.models;
CREATE POLICY "Users can delete their own models" 
ON models FOR DELETE 
TO authenticated 
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Service role can view all models" ON public.models;
CREATE POLICY "Service role can view all models" 
ON models FOR SELECT 
TO service_role 
USING (true);

-- Grant permissions
GRANT ALL ON TABLE models TO authenticated;
GRANT ALL ON TABLE models TO service_role;

-- 4. Create unlearning_requests table for tracking unlearning jobs
CREATE TABLE IF NOT EXISTS public.unlearning_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID REFERENCES models(id) ON DELETE SET NULL,
  request_id UUID,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  prompt TEXT,
  request_reason TEXT,
  data_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  blockchain_tx_hash TEXT,
  audit_trail JSONB,
  processing_time_seconds INTEGER,
  ipfs_hash TEXT
);

-- Create indexes for unlearning_requests
CREATE INDEX IF NOT EXISTS idx_unlearning_requests_status ON unlearning_requests(status);
CREATE INDEX IF NOT EXISTS idx_unlearning_requests_user_id ON unlearning_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_unlearning_requests_model_id ON unlearning_requests(model_id);
CREATE INDEX IF NOT EXISTS idx_unlearning_requests_created_at ON unlearning_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_unlearning_requests_blockchain_tx_hash ON unlearning_requests(blockchain_tx_hash);

-- Enable RLS for unlearning_requests
ALTER TABLE unlearning_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for unlearning_requests
DROP POLICY IF EXISTS "Users can view their own unlearning requests" ON public.unlearning_requests;
CREATE POLICY "Users can view their own unlearning requests" 
ON unlearning_requests FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own unlearning requests" ON public.unlearning_requests;
CREATE POLICY "Users can insert their own unlearning requests" 
ON unlearning_requests FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can view all unlearning requests" ON public.unlearning_requests;
CREATE POLICY "Service role can view all unlearning requests" 
ON unlearning_requests FOR SELECT 
TO service_role 
USING (true);

DROP POLICY IF EXISTS "Service role can update all unlearning requests" ON public.unlearning_requests;
CREATE POLICY "Service role can update all unlearning requests" 
ON unlearning_requests FOR UPDATE 
TO service_role 
USING (true);

-- Grant permissions
GRANT ALL ON TABLE unlearning_requests TO authenticated;
GRANT ALL ON TABLE unlearning_requests TO service_role;

-- 5. Create unlearning_proof_log table for logging on-chain proof registrations
CREATE TABLE IF NOT EXISTS public.unlearning_proof_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES unlearning_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  request_id UUID,
  registry_tx_hash TEXT,
  operation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  chain_type TEXT, -- 'starknet' or 'zcash'
  proof_hash TEXT
);

-- Create indexes for unlearning_proof_log
CREATE INDEX IF NOT EXISTS idx_unlearning_proof_log_job_id ON unlearning_proof_log(job_id);
CREATE INDEX IF NOT EXISTS idx_unlearning_proof_log_user_id ON unlearning_proof_log(user_id);
CREATE INDEX IF NOT EXISTS idx_unlearning_proof_log_request_id ON unlearning_proof_log(request_id);
CREATE INDEX IF NOT EXISTS idx_unlearning_proof_log_registry_tx_hash ON unlearning_proof_log(registry_tx_hash);
CREATE INDEX IF NOT EXISTS idx_unlearning_proof_log_operation_timestamp ON unlearning_proof_log(operation_timestamp);
CREATE INDEX IF NOT EXISTS idx_unlearning_proof_log_chain_type ON unlearning_proof_log(chain_type);

-- Enable RLS for unlearning_proof_log
ALTER TABLE unlearning_proof_log ENABLE ROW LEVEL SECURITY;

-- Create policies for unlearning_proof_log
DROP POLICY IF EXISTS "Users can view their own proof logs" ON public.unlearning_proof_log;
CREATE POLICY "Users can view their own proof logs" 
ON unlearning_proof_log FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can view all proof logs" ON public.unlearning_proof_log;
CREATE POLICY "Service role can view all proof logs" 
ON unlearning_proof_log FOR SELECT 
TO service_role 
USING (true);

DROP POLICY IF EXISTS "Service role can insert proof logs" ON public.unlearning_proof_log;
CREATE POLICY "Service role can insert proof logs" 
ON unlearning_proof_log FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON TABLE unlearning_proof_log TO service_role;

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    SPLIT_PART(NEW.email, '@', 1), -- Use email prefix as default username
    SPLIT_PART(NEW.email, '@', 1),
    'https://ui-avatars.com/api/?name=' || SPLIT_PART(NEW.email, '@', 1)
  );
  
  INSERT INTO public.users (id, email)
  VALUES (
    NEW.id,
    NEW.email
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create a profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;

-- Refresh the schema
SELECT pg_notify('schema_update', 'complete');

-- Print completion message
SELECT 'Forg3t application schema setup complete!' as message;