import React, { useState, useMemo } from 'react';
import { formatCurrency } from './SummaryPanel';

export default function ExpenseList({ expenses, onEditExpense, onDeleteExpense }) {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateRangeType, setDateRangeType] = useState('this-month'); // Default to this-month to show current spent
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Custom glassmorphic delete confirmation modal state
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState(null);

  // Categories helper
  const categoriesList = ['All', 'Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

  // Filter calculations
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      // 1. Category Filter
      if (categoryFilter !== 'All' && e.category !== categoryFilter) {
        return false;
      }

      // 2. Date Range Filter
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0');
      const thisMonthPrefix = `${currentYear}-${currentMonthStr}`;

      if (dateRangeType === 'this-month') {
        return e.date.startsWith(thisMonthPrefix);
      }

      if (dateRangeType === 'last-month') {
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(today.getMonth() - 1);
        const lmYear = lastMonthDate.getFullYear();
        const lmMonthStr = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
        const lastMonthPrefix = `${lmYear}-${lmMonthStr}`;
        return e.date.startsWith(lastMonthPrefix);
      }

      if (dateRangeType === 'custom') {
        if (customStartDate && e.date < customStartDate) return false;
        if (customEndDate && e.date > customEndDate) return false;
        return true;
      }

      return true; // "all"
    });
  }, [expenses, categoryFilter, dateRangeType, customStartDate, customEndDate]);

  // CSV Exporter
  const handleCSVExport = () => {
    if (filteredExpenses.length === 0) return;

    const headers = ['ID', 'Date', 'Category', 'Amount (₹)', 'Note'];
    const rows = filteredExpenses.map(e => [
      e.id,
      e.date,
      e.category,
      e.amount,
      // Wrap note in quotes to handle commas, escape inner quotes
      `"${(e.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Food': return 'badge-food';
      case 'Transport': return 'badge-transport';
      case 'Bills': return 'badge-bills';
      case 'Entertainment': return 'badge-entertainment';
      default: return 'badge-other';
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="card-header">
        <h3 className="card-title">Expense Log</h3>
        {filteredExpenses.length > 0 && (
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={handleCSVExport}>
            Export CSV
          </button>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="filter-bar">
        {/* Category filter */}
        <div className="filter-group">
          <label className="filter-label" htmlFor="cat-filter">Category</label>
          <select
            id="cat-filter"
            className="select-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Date filter type */}
        <div className="filter-group">
          <label className="filter-label" htmlFor="date-range-filter">Date Range</label>
          <select
            id="date-range-filter"
            className="select-filter"
            value={dateRangeType}
            onChange={(e) => setDateRangeType(e.target.value)}
          >
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="custom">Custom Range</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Custom date range inputs */}
        {dateRangeType === 'custom' && (
          <div className="filter-group animate-fade-in">
            <input
              type="date"
              className="date-filter-input"
              value={customStartDate}
              placeholder="Start Date"
              onChange={(e) => setCustomStartDate(e.target.value)}
              aria-label="Start Date"
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>to</span>
            <input
              type="date"
              className="date-filter-input"
              value={customEndDate}
              placeholder="End Date"
              onChange={(e) => setCustomEndDate(e.target.value)}
              aria-label="End Date"
            />
          </div>
        )}
      </div>

      {/* Log list/table */}
      {filteredExpenses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💸</div>
          <h4 className="empty-title">No expenses found</h4>
          <p className="empty-desc">Adjust your filters or add a new transaction log to get started.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="expense-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Note</th>
                <th>Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(e => (
                <tr key={e.id}>
                  <td className="col-date">{e.date}</td>
                  <td>
                    <span className={`badge ${getCategoryBadgeClass(e.category)}`}>
                      {e.category}
                    </span>
                  </td>
                  <td className="col-note" title={e.note}>{e.note || '-'}</td>
                  <td className="col-amount">{formatCurrency(e.amount)}</td>
                  <td className="col-actions">
                    <div className="actions-cell">
                      <button
                        className="btn-icon edit"
                        onClick={() => onEditExpense(e)}
                        title="Edit expense"
                        aria-label="Edit expense"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => setConfirmDeleteTarget(e)}
                        title="Delete expense"
                        aria-label="Delete expense"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Custom delete warning dialog */}
      {confirmDeleteTarget && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h3 className="modal-header" style={{ color: 'var(--danger)' }}>
              Confirm Delete
            </h3>
            <p className="modal-body">
              Are you sure you want to delete this expense of{' '}
              <strong>{formatCurrency(confirmDeleteTarget.amount)}</strong> under{' '}
              <strong>{confirmDeleteTarget.category}</strong> on{' '}
              <strong>{confirmDeleteTarget.date}</strong>? This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: 'var(--danger)', color: 'white' }}
                onClick={() => {
                  onDeleteExpense(confirmDeleteTarget.id);
                  setConfirmDeleteTarget(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
