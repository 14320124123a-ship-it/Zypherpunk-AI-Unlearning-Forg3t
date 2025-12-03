-- Fix RLS Policies for Forg3t Backend Service
-- ==========================================

-- Add missing policy for service role to insert unlearning requests
DROP POLICY IF EXISTS "Service role can insert unlearning requests" ON public.unlearning_requests;
CREATE POLICY "Service role can insert unlearning requests" 
ON public.unlearning_requests FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Also ensure the service role can insert users (if needed)
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users" 
ON public.users FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Grant permissions if needed
GRANT ALL ON TABLE public.unlearning_requests TO service_role;
GRANT ALL ON TABLE public.users TO service_role;

-- Refresh the schema
-- Note: This line may not work in all Supabase environments
-- SELECT pg_notify('schema_update', 'rls_policies_fixed');

-- Print completion message
-- Note: This line is for informational purposes only
-- SELECT 'RLS policies fixed successfully!' as message;

-- Verify the policies were added
SELECT tablename, polname as policyname
FROM pg_policy pol
JOIN pg_class cl ON cl.oid = pol.polrelid
WHERE relname IN ('unlearning_requests', 'users')
AND polname LIKE '%service%';