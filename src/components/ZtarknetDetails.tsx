import React from 'react';
import { ExternalLink, Hash, Layers, Link as LinkIcon } from 'lucide-react';

interface ZtarknetDetailsProps {
  l1TzeTxId?: string;
  l2TxId?: string;
  proofHash?: string;
}

export function ZtarknetDetails({ l1TzeTxId, l2TxId, proofHash }: ZtarknetDetailsProps) {
  if (!l1TzeTxId && !l2TxId && !proofHash) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
      <h4 className="text-sm font-medium text-purple-300 mb-3 flex items-center">
        <Hash className="h-4 w-4 mr-2" />
        Ztarknet Proof Anchoring
      </h4>
      
      <div className="space-y-3">
        {l2TxId && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 flex items-center">
              <Layers className="h-4 w-4 mr-2" />
              L2 Transaction
            </span>
            <div className="flex items-center">
              <span className="font-mono text-purple-400 mr-2" title={l2TxId}>
                {l2TxId.slice(0, 16)}...
              </span>
              <a
                href={`http://localhost:3001/api/transaction/${l1TzeTxId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-purple-200"
                title="View on local explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}
        
        {l1TzeTxId && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 flex items-center">
              <LinkIcon className="h-4 w-4 mr-2" />
              L1 TZE Transaction
            </span>
            <div className="flex items-center">
              <span className="font-mono text-purple-400 mr-2" title={l1TzeTxId}>
                {l1TzeTxId.slice(0, 16)}...
              </span>
              <a
                href={`http://localhost:3001/api/transaction/${l1TzeTxId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-purple-200"
                title="View on local explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}
        
        {proofHash && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Proof Hash</span>
            <span className="font-mono text-purple-400" title={proofHash}>
              {proofHash.slice(0, 16)}...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}