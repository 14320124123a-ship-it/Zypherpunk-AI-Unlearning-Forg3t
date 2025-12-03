import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get proof anchors for a specific unlearning job
 * @param unlearningJobId The ID of the unlearning job
 * @returns Proof anchor data
 */
export async function getProofAnchorsByJobId(unlearningJobId: string) {
  try {
    const { data, error } = await supabase
      .from('proof_anchors')
      .select('*')
      .eq('unlearning_job_id', unlearningJobId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return {
      success: true,
      data: data || null,
      error: error ? error.message : null
    };
  } catch (error) {
    console.error('Error fetching proof anchors:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create or update proof anchors for an unlearning job
 * @param proofAnchorData The proof anchor data to store
 * @returns Result of the operation
 */
export async function createOrUpdateProofAnchors(proofAnchorData: {
  unlearning_job_id: string;
  proof_hash: string;
  l2_tx?: string;
  l2_block?: number;
  l1_tx?: string;
  l1_block?: number;
}) {
  try {
    const { data, error } = await supabase
      .from('proof_anchors')
      .upsert(proofAnchorData, {
        onConflict: 'unlearning_job_id'
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error('Error creating/updating proof anchors:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}