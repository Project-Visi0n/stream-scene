// budget-routes.js - Express.js routes for budget tracker
const express = require('express');
const multer = require('multer');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'your_username',
  password: process.env.DB_PASSWORD || 'your_password',
  database: process.env.DB_NAME || 'stream_scene'
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/receipts');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `receipt-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  }
});

// Helper function to get database connection
async function getDbConnection() {
  return await mysql.createConnection(dbConfig);
}

// GET - Fetch income types
router.get('/income-types', async (req, res) => {
  let connection;
  try {
    connection = await getDbConnection();
    const [rows] = await connection.execute('SELECT * FROM income_types ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching income types:', error);
    res.status(500).json({ error: 'Failed to fetch income types' });
  } finally {
    if (connection) await connection.end();
  }
});

// GET - Fetch expense categories
router.get('/expense-categories', async (req, res) => {
  let connection;
  try {
    connection = await getDbConnection();
    const [rows] = await connection.execute('SELECT * FROM expense_categories ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({ error: 'Failed to fetch expense categories' });
  } finally {
    if (connection) await connection.end();
  }
});

// POST - Create new income entry
router.post('/income', async (req, res) => {
  let connection;
  try {
    const {
      amount,
      incomeType,
      description,
      date,
      paymentMethod,
      clientName,
      projectName,
      invoiceNumber,
      isRecurring,
      recurringFrequency,
      taxWithheld
    } = req.body;

    // Get user ID from session/auth (you'll need to implement this)
    const userId = req.user ? req.user.id : 1; // Default for testing

    connection = await getDbConnection();
    
    // Get income type ID
    const [incomeTypeRows] = await connection.execute(
      'SELECT id FROM income_types WHERE name = ?',
      [incomeType]
    );
    
    if (incomeTypeRows.length === 0) {
      return res.status(400).json({ error: 'Invalid income type' });
    }
    
    const incomeTypeId = incomeTypeRows[0].id;

    // Insert income record
    const [result] = await connection.execute(`
      INSERT INTO income (
        user_id, amount, income_type_id, description, date_received,
        payment_method, client_name, project_name, invoice_number,
        is_recurring, recurring_frequency, tax_withheld
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, amount, incomeTypeId, description, date,
      paymentMethod, clientName, projectName, invoiceNumber,
      isRecurring === 'true' || isRecurring === true,
      recurringFrequency || null,
      taxWithheld || 0
    ]);

    res.status(201).json({
      message: 'Income entry created successfully',
      id: result.insertId
    });

  } catch (error) {
    console.error('Error creating income entry:', error);
    res.status(500).json({ error: 'Failed to create income entry' });
  } finally {
    if (connection) await connection.end();
  }
});

// POST - Create new expense entry (with file upload)
router.post('/expense', upload.single('receipt'), async (req, res) => {
  let connection;
  try {
    const {
      amount,
      expenseCategory,
      description,
      date,
      paymentMethod,
      vendorName,
      isBusinessExpense,
      isTaxDeductible
    } = req.body;

    // Get user ID from session/auth
    const userId = req.user ? req.user.id : 1; // Default for testing

    connection = await getDbConnection();
    
    // Get expense category ID
    const [categoryRows] = await connection.execute(
      'SELECT id FROM expense_categories WHERE name = ?',
      [expenseCategory]
    );
    
    if (categoryRows.length === 0) {
      return res.status(400).json({ error: 'Invalid expense category' });
    }
    
    const categoryId = categoryRows[0].id;

    // Handle receipt file
    let receiptFilename = null;
    let receiptUrl = null;
    
    if (req.file) {
      receiptFilename = req.file.filename;
      receiptUrl = `/uploads/receipts/${req.file.filename}`;
    }

    // Insert expense record
    const [result] = await connection.execute(`
      INSERT INTO expenses (
        user_id, amount, expense_category_id, description, date_incurred,
        payment_method, vendor_name, receipt_filename, receipt_url,
        is_business_expense, is_tax_deductible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, amount, categoryId, description, date,
      paymentMethod, vendorName, receiptFilename, receiptUrl,
      isBusinessExpense === 'true' || isBusinessExpense === true,
      isTaxDeductible === 'true' || isTaxDeductible === true
    ]);

    res.status(201).json({
      message: 'Expense entry created successfully',
      id: result.insertId,
      receiptUrl: receiptUrl
    });

  } catch (error) {
    console.error('Error creating expense entry:', error);
    
    // Clean up uploaded file if database insert failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'Failed to create expense entry' });
  } finally {
    if (connection) await connection.end();
  }
});

// GET - Fetch user's income entries
router.get('/income', async (req, res) => {
  let connection;
  try {
    const userId = req.user ? req.user.id : 1;
    const { startDate, endDate, incomeType, limit = 50, offset = 0 } = req.query;

    connection = await getDbConnection();
    
    let query = `
      SELECT i.*, it.name as income_type_name
      FROM income i
      JOIN income_types it ON i.income_type_id = it.id
      WHERE i.user_id = ?
    `;
    let params = [userId];

    // Add filters
    if (startDate) {
      query += ' AND i.date_received >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND i.date_received <= ?';
      params.push(endDate);
    }
    if (incomeType) {
      query += ' AND it.name = ?';
      params.push(incomeType);
    }

    query += ' ORDER BY i.date_received DESC, i.created_at DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await connection.execute(query, params);
    res.json(rows);

  } catch (error) {
    console.error('Error fetching income entries:', error);
    res.status(500).json({ error: 'Failed to fetch income entries' });
  } finally {
    if (connection) await connection.end();
  }
});

// GET - Fetch user's expense entries
router.get('/expense', async (req, res) => {
  let connection;
  try {
    const userId = req.user ? req.user.id : 1;
    const { startDate, endDate, category, limit = 50, offset = 0 } = req.query;

    connection = await getDbConnection();
    
    let query = `
      SELECT e.*, ec.name as category_name
      FROM expenses e
      JOIN expense_categories ec ON e.expense_category_id = ec.id
      WHERE e.user_id = ?
    `;
    let params = [userId];

    // Add filters
    if (startDate) {
      query += ' AND e.date_incurred >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND e.date_incurred <= ?';
      params.push(endDate);
    }
    if (category) {
      query += ' AND ec.name = ?';
      params.push(category);
    }

    query += ' ORDER BY e.date_incurred DESC, e.created_at DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await connection.execute(query, params);
    res.json(rows);

  } catch (error) {
    console.error('Error fetching expense entries:', error);
    res.status(500).json({ error: 'Failed to fetch expense entries' });
  } finally {
    if (connection) await connection.end();
  }
});

// GET - Financial summary/dashboard data
router.get('/summary', async (req, res) => {
  let connection;
  try {
    const userId = req.user ? req.user.id : 1;
    const { period = 'month' } = req.query; // month, quarter, year

    connection = await getDbConnection();
    
    let dateCondition;
    switch (period) {
      case 'quarter':
        dateCondition = 'DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
        break;
      case 'year':
        dateCondition = 'DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
        break;
      default: // month
        dateCondition = 'DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
    }

    // Get income summary
    const [incomeData] = await connection.execute(`
      SELECT 
        COUNT(*) as total_entries,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM income 
      WHERE user_id = ? AND date_received >= ${dateCondition}
    `, [userId]);

    // Get expense summary
    const [expenseData] = await connection.execute(`
      SELECT 
        COUNT(*) as total_entries,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount,
        SUM(CASE WHEN is_business_expense = 1 THEN amount ELSE 0 END) as business_expenses,
        SUM(CASE WHEN is_tax_deductible = 1 THEN amount ELSE 0 END) as tax_deductible
      FROM expenses 
      WHERE user_id = ? AND date_incurred >= ${dateCondition}
    `, [userId]);

    // Get income by type
    const [incomeByType] = await connection.execute(`
      SELECT 
        it.name,
        COUNT(*) as count,
        SUM(i.amount) as total
      FROM income i
      JOIN income_types it ON i.income_type_id = it.id
      WHERE i.user_id = ? AND i.date_received >= ${dateCondition}
      GROUP BY it.id, it.name
      ORDER BY total DESC
    `, [userId]);

    // Get expenses by category
    const [expensesByCategory] = await connection.execute(`
      SELECT 
        ec.name,
        COUNT(*) as count,
        SUM(e.amount) as total
      FROM expenses e
      JOIN expense_categories ec ON e.expense_category_id = ec.id
      WHERE e.user_id = ? AND e.date_incurred >= ${dateCondition}
      GROUP BY ec.id, ec.name
      ORDER BY total DESC
    `, [userId]);

    // Calculate net income
    const totalIncome = incomeData[0].total_amount || 0;
    const totalExpenses = expenseData[0].total_amount || 0;
    const netIncome = totalIncome - totalExpenses;

    res.json({
      period,
      income: {
        ...incomeData[0],
        by_type: incomeByType
      },
      expenses: {
        ...expenseData[0],
        by_category: expensesByCategory
      },
      net_income: netIncome,
      savings_rate: totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(2) : 0
    });

  } catch (error) {
    console.error('Error fetching summary data:', error);
    res.status(500).json({ error: 'Failed to fetch summary data' });
  } finally {
    if (connection) await connection.end();
  }
});

// DELETE - Delete income entry
router.delete('/income/:id', async (req, res) => {
  let connection;
  try {
    const userId = req.user ? req.user.id : 1;
    const { id } = req.params;

    connection = await getDbConnection();
    
    const [result] = await connection.execute(
      'DELETE FROM income WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Income entry not found' });
    }

    res.json({ message: 'Income entry deleted successfully' });

  } catch (error) {
    console.error('Error deleting income entry:', error);
    res.status(500).json({ error: 'Failed to delete income entry' });
  } finally {
    if (connection) await connection.end();
  }
});

// DELETE - Delete expense entry
router.delete('/expense/:id', async (req, res) => {
  let connection;
  try {
    const userId = req.user ? req.user.id : 1;
    const { id } = req.params;

    connection = await getDbConnection();
    
    // Get receipt filename before deleting
    const [expense] = await connection.execute(
      'SELECT receipt_filename FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (expense.length === 0) {
      return res.status(404).json({ error: 'Expense entry not found' });
    }

    // Delete the record
    const [result] = await connection.execute(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    // Delete receipt file if it exists
    if (expense[0].receipt_filename) {
      try {
        const filePath = path.join(__dirname, '../uploads/receipts', expense[0].receipt_filename);
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error('Error deleting receipt file:', fileError);
        // Don't fail the request if file deletion fails
      }
    }

    res.json({ message: 'Expense entry deleted successfully' });

  } catch (error) {
    console.error('Error deleting expense entry:', error);
    res.status(500).json({ error: 'Failed to delete expense entry' });
  } finally {
    if (connection) await connection.end();
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  if (error.message.includes('Only JPEG, PNG, and PDF files are allowed')) {
    return res.status(400).json({ error: error.message });
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = router;