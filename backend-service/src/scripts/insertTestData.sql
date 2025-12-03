-- Insert test data for demonstration purposes
-- Note: We can't directly insert into auth.users, so we'll work with existing users
-- or you can create a user through the app first

-- First, let's check if there are any existing users we can use
-- Uncomment the following lines if you want to see existing users:
-- SELECT id, email FROM auth.users LIMIT 5;

-- For now, let's insert a test unlearning request without linking to a specific user
-- We'll use a placeholder user ID that you can replace with an actual user ID from your auth system

-- Get an existing user ID (replace this with an actual user ID from your auth system)
-- You can find this by running: SELECT id FROM auth.users LIMIT 1;

-- Insert a test unlearning request with blockchain data
-- Replace 'YOUR_ACTUAL_USER_ID_HERE' with a real user ID from your auth system
INSERT INTO public.unlearning_requests (
  id,
  model_id,
  request_id,
  user_id,
  status,
  prompt,
  request_reason,
  data_count,
  created_at,
  updated_at,
  completed_at,
  blockchain_tx_hash,
  audit_trail,
  processing_time_seconds,
  ipfs_hash
)
VALUES (
  'b1c2d3e4-f5f6-7890-abcd-ef1234567891',
  'c1d2e3f4-f5f6-7890-abcd-ef1234567892',
  'd1e2f3g4-g5g6-7890-abcd-ef1234567893',
  'YOUR_ACTUAL_USER_ID_HERE', -- Replace with actual user ID
  'completed',
  'Test prompt for unlearning',
  'Testing blockchain integration',
  5,
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '55 minutes',
  NOW() - INTERVAL '55 minutes',
  '8278a7151d665651b37008cb9460a3e99a0a9458c4a38f5529958192d16986fb',
  '{"leak_score": 0.05, "zk_proof": "proof_test123", "ipfs_hash": "QmTestHash123", "starknet_tx_hash": null, "zcash_tx_id": "8278a7151d665651b37008cb9460a3e99a0a9458c4a38f5529958192d16986fb", "onchain_error": "Starknet RPC compatibility issue"}',
  45,
  'QmTestHash123'
)
ON CONFLICT (id) DO NOTHING;

-- Alternative approach: If you don't have any users yet, you can temporarily disable the foreign key constraint
-- WARNING: Only do this for testing purposes!
/*
ALTER TABLE public.unlearning_requests DROP CONSTRAINT unlearning_requests_user_id_fkey;
ALTER TABLE public.users DROP CONSTRAINT users_id_fkey;

-- Now insert the test data
INSERT INTO public.users (id, email, package_type)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'test@example.com',
  'individual'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.unlearning_requests (
  id,
  model_id,
  request_id,
  user_id,
  status,
  prompt,
  request_reason,
  data_count,
  created_at,
  updated_at,
  completed_at,
  blockchain_tx_hash,
  audit_trail,
  processing_time_seconds,
  ipfs_hash
)
VALUES (
  'b1c2d3e4-f5f6-7890-abcd-ef1234567891',
  'c1d2e3f4-f5f6-7890-abcd-ef1234567892',
  'd1e2f3g4-g5g6-7890-abcd-ef1234567893',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'completed',
  'Test prompt for unlearning',
  'Testing blockchain integration',
  5,
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '55 minutes',
  NOW() - INTERVAL '55 minutes',
  '8278a7151d665651b37008cb9460a3e99a0a9458c4a38f5529958192d16986fb',
  '{"leak_score": 0.05, "zk_proof": "proof_test123", "ipfs_hash": "QmTestHash123", "starknet_tx_hash": null, "zcash_tx_id": "8278a7151d665651b37008cb9460a3e99a0a9458c4a38f5529958192d16986fb", "onchain_error": "Starknet RPC compatibility issue"}',
  45,
  'QmTestHash123'
)
ON CONFLICT (id) DO NOTHING;

-- Re-enable the constraints
ALTER TABLE public.unlearning_requests ADD CONSTRAINT unlearning_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
*/