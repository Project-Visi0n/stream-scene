import React, { useState, useRef } from 'react';
import TagInput from './TagInput';
import FilmReelLogo from './FilmReelLogo';
import { 
  FaClipboardList, 
  FaFolder, 
  FaRobot, 
  FaMobile, 
  FaBolt, 
  FaCalendarAlt, 
  FaTag, 
  FaSave,
  FaCheckCircle
} from 'react-icons/fa';

// Custom SVG Icon Components (matching your navbar and landing page)
const BudgetIcon = () => (
  <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
  </svg>
);

// Types
type Project = {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  tags?: string[];
};

type Entry = {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
  projectId?: string;
  receiptTitle?: string;
  receiptUrl?: string;
  ocrScanned?: boolean;
  ocrConfidence?: number;
  ocrVendor?: string;
  ocrDate?: string;
  tags?: string[];
};

// OCR Helper Functions
const extractAmountFromText = (text: string): { amount: number; confidence: number } | null => {
  const patterns = [
    /(?:total|amount|sum|subtotal)[\s:$]*([0-9]+\.?[0-9]*)/i,
    /\$\s*([0-9]+\.?[0-9]*)/g,
    /([0-9]+\.[0-9]{2})$/gm,
    /([0-9]+\.?[0-9]*)\s*(?:usd|dollar)/i
  ];
  
  const amounts: Array<{ amount: number; confidence: number }> = [];
  
  patterns.forEach((pattern, index) => {
    const matches = [...text.matchAll(new RegExp(pattern, 'gi'))];
    matches.forEach(match => {
      const numStr = match[1] || match[0].replace(/[^0-9.]/g, '');
      const num = parseFloat(numStr);
      if (!isNaN(num) && num > 0 && num < 10000) {
        const confidence = index === 0 ? 0.9 : 0.7;
        amounts.push({ amount: num, confidence });
      }
    });
  });
  
  if (amounts.length === 0) return null;
  amounts.sort((a, b) => b.confidence - a.confidence || b.amount - a.amount);
  return amounts[0];
};

const extractDateFromText = (text: string): string | null => {
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{1,2}-\d{1,2}-\d{4})/,
    /(\d{4}-\d{1,2}-\d{1,2})/,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
};

const extractVendorFromText = (text: string): string | null => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 2);
  
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (!/^\d+$/.test(line) && 
        !/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(line) &&
        !/^\d+\s+\w+\s+(st|ave|road|dr|blvd)/i.test(line) &&
        line.length > 3 && line.length < 50) {
      return line;
    }
  }
  return null;
};

const BudgetTracker: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState('add');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Client Website', description: 'E-commerce site for ABC Corp', color: '#8b5cf6', isActive: true },
    { id: '2', name: 'Personal Blog', description: 'My photography blog', color: '#ec4899', isActive: true },
    { id: '3', name: 'Mobile App', description: 'iOS app development', color: '#06b6d4', isActive: true }
  ]);

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    projectId: '',
    receiptTitle: '',
    ocrScanned: false,
    ocrConfidence: 0,
    ocrVendor: '',
    ocrDate: '',
    tags: [] as string[]
  });

  // Tag filter state
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  // Toast notification state
  const [toasts, setToasts] = useState<{
    id: number;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }[]>([]);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // Toast helper functions
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Edit transaction state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editFormData, setEditFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    date: '',
    category: '',
    projectId: '',
    receiptTitle: '',
    tags: [] as string[]
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: '',
    color: '#8b5cf6'
  });

  // Receipt Scanner State
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [tesseractLoaded, setTesseractLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories
  const incomeCategories = ['Freelance Payment', 'Residuals', 'Grant', 'Salary', 'Bonus', 'Donation', 'Other'];
  const expenseCategories = ['Equipment', 'Transportation', 'Software', 'Marketing', 'Office Supplies', 'Personal', 'Food', 'Other'];

  // LAZY LOAD TESSERACT - Only loads when user actually tries to scan
  const loadTesseract = async () => {
    if (tesseractLoaded) return;
    
    try {
      setProgress(10);
      const Tesseract = await import('tesseract.js');
      setTesseractLoaded(true);
      setProgress(20);
      return Tesseract;
    } catch (error) {
      console.error('Failed to load OCR library:', error);
      throw new Error('Failed to load OCR library. Please try again.');
    }
  };

  // OCR Processing with lazy loading
  const processReceiptWithTesseract = async (file: File) => {
    try {
      setProgress(0);
      
      // Load Tesseract dynamically
      const Tesseract = await loadTesseract();
      
      const imageUrl = URL.createObjectURL(file);
      const worker = await Tesseract.createWorker('eng');
      
      try {
        let progressInterval: NodeJS.Timeout;
        
        progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.random() * 15;
          });
        }, 300);
        
        const { data: { text } } = await worker.recognize(imageUrl);
        
        clearInterval(progressInterval);
        setProgress(100);
        
        console.log('OCR Raw Text:', text);
        
        const amountResult = extractAmountFromText(text);
        const vendor = extractVendorFromText(text);
        const date = extractDateFromText(text);
        
        return {
          amount: amountResult?.amount,
          confidence: amountResult?.confidence || 0,
          vendor,
          date,
          rawText: text
        };
      } finally {
        await worker.terminate();
        URL.revokeObjectURL(imageUrl);
      }
    } catch (error) {
      console.error('Tesseract error:', error);
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Event Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
    if (!validImageTypes.includes(file.type.toLowerCase())) {
      setError('Please upload a valid image file (JPG, PNG, WEBP, BMP, or TIFF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size too large. Please upload an image under 10MB.');
      return;
    }

    const testImage = new Image();
    const imageLoadPromise = new Promise<boolean>((resolve) => {
      testImage.onload = () => resolve(true);
      testImage.onerror = () => resolve(false);
      testImage.src = URL.createObjectURL(file);
    });

    const canLoadImage = await imageLoadPromise;
    if (!canLoadImage) {
      setError('Cannot read this image file. Please try a different image.');
      URL.revokeObjectURL(testImage.src);
      return;
    }

    setIsProcessing(true);
    setScanResult(null);
    setError(null);
    setProgress(0);

    try {
      const receiptUrl = URL.createObjectURL(file);
      const ocrResult = await processReceiptWithTesseract(file);
      
      setScanResult(ocrResult);
      
      if (ocrResult.amount) {
        setFormData(prev => ({
          ...prev,
          amount: ocrResult.amount.toString(),
          ocrScanned: true,
          ocrConfidence: ocrResult.confidence,
          ocrVendor: ocrResult.vendor || '',
          ocrDate: ocrResult.date || '',
          description: prev.description || (ocrResult.vendor ? `Purchase from ${ocrResult.vendor}` : ''),
          receiptTitle: file.name.replace(/\.[^/.]+$/, '')
        }));
      } else {
        setError('Could not detect amount in receipt. Please enter manually.');
      }
      
      setReceiptFile(file);
      setReceiptUrl(receiptUrl);
    } catch (error) {
      console.error('OCR processing failed:', error);
      setError(error instanceof Error ? error.message : 'OCR processing failed. Please try a different image or enter details manually.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      URL.revokeObjectURL(testImage.src);
    }
  };

  const handleSubmit = () => {
    if (!formData.amount || !formData.description || !formData.category) {
      showToast('error', 'Missing Information', 'Please fill in all required fields (Amount, Description, Category)');
      return;
    }

    const newEntry: Entry = {
      id: Math.max(...entries.map(e => e.id), 0) + 1,
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: formData.date,
      category: formData.category,
      projectId: formData.projectId || undefined,
      receiptTitle: formData.receiptTitle || undefined,
      receiptUrl: receiptUrl || undefined,
      ocrScanned: formData.ocrScanned,
      ocrConfidence: formData.ocrConfidence,
      ocrVendor: formData.ocrVendor || undefined,
      ocrDate: formData.ocrDate || undefined,
      tags: formData.tags
    };

    setEntries(prev => [newEntry, ...prev]);
    
    // Reset form
    setFormData({
      type: 'expense',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      projectId: '',
      receiptTitle: '',
      ocrScanned: false,
      ocrConfidence: 0,
      ocrVendor: '',
      ocrDate: '',
      tags: []
    });
    setReceiptFile(null);
    setReceiptUrl('');
    setScanResult(null);
    setError(null);

    // Switch to transaction history to show the new entry
    setActiveTab('history');

    showToast('success', 'Entry Saved', 'Budget entry saved successfully!');
  };

  const handleDelete = (id: number) => {
    showConfirmation(
      'Delete Transaction',
      'Are you sure you want to delete this entry? This action cannot be undone.',
      () => {
        setEntries(prev => prev.filter(entry => entry.id !== id));
        showToast('success', 'Entry Deleted', 'Transaction deleted successfully');
      }
    );
  };

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry);
    setEditFormData({
      type: entry.type,
      amount: entry.amount.toString(),
      description: entry.description,
      date: entry.date,
      category: entry.category,
      projectId: entry.projectId || '',
      receiptTitle: entry.receiptTitle || '',
      tags: entry.tags || []
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editFormData.amount || !editFormData.description || !editFormData.category) {
      showToast('error', 'Missing Information', 'Please fill in all required fields (Amount, Description, Category)');
      return;
    }

    if (!editingEntry) return;

    const updatedEntry: Entry = {
      ...editingEntry,
      type: editFormData.type,
      amount: parseFloat(editFormData.amount),
      description: editFormData.description,
      date: editFormData.date,
      category: editFormData.category,
      projectId: editFormData.projectId || undefined,
      receiptTitle: editFormData.receiptTitle || undefined,
      tags: editFormData.tags
    };

    setEntries(prev => prev.map(entry => 
      entry.id === editingEntry.id ? updatedEntry : entry
    ));

    setIsEditModalOpen(false);
    setEditingEntry(null);
    showToast('success', 'Entry Updated', 'Transaction updated successfully!');
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingEntry(null);
    setEditFormData({
      type: 'expense',
      amount: '',
      description: '',
      date: '',
      category: '',
      projectId: '',
      receiptTitle: '',
      tags: []
    });
  };

  const handleCreateProject = () => {
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = () => {
    if (!newProjectData.name.trim()) {
      showToast('error', 'Missing Information', 'Please enter a project name');
      return;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectData.name.trim(),
      description: newProjectData.description.trim(),
      color: newProjectData.color,
      isActive: true
    };

    setProjects(prev => [...prev, newProject]);
    setNewProjectData({ name: '', description: '', color: '#8b5cf6' });
    setIsProjectModalOpen(false);
    
    setFormData(prev => ({ ...prev, projectId: newProject.id }));
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptUrl('');
    setScanResult(null);
    setError(null);
    setFormData(prev => ({ 
      ...prev, 
      receiptTitle: '', 
      ocrScanned: false, 
      ocrConfidence: 0,
      ocrVendor: '',
      ocrDate: '',
    }));
  };

  // Calculations
  const calculateTotals = () => {
    const totalIncome = entries.filter(entry => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0);
    const totalExpenses = entries.filter(entry => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0);
    return {
      income: totalIncome,
      expenses: totalExpenses,
      net: totalIncome - totalExpenses
    };
  };

  const filteredEntries = entries.filter(entry => {
    // Text search filter
    const matchesSearch = searchQuery === '' || 
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.receiptTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projects.find(p => p.id === entry.projectId)?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tag filter
    const matchesTags = tagFilter.length === 0 || 
      (entry.tags && entry.tags.length > 0 && tagFilter.every(filterTag => entry.tags?.includes(filterTag)));
    
    return matchesSearch && matchesTags;
  });

  const totals = calculateTotals();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      
      {/* Floating Animation Elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400/40 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400/40 rounded-full animate-bounce"></div>
      <div className="absolute bottom-32 left-20 w-3 h-3 bg-purple-300/50 rounded-full animate-ping"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6 mb-6 text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center">
            <BudgetIcon />
            <span className="ml-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Budget Tracker
            </span>
          </h1>
          <p className="text-gray-300">Manage your freelance income and expenses with project tracking and AI-powered receipt scanning</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-emerald-800/50 to-green-900/50 border border-emerald-500/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center text-white font-bold text-lg mr-4">↗</div>
              <div>
                <p className="text-emerald-300 font-medium">Total Income</p>
                <p className="text-2xl font-bold text-emerald-400">${totals.income.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-800/50 to-rose-900/50 border border-red-500/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-br from-red-400 to-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-lg mr-4">↘</div>
              <div>
                <p className="text-red-300 font-medium">Total Expenses</p>
                <p className="text-2xl font-bold text-red-400">${totals.expenses.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-800/50 to-purple-900/50 border border-blue-500/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg mr-4">$</div>
              <div>
                <p className="text-blue-300 font-medium">Net Income</p>
                <p className={`text-2xl font-bold ${totals.net >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  ${totals.net.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl mb-6">
          <div className="border-b border-purple-500/20">
            <div className="flex">
                              <button
                onClick={() => setActiveTab('add')}
                className={`px-6 py-4 font-medium transition-all duration-200 ${
                  activeTab === 'add'
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-purple-300'
                }`}
              >
                <span className="inline-block w-5 h-5 mr-2 text-center font-bold">+</span>
                Add Entry
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 font-medium transition-all duration-200 ${
                  activeTab === 'history'
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-purple-300'
                }`}
              >
                <span className="inline-block w-5 h-5 mr-2 text-center font-bold">📋</span>
                Transaction History
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'add' ? (
              /* Add Entry Form */
              <div className="space-y-6">
                {/* Entry Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Entry Type *</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="income"
                        checked={formData.type === 'income'}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                        className="text-emerald-400 focus:ring-emerald-500 bg-slate-800 border-slate-600"
                      />
                      <span className="ml-2 text-emerald-400 font-medium">Income</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="expense"
                        checked={formData.type === 'expense'}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                        className="text-red-400 focus:ring-red-500 bg-slate-800 border-slate-600"
                      />
                      <span className="ml-2 text-red-400 font-medium">Expense</span>
                    </label>
                  </div>
                </div>

                {/* Project Association */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <span className="inline-block w-4 h-4 mr-2 text-center">📁</span>
                    Associate with Project (Optional)
                  </label>
                  
                  {formData.projectId && (
                    <div className="mb-4 p-4 bg-gradient-to-br from-purple-800/30 to-blue-900/30 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {(() => {
                            const selectedProject = projects.find(p => p.id === formData.projectId);
                            return selectedProject ? (
                              <>
                                <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: selectedProject.color }}></div>
                                <div>
                                  <span className="text-sm font-medium text-purple-300">{selectedProject.name}</span>
                                  {selectedProject.description && (
                                    <p className="text-xs text-gray-400 mt-1">{selectedProject.description}</p>
                                  )}
                                </div>
                              </>
                            ) : null;
                          })()}
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, projectId: '' }))}
                          className="text-gray-400 hover:text-gray-300 p-1 hover:bg-slate-700/50 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {projects
                      .filter(p => p.isActive && p.id !== formData.projectId)
                      .map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, projectId: project.id }))}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-slate-800/50 border border-slate-600/50 text-gray-300 hover:bg-purple-800/30 hover:border-purple-500/50 hover:text-purple-300 transition-all duration-200"
                        >
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: project.color }}></div>
                          <span>{project.name}</span>
                        </button>
                      ))}
                    
                    <button
                      type="button"
                      onClick={handleCreateProject}
                      className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border-2 border-dashed border-purple-500/50 text-purple-400 hover:border-purple-400 hover:text-purple-300 hover:bg-purple-900/20 transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create New Project
                    </button>
                  </div>
                </div>

                {/* Smart Receipt Scanner (only for expenses) */}
                {formData.type === 'expense' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        <span className="inline-block w-4 h-4 mr-2 text-center">🤖</span>
                        Smart Receipt Scanner
                        <span className="ml-2 text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded-full">
                          AI-Powered OCR
                        </span>
                      </label>
                      
                      <div className="border-2 border-dashed border-purple-500/50 rounded-lg p-6 hover:border-purple-400/70 transition-colors bg-gradient-to-br from-slate-800/30 to-purple-900/20">
                        <div className="text-center">
                          {isProcessing ? (
                            <div className="space-y-3">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                              <p className="text-sm text-purple-300">
                                {!tesseractLoaded ? 'Loading AI scanner...' : 'Scanning receipt with AI...'}
                              </p>
                              {progress > 0 && (
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              )}
                              <p className="text-xs text-gray-400">{progress}% complete</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="text-4xl">📱</div>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg shadow-purple-500/25"
                                >
                                  Upload & Scan Receipt
                                </button>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp,image/tiff"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                />
                              </div>
                              <p className="text-xs text-gray-400">
                                AI will automatically extract amount, vendor, and date from your receipt
                                {!tesseractLoaded && (
                                  <>
                                    <br />
                                    <span className="text-purple-400 flex items-center gap-1">
                                      <FaBolt className="w-3 h-3" /> OCR library loads only when you need it
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-gradient-to-br from-red-800/30 to-rose-900/30 border border-red-500/30 rounded-lg p-4">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-red-300">Scanning Error</p>
                            <p className="text-xs text-red-400">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {scanResult && scanResult.amount && (
                      <div className="bg-gradient-to-br from-emerald-800/30 to-green-900/30 border border-emerald-500/30 rounded-lg p-4">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-emerald-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-emerald-300 mb-1">Receipt Scanned Successfully!</p>
                            <div className="space-y-1 text-xs text-emerald-400">
                              <p><strong>Amount:</strong> ${scanResult.amount.toFixed(2)} ({Math.round((scanResult.confidence || 0) * 100)}% confidence)</p>
                              {scanResult.vendor && (
                                <p><strong>Vendor:</strong> {scanResult.vendor}</p>
                              )}
                              {scanResult.date && (
                                <p><strong>Date:</strong> {scanResult.date}</p>
                              )}
                            </div>
                            <p className="text-xs text-emerald-400 mt-2">
                              You can still edit the amount below if needed
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Amount and Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <svg className="inline-block w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd" />
                      </svg>
                      Amount *
                      {formData.ocrScanned && (
                        <span className="ml-2 text-xs bg-gradient-to-r from-emerald-600 to-green-600 text-white px-2 py-1 rounded-full">
                          AI-detected ({Math.round(formData.ocrConfidence * 100)}%)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        amount: e.target.value,
                        ocrScanned: prev.amount === e.target.value ? prev.ocrScanned : false
                      }))}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                        formData.ocrScanned 
                          ? 'border border-emerald-500/50 bg-emerald-900/20 text-emerald-300' 
                          : 'border border-slate-600 bg-slate-800/50 text-gray-300'
                      }`}
                    />
                    {formData.ocrScanned && (
                      <p className="mt-1 text-xs text-emerald-400">
                        Amount automatically extracted from receipt. You can edit if needed.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <span className="inline-block w-4 h-4 mr-1 text-center font-bold">📅</span>
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Category Chips */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <span className="inline-block w-4 h-4 mr-2 text-center">🏷️</span>
                    Category *
                  </label>
                  
                  <div className="flex flex-wrap gap-2">
                    {(formData.type === 'income' ? incomeCategories : expenseCategories).map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          category: prev.category === category ? '' : category 
                        }))}
                        className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer select-none border ${
                          formData.category === category
                            ? formData.type === 'income'
                              ? "bg-gradient-to-br from-emerald-800/50 to-green-900/50 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/20"
                              : "bg-gradient-to-br from-red-800/50 to-rose-900/50 text-red-300 border-red-500/50 shadow-lg shadow-red-500/20"
                            : "bg-slate-800/50 text-gray-300 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500"
                        }`}
                      >
                        <span className="truncate max-w-32">{category}</span>
                        {formData.category === category && (
                          <svg
                            className={`ml-2 h-4 w-4 ${formData.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                    {formData.ocrVendor && (
                      <span className="ml-2 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded-full">
                        Vendor: {formData.ocrVendor}
                      </span>
                    )}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Enter description..."
                    className="w-full px-3 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300 placeholder-gray-500 transition-all duration-200"
                  />
                </div>

                {/* Receipt preview if uploaded */}
                {receiptFile && (
                  <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-slate-600/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-8 h-8 text-emerald-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-300">{receiptFile.name}</p>
                          <p className="text-xs text-gray-400">Receipt uploaded & scanned successfully</p>
                          {formData.ocrScanned && (
                            <p className="text-xs text-emerald-400">
                              AI extracted: ${formData.amount} {formData.ocrVendor && `from ${formData.ocrVendor}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveReceipt}
                        className="text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
                        title="Remove receipt and clear OCR data"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags
                    <span className="text-xs text-gray-500 ml-2">(Optional - organize and categorize entries)</span>
                  </label>
                  <TagInput
                    selectedTags={formData.tags}
                    onTagsChange={(newTags: string[]) => setFormData(prev => ({ ...prev, tags: newTags }))}
                    placeholder="Add tags to organize this entry..."
                    className="w-full"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSubmit}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 font-medium shadow-lg shadow-purple-500/25"
                  >
                    <span className="inline-block w-5 h-5 mr-2 text-center font-bold">💾</span>
                    Save Entry
                  </button>
                </div>
              </div>
            ) : (
              /* Transaction History */
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-purple-300">Recent Transactions</h2>
                  
                  {/* Search Box */}
                  <div className="w-64">
                    <input
                      type="text"
                      placeholder="Search transactions, projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300 placeholder-gray-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Tag Filter */}
                <div className="bg-gradient-to-br from-slate-800/30 to-gray-900/30 border border-slate-600/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">Filter by Tags</label>
                    {tagFilter.length > 0 && (
                      <button
                        onClick={() => setTagFilter([])}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                  <TagInput
                    selectedTags={tagFilter}
                    onTagsChange={setTagFilter}
                    placeholder="Select tags to filter transactions..."
                    className="w-full"
                    maxTags={5}
                    allowCreate={false}
                  />
                </div>
                
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">$</div>
                    <h3 className="mt-2 text-sm font-medium text-gray-300">
                      {searchQuery ? 'No transactions match your search' : 'No transactions yet'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      {searchQuery ? 'Try a different search term' : 'Get started by adding your first income or expense entry.'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-slate-800/30 to-gray-900/30 border border-slate-600/30 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-600/30">
                        <thead className="bg-gradient-to-r from-slate-800/50 to-gray-900/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Project</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tags</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Receipt</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-600/20">
                        {filteredEntries.map((entry) => {
                          const project = projects.find(p => p.id === entry.projectId);
                          return (
                            <tr 
                              key={entry.id} 
                              onClick={() => handleEditEntry(entry)}
                              className="hover:bg-slate-700/20 transition-colors cursor-pointer"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {new Date(entry.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  entry.type === 'income' 
                                    ? 'bg-emerald-800/50 text-emerald-300 border border-emerald-600/30' 
                                    : 'bg-red-800/50 text-red-300 border border-red-600/30'
                                }`}>
                                  {entry.type === 'income' ? 'Income' : 'Expense'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {project ? (
                                  <div className="flex items-center">
                                    <div 
                                      className="w-3 h-3 rounded-full mr-2"
                                      style={{ backgroundColor: project.color }}
                                    ></div>
                                    <span className="text-xs">{project.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500 text-xs">No project</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {entry.category}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300 max-w-xs">
                                <div className="truncate">{entry.description}</div>
                                {entry.ocrScanned && (
                                  <div className="flex items-center mt-1">
                                    <span className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-0.5 rounded-full">
                                      AI-scanned ({Math.round((entry.ocrConfidence || 0) * 100)}%)
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300 max-w-xs">
                                {entry.tags && entry.tags.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {entry.tags.map((tag, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300 border border-purple-600/30"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-500 text-xs">No tags</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {entry.receiptTitle ? (
                                  <button
                                    onClick={() => entry.receiptUrl && window.open(entry.receiptUrl, '_blank')}
                                    className="text-purple-400 hover:text-purple-300 underline text-xs transition-colors"
                                  >
                                    {entry.receiptTitle}
                                  </button>
                                ) : (
                                  <span className="text-gray-500 text-xs">No receipt</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <span className={entry.type === 'income' ? 'text-emerald-400' : 'text-red-400'}>
                                  {entry.type === 'income' ? '+' : '-'}${entry.amount.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleEditEntry(entry)}
                                    className="text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-800/30 p-2 rounded-md transition-colors border border-blue-600/30"
                                    title="Edit transaction"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-800/30 p-2 rounded-md transition-colors border border-red-600/30"
                                    title="Delete transaction"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Project Creation Modal */}
        {isProjectModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-slate-800 to-gray-900 border border-purple-500/30 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">Create New Project</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProjectData.name}
                    onChange={(e) => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Client Website, Personal Blog"
                    className="w-full px-3 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300 placeholder-gray-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newProjectData.description}
                    onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional project description"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Color
                  </label>
                  <div className="flex space-x-2">
                    {['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewProjectData(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                          newProjectData.color === color ? 'border-purple-400 ring-2 ring-purple-400/30' : 'border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProjectModalOpen(false);
                      setNewProjectData({ name: '', description: '', color: '#8b5cf6' });
                    }}
                    className="px-4 py-2 text-gray-400 border border-slate-600 rounded-lg hover:bg-slate-700/50 hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProject}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg shadow-purple-500/25"
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Transaction Modal */}
        {isEditModalOpen && editingEntry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-slate-800 to-gray-900 border border-purple-500/30 rounded-xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">Edit Transaction</h3>
              
              <div className="space-y-4">
                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="income"
                        checked={editFormData.type === 'income'}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                        className="sr-only"
                      />
                      <div className={`px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                        editFormData.type === 'income'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-600/50'
                      }`}>
                        Income
                      </div>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="expense"
                        checked={editFormData.type === 'expense'}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                        className="sr-only"
                      />
                      <div className={`px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                        editFormData.type === 'expense'
                          ? 'bg-red-600/20 border-red-500 text-red-300'
                          : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-600/50'
                      }`}>
                        Expense
                      </div>
                    </label>
                  </div>
                </div>

                {/* Amount and Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.amount}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
                    <input
                      type="date"
                      value={editFormData.date}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <input
                    type="text"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What was this for?"
                    className="w-full px-3 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300"
                  />
                </div>

                {/* Category and Project */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                    <select
                      value={editFormData.category}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300"
                    >
                      <option value="">Select category</option>
                      <option value="freelance">Freelance Work</option>
                      <option value="equipment">Equipment</option>
                      <option value="software">Software</option>
                      <option value="marketing">Marketing</option>
                      <option value="office">Office Supplies</option>
                      <option value="travel">Travel</option>
                      <option value="meals">Meals</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Project (Optional)</label>
                    <select
                      value={editFormData.projectId}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, projectId: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300"
                    >
                      <option value="">No project</option>
                      {projects.filter(p => p.isActive).map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags
                    <span className="text-xs text-gray-500 ml-2">(Optional - organize and categorize entries)</span>
                  </label>
                  <TagInput
                    selectedTags={editFormData.tags}
                    onTagsChange={(newTags: string[]) => setEditFormData(prev => ({ ...prev, tags: newTags }))}
                    placeholder="Add tags to organize this entry..."
                    className="w-full"
                  />
                </div>

                {/* Receipt Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Receipt Title (Optional)</label>
                  <input
                    type="text"
                    value={editFormData.receiptTitle}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, receiptTitle: e.target.value }))}
                    placeholder="Receipt description"
                    className="w-full px-3 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-400 border border-slate-600 rounded-lg hover:bg-slate-700/50 hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg shadow-purple-500/25"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-slate-800 to-gray-900 border border-red-500/30 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                  <div className="scale-50">
                    <FilmReelLogo />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-red-300">{confirmModal.title}</h3>
              </div>
              
              <p className="text-gray-300 mb-6">{confirmModal.message}</p>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={confirmModal.onCancel}
                  className="px-4 py-2 text-gray-400 border border-slate-600 rounded-lg hover:bg-slate-700/50 hover:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-colors shadow-lg shadow-red-500/25"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`transform transition-all duration-300 ease-in-out animate-slide-in-right`}
            >
              <div className={`bg-gradient-to-r border rounded-lg shadow-lg backdrop-blur-sm p-4 min-w-80 max-w-md ${
                toast.type === 'success' 
                  ? 'from-emerald-800/90 to-green-900/90 border-emerald-500/30' 
                  : toast.type === 'error'
                  ? 'from-red-800/90 to-red-900/90 border-red-500/30'
                  : toast.type === 'warning'
                  ? 'from-yellow-800/90 to-orange-900/90 border-yellow-500/30'
                  : 'from-blue-800/90 to-indigo-900/90 border-blue-500/30'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                      <div className="scale-25">
                        <FilmReelLogo />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium ${
                      toast.type === 'success' ? 'text-emerald-100' :
                      toast.type === 'error' ? 'text-red-100' :
                      toast.type === 'warning' ? 'text-yellow-100' :
                      'text-blue-100'
                    }`}>
                      {toast.title}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      toast.type === 'success' ? 'text-emerald-200' :
                      toast.type === 'error' ? 'text-red-200' :
                      toast.type === 'warning' ? 'text-yellow-200' :
                      'text-blue-200'
                    }`}>
                      {toast.message}
                    </p>
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className={`ml-3 flex-shrink-0 rounded-md p-1.5 hover:bg-black/20 transition-colors ${
                      toast.type === 'success' ? 'text-emerald-300 hover:text-emerald-200' :
                      toast.type === 'error' ? 'text-red-300 hover:text-red-200' :
                      toast.type === 'warning' ? 'text-yellow-300 hover:text-yellow-200' :
                      'text-blue-300 hover:text-blue-200'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BudgetTracker;