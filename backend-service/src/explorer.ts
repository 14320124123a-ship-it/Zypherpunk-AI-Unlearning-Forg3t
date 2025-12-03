import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getProofCount } from './starknet/starknetClient';
import { getBlockchainInfo } from './zcash/zCashClient';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const app = express();
const PORT = process.env.EXPLORER_PORT ? parseInt(process.env.EXPLORER_PORT) : 3001;

app.use(express.json());

app.use(express.static('public'));

app.get('/api/transaction/:txId', async (req: Request, res: Response) => {
  try {
    const { txId } = req.params;
    
    const { data: request, error } = await supabase
      .from('unlearning_requests')
      .select('*')
      .eq('blockchain_tx_hash', txId)
      .single();
    
    if (error) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({
      l1_tx_id: request.blockchain_tx_hash,
      l2_tx_id: request.audit_trail?.l2_tx_id,
      proof_hash: request.audit_trail?.proof_hash,
      job_id: request.id,
      job_status: request.status,
      created_at: request.created_at,
      audit_trail: request.audit_trail
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/zcash-transaction/:txId', async (req: Request, res: Response) => {
  try {
    const { txId } = req.params;
    
    res.json({
      txId: txId,
      message: "In a full implementation, this endpoint would query the Zebra regtest node directly to retrieve raw transaction details.",
      instructions: [
        "1. Connect to the Zebra regtest node via RPC",
        "2. Use the getrawtransaction RPC method to fetch transaction details",
        "3. Parse and return the transaction data",
        "4. Extract the OP_RETURN or memo data containing the proof hash"
      ],
      placeholder_data: {
        txid: txId,
        version: 4,
        locktime: 0,
        vin: [],
        vout: [
          {
            value: 0.0001,
            n: 0,
            scriptPubKey: {
              asm: "OP_RETURN <proof_hash_data>",
              hex: "<hex_encoded_proof_hash>",
              type: "nulldata"
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching Zcash transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/transactions', async (req: Request, res: Response) => {
  try {
    const { data: requests, error } = await supabase
      .from('unlearning_requests')
      .select('*')
      .not('blockchain_tx_hash', 'is', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: 'Error fetching transactions' });
    }
    
    const transactions = requests.map(request => ({
      l1_tx_id: request.blockchain_tx_hash,
      l2_tx_id: request.audit_trail?.l2_tx_id,
      proof_hash: request.audit_trail?.proof_hash,
      job_id: request.id,
      job_status: request.status,
      created_at: request.created_at
    }));
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/registry/proof-count', async (req: Request, res: Response) => {
  try {
    const proofCount = await getProofCount();
    
    res.json({
      network: 'starknet-sepolia',
      contractAddress: process.env.STARKNET_REGISTRY_CONTRACT_ADDRESS,
      proofCount: proofCount.toString()
    });
  } catch (error) {
    console.error('Error fetching proof count:', error);
    res.status(500).json({ 
      error: 'Failed to fetch proof count from Starknet registry',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/zcash/info', async (req: Request, res: Response) => {
  try {
    const info = await getBlockchainInfo();
    
    res.json({
      chain: info.chain,
      blocks: info.blocks,
      bestblockhash: info.bestblockhash,
      difficulty: info.difficulty,
      initialBlockDownloadComplete: info.initial_block_download_complete,
      softforks: info.softforks ? Object.keys(info.softforks) : []
    });
  } catch (error) {
    console.error('Error fetching Zcash info:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Zcash blockchain info',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/onchain/health', async (req: Request, res: Response) => {
  try {
    const starknetHealthy = await getProofCount().then(() => true).catch(() => false);
    
    const zcashHealthy = await getBlockchainInfo().then(() => true).catch(() => false);
    
    res.json({
      starknet: starknetHealthy ? 'healthy' : 'unhealthy',
      zcash: zcashHealthy ? 'healthy' : 'unhealthy',
      overall: starknetHealthy && zcashHealthy ? 'healthy' : 'degraded'
    });
  } catch (error) {
    console.error('Error checking onchain health:', error);
    res.status(500).json({ 
      error: 'Failed to check onchain health',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ztarknet-explorer' });
});

app.listen(PORT, () => {
  console.log(`Ztarknet Explorer listening on port ${PORT}`);
  console.log(`Explorer URL: http://localhost:${PORT}`);
});