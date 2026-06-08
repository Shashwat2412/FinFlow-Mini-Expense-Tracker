import React, { useState, useMemo } from 'react';
import { formatCurrency } from './SummaryPanel';
import CustomSelect from './CustomSelect';

export default function ExpenseList({ expenses, onEditExpense, onDeleteExpense }) {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateRangeType, setDateRangeType] = useState('this-month'); // Default to this-month to show current spent
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Custom glassmorphic delete confirmation modal state
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState('5');

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

  // Dynamic page size based on "All" setting
  const pageSize = useMemo(() => {
    return itemsPerPage === 'all' ? Math.max(1, filteredExpenses.length) : Number(itemsPerPage);
  }, [itemsPerPage, filteredExpenses.length]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredExpenses.length / pageSize));
  }, [filteredExpenses.length, pageSize]);

  // Reset to page 1 on filter changes or page size changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, dateRangeType, customStartDate, customEndDate, itemsPerPage]);

  // Adjust page index if deletions reduce total page counts
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredExpenses.length, totalPages, currentPage]);

  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredExpenses.slice(start, end);
  }, [filteredExpenses, currentPage, pageSize]);

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
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', gap: '0.4rem' }} onClick={handleCSVExport}>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export CSV
          </button>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="filter-bar">
        {/* Category filter */}
        <div className="filter-group">
          <label className="filter-label">Category</label>
          <CustomSelect
            size="small"
            options={categoriesList.map(cat => ({ value: cat, label: cat }))}
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="Category"
          />
        </div>

        {/* Date filter type */}
        <div className="filter-group">
          <label className="filter-label">Date Range</label>
          <CustomSelect
            size="small"
            options={[
              { value: 'this-month', label: 'This Month' },
              { value: 'last-month', label: 'Last Month' },
              { value: 'custom', label: 'Custom Range' },
              { value: 'all', label: 'All Time' }
            ]}
            value={dateRangeType}
            onChange={setDateRangeType}
            placeholder="Date Range"
          />
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
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '1rem' }}>
            <line x1="18" y1="2" x2="22" y2="6"></line>
            <path d="M7.5 10.5h9M7.5 14.5h5"></path>
            <path d="M21 12V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"></path>
          </svg>
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
              {paginatedExpenses.map(e => (
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
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => setConfirmDeleteTarget(e)}
                        title="Delete expense"
                        aria-label="Delete expense"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls footer */}
      {filteredExpenses.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Show</span>
              <div style={{ width: '70px' }}>
                <CustomSelect
                  size="small"
                  options={[
                    { value: '5', label: '5' },
                    { value: '10', label: '10' },
                    { value: '25', label: '25' },
                    { value: '50', label: '50' },
                    { value: '100', label: '100' },
                    { value: 'all', label: 'All' }
                  ]}
                  value={itemsPerPage}
                  onChange={(val) => {
                    setItemsPerPage(val);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <span>rows</span>
            </div>
            <span style={{ color: 'var(--border-color)', userSelect: 'none' }}>|</span>
            <div>
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredExpenses.length)}-{Math.min(currentPage * pageSize, filteredExpenses.length)} of {filteredExpenses.length} entries
            </div>
          </div>
          
          {itemsPerPage !== 'all' && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          )}
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
