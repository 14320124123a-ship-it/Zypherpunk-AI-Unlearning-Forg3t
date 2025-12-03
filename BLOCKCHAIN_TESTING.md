# Blockchain Integration Testing

This document explains how to test and verify that the Starknet and Zcash blockchain integrations are working correctly in the Forg3t Protocol.

## Overview

The Forg3t Protocol integrates with two blockchains:
1. **Starknet** - For zero-knowledge proof verification and storage
2. **Zcash** - For privacy-preserving transaction anchoring

## Testing Scripts

We've created several scripts to help verify the blockchain integrations:

### 1. Comprehensive Blockchain Integration Test

This test verifies all aspects of the blockchain integration:

```bash
npm run blockchain:test
```

This script will:
- Test Starknet connection and proof registration
- Test Zcash connection and transaction sending
- Verify database integration
- Check dashboard display functionality

### 2. Blockchain Status Checker

This script checks the current status of blockchain integrations:

```bash
npm run blockchain:status
```

This script will:
- Check for completed unlearning requests
- Verify blockchain data in audit trails
- Report on Starknet and Zcash integration status

### 3. Job Processing Verification

This script verifies that the backend service is properly processing completed jobs:

```bash
npm run job:verify
```

This script will:
- Check recently completed jobs
- Verify that blockchain data has been added to audit trails
- Identify any jobs stuck in processing

### 4. Manual Job Processing

This script manually triggers processing of completed jobs that may be missing blockchain data:

```bash
npm run job:process
```

This script will:
- Find completed jobs without blockchain data
- Manually trigger blockchain anchoring
- Update jobs with blockchain transaction information

⚠️ **Warning**: This should only be used for testing purposes.

## Manual Testing Process

### 1. Perform an Unlearning Request

1. Navigate to the dashboard: http://localhost:5173/dashboard
2. Click on either "Black-box Unlearning" or "White-box Unlearning"
3. Complete the unlearning request form
4. Submit the request

### 2. Monitor Processing

1. Return to the dashboard
2. Watch the "Recent Unlearning Requests" table
3. The request should progress from "pending" to "processing" to "completed"
4. Once completed, blockchain data should appear

### 3. Verify Blockchain Data

In the "Recent Unlearning Requests" table, look for:
- **Starknet Transaction Hash** - Should appear after processing
- **Zcash Transaction ID** - Should appear after processing
- Links to blockchain explorers for verification

## Expected Results

### Successful Blockchain Integration

When the blockchain integration is working correctly, you should see:

1. In the dashboard table:
   ```
   Starknet: 0x12345678...
   Zcash: tx_abcdef1234...
   ```

2. Clickable links to blockchain explorers:
   - Starknet transactions on StarkScan
   - Zcash transactions on Zcash Block Explorer

### Blockchain Still Processing

If you see:
```
Processing blockchain anchoring...
```

This indicates the backend service hasn't finished processing the blockchain anchoring yet.

## Troubleshooting

### 1. No Blockchain Data Appears

If blockchain data doesn't appear after the request is marked as "completed":

1. Check the backend service logs:
   ```bash
   npm run dev
   ```

2. Verify job processing with the job verification script:
   ```bash
   npm run job:verify
   ```

3. If jobs are stuck, try manually processing them:
   ```bash
   npm run job:process
   ```

4. Look for errors related to Starknet or Zcash integration

5. Verify environment variables in `.env`:
   - `STARKNET_RPC_URL`
   - `STARKNET_REGISTRY_CONTRACT_ADDRESS`
   - `STARKNET_ACCOUNT_ADDRESS`
   - `STARKNET_PRIVATE_KEY`
   - `ZCASH_RPC_HOST`
   - `ZCASH_RPC_PORT`
   - `ZCASH_RPC_USER`
   - `ZCASH_RPC_PASSWORD`

### 2. Starknet Connection Issues

Common Starknet issues:
- Invalid RPC endpoint
- Incorrect contract address
- Account/private key mismatch
- Insufficient funds for gas

### 3. Zcash Connection Issues

Common Zcash issues:
- Zcash node not running
- Incorrect RPC credentials
- Network connectivity issues
- Insufficient ZEC balance

## Running Tests

To run the automated blockchain integration tests:

```bash
cd backend-service
npm run blockchain:test
```

The test will output detailed results for each component of the blockchain integration.

## Dashboard Blockchain Status Widget

The dashboard includes a Blockchain Status widget that shows:
- Starknet integration status
- Zcash integration status
- Last check time
- Refresh button for manual checking

This widget automatically refreshes every 30 seconds to monitor the blockchain integration status.