import crypto from "crypto";
import { registerUnlearningProof } from "../starknet/starknetClient";
import { sendUnlearningProofTx, UnlearningProofMeta } from "../zcash/zCashClient";

export interface UnlearningContext {
  jobId: string;
  modelId?: string;
  requestId?: string;
  userId?: string;
  timestamp: Date;
  [key: string]: any;
}

export interface OnchainResult {
  starknetTxHash?: string;
  zcashTxId?: string;
  error?: string;
}

function computeProofHash(context: UnlearningContext): string {
  const payload = JSON.stringify({
    jobId: context.jobId,
    modelId: context.modelId ?? null,
    requestId: context.requestId ?? null,
    userId: context.userId ?? null,
    timestamp: context.timestamp.toISOString(),
  });

  return crypto.createHash("sha256").update(payload).digest("hex");
}

export async function recordUnlearningOnChains(
  context: UnlearningContext
): Promise<OnchainResult> {
  const result: OnchainResult = {};
  
  const proofHash = computeProofHash(context);
  console.log(`[Forg3t][Onchain] Computed proof hash: ${proofHash}`);
  
  try {
    console.log(`[Forg3t][Onchain] Registering proof on Starknet for job ${context.jobId}`);
    const starknetResult = await registerUnlearningProof();
    result.starknetTxHash = starknetResult.txHash;
    console.log(`[Forg3t][Onchain] Starknet registration successful: ${result.starknetTxHash}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Forg3t][Onchain] Failed to register proof on Starknet: ${errorMessage}`);
    result.error = result.error ? `${result.error}; Starknet error: ${errorMessage}` : `Starknet error: ${errorMessage}`;
  }
  
  try {
    console.log(`[Forg3t][Onchain] Sending proof to Zcash for job ${context.jobId}`);
    const zcashTxId = await sendUnlearningProofTx({
      proofHash,
      modelId: context.modelId,
      requestId: context.requestId,
      userId: context.userId,
      timestamp: context.timestamp.toISOString()
    });
    result.zcashTxId = zcashTxId;
    console.log(`[Forg3t][Onchain] Zcash transaction successful: ${result.zcashTxId}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Forg3t][Onchain] Failed to send proof to Zcash: ${errorMessage}`);
    result.error = result.error ? `${result.error}; Zcash error: ${errorMessage}` : `Zcash error: ${errorMessage}`;
  }
  
  return result;
}