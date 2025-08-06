import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { shareService, ShareRecord, CreateShareRequest } from '../services/shareService';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: number;
  fileName: string;
  onShareCreated?: (share: ShareRecord) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  fileId,
  fileName,
  onShareCreated
}) => {
  const [shareType, setShareType] = useState<'one-time' | 'indefinite'>('indefinite');
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingShares, setExistingShares] = useState<ShareRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Load existing shares when modal opens
  useEffect(() => {
    if (isOpen && fileId) {
      loadExistingShares();
    }
  }, [isOpen, fileId]);

  const loadExistingShares = async () => {
    try {
      setLoading(true);
      const shares = await shareService.getFileShares(fileId);
      setExistingShares(shares);
    } catch (error) {
      console.error('Failed to load existing shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShare = async () => {
    setCreating(true);
    setError(null);

    try {
      const shareData: CreateShareRequest = {
        fileId,
        shareType
      };

      // Add expiration date if specified
      if (expiresAt) {
        shareData.expiresAt = new Date(expiresAt).toISOString();
      }

      const newShare = await shareService.createShare(shareData);
      
      // Update existing shares list
      setExistingShares(prev => [newShare, ...prev]);
      
      // Reset form
      setShareType('indefinite');
      setExpiresAt('');
      
      // Notify parent component
      onShareCreated?.(newShare);

      // Auto-copy the share URL
      await shareService.copyShareUrl(newShare.shareUrl);
      setCopiedUrl(newShare.shareUrl);
      setTimeout(() => setCopiedUrl(null), 3000);

    } catch (error) {
      console.error('Failed to create share:', error);
      setError(error instanceof Error ? error.message : 'Failed to create share');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyUrl = async (shareUrl: string) => {
    try {
      await shareService.copyShareUrl(shareUrl);
      setCopiedUrl(shareUrl);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleDeactivateShare = async (shareId: number) => {
    try {
      await shareService.deactivateShare(shareId);
      // Refresh the shares list
      await loadExistingShares();
    } catch (error) {
      console.error('Failed to deactivate share:', error);
      setError('Failed to deactivate share');
    }
  };

  const handleDeleteShare = async (shareId: number) => {
    try {
      await shareService.deleteShare(shareId);
      // Refresh the shares list
      await loadExistingShares();
    } catch (error) {
      console.error('Failed to delete share:', error);
      setError('Failed to delete share');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // At least 5 minutes in the future
    return now.toISOString().slice(0, 16);
  };

  const getShareStatusBadge = (share: ShareRecord) => {
    if (!share.isActive) {
      return <span className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded">Inactive</span>;
    }
    if (!share.canAccess) {
      return <span className="px-2 py-1 text-xs bg-red-600 text-red-100 rounded">Expired</span>;
    }
    if (share.shareType === 'one-time' && share.accessCount > 0) {
      return <span className="px-2 py-1 text-xs bg-orange-600 text-orange-100 rounded">Used</span>;
    }
    return <span className="px-2 py-1 text-xs bg-green-600 text-green-100 rounded">Active</span>;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gradient-to-br from-slate-800 to-gray-900 rounded-xl shadow-2xl border border-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Share File</h2>
                  <p className="text-sm text-gray-400 truncate" title={fileName}>
                    {fileName}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Create New Share Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Create New Share</h3>
                
                {/* Share Type Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Share Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <motion.label
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        shareType === 'indefinite'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shareType"
                        value="indefinite"
                        checked={shareType === 'indefinite'}
                        onChange={(e) => setShareType(e.target.value as 'indefinite')}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          shareType === 'indefinite' ? 'border-purple-500 bg-purple-500' : 'border-gray-400'
                        }`}>
                          {shareType === 'indefinite' && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">Indefinite</div>
                          <div className="text-xs text-gray-400">Can be accessed multiple times</div>
                        </div>
                      </div>
                    </motion.label>

                    <motion.label
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        shareType === 'one-time'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shareType"
                        value="one-time"
                        checked={shareType === 'one-time'}
                        onChange={(e) => setShareType(e.target.value as 'one-time')}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          shareType === 'one-time' ? 'border-purple-500 bg-purple-500' : 'border-gray-400'
                        }`}>
                          {shareType === 'one-time' && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">One-time</div>
                          <div className="text-xs text-gray-400">Can only be accessed once</div>
                        </div>
                      </div>
                    </motion.label>
                  </div>
                </div>

                {/* Expiration Date (Optional) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={getMinDateTime()}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  {expiresAt && (
                    <p className="text-xs text-gray-400">
                      Share will expire on {formatDate(expiresAt)}
                    </p>
                  )}
                </div>

                {/* Create Button */}
                <motion.button
                  onClick={handleCreateShare}
                  disabled={creating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  {creating ? 'Creating Share...' : 'Create Share Link'}
                </motion.button>

                {/* Success Message */}
                {copiedUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-900/50 border border-green-500/50 text-green-200 px-4 py-2 rounded-lg text-sm"
                  >
                    ✓ Share link created and copied to clipboard!
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm"
                  >
                    {error}
                    <button
                      onClick={() => setError(null)}
                      className="ml-2 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Existing Shares Section */}
              {existingShares.length > 0 && (
                <div className="space-y-4 border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-white">
                    Existing Shares ({existingShares.length})
                  </h3>
                  
                  {loading ? (
                    <div className="text-gray-400 text-center py-4">Loading shares...</div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {existingShares.map((share) => (
                        <motion.div
                          key={share.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-gray-800/50 rounded-lg border border-gray-600"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getShareStatusBadge(share)}
                              <span className="text-sm text-gray-300 capitalize">
                                {share.shareType.replace('-', ' ')}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400">
                              Created {formatDate(share.createdAt)}
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-400 mb-3">
                            Accessed {share.accessCount} time{share.accessCount !== 1 ? 's' : ''}
                            {share.maxAccess && ` (max: ${share.maxAccess})`}
                            {share.expiresAt && ` • Expires ${formatDate(share.expiresAt)}`}
                          </div>

                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-900 rounded px-3 py-2 text-sm font-mono text-gray-300 truncate">
                              {share.shareUrl}
                            </div>
                            
                            <motion.button
                              onClick={() => handleCopyUrl(share.shareUrl)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                              title="Copy URL"
                            >
                              {copiedUrl === share.shareUrl ? '✓' : 'Copy'}
                            </motion.button>
                            
                            {share.isActive && (
                              <motion.button
                                onClick={() => handleDeactivateShare(share.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors"
                                title="Deactivate"
                              >
                                Deactivate
                              </motion.button>
                            )}
                            
                            <motion.button
                              onClick={() => handleDeleteShare(share.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                              title="Delete"
                            >
                              Delete
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;
