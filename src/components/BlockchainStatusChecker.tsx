import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface BlockchainStatus {
  starknetWorking: boolean;
  zcashWorking: boolean;
  lastChecked: Date | null;
  errorMessage?: string;
}

export function BlockchainStatusChecker() {
  const [status, setStatus] = useState<BlockchainStatus>({
    starknetWorking: false,
    zcashWorking: false,
    lastChecked: null
  });
  const [loading, setLoading] = useState(false);

  const checkBlockchainStatus = async () => {
    setLoading(true);
    try {
      // Check for recent completed requests with blockchain data
      const { data, error } = await supabase
        .from('unlearning_requests')
        .select('*')
        .eq('status', 'completed')
        .not('audit_trail', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Database error: ${error.message}`);
      }

      if (data && data.audit_trail) {
        const auditTrail = data.audit_trail;
        const hasStarknetData = !!auditTrail.starknet_tx_hash || !!auditTrail.l2_tx_id;
        const hasZcashData = !!auditTrail.zcash_tx_id || !!auditTrail.l1_tze_tx_id;

        setStatus({
          starknetWorking: hasStarknetData,
          zcashWorking: hasZcashData,
          lastChecked: new Date()
        });
      } else {
        // No data yet, but no error - this is fine
        setStatus({
          starknetWorking: false,
          zcashWorking: false,
          lastChecked: new Date()
        });
      }
    } catch (err) {
      setStatus({
        starknetWorking: false,
        zcashWorking: false,
        lastChecked: new Date(),
        errorMessage: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBlockchainStatus();
    // Check every 30 seconds
    const interval = setInterval(checkBlockchainStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatLastChecked = () => {
    if (!status.lastChecked) return 'Never';
    return status.lastChecked.toLocaleTimeString();
  };

  return (
    <div className="bg-[#002d68] p-4 rounded-lg border border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Blockchain Status</h3>
        <button
          onClick={checkBlockchainStatus}
          disabled={loading}
          className="text-sm bg-[#60a5fa] hover:bg-[#60a5fa]/90 text-white px-3 py-1 rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {status.errorMessage ? (
        <div className="text-red-400 text-sm mb-3">
          Error: {status.errorMessage}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Starknet Integration</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            status.starknetWorking 
              ? 'bg-green-900/30 text-green-400' 
              : 'bg-yellow-900/30 text-yellow-400'
          }`}>
            {status.starknetWorking ? 'Working' : 'No Data'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">Zcash Integration</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            status.zcashWorking 
              ? 'bg-green-900/30 text-green-400' 
              : 'bg-yellow-900/30 text-yellow-400'
          }`}>
            {status.zcashWorking ? 'Working' : 'No Data'}
          </span>
        </div>

        <div className="text-xs text-gray-500 mt-3">
          Last checked: {formatLastChecked()}
        </div>
      </div>

      {!status.starknetWorking && !status.zcashWorking && (
        <div className="mt-3 text-sm text-gray-400">
          Perform an unlearning request to test blockchain integration.
        </div>
      )}
    </div>
  );
}