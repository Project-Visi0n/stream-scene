import React, { useState, useEffect } from 'react';
import { uploadReceipt } from '../services/s3Service';

type Entry = {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
  receiptTitle?: string;
  receiptUrl?: string;
};

// Category chip component
interface CategoryChipProps {
  category: string;
  isSelected: boolean;
  onClick: (category: string) => void;
  type: 'income' | 'expense';
}

const CategoryChip: React.FC<CategoryChipProps> = ({ category, isSelected, onClick, type }) => {
  const baseClasses = "inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer select-none border";
  
  const typeColors = {
    income: isSelected
      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 shadow-sm"
      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300",
    expense: isSelected
      ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 shadow-sm"
      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${typeColors[type]}`}
      onClick={() => onClick(category)}
    >
      <span className="truncate max-w-32">{category}</span>
      {isSelected && (
        <svg
          className={`ml-2 h-4 w-4 ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      )}
    </button>
  );
};

// Category selector component 
interface CategorySelectorProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  type: 'income' | 'expense';
  label: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  type,
  label
}) => {
  const [showAll, setShowAll] = useState(false);
  const maxVisible = 6;
  const visibleCategories = showAll ? categories : categories.slice(0, maxVisible);
  const hasMore = categories.length > maxVisible;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        <span className="inline-block w-4 h-4 mr-2 text-center">🏷️</span>
        {label} *
      </label>
      
      {/* Selected category display */}
      {selectedCategory && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">Selected:</span>
            <div className="flex items-center gap-2">
              <CategoryChip
                category={selectedCategory}
                isSelected={true}
                onClick={onCategorySelect}
                type={type}
              />
              <button
                type="button"
                onClick={() => onCategorySelect('')}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Available categories */}
      <div className="space-y-3">
        <div className="text-sm text-gray-600 font-medium mb-2">Choose a category:</div>
        <div className="flex flex-wrap gap-2">
          {visibleCategories
            .filter(cat => cat !== selectedCategory)
            .map((category) => (
              <CategoryChip
                key={category}
                category={category}
                isSelected={false}
                onClick={onCategorySelect}
                type={type}
              />
            ))}
        </div>
        
        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAll ? 'Show Less' : `Show ${categories.length - maxVisible} More`}
          </button>
        )}
      </div>
    </div>
  );
};

const BudgetTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState('add');
  const [entries, setEntries] = useState<Entry[]>([
    { id: 1, type: 'income', amount: 2500, description: 'Freelance project', date: '2025-01-15', category: 'Freelance Payment' },
    { id: 2, type: 'expense', amount: 300, description: 'New camera lens', date: '2025-01-14', category: 'Equipment', receiptTitle: 'Camera Receipt', receiptUrl: '/sample-receipt.jpg' },
    { id: 3, type: 'income', amount: 850, description: 'Stock footage sales', date: '2025-01-12', category: 'Residuals' }
  ]);

  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    receiptTitle: ''
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  const incomeCategories = ['Freelance Payment', 'Residuals', 'Grant', 'Salary', 'Bonus', 'Other'];
  const expenseCategories = ['Equipment', 'Transportation', 'Software', 'Marketing', 'Office Supplies', 'Personal', 'Other'];

  const allCategories = [...new Set(entries.map(entry => entry.category))];

  // Input handler for text inputs only
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Separate handler for category selection
  const handleCategorySelect = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category: prev.category === category ? '' : category
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  const handleSubmit = () => {
    if (!formData.amount || !formData.description || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    let receiptUrl = '';
    if (receiptFile) {
      receiptUrl = URL.createObjectURL(receiptFile);
    }

    const newEntry: Entry = {
      id: Math.max(...entries.map(e => e.id), 0) + 1,
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: formData.date,
      category: formData.category,
      receiptTitle: formData.receiptTitle || undefined,
      receiptUrl: receiptUrl || undefined
    };

    setEntries(prev => [newEntry, ...prev]);
    
    setFormData({
      type: 'income',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      receiptTitle: ''
    });
    setReceiptFile(null);

    alert('Entry saved successfully!');
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const handleCategoryFilterToggle = (category: string) => {
    setCategoryFilter(prev => {
      const isSelected = prev.includes(category);
      if (isSelected) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const calculateTotals = () => {
    const totalIncome = entries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const totalExpenses = entries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      income: totalIncome,
      expenses: totalExpenses,
      net: totalIncome - totalExpenses
    };
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = searchQuery === '' || 
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.receiptTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter.length === 0 || 
      categoryFilter.includes(entry.category);
    
    return matchesSearch && matchesCategory;
  });

  const totals = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🎬</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">StreamScene</h1>
              <p className="text-slate-300 text-xs">Creative Workspace</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#" className="text-slate-300 hover:text-white flex items-center space-x-2 text-sm">
              <span>🏠</span><span>Home</span>
            </a>
            <a href="#" className="text-slate-300 hover:text-white flex items-center space-x-2 text-sm">
              <span>📋</span><span>Project Center</span>
            </a>
            <a href="#" className="text-slate-300 hover:text-white flex items-center space-x-2 text-sm">
              <span>📅</span><span>Content Scheduler</span>
            </a>
            <a href="#" className="text-slate-300 hover:text-white flex items-center space-x-2 text-sm">
              <span>🤖</span><span>AI Weekly Planner</span>
            </a>
            <a href="#" className="bg-yellow-500 text-slate-900 px-3 py-1 rounded-lg flex items-center space-x-2 text-sm font-medium">
              <span>💰</span><span>Budget Tracker</span>
            </a>
            <a href="#" className="text-slate-300 hover:text-white flex items-center space-x-2 text-sm">
              <span>🎥</span><span>Demos & Trailers</span>
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Tracker</h1>
          <p className="text-gray-600">Manage your freelance income and expenses</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center text-white mr-4">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.income)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-red-500 rounded-full flex items-center justify-center text-white mr-4">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.expenses)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center text-white mr-4">
                <span className="text-xl font-bold">$</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className={`text-2xl font-bold ${totals.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.net)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('add')}
                className={`px-6 py-4 font-medium flex items-center space-x-2 ${
                  activeTab === 'add'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-xl">+</span>
                <span>Add Entry</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 font-medium flex items-center space-x-2 ${
                  activeTab === 'history'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>📋</span>
                <span>Transaction History</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'add' ? (
              /* Add Entry Form */
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Add New Entry</h2>
                
                {/* Entry Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Entry Type *</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="income"
                        checked={formData.type === 'income'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                      />
                      <span className="ml-2 text-green-600 font-medium">Income</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="expense"
                        checked={formData.type === 'expense'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <span className="ml-2 text-red-600 font-medium">Expense</span>
                    </label>
                  </div>
                </div>

                {/* Amount and Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <span className="inline-block w-4 h-4 mr-2 text-center">$</span>
                      Amount *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <span className="inline-block w-4 h-4 mr-2 text-center">📅</span>
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* CATEGORY CHIPS - NO DROPDOWN HERE! */}
                <CategorySelector
                  categories={formData.type === 'income' ? incomeCategories : expenseCategories}
                  selectedCategory={formData.category}
                  onCategorySelect={handleCategorySelect}
                  type={formData.type}
                  label="Category"
                />

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Enter description..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Receipt Upload (only for expenses) */}
                {formData.type === 'expense' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Receipt Title</label>
                      <input
                        type="text"
                        name="receiptTitle"
                        value={formData.receiptTitle}
                        onChange={handleInputChange}
                        placeholder="e.g., Camera Store Receipt"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <span className="inline-block w-4 h-4 mr-2 text-center">📎</span>
                        Upload Receipt
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                        <div className="space-y-1 text-center">
                          {receiptFile ? (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium text-green-600">✓ {receiptFile.name}</span>
                              <button
                                type="button"
                                onClick={() => setReceiptFile(null)}
                                className="ml-2 text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="text-4xl">📄</div>
                              <div className="flex text-sm text-gray-600">
                                <label htmlFor="receipt-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                  <span>Upload a file</span>
                                  <input
                                    id="receipt-upload"
                                    name="receipt-upload"
                                    type="file"
                                    className="sr-only"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSubmit}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <span className="inline-block mr-2 text-lg">💾</span>
                    Save Entry
                  </button>
                  </div>
              </div>
            ) : (
              /* Transaction History */
              <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
                  
                  <div className="w-64">
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {allCategories.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Category:</h3>
                    <div className="flex flex-wrap gap-2">
                      {allCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => handleCategoryFilterToggle(category)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
                            categoryFilter.includes(category)
                              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          {category}
                          {categoryFilter.includes(category) && (
                            <svg
                              className="ml-2 h-4 w-4 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                    {categoryFilter.length > 0 && (
                      <button
                        onClick={() => setCategoryFilter([])}
                        className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}

                {(searchQuery || categoryFilter.length > 0) && (
                  <div className="text-sm text-gray-600">
                    Showing {filteredEntries.length} of {entries.length} transactions
                  </div>
                )}
                
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">$</div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {searchQuery || categoryFilter.length > 0 ? 'No transactions match your filters' : 'No transactions yet'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchQuery || categoryFilter.length > 0 ? 'Try adjusting your search or filters' : 'Get started by adding your first income or expense entry.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(entry.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                entry.type === 'income' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {entry.type === 'income' ? 'Income' : 'Expense'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {entry.category}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {entry.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {entry.receiptTitle ? (
                                <button
                                  onClick={() => entry.receiptUrl && window.open(entry.receiptUrl, '_blank')}
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  {entry.receiptTitle}
                                </button>
                              ) : (
                                <span className="text-gray-400">No receipt</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <span className={entry.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetTracker;