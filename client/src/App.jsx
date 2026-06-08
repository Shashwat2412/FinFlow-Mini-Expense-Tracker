import React, { useState, useEffect } from 'react';
import SummaryPanel from './components/SummaryPanel';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import BudgetWidget from './components/BudgetWidget';
import CategoryChart from './components/CategoryChart';
import './App.css';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState({
    Food: 500,
    Transport: 150,
    Bills: 800,
    Entertainment: 200,
    Other: 150
  });

  const [editingExpense, setEditingExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch expenses & budgets concurrently
        const [expensesRes, budgetsRes] = await Promise.all([
          fetch(`${API_BASE}/expenses`),
          fetch(`${API_BASE}/budgets`)
        ]);

        if (!expensesRes.ok || !budgetsRes.ok) {
          throw new Error('Failed to load ledger data from server.');
        }

        const expensesData = await expensesRes.json();
        const budgetsData = await budgetsRes.json();

        setExpenses(expensesData);
        setBudgets(budgetsData);
      } catch (err) {
        console.error('Server sync error:', err);
        setError('Could not connect to the backend server. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handler to save (create or update) expense
  const handleSaveExpense = async (expenseData) => {
    try {
      const isEditing = !!expenseData.id;
      const url = isEditing 
        ? `${API_BASE}/expenses/${expenseData.id}` 
        : `${API_BASE}/expenses`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.errors?.join(', ') || 'Failed to save expense.');
      }

      const savedExpense = await response.json();

      if (isEditing) {
        setExpenses(prev => prev.map(e => e.id === savedExpense.id ? savedExpense : e));
        setEditingExpense(null);
      } else {
        // Prepend new expense
        setExpenses(prev => [savedExpense, ...prev]);
      }
      setError(null);
    } catch (err) {
      console.error('Save expense error:', err);
      alert(err.message || 'Error saving expense.');
    }
  };

  // Handler to delete expense
  const handleDeleteExpense = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/expenses/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense.');
      }

      setExpenses(prev => prev.filter(e => e.id !== id));
      
      // Clear editing state if we deleted the item we were editing
      if (editingExpense?.id === id) {
        setEditingExpense(null);
      }
      setError(null);
    } catch (err) {
      console.error('Delete expense error:', err);
      alert(err.message || 'Error deleting expense.');
    }
  };

  // Handler to update category budgets
  const handleUpdateBudgets = async (newBudgets) => {
    try {
      const response = await fetch(`${API_BASE}/budgets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBudgets)
      });

      if (!response.ok) {
        throw new Error('Failed to update budgets.');
      }

      const updated = await response.json();
      setBudgets(updated);
      setError(null);
    } catch (err) {
      console.error('Update budgets error:', err);
      alert(err.message || 'Error updating budgets.');
    }
  };

  return (
    <div className="app-container">
      {/* Brand Header */}
      <header>
        <div className="brand">
          <h1 className="brand-logo">FinFlow</h1>
          <span className="brand-tag">v1.0.0</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </header>

      {/* Global Connection Error Alert */}
      {error && (
        <div 
          className="glass-card animate-fade-in" 
          style={{ 
            borderColor: 'var(--danger)', 
            background: 'hsla(0, 95%, 60%, 0.05)', 
            color: 'var(--danger)', 
            padding: '1rem', 
            marginBottom: '2rem', 
            fontSize: '0.9rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--border-color)',
            borderTopColor: 'var(--accent-cyan)',
            borderRadius: '50%',
            animation: 'pulse-danger-dot 1s infinite linear'
          }}></div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading ledger state...</span>
        </div>
      ) : (
        <>
          {/* Top Aggregation Cards */}
          <SummaryPanel expenses={expenses} budgets={budgets} />

          {/* Main Dashboard Layout Grid */}
          <div className="dashboard-grid">
            
            {/* Left Column: Log Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <ExpenseForm 
                onSaveExpense={handleSaveExpense} 
                editingExpense={editingExpense}
                onCancelEdit={() => setEditingExpense(null)}
              />
              <BudgetWidget 
                expenses={expenses} 
                budgets={budgets} 
                onUpdateBudgets={handleUpdateBudgets}
              />
            </div>

            {/* Right Column: Visualization & Logs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <CategoryChart expenses={expenses} />
              <ExpenseList 
                expenses={expenses} 
                onEditExpense={(e) => setEditingExpense(e)}
                onDeleteExpense={handleDeleteExpense}
              />
            </div>

          </div>
        </>
      )}
    </div>
  );
}
