# Blockchain Integration Testing Instructions

This document provides step-by-step instructions for testing the blockchain integration in the Forg3t Protocol.

## Prerequisites

1. Ensure the backend service is running:
   ```bash
   cd backend-service
   npm run dev
   ```

2. Ensure the frontend is running:
   ```bash
   npm run dev
   ```

3. Make sure you have performed at least one unlearning request

## Testing Steps

### 1. Verify Job Processing

Check if completed jobs are being processed correctly:

```bash
cd backend-service
npm run job:verify
```

This will show you the status of recently completed jobs and whether they have blockchain data.

### 2. Check Blockchain Status

Verify the overall blockchain integration status:

```bash
cd backend-service
npm run blockchain:status
```

This will check if Starknet and Zcash integrations are working.

### 3. Run Comprehensive Tests

Run all blockchain integration tests:

```bash
cd backend-service
npm run blockchain:test
```

This will test:
- Starknet integration
- Zcash integration
- Database integration
- Dashboard display

### 4. Manual Job Processing (if needed)

If jobs are stuck without blockchain data, you can manually process them:

```bash
cd backend-service
npm run job:process
```

⚠️ **Warning**: Only use this for testing purposes.

## Dashboard Verification

1. Open the dashboard in your browser: http://localhost:5173/dashboard
2. Look for the "Blockchain Status" widget in the quick actions section
3. Check the "Recent Unlearning Requests" table for blockchain data:
   - Starknet transaction hashes
   - Zcash transaction IDs
   - Links to blockchain explorers

## Expected Results

### Success Case

When everything is working correctly, you should see:

1. In the terminal output:
   ```
   🎉 All Blockchain Integration Tests PASSED!
   ```

2. In the dashboard:
   - Blockchain Status widget shows "Working" for both Starknet and Zcash
   - Recent requests show actual transaction hashes instead of "Processing blockchain anchoring..."

### Failure Case

If there are issues, you might see:

1. In the terminal output:
   ```
   ❌ Some tests FAILED.
   ```

2. In the dashboard:
   - "Processing blockchain anchoring..." message that doesn't change
   - Blockchain Status widget shows "No Data"

## Troubleshooting

If tests fail or blockchain data isn't appearing:

1. Check backend service logs for errors
2. Verify environment variables in `.env` files
3. Ensure Starknet and Zcash nodes are accessible
4. Check if the backend service has the necessary permissions in the database

## Next Steps

Once testing is complete, you can proceed with normal usage of the Forg3t Protocol, confident that the blockchain integrations are working correctly.