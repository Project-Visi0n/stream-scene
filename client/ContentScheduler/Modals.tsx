import React, { useState, useCallback } from 'react';

type Platform = 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'youtube' | 'tiktok';

interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  filename: string;
  size: number;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (postData: any) => void;
  projectId?: string;
}

interface AssetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assets: MediaAsset[]) => void;
  allowMultiple?: boolean;
}

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: any) => void;
}

// Platform configuration
const PLATFORMS = {
  twitter: { name: 'Twitter', icon: '🐦', color: 'bg-blue-500', limit: 280, maxMedia: 4 },
  instagram: { name: 'Instagram', icon: '📷', color: 'bg-pink-500', limit: 2200, maxMedia: 10 },
  linkedin: { name: 'LinkedIn', icon: '💼', color: 'bg-blue-600', limit: 3000, maxMedia: 9 },
  facebook: { name: 'Facebook', icon: '📘', color: 'bg-blue-700', limit: 63206, maxMedia: 10 },
  youtube: { name: 'YouTube', icon: '📺', color: 'bg-red-500', limit: 5000, maxMedia: 1 },
  tiktok: { name: 'TikTok', icon: '🎵', color: 'bg-black', limit: 150, maxMedia: 1 }
};

// Mock media assets for the asset picker
const mockAssets: MediaAsset[] = [
  { id: '1', type: 'image', url: '/api/placeholder/300/300', filename: 'project-1.jpg', size: 1024000 },
  { id: '2', type: 'image', url: '/api/placeholder/300/200', filename: 'behind-scenes.jpg', size: 856000 },
  { id: '3', type: 'video', url: '/api/placeholder/400/300', filename: 'demo-video.mp4', size: 5242880 },
  { id: '4', type: 'image', url: '/api/placeholder/400/400', filename: 'product-shot.jpg', size: 1536000 },
  { id: '5', type: 'gif', url: '/api/placeholder/300/300', filename: 'animation.gif', size: 2048000 },
  { id: '6', type: 'image', url: '/api/placeholder/600/400', filename: 'banner.jpg', size: 2560000 }
];

// Mock templates
const mockTemplates = [
  {
    id: '1',
    name: 'Product Launch',
    content: {
      text: 'Exciting news! We\'re launching {product_name} 🚀\n\nKey features:\n• {feature_1}\n• {feature_2}\n• {feature_3}\n\nGet ready for something amazing! #ProductLaunch #Innovation',
      hashtags: ['ProductLaunch', 'Innovation', 'NewProduct']
    },
    platforms: ['twitter', 'linkedin', 'facebook']
  },
  {
    id: '2',
    name: 'Behind the Scenes',
    content: {
      text: 'Taking you behind the scenes of {project_name} ✨\n\nThe magic happens when creative minds come together. Here\'s a glimpse into our process...\n\n#BehindTheScenes #CreativeProcess',
      hashtags: ['BehindTheScenes', 'CreativeProcess', 'TeamWork']
    },
    platforms: ['instagram', 'facebook']
  },
  {
    id: '3',
    name: 'Tips & Insights',
    content: {
      text: '💡 Pro tip: {tip_content}\n\nThis simple technique can {benefit}. Try it out and let us know how it works for you!\n\n#ProTip #LearningTogether #Tips',
      hashtags: ['ProTip', 'LearningTogether', 'Tips']
    },
    platforms: ['twitter', 'linkedin']
  }
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSubmit, projectId }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['twitter']);
  const [postText, setPostText] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [customHashtag, setCustomHashtag] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>([]);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [recurrence, setRecurrence] = useState('none');
  const [mentions, setMentions] = useState<string[]>([]);

  const suggestedHashtags = ['StreamScene', 'CreativeTools', 'ContentCreation', 'SocialMedia', 'ProductionLife', 'DigitalMarketing', 'CreativeProcess', 'Innovation'];

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const addHashtag = () => {
    if (customHashtag && !selectedHashtags.includes(customHashtag)) {
      setSelectedHashtags(prev => [...prev, customHashtag]);
      setCustomHashtag('');
    }
  };

  const getCharacterLimit = () => {
    if (selectedPlatforms.length === 0) return null;
    return Math.min(...selectedPlatforms.map(p => PLATFORMS[p].limit));
  };

  const getMaxMediaCount = () => {
    if (selectedPlatforms.length === 0) return 10;
    return Math.min(...selectedPlatforms.map(p => PLATFORMS[p].maxMedia));
  };

  const handleSubmit = () => {
    const postData = {
      platforms: selectedPlatforms,
      content: {
        text: postText,
        mediaAssets: selectedAssets,
        hashtags: selectedHashtags,
        mentions
      },
      scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
      projectId,
      recurrence: recurrence !== 'none' ? { type: recurrence } : undefined
    };
    
    onSubmit(postData);
    onClose();
    
    // Reset form
    setPostText('');
    setSelectedPlatforms(['twitter']);
    setSelectedHashtags([]);
    setSelectedAssets([]);
    setScheduledTime('');
    setRecurrence('none');
    setMentions([]);
  };

  if (!isOpen) return null;

  const characterLimit = getCharacterLimit();
  const maxMedia = getMaxMediaCount();

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-purple-300">Create New Post</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
              ✕
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Quick Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowTemplates(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <span>📄</span>
                Use Template
              </button>
              <button
                onClick={() => setShowAssetPicker(true)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <span>🖼️</span>
                Add Media
              </button>
            </div>

            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Select Platforms</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(PLATFORMS).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => handlePlatformToggle(key as Platform)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      selectedPlatforms.includes(key as Platform)
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{config.icon}</span>
                      <div>
                        <div className="font-medium text-white">{config.name}</div>
                        <div className="text-xs text-gray-400">{config.limit} chars • {config.maxMedia} media</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's happening?"
                className="w-full h-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none"
                maxLength={characterLimit || undefined}
              />
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400">
                  {postText.length}{characterLimit && `/${characterLimit}`} characters
                </span>
                {characterLimit && postText.length > characterLimit * 0.9 && (
                  <span className={postText.length >= characterLimit ? 'text-red-400' : 'text-yellow-400'}>
                    {characterLimit - postText.length} remaining
                  </span>
                )}
              </div>
            </div>

            {/* Media Assets */}
            {selectedAssets.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Media ({selectedAssets.length}/{maxMedia})</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedAssets.map(asset => (
                    <div key={asset.id} className="relative group">
                      <div className="aspect-square bg-slate-700 rounded-lg overflow-hidden">
                        {asset.type === 'image' ? (
                          <img src={asset.url} alt={asset.filename} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl">🎥</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedAssets(prev => prev.filter(a => a.id !== asset.id))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                      >
                        ✕
                      </button>
                      <div className="text-xs text-gray-400 mt-1 truncate">{asset.filename}</div>
                    </div>
                  ))}
                  
                  {selectedAssets.length < maxMedia && (
                    <button
                      onClick={() => setShowAssetPicker(true)}
                      className="aspect-square border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-slate-500 transition-colors"
                    >
                      <span className="text-2xl mb-1">➕</span>
                      <span className="text-xs">Add Media</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Hashtags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {suggestedHashtags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (!selectedHashtags.includes(tag)) {
                        setSelectedHashtags(prev => [...prev, tag]);
                      }
                    }}
                    disabled={selectedHashtags.includes(tag)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      selectedHashtags.includes(tag)
                        ? 'bg-purple-500 text-white cursor-default'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600 cursor-pointer'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customHashtag}
                  onChange={(e) => setCustomHashtag(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                  placeholder="Add custom hashtag"
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                />
                <button
                  onClick={addHashtag}
                  disabled={!customHashtag}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              
              {selectedHashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedHashtags.map(tag => (
                    <span
                      key={tag}
                      className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-sm flex items-center gap-1"
                    >
                      #{tag}
                      <button
                        onClick={() => setSelectedHashtags(prev => prev.filter(t => t !== tag))}
                        className="text-purple-300 hover:text-white ml-1"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Schedule Time</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Recurrence</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="none">No recurrence</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-700 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!postText.trim() || selectedPlatforms.length === 0}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {scheduledTime ? 'Schedule Post' : 'Post Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Asset Picker Modal */}
      <AssetPickerModal
        isOpen={showAssetPicker}
        onClose={() => setShowAssetPicker(false)}
        onSelect={(assets) => {
          const remainingSlots = maxMedia - selectedAssets.length;
          const newAssets = assets.slice(0, remainingSlots);
          setSelectedAssets(prev => [...prev, ...newAssets]);
          setShowAssetPicker(false);
        }}
        allowMultiple={true}
      />

      {/* Template Modal */}
      <TemplateModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={(template) => {
          setPostText(template.content.text);
          setSelectedHashtags(template.content.hashtags || []);
          setSelectedPlatforms(template.platforms || ['twitter']);
          setShowTemplates(false);
        }}
      />
    </>
  );
};

export const AssetPickerModal: React.FC<AssetPickerModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  allowMultiple = false 
}) => {
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'gif'>('all');

  const filteredAssets = mockAssets.filter(asset => {
    const matchesSearch = asset.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleAssetToggle = (asset: MediaAsset) => {
    if (allowMultiple) {
      setSelectedAssets(prev => 
        prev.find(a => a.id === asset.id)
          ? prev.filter(a => a.id !== asset.id)
          : [...prev, asset]
      );
    } else {
      setSelectedAssets([asset]);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedAssets);
    setSelectedAssets([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-purple-300">Select Media Assets</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="gif">GIFs</option>
            </select>
          </div>

          {/* Asset Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            {filteredAssets.map(asset => (
              <div
                key={asset.id}
                onClick={() => handleAssetToggle(asset)}
                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedAssets.find(a => a.id === asset.id)
                    ? 'ring-2 ring-purple-400 scale-95'
                    : 'hover:scale-105'
                }`}
              >
                {asset.type === 'image' ? (
                  <img src={asset.url} alt={asset.filename} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                    {asset.type === 'video' ? (
                      <span className="text-2xl">🎥</span>
                    ) : (
                      <span className="text-2xl">🖼️</span>
                    )}
                  </div>
                )}
                
                {selectedAssets.find(a => a.id === asset.id) && (
                  <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                    <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                      <span>👁️</span>
                    </div>
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                  <div className="text-xs truncate">{asset.filename}</div>
                  <div className="text-xs text-gray-300">
                    {(asset.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upload New */}
          <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
            <span className="text-4xl block mb-4">📤</span>
            <h3 className="text-lg font-medium text-gray-300 mb-2">Upload New Media</h3>
            <p className="text-gray-400 mb-4">Drag and drop files here, or click to browse</p>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
              Choose Files
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedAssets.length === 0}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
      <div className="bg-slate-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-purple-300">Choose Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            ✕
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'border-purple-400 bg-purple-500/20'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <h3 className="font-medium text-white mb-2">{template.name}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-3">
                  {template.content.text.slice(0, 100)}...
                </p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.platforms.map(platform => (
                    <span
                      key={platform}
                      className={`${PLATFORMS[platform as Platform].color} text-white px-2 py-1 rounded text-xs`}
                    >
                      {PLATFORMS[platform as Platform].icon} {PLATFORMS[platform as Platform].name}
                    </span>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {template.content.hashtags.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="text-purple-400 text-xs">#{tag}</span>
                  ))}
                  {template.content.hashtags.length > 3 && (
                    <span className="text-gray-500 text-xs">+{template.content.hashtags.length - 3}</span>
                  )}
                </div>
              </div>
            ))}
            
            {/* Create New Template */}
            <div className="p-4 rounded-lg border-2 border-dashed border-slate-600 hover:border-slate-500 cursor-pointer transition-colors flex flex-col items-center justify-center text-center">
              <span className="text-2xl mb-2">➕</span>
              <h3 className="font-medium text-gray-300 mb-1">Create New Template</h3>
              <p className="text-gray-500 text-sm">Save your current post as a template</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedTemplate && onSelect(selectedTemplate)}
            disabled={!selectedTemplate}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
};

// Analytics Modal Component
export const AnalyticsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const mockAnalytics = {
    totalPosts: 45,
    publishedPosts: 38,
    scheduledPosts: 5,
    failedPosts: 2,
    totalEngagement: 12450,
    platformBreakdown: {
      twitter: { posts: 15, engagement: 3200 },
      instagram: { posts: 12, engagement: 4800 },
      linkedin: { posts: 8, engagement: 2100 },
      facebook: { posts: 10, engagement: 2350 }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-RetryJContinueEditauto">
<div className="p-6 border-b border-slate-700 flex justify-between items-center">
<h2 className="text-xl font-bold text-purple-300">Analytics Overview</h2>
<button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
✕
</button>
</div>
    <div className="p-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{mockAnalytics.totalPosts}</div>
          <div className="text-sm text-gray-400">Total Posts</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{mockAnalytics.publishedPosts}</div>
          <div className="text-sm text-gray-400">Published</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{mockAnalytics.scheduledPosts}</div>
          <div className="text-sm text-gray-400">Scheduled</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{mockAnalytics.totalEngagement.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Total Engagement</div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-purple-300 mb-4">Platform Performance</h3>
        <div className="space-y-4">
          {Object.entries(mockAnalytics.platformBreakdown).map(([platform, data]) => {
            const config = PLATFORMS[platform as Platform];
            return (
              <div key={platform} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{config.icon}</span>
                  <div>
                    <div className="font-medium text-white">{config.name}</div>
                    <div className="text-sm text-gray-400">{data.posts} posts</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-white">{data.engagement.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">engagement</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Chart Placeholder */}
      <div className="bg-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-purple-300 mb-4">Recent Activity</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <span className="text-4xl block mb-2">📊</span>
            <p>Activity chart visualization would go here</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-6 border-t border-slate-700">
      <button
        onClick={onClose}
        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
      >
        Close
      </button>
    </div>
  </div>
</div>
);
};
// Bulk Actions Modal
export const BulkActionsModal: React.FC<{
isOpen: boolean;
onClose: () => void;
selectedPosts: string[];
onBulkAction: (action: string) => void;
}> = ({ isOpen, onClose, selectedPosts, onBulkAction }) => {
if (!isOpen) return null;
return (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
<div className="bg-slate-800 rounded-lg max-w-md w-full">
<div className="p-6 border-b border-slate-700">
<h2 className="text-xl font-bold text-purple-300">Bulk Actions</h2>
<p className="text-gray-400 text-sm">{selectedPosts.length} posts selected</p>
</div>
    <div className="p-6 space-y-3">
      <button
        onClick={() => onBulkAction('reschedule')}
        className="w-full p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-left flex items-center gap-3"
      >
        <span className="text-blue-400 text-xl">🕒</span>
        <div>
          <div className="font-medium">Reschedule Posts</div>
          <div className="text-sm text-gray-400">Change schedule time for all selected</div>
        </div>
      </button>
      
      <button
        onClick={() => onBulkAction('duplicate')}
        className="w-full p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-left flex items-center gap-3"
      >
        <span className="text-green-400 text-xl">📋</span>
        <div>
          <div className="font-medium">Duplicate Posts</div>
          <div className="text-sm text-gray-400">Create copies of selected posts</div>
        </div>
      </button>
      
      <button
        onClick={() => onBulkAction('delete')}
        className="w-full p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-left flex items-center gap-3"
      >
        <span className="text-xl">🗑️</span>
        <div>
          <div className="font-medium">Delete Posts</div>
          <div className="text-sm text-red-200">Permanently remove selected posts</div>
        </div>
      </button>
    </div>

    <div className="p-6 border-t border-slate-700">
      <button
        onClick={onClose}
        className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
      >
        Cancel
      </button>
    </div>
  </div>
</div>
);
};