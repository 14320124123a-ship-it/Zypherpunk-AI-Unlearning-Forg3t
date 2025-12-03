-- Fix RLS Policies for Forg3t Backend Service
-- ==========================================

-- Add missing policy for service role to insert unlearning requests
DROP POLICY IF EXISTS "Service role can insert unlearning requests" ON public.unlearning_requests;
CREATE POLICY "Service role can insert unlearning requests" 
ON unlearning_requests FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Also ensure the service role can insert users (if needed)
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users" 
ON users FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Verify the policies were added (corrected query)
SELECT polname as policyname, rolname as roles
FROM pg_policy pol
JOIN pg_roles r ON r.oid = ANY(pol.polroles)
JOIN pg_class cl ON cl.oid = pol.polrelid
WHERE relname IN ('unlearning_requests', 'users') 
AND polname LIKE '%service%';

-- Grant permissions if needed
GRANT ALL ON TABLE unlearning_requests TO service_role;
GRANT ALL ON TABLE users TO service_role;

-- Refresh the schema
SELECT pg_notify('schema_update', 'rls_policies_fixed');

-- Print completion message
SELECT 'RLS policies fixed successfully!' as message;