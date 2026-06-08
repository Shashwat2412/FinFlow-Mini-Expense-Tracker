import React, { useState, useEffect } from 'react';
import SummaryPanel from './components/SummaryPanel';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import BudgetWidget from './components/BudgetWidget';
import CategoryChart from './components/CategoryChart';
import TrendChart from './components/TrendChart';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState({
    Food: 500,
    Transport: 150,
    Bills: 800,
    Entertainment: 200,
    Other: 150
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button 
            className="btn btn-primary" 
            style={{ gap: '0.45rem', padding: '0.55rem 1.15rem', fontSize: '0.85rem' }} 
            onClick={() => { setEditingExpense(null); setIsFormOpen(true); }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Expense
          </button>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
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
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          {error}
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
          {/* Top Summary Stats Section */}
          <SummaryPanel expenses={expenses} budgets={budgets} />

          {/* Row 2: Spending Distribution Section (Budgets on left, Breakdown Donut on right) */}
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1.1fr 0.9fr', marginBottom: '2rem' }}>
            <BudgetWidget 
              expenses={expenses} 
              budgets={budgets} 
              onUpdateBudgets={handleUpdateBudgets}
            />
            <CategoryChart expenses={expenses} />
          </div>

          {/* Row 3: Trend Visualization Section */}
          <div style={{ marginBottom: '2rem' }}>
            <TrendChart expenses={expenses} />
          </div>

          {/* Row 4: Transaction Ledger History Section */}
          <div>
            <ExpenseList 
              expenses={expenses} 
              onEditExpense={(e) => {
                setEditingExpense(e);
                setIsFormOpen(true);
              }}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>

          {/* Modal Popup Overlay for Adding & Editing Transactions */}
          {(isFormOpen || editingExpense) && (
            <div className="modal-overlay">
              <ExpenseForm 
                onSaveExpense={(data) => {
                  handleSaveExpense(data);
                  setIsFormOpen(false);
                }} 
                editingExpense={editingExpense}
                onCancelEdit={() => {
                  setEditingExpense(null);
                  setIsFormOpen(false);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
