import { RpcProvider, Account, Contract, cairo, CallData } from 'starknet';

export class StarkNetService {
  private provider: RpcProvider;
  private account: Account;
  private contract: Contract;
  private contractAddress: string;

  constructor() {
    // Get configuration from environment variables
    const rpcEndpoint = import.meta.env.VITE_L2_RPC_ENDPOINT || 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/demo';
    this.contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0x02f797a15292f9859f7d5fb76847b41bbd2778c35570f68af8e25a669c16bf3d';
    const accountAddress = import.meta.env.VITE_STARKNET_ACCOUNT_ADDRESS || '0x07b3df7fc385a21ec33701978ed74ce292f933cba3caaeb12e6e0efed37b7f82';
    const privateKey = import.meta.env.VITE_STARKNET_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';

    // Initialize StarkNet provider
    this.provider = new RpcProvider({
      nodeUrl: rpcEndpoint
    });

    // Initialize account
    this.account = new Account(this.provider, accountAddress, privateKey);

    // Initialize contract with ProofRegistry ABI
    const proofRegistryAbi = [
      {
        "name": "store_proof",
        "type": "function",
        "inputs": [
          {
            "name": "job_id",
            "type": "core::felt252"
          },
          {
            "name": "proof_hash",
            "type": "core::felt252"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "name": "get_proof",
        "type": "function",
        "inputs": [
          {
            "name": "job_id",
            "type": "core::felt252"
          }
        ],
        "outputs": [
          {
            "type": "(core::felt252, core::integer::u64)"
          }
        ],
        "state_mutability": "view"
      }
    ];

    this.contract = new Contract(proofRegistryAbi, this.contractAddress, this.provider);
    this.contract.connect(this.account);
  }

  async commitForgetProof(
    jobId: string,
    proofHash: string,
    timestamp: number
  ): Promise<string> {
    try {
      console.log('Committing proof to StarkNet:', {
        jobId,
        proofHash,
        timestamp,
        contractAddress: this.contractAddress
      });

      // Convert inputs to felt252 format
      const jobIdFelt = jobId.startsWith('0x') ? jobId : `0x${jobId}`;
      const proofHashFelt = proofHash.startsWith('0x') ? proofHash : `0x${proofHash}`;

      // Store the proof on StarkNet
      const { transaction_hash } = await this.contract.store_proof(
        cairo.felt(jobIdFelt),
        cairo.felt(proofHashFelt)
      );

      // Wait for transaction to be accepted
      await this.provider.waitForTransaction(transaction_hash);

      console.log('Proof committed to StarkNet with transaction hash:', transaction_hash);
      return transaction_hash;
    } catch (error) {
      console.error('StarkNet commit failed:', error);
      throw new Error(`Failed to commit proof to StarkNet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyProofOnChain(jobId: string): Promise<{ proofHash: string; timestamp: number } | null> {
    try {
      // Convert jobId to felt252 format
      const jobIdFelt = jobId.startsWith('0x') ? jobId : `0x${jobId}`;

      // Get the proof from StarkNet
      const result = await this.contract.get_proof(cairo.felt(jobIdFelt));
      
      if (result && result.length >= 2) {
        const proofHash = result[0].toString();
        const timestamp = parseInt(result[1].toString());
        return { proofHash, timestamp };
      }
      
      return null;
    } catch (error) {
      console.error('On-chain verification failed:', error);
      return null;
    }
  }

  getStarkScanUrl(txHash: string): string {
    return `https://sepolia.starkscan.co/tx/${txHash}`;
  }
}