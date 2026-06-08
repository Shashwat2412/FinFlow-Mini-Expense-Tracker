import React from 'react';

// Currency formatting helper
export const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (e) {
    return `₹${Number(amount).toFixed(2)}`;
  }
};

export default function SummaryPanel({ expenses, budgets }) {
  // Get current year and month for "this month" matching (YYYY-MM)
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0');
  const thisMonthPrefix = `${currentYear}-${currentMonthStr}`;

  // 1. Calculate total spent this month
  const thisMonthExpenses = expenses.filter(e => e.date.startsWith(thisMonthPrefix));
  const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 2. Identify highest single expense of all time
  const highestExpense = expenses.reduce((max, e) => {
    return (!max || e.amount > max.amount) ? e : max;
  }, null);

  // 3. Evaluate budgets vs spent this month per category
  // Initialize spending map for this month
  const monthlySpentByCategory = {};
  thisMonthExpenses.forEach(e => {
    monthlySpentByCategory[e.category] = (monthlySpentByCategory[e.category] || 0) + e.amount;
  });

  // Check how many categories exceeded their budget
  let exceededCount = 0;
  Object.keys(budgets).forEach(cat => {
    const spent = monthlySpentByCategory[cat] || 0;
    const limit = budgets[cat] || 0;
    if (limit > 0 && spent > limit) {
      exceededCount++;
    }
  });

  return (
    <div className="kpi-grid">
      {/* Card 1: Total Spent This Month */}
      <div className="glass-card kpi-card kpi-total animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <h3 className="kpi-title">Spent This Month</h3>
        <div className="kpi-value">{formatCurrency(totalThisMonth)}</div>
        <div className="kpi-meta">
          For {today.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Card 2: Highest Single Expense */}
      <div className="glass-card kpi-card kpi-highest animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h3 className="kpi-title">Highest Expense</h3>
        {highestExpense ? (
          <>
            <div className="kpi-value">{formatCurrency(highestExpense.amount)}</div>
            <div className="kpi-meta">
              {highestExpense.category} &bull; {highestExpense.date}
            </div>
          </>
        ) : (
          <>
            <div className="kpi-value">₹0.00</div>
            <div className="kpi-meta">No expenses logged yet</div>
          </>
        )}
      </div>

      {/* Card 3: Budget Status Alert */}
      <div className="glass-card kpi-card kpi-status animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <h3 className="kpi-title">Budget Health</h3>
        {exceededCount > 0 ? (
          <>
            <div className="kpi-value" style={{ color: 'var(--danger)' }}>
              {exceededCount} Alert{exceededCount > 1 ? 's' : ''}
            </div>
            <div className="kpi-meta">
              <span className="alert-pill">
                <span className="alert-pulse-dot"></span>
                Limit exceeded in {exceededCount} category{exceededCount > 1 ? 'ies' : ''}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="kpi-value" style={{ color: 'var(--success)' }}>
              Healthy
            </div>
            <div className="kpi-meta">All category spendings within budget limits.</div>
          </>
        )}
      </div>
    </div>
  );
}
