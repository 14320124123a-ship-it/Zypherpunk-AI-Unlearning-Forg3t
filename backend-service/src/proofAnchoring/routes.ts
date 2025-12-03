import express from 'express';
import { getProofAnchorsByJobId, createOrUpdateProofAnchors } from './api';

const router = express.Router();

/**
 * GET /api/proof-anchors/:unlearningJobId
 * Get proof anchors for a specific unlearning job
 */
router.get('/proof-anchors/:unlearningJobId', async (req, res) => {
  try {
    const { unlearningJobId } = req.params;
    
    if (!unlearningJobId) {
      return res.status(400).json({
        success: false,
        error: 'Missing unlearningJobId parameter'
      });
    }
    
    const result = await getProofAnchorsByJobId(unlearningJobId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in GET /proof-anchors/:unlearningJobId:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/proof-anchors/create
 * Create or update proof anchors for an unlearning job
 */
router.post('/proof-anchors/create', async (req, res) => {
  try {
    const { unlearning_job_id, proof_hash, l2_tx, l2_block, l1_tx, l1_block } = req.body;
    
    // Validate required fields
    if (!unlearning_job_id || !proof_hash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: unlearning_job_id and proof_hash'
      });
    }
    
    const proofAnchorData = {
      unlearning_job_id,
      proof_hash,
      l2_tx,
      l2_block,
      l1_tx,
      l1_block
    };
    
    const result = await createOrUpdateProofAnchors(proofAnchorData);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error in POST /proof-anchors/create:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;