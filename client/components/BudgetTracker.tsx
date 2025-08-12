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

const BudgetTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState('add');
  const [entries, setEntries] = useState<Entry[]>([
    // Sample data to verify it's working
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

  const incomeCategories = ['Freelance Payment', 'Residuals', 'Grant', 'Salary', 'Bonus', 'Other'];
  const expenseCategories = ['Equipment', 'Transportation', 'Software', 'Marketing', 'Office Supplies', 'Personal', 'Other'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      // In a real app, you'd upload the file to your server here
      // For now, we'll create a fake URL
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
    
    // Reset form
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

  const filteredEntries = entries.filter(entry => 
    searchQuery === '' || 
    entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.receiptTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totals = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Tracker</h1>
        <p className="text-gray-600">Manage your freelance income and expenses</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">↗</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.income)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">↘</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.expenses)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">$</div>
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
              className={`px-6 py-4 font-medium ${
                activeTab === 'add'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="inline-block w-5 h-5 mr-2 text-center font-bold">+</span>
              Add Entry
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
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
              <h2 className="text-xl font-semibold text-gray-900">Add New Entry</h2>
              
              {/* Entry Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entry Type *</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={formData.type === 'income'}
                      onChange={handleInputChange}
                      className="text-green-600 focus:ring-green-500"
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
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-red-600 font-medium">Expense</span>
                  </label>
                </div>
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="inline-block w-4 h-4 mr-1 text-center font-bold">$</span>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="inline-block w-4 h-4 mr-1 text-center font-bold">📅</span>
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="inline-block w-4 h-4 mr-1 text-center font-bold">🏷️</span>
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select category</option>
                  {(formData.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Receipt Upload (only for expenses) */}
              {formData.type === 'expense' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Title</label>
                    <input
                      type="text"
                      name="receiptTitle"
                      value={formData.receiptTitle}
                      onChange={handleInputChange}
                      placeholder="e.g., Camera Store Receipt"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="inline-block w-4 h-4 mr-1 text-center font-bold">📎</span>
                      Upload Receipt
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400">
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
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
                
                {/* Search Box */}
                <div className="w-64">
                  <input
                    type="text"
                    placeholder="Search by description, receipt title, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">$</div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {searchQuery ? 'No transactions match your search' : 'No transactions yet'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery ? 'Try a different search term' : 'Get started by adding your first income or expense entry.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
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
  );
};

export default BudgetTracker;