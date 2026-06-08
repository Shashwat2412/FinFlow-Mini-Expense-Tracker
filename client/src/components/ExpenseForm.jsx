import React, { useState, useEffect } from 'react';
import CustomSelect from './CustomSelect';

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

export default function ExpenseForm({ onSaveExpense, editingExpense, onCancelEdit }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  
  // Validation error states
  const [errors, setErrors] = useState({});

  // Sync state if editingExpense changes
  useEffect(() => {
    if (editingExpense) {
      setAmount(editingExpense.amount);
      setCategory(editingExpense.category);
      setDate(editingExpense.date);
      setNote(editingExpense.note || '');
      setErrors({});
    } else {
      resetForm();
    }
  }, [editingExpense]);

  // Set default date to today for new expenses
  useEffect(() => {
    if (!editingExpense) {
      const todayStr = new Date().toISOString().split('T')[0];
      setDate(todayStr);
    }
  }, [editingExpense]);

  const resetForm = () => {
    setAmount('');
    setCategory('');
    const todayStr = new Date().toISOString().split('T')[0];
    setDate(todayStr);
    setNote('');
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};
    const parsedAmount = Number(amount);
    
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Please enter a positive number greater than 0.';
    }

    if (!category || !CATEGORIES.includes(category)) {
      newErrors.category = 'Category selection is required.';
    }

    if (!date) {
      newErrors.date = 'Date is required.';
    } else {
      const dateVal = new Date(date);
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      if (date > todayStr) {
        newErrors.date = 'Future dates are not allowed.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const expenseData = {
      amount: Number(amount),
      category,
      date,
      note: note.trim()
    };

    if (editingExpense) {
      expenseData.id = editingExpense.id;
    }

    onSaveExpense(expenseData);
    resetForm();
  };

  // Prevent selecting future dates in native HTML date picker
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className={`glass-card ${editingExpense ? 'editing-expense' : ''} animate-fade-in`}>
      <div className="card-header">
        <h3 className={`card-title ${editingExpense ? 'form-title-edit' : ''}`}>
          {editingExpense ? 'Edit Expense' : 'Add Expense'}
        </h3>
        {editingExpense && (
          <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={onCancelEdit}>
            Reset
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Amount */}
        <div className="form-group">
          <label className="form-label" htmlFor="amount-input">Amount (₹)</label>
          <input
            id="amount-input"
            type="number"
            step="0.01"
            placeholder="0.00"
            className={`form-input ${errors.amount ? 'is-invalid' : ''}`}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errors.amount) setErrors({ ...errors, amount: null });
            }}
            required
          />
          {errors.amount && <div className="error-text">{errors.amount}</div>}
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label" htmlFor="category-select">Category</label>
          <CustomSelect
            options={CATEGORIES.map(cat => ({ value: cat, label: cat }))}
            value={category}
            onChange={(val) => {
              setCategory(val);
              if (errors.category) setErrors({ ...errors, category: null });
            }}
            placeholder="Select Category"
            error={errors.category}
          />
          {errors.category && <div className="error-text">{errors.category}</div>}
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="form-label" htmlFor="date-input">Date</label>
          <input
            id="date-input"
            type="date"
            max={todayStr}
            className={`form-input ${errors.date ? 'is-invalid' : ''}`}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date) setErrors({ ...errors, date: null });
            }}
            required
          />
          {errors.date && <div className="error-text">{errors.date}</div>}
        </div>

        {/* Note */}
        <div className="form-group">
          <label className="form-label" htmlFor="note-textarea">Note (Optional)</label>
          <textarea
            id="note-textarea"
            placeholder="What was this spent on?"
            className="form-textarea"
            rows="3"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
            {editingExpense ? 'Update Expense' : 'Log Expense'}
          </button>
          
          {editingExpense && (
            <button type="button" className="btn btn-secondary" onClick={onCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
