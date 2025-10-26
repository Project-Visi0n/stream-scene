import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tagService, tagUtils } from '../services/tagService';

export interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  allowCreate?: boolean;
  className?: string;
  disabled?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({
  selectedTags,
  onTagsChange,
  placeholder = 'Type to search or add tags...',
  maxTags = 10,
  allowCreate = true,
  className = '',
  disabled = false
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load tag suggestions when input changes
  useEffect(() => {
    const loadSuggestions = async () => {
      if (input.trim()) {
        const suggestions = await tagService.getTagSuggestions(input, 8);
        // Filter out already selected tags
        const filtered = suggestions.filter(tag => 
          !selectedTags.includes(tag.toLowerCase())
        );
        setSuggestions(filtered);
        setIsOpen(filtered.length > 0);
      } else {
        // Show popular tags when no input
        const allTags = await tagService.getAllTags();
        const filtered = allTags
          .filter(tag => !selectedTags.includes(tag.toLowerCase()))
          .slice(0, 8);
        setSuggestions(filtered);
        setIsOpen(false);
      }
    };

    loadSuggestions();
  }, [input, selectedTags]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setHighlightedIndex(-1);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle input blur
  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay closing to allow clicking on suggestions
    setTimeout(() => {
      if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
        setIsOpen(false);
      }
    }, 150);
  };

  // Add a tag
  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    
    if (!normalizedTag || selectedTags.includes(normalizedTag)) {
      return;
    }

    if (selectedTags.length >= maxTags) {
      return;
    }

    // Validate tag if creating new one
    if (allowCreate && !suggestions.includes(normalizedTag)) {
      const validation = tagService.validateTag(normalizedTag);
      if (!validation.valid) {
        return;
      }
    }

    const newTags = [...selectedTags, normalizedTag];
    onTagsChange(newTags);
    setInput('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    
    // Focus back on input
    inputRef.current?.focus();
  };

  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    onTagsChange(newTags);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          addTag(suggestions[highlightedIndex]);
        } else if (input.trim() && allowCreate) {
          addTag(input.trim());
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;

      case 'Backspace':
        if (!input && selectedTags.length > 0) {
          removeTag(selectedTags[selectedTags.length - 1]);
        }
        break;

      case 'Tab':
        if (isOpen && highlightedIndex >= 0) {
          e.preventDefault();
          addTag(suggestions[highlightedIndex]);
        }
        break;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Tag Input Container */}
      <div className={`
        flex flex-wrap items-center gap-1 p-2 border rounded-lg 
        ${disabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 focus-within:border-blue-500'}
        ${disabled ? 'cursor-not-allowed' : 'cursor-text'}
        min-h-[2.5rem]
      `}
      onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Selected Tags */}
        <AnimatePresence>
          {selectedTags.map((tag) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                ${tagUtils.getTagColor(tag)}
                ${disabled ? 'opacity-60' : ''}
              `}
            >
              {tagUtils.formatTag(tag)}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          disabled={disabled || selectedTags.length >= maxTags}
          className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm placeholder-gray-400 disabled:cursor-not-allowed"
        />

        {/* Tag Count */}
        {maxTags && (
          <span className="text-xs text-gray-400 ml-2">
            {selectedTags.length}/{maxTags}
          </span>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((tag, index) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className={`
                  w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors
                  ${index === highlightedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === suggestions.length - 1 ? 'rounded-b-lg' : ''}
                `}
              >
                <span className={tagUtils.getTagColor(tag).replace('bg-', 'text-').replace('text-', 'text-')}>
                  #{tagUtils.formatTag(tag)}
                </span>
              </button>
            ))}
            
            {/* Create new tag option */}
            {allowCreate && input.trim() && !suggestions.includes(input.toLowerCase().trim()) && (
              <button
                type="button"
                onClick={() => addTag(input.trim())}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-gray-600 border-t border-gray-100"
              >
                Create "{input.trim()}"
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TagInput;