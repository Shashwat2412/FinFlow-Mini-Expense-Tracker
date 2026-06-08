import React, { useState, useMemo } from 'react';
import { formatCurrency } from './SummaryPanel';

export default function TrendChart({ expenses }) {
  const [hoveredBarIdx, setHoveredBarIdx] = useState(null);

  // Calculate daily totals for the last 7 calendar days (from 6 days ago to today)
  const dailyTrend = useMemo(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const label = d.toLocaleDateString('default', { day: '2-digit', month: 'short' });
      dates.push({ dateStr, label, amount: 0 });
    }

    expenses.forEach(e => {
      const matchingDay = dates.find(d => d.dateStr === e.date);
      if (matchingDay) {
        matchingDay.amount += e.amount;
      }
    });

    return dates;
  }, [expenses]);

  const maxDailyAmount = useMemo(() => {
    const max = Math.max(...dailyTrend.map(d => d.amount));
    return max > 0 ? max : 100; // Divisions safety fallback
  }, [dailyTrend]);

  return (
    <div className="glass-card animate-fade-in" style={{ animationDelay: '0.25s', width: '100%' }}>
      <div className="card-header">
        <h3 className="card-title">7-Day Spending Trend</h3>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '200px', marginTop: '1rem' }}>
        <svg width="100%" height="100%" viewBox="0 0 540 200" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="bar-trend-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0.75" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          <line x1="45" y1="20" x2="520" y2="20" className="chart-axis-line" />
          <line x1="45" y1="85" x2="520" y2="85" className="chart-axis-line" />
          <line x1="45" y1="150" x2="520" y2="150" stroke="var(--border-color)" strokeWidth="1" />

          {/* Y-Axis Value Labels */}
          <text x="36" y="24" fill="var(--text-muted)" fontSize="8.5" fontWeight="600" textAnchor="end">
            {formatCurrency(maxDailyAmount)}
          </text>
          <text x="36" y="89" fill="var(--text-muted)" fontSize="8.5" fontWeight="600" textAnchor="end">
            {formatCurrency(maxDailyAmount / 2)}
          </text>
          <text x="36" y="154" fill="var(--text-muted)" fontSize="8.5" fontWeight="600" textAnchor="end">
            ₹0
          </text>

          {/* Bars */}
          {dailyTrend.map((d, idx) => {
            const H = (d.amount / maxDailyAmount) * 130; // Max height 130px
            const Y = 150 - H;
            // Distribute 7 bars evenly across width: Left start at 60px, ending near 500px
            const X = 65 + idx * 70;
            const isHovered = hoveredBarIdx === idx;

            return (
              <g key={d.dateStr}>
                {/* Large invisible interactive hover boundary box */}
                <rect
                  x={X - 15}
                  y="10"
                  width="60"
                  height="145"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredBarIdx(idx)}
                  onMouseLeave={() => setHoveredBarIdx(null)}
                />

                {/* Bar Fill */}
                {d.amount > 0 && (
                  <rect
                    className="chart-bar-rect"
                    x={X}
                    y={Y}
                    width="30"
                    height={H}
                    rx="5"
                    fill="url(#bar-trend-gradient)"
                    onMouseEnter={() => setHoveredBarIdx(idx)}
                    onMouseLeave={() => setHoveredBarIdx(null)}
                    style={{
                      transformOrigin: `center 150px`,
                      transform: isHovered ? 'scaleX(1.06)' : 'none',
                      transition: 'all var(--transition-fast)'
                    }}
                  />
                )}

                {/* X-Axis Date tags */}
                <text
                  x={X + 15}
                  y="170"
                  fill={isHovered ? 'var(--accent-cyan)' : 'var(--text-secondary)'}
                  fontSize="9.5"
                  fontWeight={isHovered ? '600' : '500'}
                  textAnchor="middle"
                  style={{ transition: 'color var(--transition-fast)' }}
                >
                  {d.label}
                </text>

                {/* Interactive Tooltips appearing directly above bars */}
                {isHovered && d.amount > 0 && (
                  <text
                    x={X + 15}
                    y={Y - 8}
                    className="chart-tooltip-text animate-fade-in"
                    style={{ fontSize: '9.5px', fill: 'var(--accent-cyan)', filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' }}
                  >
                    {formatCurrency(d.amount)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
