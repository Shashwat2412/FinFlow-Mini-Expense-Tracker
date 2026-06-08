import React, { useState } from 'react';
import { formatCurrency } from './SummaryPanel';

export default function BudgetWidget({ expenses, budgets, onUpdateBudgets }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBudgets, setEditedBudgets] = useState({ ...budgets });

  // Calculate this month's spending per category
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0');
  const thisMonthPrefix = `${currentYear}-${currentMonthStr}`;

  const thisMonthExpenses = expenses.filter(e => e.date.startsWith(thisMonthPrefix));
  
  const spentByCategory = {
    Food: 0,
    Transport: 0,
    Bills: 0,
    Entertainment: 0,
    Other: 0
  };

  thisMonthExpenses.forEach(e => {
    if (spentByCategory[e.category] !== undefined) {
      spentByCategory[e.category] += e.amount;
    }
  });

  const categories = Object.keys(budgets);

  const handleBudgetChange = (cat, val) => {
    const amountVal = val === '' ? 0 : Number(val);
    setEditedBudgets(prev => ({
      ...prev,
      [cat]: amountVal
    }));
  };

  const handleSave = () => {
    onUpdateBudgets(editedBudgets);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedBudgets({ ...budgets });
    setIsEditing(false);
  };

  // Helper to determine progress fill class
  const getProgressClass = (spent, limit) => {
    if (!limit || limit <= 0) return 'progress-normal';
    const percent = (spent / limit) * 100;
    if (percent >= 100) return 'progress-danger';
    if (percent >= 70) return 'progress-warning';
    return 'progress-normal';
  };

  // Helper to determine category spent color accent
  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Food': return 'var(--cat-food)';
      case 'Transport': return 'var(--cat-transport)';
      case 'Bills': return 'var(--cat-bills)';
      case 'Entertainment': return 'var(--cat-entertainment)';
      default: return 'var(--cat-other)';
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ animationDelay: '0.25s' }}>
      <div className="card-header">
        <h3 className="card-title">Category Budgets</h3>
        {!isEditing ? (
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} 
            onClick={() => {
              setEditedBudgets({ ...budgets });
              setIsEditing(true);
            }}
          >
            Adjust Limits
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-primary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} 
              onClick={handleSave}
            >
              Save
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} 
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div>
        {categories.map(cat => {
          const spent = spentByCategory[cat];
          const limit = isEditing ? editedBudgets[cat] : budgets[cat];
          const hasExceeded = limit > 0 && spent > limit;
          const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
          const displayPercentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

          return (
            <div 
              key={cat} 
              className={`budget-item ${hasExceeded ? 'category-over-alert' : ''}`}
              style={{
                padding: hasExceeded ? '0.5rem' : '0',
                margin: hasExceeded ? '0.5rem -0.5rem 1rem -0.5rem' : '0 0 1.25rem 0',
                borderRadius: hasExceeded ? '8px' : '0',
                border: hasExceeded ? '1px solid var(--danger)' : 'none',
                boxShadow: hasExceeded ? 'var(--glow-danger)' : 'none',
                transition: 'all var(--transition-normal)'
              }}
            >
              <div className="budget-info">
                <span className="budget-cat-name">
                  <span 
                    className="legend-dot" 
                    style={{ background: getCategoryColor(cat) }}
                  ></span>
                  {cat}
                </span>

                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Limit: ₹</span>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      style={{ width: '80px', padding: '0.2rem 0.4rem', fontSize: '0.85rem', display: 'inline-block' }}
                      value={limit}
                      onChange={(e) => handleBudgetChange(cat, e.target.value)}
                      aria-label={`${cat} Budget Limit`}
                    />
                  </div>
                ) : (
                  <span className="budget-values">
                    <span className="budget-spent">{formatCurrency(spent)}</span>
                    {limit > 0 ? (
                      <> / {formatCurrency(limit)} ({displayPercentage}%)</>
                    ) : (
                      <> / No Limit</>
                    )}
                  </span>
                )}
              </div>

              {!isEditing && limit > 0 && (
                <div className="progress-bar-track">
                  <div 
                    className={`progress-bar-fill ${getProgressClass(spent, limit)}`}
                    style={{ 
                      width: `${percentage}%`,
                      '--fill-color': getCategoryColor(cat) 
                    }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
