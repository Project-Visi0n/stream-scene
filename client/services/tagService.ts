// Unified tag management service for all components
// Used by Budget Tracker, AI Weekly Planner, Content Scheduler, and File Upload

export interface TaggedItem {
  id: string | number;
  name: string;
  tags: string[];
  type: 'file' | 'budget' | 'task' | 'content' | 'project';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TagFilter {
  tags: string[];
  operator: 'AND' | 'OR'; // Whether all tags must match (AND) or any tag (OR)
}

export interface TagStats {
  tag: string;
  count: number;
  usage: {
    files: number;
    budget: number;
    tasks: number;
    content: number;
    projects: number;
  };
}

class TagService {
  private static instance: TagService;
  private cache: Map<string, string[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): TagService {
    if (!TagService.instance) {
      TagService.instance = new TagService();
    }
    return TagService.instance;
  }

  private constructor() {}

  // Get all tags from files (uses existing file service)
  async getFileTags(): Promise<string[]> {
    const cacheKey = 'file-tags';
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey) || [];
    }

    try {
      const response = await fetch('/api/files/tags/list', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file tags: ${response.statusText}`);
      }
      
      const data = await response.json();
      const tags = data.tags || [];
      
      // Update cache
      this.cache.set(cacheKey, tags);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
      
      return tags;
    } catch (error) {
      console.error('Error fetching file tags:', error);
      return [];
    }
  }

  // Get all unique tags across all systems
  async getAllTags(): Promise<string[]> {
    const cacheKey = 'all-tags';
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey) || [];
    }

    try {
      // Fetch tags from files (the main source)
      const fileTags = await this.getFileTags();
      
      // TODO: Add budget, task, and content tags when those systems implement tagging
      // For now, file tags are the primary source
      const allTags = [...new Set(fileTags)].sort();
      
      // Update cache
      this.cache.set(cacheKey, allTags);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
      
      return allTags;
    } catch (error) {
      console.error('Error fetching all tags:', error);
      return [];
    }
  }

  // Get tag suggestions based on partial input
  async getTagSuggestions(input: string, limit: number = 10): Promise<string[]> {
    const allTags = await this.getAllTags();
    const normalizedInput = input.toLowerCase().trim();
    
    if (!normalizedInput) {
      return allTags.slice(0, limit);
    }
    
    // Filter tags that start with the input
    const startsWith = allTags.filter(tag => 
      tag.toLowerCase().startsWith(normalizedInput)
    );
    
    // Filter tags that contain the input (but don't start with it)
    const contains = allTags.filter(tag => 
      tag.toLowerCase().includes(normalizedInput) && 
      !tag.toLowerCase().startsWith(normalizedInput)
    );
    
    return [...startsWith, ...contains].slice(0, limit);
  }

  // Validate and normalize tags
  normalizeTags(tags: string[]): string[] {
    return tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 50) // Reasonable tag length limit
      .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
      .sort();
  }

  // Create a new tag (just validation for now, actual creation happens via file upload)
  validateTag(tag: string): { valid: boolean; error?: string } {
    const trimmed = tag.trim();
    
    if (!trimmed) {
      return { valid: false, error: 'Tag cannot be empty' };
    }
    
    if (trimmed.length > 50) {
      return { valid: false, error: 'Tag must be 50 characters or less' };
    }
    
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
      return { valid: false, error: 'Tag can only contain letters, numbers, spaces, hyphens, and underscores' };
    }
    
    return { valid: true };
  }

  // Filter items by tags
  filterItemsByTags<T extends TaggedItem>(
    items: T[], 
    filter: TagFilter
  ): T[] {
    if (!filter.tags.length) {
      return items;
    }

    return items.filter(item => {
      if (!item.tags || !item.tags.length) {
        return false;
      }

      const itemTags = item.tags.map(tag => tag.toLowerCase());
      const filterTags = filter.tags.map(tag => tag.toLowerCase());

      if (filter.operator === 'AND') {
        // All filter tags must be present in item tags
        return filterTags.every(filterTag => 
          itemTags.some(itemTag => itemTag.includes(filterTag))
        );
      } else {
        // At least one filter tag must be present in item tags
        return filterTags.some(filterTag => 
          itemTags.some(itemTag => itemTag.includes(filterTag))
        );
      }
    });
  }

  // Get tag statistics (future enhancement)
  async getTagStats(): Promise<TagStats[]> {
    const allTags = await this.getAllTags();
    
    // For now, just return basic stats from files
    // TODO: Expand to include budget, task, and content usage
    return allTags.map(tag => ({
      tag,
      count: 1, // Placeholder
      usage: {
        files: 1, // Placeholder
        budget: 0,
        tasks: 0,
        content: 0,
        projects: 0
      }
    }));
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Check if cache is valid
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }
}

// Export singleton instance
export const tagService = TagService.getInstance();

// Utility functions for tag operations
export const tagUtils = {
  // Format tags for display
  formatTag(tag: string): string {
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  },

  // Get tag color (consistent colors for same tags across components)
  getTagColor(tag: string): string {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800', 
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-gray-100 text-gray-800'
    ];
    
    // Simple hash function to get consistent color for tag
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      const char = tag.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return colors[Math.abs(hash) % colors.length];
  },

  // Create a tag badge component props
  getTagBadgeProps(tag: string) {
    return {
      className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getTagColor(tag)}`,
      children: this.formatTag(tag)
    };
  }
};