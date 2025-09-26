import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import {
  DollarSign as HiCurrencyDollar,
  Plus as HiPlus,
  Clock as HiClock,
  Search as HiMagnifyingGlass,
  Upload as HiArrowUpTray,
  Cpu as HiCpuChip,
  CheckCircle as HiCheckCircle,
  AlertCircle as HiExclamationCircle,
  X as HiXMark,
  Trash as HiTrash,
  FolderPlus as HiFolderPlus,
  Eye as HiEye,
  TrendingUp as HiTrendingUp,
  TrendingDown as HiTrendingDown,
  Wallet as HiWallet,
  Calendar as HiCalendarDays,
  Tag as HiTag,
  Smartphone as HiDevicePhoneMobile,
  Save as HiSave,
  Check as HiCheck,
  Pencil as HiPencil,
} from 'lucide-react';
import TagInput from './TagInput';

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
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  projectId?: string;
  receiptTitle?: string;
  ocrScanned?: boolean;
  ocrConfidence?: number;
  tags?: string[];
};

// ===== OCR Helper Functions =====
const extractAmountFromText = (text: string): { amount: number; confidence: number } | null => {
  const patterns = [
    /(?:total|amount|sum|subtotal)[\s:$]*([0-9]+\.?[0-9]*)/i,
    /\$\s*([0-9]+\.?[0-9]*)/g,
    /([0-9]+\.[0-9]{2})$/gm,
    /([0-9]+\.?[0-9]*)\s*(?:usd|dollar)/i,
  ];

  const amounts: Array<{ amount: number; confidence: number }> = [];

  patterns.forEach((pattern, index) => {
    const matches = [...text.matchAll(new RegExp(pattern, 'gi'))];
    matches.forEach((match) => {
      const numStr = (match as any)[1] || (match as any)[0].replace(/[^0-9.]/g, '');
      const num = parseFloat(numStr);
      if (!isNaN(num) && num > 0 && num < 100000) {
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
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
};

const extractVendorFromText = (text: string): string | null => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 2);

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (
      !/^\d+$/.test(line) &&
      !/\d{1,2}[\/-]\d{1,2}[\/-]\d{4}/.test(line) &&
      !/^\d+\s+\w+\s+(st|ave|road|dr|blvd)/i.test(line) &&
      line.length > 3 &&
      line.length < 50
    ) {
      return line;
    }
  }
  return null;
};

const BudgetTracker: React.FC = () => {
  // === Config for confirm step ===
  const OCR_CONFIRM_THRESHOLD = 0.92;

  // ===== State (no mock data) =====
  const [activeTab, setActiveTab] = useState<'add' | 'history'>('add');

  // Load from localStorage on first render
  const [entries, setEntries] = useState<Entry[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('budgetEntries') : null;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('budgetProjects') : null;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage when entries/projects change
  useEffect(() => {
    try {
      localStorage.setItem('budgetEntries', JSON.stringify(entries));
    } catch {}
  }, [entries]);

  useEffect(() => {
    try {
      localStorage.setItem('budgetProjects', JSON.stringify(projects));
    } catch {}
  }, [projects]);

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    projectId: '',
    receiptTitle: '',
    tags: [] as string[],
    ocrScanned: false,
    ocrConfidence: 0,
    ocrVendor: '',
    ocrDate: '',
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: '', description: '', color: '#8b5cf6' });
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editFormData, setEditFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    projectId: '',
    receiptTitle: '',
    tags: [] as string[],
    ocrScanned: false,
    ocrConfidence: 0,
    ocrVendor: '',
    ocrDate: '',
  });

  // Receipt Scanner State
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Confirm step state
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Categories
  const incomeCategories = ['Freelance Payment', 'Residuals', 'Grant', 'Salary', 'Bonus', 'Donation', 'Other'];
  const expenseCategories = ['Equipment', 'Transportation', 'Software', 'Marketing', 'Office Supplies', 'Personal', 'Food', 'Other'];

  // ===== Real OCR Processing using Tesseract.js =====
  const processReceiptWithOCR = async (file: File) => {
    try {
      setProgress(0);
      setError(null);

      const imageUrl = URL.createObjectURL(file);

      const result = await Tesseract.recognize(imageUrl, 'eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const rawText: string = result.data?.text || '';
      // Average confidence fallback
      const avgConfidence: number =
        (Array.isArray(result.data?.words) && result.data.words.length
          ? result.data.words.reduce((s: number, w: any) => s + (w.confidence ?? 0), 0) / result.data.words.length
          : 70) / 100;

      URL.revokeObjectURL(imageUrl);

      // Parse fields from text
      const amountGuess = extractAmountFromText(rawText);
      const vendor = extractVendorFromText(rawText) || undefined;
      const date = extractDateFromText(rawText) || undefined;

      return {
        amount: amountGuess?.amount,
        confidence: amountGuess?.confidence ?? avgConfidence,
        vendor,
        date,
        rawText,
      };
    } catch (err: any) {
      throw new Error(`OCR processing failed: ${err?.message || 'Unknown error'}`);
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

    setIsProcessing(true);
    setScanResult(null);
    setError(null);
    setProgress(0);

    try {
      const receiptUrlLocal = URL.createObjectURL(file);
      const ocrResult = await processReceiptWithOCR(file);

      setScanResult(ocrResult);

      if (ocrResult.amount) {
        setFormData((prev) => ({
          ...prev,
          amount: ocrResult.amount!.toString(),
          ocrScanned: true,
          ocrConfidence: ocrResult.confidence || 0,
          ocrVendor: ocrResult.vendor || '',
          ocrDate: ocrResult.date || '',
          description: prev.description || (ocrResult.vendor ? `Purchase from ${ocrResult.vendor}` : ''),
          receiptTitle: file.name.replace(/\.[^/.]+$/, ''),
        }));
      } else {
        setError('Could not detect amount in receipt. Please enter manually.');
      }

      // Decide if this needs a quick confirm tap
      const maybeConfirm = (ocrResult.confidence ?? 0) < OCR_CONFIRM_THRESHOLD || !ocrResult.amount || ocrResult.amount <= 0;
      setNeedsConfirm(maybeConfirm);

      setReceiptFile(file);
      setReceiptUrl(receiptUrlLocal);
    } catch (err: any) {
      setError(err?.message || 'OCR processing failed. Please try a different image or enter details manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description || !formData.category) {
      showToast('error', 'Missing Information', 'Please fill in all required fields (Amount, Description, Category)');
      return;
    }
    if (needsConfirm) {
      const proceed = confirm('OCR amount is unconfirmed. Save anyway?');
      if (!proceed) return;
    }

    try {
      setIsSaving(true);
      const newEntry: Entry = {
        id: Math.max(...entries.map((e) => e.id), 0) + 1,
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
      };

      setEntries((prev) => [newEntry, ...prev]);

      // Reset form
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        projectId: '',
        receiptTitle: '',
        tags: [],
        ocrScanned: false,
        ocrConfidence: 0,
        ocrVendor: '',
        ocrDate: '',
      });
      if (receiptUrl) {
        try {
          URL.revokeObjectURL(receiptUrl);
        } catch {}
      }
      setReceiptFile(null);
      setReceiptUrl('');
      setScanResult(null);
      setError(null);
      setNeedsConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    }
  };

  const handleCreateProject = () => setIsProjectModalOpen(true);

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
      isActive: true,
    };

    setProjects((prev) => [...prev, newProject]);
    setNewProjectData({ name: '', description: '', color: '#8b5cf6' });
    setIsProjectModalOpen(false);

    setFormData((prev) => ({ ...prev, projectId: newProject.id }));
  };

  const handleRemoveReceipt = () => {
    if (receiptUrl) {
      try {
        URL.revokeObjectURL(receiptUrl);
      } catch {}
    }
    setReceiptFile(null);
    setReceiptUrl('');
    setScanResult(null);
    setError(null);
    setFormData((prev) => ({
      ...prev,
      receiptTitle: '',
      ocrScanned: false,
      ocrConfidence: 0,
      ocrVendor: '',
      ocrDate: '',
    }));
    setNeedsConfirm(false);
  };

  // Edit handlers
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
      tags: entry.tags || [],
      ocrScanned: entry.ocrScanned || false,
      ocrConfidence: entry.ocrConfidence || 0,
      ocrVendor: '',
      ocrDate: '',
    });
    setIsEditModalOpen(true);
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingEntry(null);
    setEditFormData({
      type: 'expense',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      projectId: '',
      receiptTitle: '',
      tags: [],
      ocrScanned: false,
      ocrConfidence: 0,
      ocrVendor: '',
      ocrDate: '',
    });
  };

  const handleSaveEdit = () => {
    if (!editingEntry || !editFormData.amount || !editFormData.description || !editFormData.category) {
      return;
    }

    const updatedEntry: Entry = {
      ...editingEntry,
      type: editFormData.type,
      amount: parseFloat(editFormData.amount),
      description: editFormData.description,
      date: editFormData.date,
      category: editFormData.category,
      projectId: editFormData.projectId || undefined,
      receiptTitle: editFormData.receiptTitle || undefined,
      tags: editFormData.tags,
      ocrScanned: editFormData.ocrScanned,
      ocrConfidence: editFormData.ocrConfidence,
    };

    setEntries(prev => prev.map(entry => 
      entry.id === editingEntry.id ? updatedEntry : entry
    ));

    // Save to localStorage
    const updatedEntries = entries.map(entry => 
      entry.id === editingEntry.id ? updatedEntry : entry
    );
    localStorage.setItem('budgetEntries', JSON.stringify(updatedEntries));

    handleCancelEdit();
  };

  // Calculations
  const calculateTotals = () => {
    const totalIncome = entries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0);
    const totalExpenses = entries.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0);
    return {
      income: totalIncome,
      expenses: totalExpenses,
      net: totalIncome - totalExpenses,
    };
  };

  const sq = searchQuery.toLowerCase().trim();
  const filteredEntries = entries.filter((entry) => {
    const projectName = (projects.find((p) => p.id === entry.projectId)?.name ?? '').toLowerCase();
    return (
      sq === '' ||
      entry.description.toLowerCase().includes(sq) ||
      (entry.receiptTitle ?? '').toLowerCase().includes(sq) ||
      entry.category.toLowerCase().includes(sq) ||
      projectName.includes(sq)
    );
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
            <HiCurrencyDollar className="mr-3 text-4xl w-10 h-10 text-purple-400" />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Budget Tracker</span>
          </h1>
          <p className="text-gray-300">Manage your freelance income and expenses with project tracking and AI-powered receipt scanning</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-emerald-800/50 to-green-900/50 border border-emerald-500/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center text-white mr-4">
                <HiTrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-emerald-300 font-medium">Total Income</p>
                <p className="text-2xl font-bold text-emerald-400">${totals.income.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-800/50 to-rose-900/50 border border-red-500/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-br from-red-400 to-rose-500 rounded-xl flex items-center justify-center text-white mr-4">
                <HiTrendingDown className="w-6 h-6" />
              </div>
              <div>
                <p className="text-red-300 font-medium">Total Expenses</p>
                <p className="text-2xl font-bold text-red-400">${totals.expenses.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-800/50 to-purple-900/50 border border-blue-500/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white mr-4">
                <HiWallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-blue-300 font-medium">Net Income</p>
                <p className={`text-2xl font-bold ${totals.net >= 0 ? 'text-blue-400' : 'text-red-400'}`}>${totals.net.toFixed(2)}</p>
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
                className={`px-6 py-4 font-medium transition-all duration-200 flex items-center ${
                  activeTab === 'add' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-purple-300'
                }`}
              >
                <HiPlus className="w-5 h-5 mr-2" />
                Add Entry
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 font-medium transition-all duration-200 flex items-center ${
                  activeTab === 'history' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-purple-300'
                }`}
              >
                <HiClock className="w-5 h-5 mr-2" />
                Transaction History
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'add' ? (
              /* Add Entry Form */
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-purple-300">Add New Entry</h2>

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
                        onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
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
                        onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                        className="text-red-400 focus:ring-red-500 bg-slate-800 border-slate-600"
                      />
                      <span className="ml-2 text-red-400 font-medium">Expense</span>
                    </label>
                  </div>
                </div>

                {/* Project Association */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <HiFolderPlus className="inline-block w-4 h-4 mr-2" />
                    Associate with Project (Optional)
                  </label>

                  {formData.projectId && (
                    <div className="mb-4 p-4 bg-gradient-to-br from-purple-800/30 to-blue-900/30 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {(() => {
                            const selectedProject = projects.find((p) => p.id === formData.projectId);
                            return selectedProject ? (
                              <>
                                <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: selectedProject.color }}></div>
                                <div>
                                  <span className="text-sm font-medium text-purple-300">{selectedProject.name}</span>
                                  {selectedProject.description && <p className="text-xs text-gray-400 mt-1">{selectedProject.description}</p>}
                                </div>
                              </>
                            ) : null;
                          })()}
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, projectId: '' }))}
                          className="text-gray-400 hover:text-gray-300 p-1 hover:bg-slate-700/50 rounded transition-colors"
                        >
                          <HiXMark className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {projects
                      .filter((p) => p.isActive && p.id !== formData.projectId)
                      .map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, projectId: project.id }))}
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
                      <HiPlus className="w-4 h-4 mr-1" />
                      Create New Project
                    </button>
                  </div>
                </div>

                {/* Smart Receipt Scanner (only for expenses) */}
                {formData.type === 'expense' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        <HiCpuChip className="inline-block w-4 h-4 mr-2" />
                        Smart Receipt Scanner
                        <span className="ml-2 text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded-full">AI-Powered OCR</span>
                      </label>

                      <div className="border-2 border-dashed border-purple-500/50 rounded-lg p-6 hover:border-purple-400/70 transition-colors bg-gradient-to-br from-slate-800/30 to-purple-900/20">
                        <div className="text-center">
                          {isProcessing ? (
                            <div className="space-y-3">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                              <p className="text-sm text-purple-300">Scanning receipt with AI...</p>
                              {progress > 0 && (
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                              )}
                              <p className="text-xs text-gray-400">{progress}% complete</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <HiDevicePhoneMobile className="text-4xl mx-auto text-purple-400" />
                              <div>
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg shadow-purple-500/25 inline-flex items-center"
                                >
                                  <HiArrowUpTray className="w-4 h-4 mr-2" />
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
                                <br />
                                <span className="text-purple-400">⚡ AI-powered text extraction</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-gradient-to-br from-red-800/30 to-rose-900/30 border border-red-500/30 rounded-lg p-4">
                        <div className="flex items-center">
                          <HiExclamationCircle className="w-5 h-5 text-red-400 mr-2" />
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
                          <HiCheckCircle className="w-5 h-5 text-emerald-400 mr-2 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-emerald-300 mb-1">Receipt Scanned Successfully!</p>
                            <div className="space-y-1 text-xs text-emerald-400">
                              <p>
                                <strong>Amount:</strong> ${scanResult.amount.toFixed(2)} ({Math.round((scanResult.confidence || 0) * 100)}% confidence)
                              </p>
                              {scanResult.vendor && (
                                <p>
                                  <strong>Vendor:</strong> {scanResult.vendor}
                                </p>
                              )}
                              {scanResult.date && (
                                <p>
                                  <strong>Date:</strong> {scanResult.date}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-emerald-400 mt-2">You can still edit the amount below if needed</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Amount and Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Amount column */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <HiCurrencyDollar className="inline-block w-4 h-4 mr-1" />
                      Amount *
                      {formData.ocrScanned && (
                        <span className="ml-2 text-xs bg-gradient-to-r from-emerald-600 to-green-600 text-white px-2 py-1 rounded-full">
                          AI-detected ({Math.round(formData.ocrConfidence * 100)}%)
                        </span>
                      )}
                    </label>

                    <input
                      ref={amountInputRef}
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData((prev) => {
                          if (needsConfirm) setNeedsConfirm(false);
                          return {
                            ...prev,
                            amount: e.target.value,
                            ocrScanned: prev.amount === e.target.value ? prev.ocrScanned : false,
                          };
                        })
                      }
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                        formData.ocrScanned
                          ? 'border border-emerald-500/50 bg-emerald-900/20 text-emerald-300'
                          : 'border border-slate-600 bg-slate-800/50 text-gray-300'
                      }`}
                    />

                    {needsConfirm && (
                      <div
                        className="mt-3 inline-flex items-center gap-2 text-sm
                                   bg-slate-900 border border-white/20
                                   rounded-lg px-3 py-2 text-white shadow
                                   ring-1 ring-white/10"
                        role="status"
                        aria-live="polite"
                      >
                        <span className="opacity-95">
                          Confirm total:&nbsp;
                          <span className="font-semibold tracking-wide">${formData.amount || '0.00'}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => setNeedsConfirm(false)}
                          className="inline-flex items-center gap-1 rounded-md
                                     bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800
                                     text-white px-3 py-1.5 text-sm font-medium
                                     focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                        >
                          <HiCheck className="w-4 h-4" />
                          Yes
                        </button>

                        <button
                          type="button"
                          onClick={() => amountInputRef.current?.focus()}
                          className="inline-flex items-center gap-1 rounded-md
                                     bg-slate-700 hover:bg-slate-600 active:bg-slate-500
                                     text-white px-3 py-1.5 text-sm font-medium
                                     focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                        >
                          <HiPencil className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Date column */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <HiCalendarDays className="inline-block w-4 h-4 mr-1" />
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Category Chips */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <HiTag className="inline-block w-4 h-4 mr-2" />
                    Category *
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {(formData.type === 'income' ? incomeCategories : expenseCategories).map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, category: prev.category === category ? '' : category }))}
                        className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer select-none border ${
                          formData.category === category
                            ? formData.type === 'income'
                              ? 'bg-gradient-to-br from-emerald-800/50 to-green-900/50 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                              : 'bg-gradient-to-br from-red-800/50 to-rose-900/50 text-red-300 border-red-500/50 shadow-lg shadow-red-500/20'
                            : 'bg-slate-800/50 text-gray-300 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500'
                        }`}
                      >
                        <span className="truncate max-w-32">{category}</span>
                        {formData.category === category && (
                          <HiCheckCircle className={`ml-2 h-4 w-4 ${formData.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`} />
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
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
                        <HiEye className="w-8 h-8 text-emerald-400 mr-3" />
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
                        <HiTrash className="w-4 h-4" />
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
                    disabled={isSaving}
                    className={`inline-flex items-center px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 font-medium shadow-lg shadow-purple-500/25 ${
                      isSaving
                        ? 'bg-slate-700/60 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                    }`}
                  >
                    {isSaving ? (
                      <span className="inline-flex items-center">
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                        Saving...
                      </span>
                    ) : (
                      <span className="inline-flex items-center">
                        <HiSave className="w-5 h-5 mr-2" />
                        Save Entry
                      </span>
                    )}
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
                    <div className="relative">
                      <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search transactions, projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300 placeholder-gray-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {filteredEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                      <HiCurrencyDollar className="w-8 h-8" />
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-300">{searchQuery ? 'No transactions match your search' : 'No transactions yet'}</h3>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Receipt</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-600/20">
                          {filteredEntries.map((entry) => {
                            const project = projects.find((p) => p.id === entry.projectId);
                            return (
                              <tr key={entry.id} className="hover:bg-slate-700/20 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(entry.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      entry.type === 'income'
                                        ? 'bg-emerald-800/50 text-emerald-300 border border-emerald-600/30'
                                        : 'bg-red-800/50 text-red-300 border border-red-600/30'
                                    }`}
                                  >
                                    {entry.type === 'income' ? 'Income' : 'Expense'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {project ? (
                                    <div className="flex items-center">
                                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: project.color }}></div>
                                      <span className="text-xs">{project.name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 text-xs">No project</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{entry.category}</td>
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
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditEntry(entry)}
                                      className="text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-800/30 px-3 py-1 rounded-md transition-colors text-xs border border-blue-600/30 inline-flex items-center"
                                    >
                                      <HiPencil className="w-3 h-3 mr-1" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(entry.id)}
                                      className="text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-800/30 px-3 py-1 rounded-md transition-colors text-xs border border-red-600/30 inline-flex items-center"
                                    >
                                      <HiTrash className="w-3 h-3 mr-1" />
                                      Delete
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-300 flex items-center">
                  <HiFolderPlus className="w-5 h-5 mr-2" />
                  Create New Project
                </h3>
                <button
                  onClick={() => {
                    setIsProjectModalOpen(false);
                    setNewProjectData({ name: '', description: '', color: '#8b5cf6' });
                  }}
                  className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                >
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={newProjectData.name}
                    onChange={(e) => setNewProjectData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Client Website, Personal Blog"
                    className="w-full px-3 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300 placeholder-gray-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                  <textarea
                    value={newProjectData.description}
                    onChange={(e) => setNewProjectData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional project description"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-600 bg-slate-800/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-300 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                  <div className="flex space-x-2">
                    {['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewProjectData((prev) => ({ ...prev, color }))}
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
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg shadow-purple-500/25 flex items-center"
                  >
                    <HiPlus className="w-4 h-4 mr-1" />
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
                  <FaFilm className="w-4 h-4" />
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
                      <FaFilm className="w-4 h-4" />
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
                    <FaTimes className="w-4 h-4" />
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
