import { useState, useEffect } from 'react';
import { ExternalLink, Loader, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProofAnchor {
  id: string;
  unlearning_job_id: string;
  proof_hash: string;
  l2_tx: string | null;
  l2_block: number | null;
  l1_tx: string | null;
  l1_block: number | null;
  created_at: string;
}

interface ProofAnchorsPanelProps {
  unlearningJobId: string;
}

export function ProofAnchorsPanel({ unlearningJobId }: ProofAnchorsPanelProps) {
  const [proofAnchors, setProofAnchors] = useState<ProofAnchor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProofAnchors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('proof_anchors')
        .select('*')
        .eq('unlearning_job_id', unlearningJobId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }
      
      setProofAnchors(data || null);
    } catch (err) {
      console.error('Error fetching proof anchors:', err);
      setError('Failed to load proof anchoring data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchProofAnchors();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProofAnchors();
  }, [unlearningJobId]);

  if (loading) {
    return (
      <div className="bg-[#002d68] rounded-lg border border-gray-600 p-6">
        <div className="flex items-center justify-center">
          <Loader className="h-6 w-6 animate-spin text-[#60a5fa]" />
          <span className="ml-2 text-gray-400">Loading proof anchoring data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#002d68] rounded-lg border border-gray-600 p-6">
        <div className="flex items-center text-red-400">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!proofAnchors) {
    return (
      <div className="bg-[#002d68] rounded-lg border border-gray-600 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Proof Anchoring</h3>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="p-2 rounded-md hover:bg-gray-700 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="mt-4 text-gray-400">
          No proof anchoring data available for this job yet.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#002d68] rounded-lg border border-gray-600 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Proof Anchoring</h3>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="p-2 rounded-md hover:bg-gray-700 transition-colors"
          title="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="mt-4 space-y-4">
        {/* Proof Hash */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Proof Hash</span>
          <span className="font-mono text-sm text-purple-400" title={proofAnchors.proof_hash}>
            {proofAnchors.proof_hash?.slice(0, 16)}...
          </span>
        </div>
        
        {/* ZTarknet L2 Transaction */}
        {proofAnchors.l2_tx ? (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">ZTarknet L2 TX</span>
            <div className="flex items-center">
              <span className="font-mono text-sm text-purple-400 mr-2" title={proofAnchors.l2_tx}>
                {proofAnchors.l2_tx.slice(0, 16)}...
              </span>
              <a
                href={`https://sepolia.starkscan.co/tx/${proofAnchors.l2_tx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-purple-200"
                title="View on Starknet explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">ZTarknet L2 TX</span>
            <span className="text-yellow-400 flex items-center">
              <Loader className="h-4 w-4 mr-1 animate-spin" />
              Pending
            </span>
          </div>
        )}
        
        {/* ZTarknet L2 Block */}
        {proofAnchors.l2_block ? (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">ZTarknet L2 Block</span>
            <span className="text-purple-400">#{proofAnchors.l2_block}</span>
          </div>
        ) : null}
        
        {/* Zcash L1 Transaction */}
        {proofAnchors.l1_tx ? (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Zcash L1 TX</span>
            <div className="flex items-center">
              <span className="font-mono text-sm text-green-400 mr-2" title={proofAnchors.l1_tx}>
                {proofAnchors.l1_tx.slice(0, 16)}...
              </span>
              <a
                href={`https://zcashblockexplorer.com/transactions/${proofAnchors.l1_tx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-300 hover:text-green-200"
                title="View on Zcash explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Zcash L1 TX</span>
            <span className="text-yellow-400 flex items-center">
              <Loader className="h-4 w-4 mr-1 animate-spin" />
              Pending
            </span>
          </div>
        )}
        
        {/* Zcash L1 Block */}
        {proofAnchors.l1_block && proofAnchors.l1_block > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Zcash L1 Block</span>
            <span className="text-green-400">#{proofAnchors.l1_block}</span>
          </div>
        ) : null}
        
        {/* Status Indicator */}
        <div className="pt-2">
          {proofAnchors.l2_tx && proofAnchors.l1_tx ? (
            <div className="flex items-center text-green-400">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Fully anchored on both L1 and L2</span>
            </div>
          ) : proofAnchors.l2_tx || proofAnchors.l1_tx ? (
            <div className="flex items-center text-yellow-400">
              <Loader className="h-5 w-5 mr-2 animate-spin" />
              <span>Partially anchored ({proofAnchors.l2_tx ? 'L2' : 'L1'} complete)</span>
            </div>
          ) : (
            <div className="flex items-center text-yellow-400">
              <Loader className="h-5 w-5 mr-2 animate-spin" />
              <span>Anchoring in progress...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}