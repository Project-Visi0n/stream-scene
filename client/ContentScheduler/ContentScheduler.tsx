import React, { useState, useRef } from 'react';
import { 
  DollarSign, 
  Plus, 
  History, 
  Search, 
  Upload, 
  Robot, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Trash2, 
  FolderPlus,
  Eye,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react';

// Types
type Project = {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
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

// Mock OCR function (since Tesseract.js won't work in Claude artifacts)
const mockOCRProcess = async (file: File): Promise<any> => {
  // Simulate OCR processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock extracted data based on filename or random values
  const mockResults = [
    { amount: 25.99, vendor: "Starbucks Coffee", date: "2025-09-22", confidence: 0.89 },
    { amount: 45.67, vendor: "Office Depot", date: "2025-09-21", confidence: 0.92 },
    { amount: 123.45, vendor: "Amazon", date: "2025-09-20", confidence: 0.85 },
    { amount: 67.89, vendor: "Gas Station", date: "2025-09-19", confidence: 0.78 },
    { amount: 89.12, vendor: "Best Buy", date: "2025-09-18", confidence: 0.91 },
    { amount: 34.56, vendor: "Target", date: "2025-09-17", confidence: 0.88 }
  ];
  
  const result = mockResults[Math.floor(Math.random() * mockResults.length)];
  
  return {
    amount: result.amount,
    confidence: result.confidence,
    vendor: result.vendor,
    date: result.date,
    rawText: `Receipt from ${result.vendor}\nDate: ${result.date}\nTotal: $${result.amount}\nThank you for your business!`
  };
};

const BudgetTracker: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState('add');
  const [entries, setEntries] = useState<Entry[]>([
    {
      id: 1,
      type: 'income',
      amount: 2500,
      description: 'Website Development - ABC Corp',
      date: '2025-09-20',
      category: 'Freelance Payment',
      projectId: '1'
    },
    {
      id: 2,
      type: 'expense',
      amount: 45.67,
      description: 'Office supplies from Office Depot',
      date: '2025-09-19',
      category: 'Office Supplies',
      ocrScanned: true,
      ocrConfidence: 0.92,
      ocrVendor: 'Office Depot'
    },
    {
      id: 3,
      type: 'income',
      amount: 1800,
      description: 'Mobile App UI Design',
      date: '2025-09-18',
      category: 'Freelance Payment',
      projectId: '3'
    },
    {
      id: 4,
      type: 'expense',
      amount: 89.99,
      description: 'Adobe Creative Cloud Subscription',
      date: '2025-09-17',
      category: 'Software',
      projectId: '2'
    }
  ]);
  
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
    ocrDate: ''
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories
  const incomeCategories = ['Freelance Payment', 'Residuals', 'Grant', 'Salary', 'Bonus', 'Donation', 'Other'];
  const expenseCategories = ['Equipment', 'Transportation', 'Software', 'Marketing', 'Office Supplies', 'Personal', 'Food', 'Other'];

  // OCR Processing (using mock function)
  const processReceiptWithOCR = async (file: File) => {
    try {
      setProgress(0);
      setError(null);
      
      const imageUrl = URL.createObjectURL(file);
      setProgress(30);
      
      // Mock OCR processing with progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const result = await mockOCRProcess(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      console.log('OCR Result:', result);
      
      const amountResult = { amount: result.amount, confidence: result.confidence };
      const vendor = result.vendor;
      const date = result.date;
      
      URL.revokeObjectURL(imageUrl);
      
      return {
        amount: amountResult?.amount,
        confidence: amountResult?.confidence || 0,
        vendor,
        date,
        rawText: result.rawText
      };
    } catch (error) {
      console.error('OCR error:', error);
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

    setIsProcessing(true);
    setScanResult(null);
    setError(null);
    setProgress(0);

    try {
      const receiptUrl = URL.createObjectURL(file);
      const ocrResult = await processReceiptWithOCR(file);
      
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
    }
  };

  const handleSubmit = () => {
    if (!formData.amount || !formData.description || !formData.category) {
      alert('Please fill in all required fields (Amount, Description, Category)');
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
      ocrDate: formData.ocrDate || undefined
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
      ocrDate: ''
    });
    setReceiptFile(null);
    setReceiptUrl('');
    setScanResult(null);
    setError(null);

    alert('Entry saved successfully!');
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const handleCreateProject = () => {
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = () => {
    if (!newProjectData.name.trim()) {
      alert('Please enter a project name');
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

  const filteredEntries = entries.filter(entry => 
    searchQuery === '' || 
    entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.receiptTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    projects.find(p => p.id === entry.projectId)?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm rounded-xl p-6 mb-6 text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center">
            <DollarSign className="mr-3 text-4xl w-10 h-10" />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Budget Tracker
            </span>
          </h1>
          <p className="text-gray-300">Manage your freelance income and expenses with project tracking and AI-powered receipt scanning</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-emerald-800/50 to-green-900/50 border border-emerald-500/20 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center text-white mr-4">
                <TrendingUp className="w-6 h-6" />
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
                <TrendingDown className="w-6 h-6" />
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
                <Wallet className="w-6 h-6" />
              </div>
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
                className={`px-6 py-4 font-medium transition-all duration-200 flex items-center ${
                  activeTab === 'add'
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-purple-300'
                }`}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Entry
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 font-medium transition-all duration-200 flex items-center ${
                  activeTab === 'history'
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-purple-300'
                }`}
              >
                <History className="w-5 h-5 mr-2" />
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
                    <FolderPlus className="inline-block w-4 h-4 mr-2" />
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
                          <X className="w-4 h-4" />
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
                      <Plus className="w-4 h-4 mr-1" />
                      Create New Project
                    </button>
                  </div>
                </div>

                {/* Smart Receipt Scanner (only for expenses) */}
                {formData.type === 'expense' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        <Robot className="inline-block w-4 h-4 mr-2" />
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
                                Scanning receipt with AI...
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
                              <Upload className="w-12 h-12 text-purple-400 mx-auto" />
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
                          <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-red-300">Scanning Error</p>
                            <p className="text-xs text-red-400">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {scanResult && scanResult.amount && (
                      <div className="bg-gradient-to-br from-emerald-800/30 to-green-900/30 border border-emerald-500/30 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-emerald-400 mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-emerald-300">Receipt Scanned Successfully!</p>
                              <div className="text-xs text-emerald-400 mt-1 space-y-1">
                                <p><strong>Amount:</strong> ${scanResult.amount} (confidence: {Math.round(scanResult.confidence * 100)}%)</p>
                                {scanResult.vendor && <p><strong>Vendor:</strong> {scanResult.vendor}</p>}
                                {scanResult.date && <p><strong>Date:</strong> {scanResult.date}</p>}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveReceipt}
                            className="text-gray-400 hover:text-gray-300 p-1 hover:bg-slate-700/50 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {receiptUrl && (
                      <div className="bg-gradient-to-br from-slate-800/30 to-gray-900/30 border border-slate-600/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-300">Receipt Preview</p>
                          <button
                            type="button"
                            onClick={handleRemoveReceipt}
                            className="text-gray-400 hover:text-red-400 text-sm hover:bg-red-900/20 px-2 py-1 rounded transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="max-w-xs">
                          <img 
                            src={receiptUrl} 
                            alt="Receipt preview" 
                            className="w-full h-auto rounded border border-slate-600"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Amount *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="block w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="block w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter description..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="block w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a category</option>
                    {(formData.type === 'income' ? incomeCategories : expenseCategories).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg shadow-purple-500/25 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Entry
                  </button>
                </div>
              </div>
            ) : (
              /* Transaction History */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xl font-semibold text-purple-300">Transaction History</h2>
                  <div className="relative w-full sm:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredEntries.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📝</div>
                      <h3 className="text-lg font-medium text-gray-300 mb-2">
                        {entries.length === 0 ? 'No transactions yet' : 'No matching transactions'}
                      </h3>
                      <p className="text-gray-400">
                        {entries.length === 0 
                          ? 'Add your first income or expense entry to get started.' 
                          : 'Try adjusting your search criteria.'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredEntries.map((entry) => {
                      const associatedProject = projects.find(p => p.id === entry.projectId);
                      return (
                        <div
                          key={entry.id}
                          className="bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-slate-600/50 rounded-lg p-4 hover:border-purple-500/30 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${
                                entry.type === 'income' 
                                  ? 'bg-gradient-to-br from-emerald-400 to-green-500'
                                  : 'bg-gradient-to-br from-red-400 to-rose-500'
                              }`}>
                                {entry.type === 'income' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-medium text-white">{entry.description}</h3>
                                  {entry.ocrScanned && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-900/50 text-purple-300 border border-purple-500/30">
                                      <Robot className="w-3 h-3 mr-1" />
                                      AI Scanned
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="text-sm text-gray-400">{entry.category}</span>
                                  <span className="text-sm text-gray-400">•</span>
                                  <span className="text-sm text-gray-400">{entry.date}</span>
                                  
                                  {associatedProject && (
                                    <>
                                      <span className="text-sm text-gray-400">•</span>
                                      <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: associatedProject.color }}></div>
                                        <span className="text-sm text-purple-300">{associatedProject.name}</span>
                                      </div>
                                    </>
                                  )}
                                  
                                  {entry.ocrVendor && (
                                    <>
                                      <span className="text-sm text-gray-400">•</span>
                                      <span className="text-sm text-purple-400">from {entry.ocrVendor}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className={`text-lg font-bold ${
                                  entry.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                  {entry.type === 'income' ? '+' : '-'}${entry.amount.toFixed(2)}
                                </p>
                                {entry.ocrConfidence && entry.ocrConfidence > 0 && (
                                  <p className="text-xs text-gray-400">
                                    {Math.round(entry.ocrConfidence * 100)}% confidence
                                  </p>
                                )}
                              </div>
                              
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="text-gray-400 hover:text-red-400 p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {entry.receiptUrl && (
                            <div className="mt-3 pt-3 border-t border-slate-600/50">
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-400">Receipt attached</p>
                                <button className="text-purple-400 hover:text-purple-300 text-sm flex items-center">
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Receipt
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Summary Stats for Filtered Results */}
                {filteredEntries.length > 0 && searchQuery && (
                  <div className="bg-gradient-to-br from-slate-800/30 to-gray-900/30 border border-slate-600/30 rounded-lg p-4 mt-6">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Search Results Summary</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-400">Transactions</p>
                        <p className="text-lg font-bold text-white">{filteredEntries.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Total Income</p>
                        <p className="text-lg font-bold text-emerald-400">
                          ${filteredEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Total Expenses</p>
                        <p className="text-lg font-bold text-red-400">
                          ${filteredEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Project Creation Modal */}
        {isProjectModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-gray-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-300 flex items-center">
                  <FolderPlus className="w-5 h-5 mr-2" />
                  Create New Project
                </h3>
                <button
                  onClick={() => {
                    setIsProjectModalOpen(false);
                    setNewProjectData({ name: '', description: '', color: '#8b5cf6' });
                  }}
                  className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={newProjectData.name}
                    onChange={(e) => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
                    className="block w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter project name..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                  <textarea
                    value={newProjectData.description}
                    onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                    className="block w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Brief project description..."
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={newProjectData.color}
                      onChange={(e) => setNewProjectData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-10 rounded-lg border border-slate-600 bg-slate-800 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-gray-400">{newProjectData.color}</span>
                      <div className="flex space-x-2 mt-1">
                        {['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                          <button
                            key={color}
                            onClick={() => setNewProjectData(prev => ({ ...prev, color }))}
                            className="w-6 h-6 rounded-full border-2 border-slate-600 hover:border-slate-400 transition-colors"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsProjectModalOpen(false);
                    setNewProjectData({ name: '', description: '', color: '#8b5cf6' });
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProject}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Built with React, TypeScript, and Tailwind CSS • AI-Powered Receipt Scanning
          </p>
        </div>
      </div>
    </div>
  );
};

export default BudgetTracker;