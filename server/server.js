const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const EXPENSES_FILE = path.join(DATA_DIR, 'expenses.json');
const BUDGETS_FILE = path.join(DATA_DIR, 'budgets.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_BUDGETS = {
  Food: 500,
  Transport: 150,
  Bills: 800,
  Entertainment: 200,
  Other: 150
};

// Initialize files if they don't exist
if (!fs.existsSync(EXPENSES_FILE)) {
  fs.writeFileSync(EXPENSES_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(BUDGETS_FILE)) {
  fs.writeFileSync(BUDGETS_FILE, JSON.stringify(DEFAULT_BUDGETS, null, 2));
}

// Helpers for reading/writing JSON
function readJSON(file) {
  try {
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
    return [];
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${file}:`, error);
    return false;
  }
}

// Validation helper
const VALID_CATEGORIES = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

function validateExpense(expense) {
  const errors = [];
  
  // Amount validation
  const amount = Number(expense.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push('Amount must be a positive number.');
  }

  // Category validation
  if (!expense.category || !VALID_CATEGORIES.includes(expense.category)) {
    errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`);
  }

  // Date validation
  if (!expense.date) {
    errors.push('Date is required.');
  } else {
    const dateVal = new Date(expense.date);
    if (isNaN(dateVal.getTime())) {
      errors.push('Date is invalid.');
    } else {
      // Prevent future dates (local system time, format to YYYY-MM-DD for comparison)
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      if (expense.date > todayStr) {
        errors.push('Date cannot be in the future.');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// API Routes

// 1. GET /api/expenses
app.get('/api/expenses', (req, res) => {
  let expenses = readJSON(EXPENSES_FILE);
  const { category, startDate, endDate } = req.query;

  if (category) {
    expenses = expenses.filter(e => e.category.toLowerCase() === category.toLowerCase());
  }

  if (startDate) {
    expenses = expenses.filter(e => e.date >= startDate);
  }

  if (endDate) {
    expenses = expenses.filter(e => e.date <= endDate);
  }

  // Sort by date newest first, then by UUID/alphabetical
  expenses.sort((a, b) => {
    const dateCompare = new Date(b.date) - new Date(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.id.localeCompare(a.id);
  });

  res.json(expenses);
});

// 2. POST /api/expenses
app.post('/api/expenses', (req, res) => {
  const { amount, category, date, note } = req.body;
  const newExpense = {
    id: randomUUID(),
    amount: Number(amount),
    category,
    date,
    note: note ? String(note).trim() : ''
  };

  const validation = validateExpense(newExpense);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }

  const expenses = readJSON(EXPENSES_FILE);
  expenses.push(newExpense);
  writeJSON(EXPENSES_FILE, expenses);

  res.status(201).json(newExpense);
});

// 3. PUT /api/expenses/:id
app.put('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const { amount, category, date, note } = req.body;

  const expenses = readJSON(EXPENSES_FILE);
  const index = expenses.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Expense not found.' });
  }

  const updatedExpense = {
    id,
    amount: Number(amount),
    category,
    date,
    note: note ? String(note).trim() : ''
  };

  const validation = validateExpense(updatedExpense);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }

  expenses[index] = updatedExpense;
  writeJSON(EXPENSES_FILE, expenses);

  res.json(updatedExpense);
});

// 4. DELETE /api/expenses/:id
app.delete('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const expenses = readJSON(EXPENSES_FILE);
  const index = expenses.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Expense not found.' });
  }

  expenses.splice(index, 1);
  writeJSON(EXPENSES_FILE, expenses);

  res.json({ success: true, message: 'Expense deleted successfully.' });
});

// 5. GET /api/budgets
app.get('/api/budgets', (req, res) => {
  const budgets = readJSON(BUDGETS_FILE);
  res.json(budgets);
});

// 6. PUT /api/budgets
app.put('/api/budgets', (req, res) => {
  const newBudgets = req.body;
  const currentBudgets = readJSON(BUDGETS_FILE);

  // Validate budgets
  for (const cat of Object.keys(newBudgets)) {
    if (!VALID_CATEGORIES.includes(cat)) {
      return res.status(400).json({ error: `Invalid category: ${cat}` });
    }
    const val = Number(newBudgets[cat]);
    if (isNaN(val) || val < 0) {
      return res.status(400).json({ error: `Budget for ${cat} must be a positive number.` });
    }
    currentBudgets[cat] = val;
  }

  writeJSON(BUDGETS_FILE, currentBudgets);
  res.json(currentBudgets);
});

// If executing as the entry file, listen on PORT
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; // For testing purposes
