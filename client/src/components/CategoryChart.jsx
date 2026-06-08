import React, { useState, useMemo } from 'react';
import { formatCurrency } from './SummaryPanel';

export default function CategoryChart({ expenses }) {
  const [hoveredCat, setHoveredCat] = useState(null);
  const [hoveredBarIdx, setHoveredBarIdx] = useState(null);

  // 1. Donut Chart - Category Totals Calculations
  const categoryTotals = useMemo(() => {
    const totals = {
      Food: 0,
      Transport: 0,
      Bills: 0,
      Entertainment: 0,
      Other: 0
    };

    expenses.forEach(e => {
      if (totals[e.category] !== undefined) {
        totals[e.category] += e.amount;
      }
    });

    return totals;
  }, [expenses]);

  const totalSpent = useMemo(() => {
    return Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
  }, [categoryTotals]);

  const categoryColors = {
    Food: 'var(--cat-food)',
    Transport: 'var(--cat-transport)',
    Bills: 'var(--cat-bills)',
    Entertainment: 'var(--cat-entertainment)',
    Other: 'var(--cat-other)'
  };

  const chartData = useMemo(() => {
    if (totalSpent === 0) return [];
    
    let cumulativePercent = 0;
    return Object.keys(categoryTotals).map(cat => {
      const amount = categoryTotals[cat];
      const percent = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
      const data = {
        category: cat,
        amount,
        percent,
        startPercent: cumulativePercent
      };
      cumulativePercent += percent;
      return data;
    }).filter(d => d.amount > 0);
  }, [categoryTotals, totalSpent]);

  // Donut Geometry Parameters (Adjusted to widen the center hole)
  const RADIUS = 58;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~364.42
  const STROKE_WIDTH = 12;
  const CENTER = 80;

  const centerDisplay = useMemo(() => {
    if (hoveredCat) {
      const amount = categoryTotals[hoveredCat];
      const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
      return {
        title: hoveredCat,
        amount: formatCurrency(amount),
        sub: `${pct}% of total`
      };
    }
    return {
      title: 'Total Spent',
      amount: formatCurrency(totalSpent),
      sub: `${expenses.length} log${expenses.length === 1 ? '' : 's'}`
    };
  }, [hoveredCat, categoryTotals, totalSpent, expenses.length]);

  // 2. Bar Chart - Last 7 Days Spending Daily Trend Calculations
  const dailyTrend = useMemo(() => {
    const dates = [];
    // Generate dates from 6 days ago to today
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
    <div className="glass-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="card-header">
        <h3 className="card-title">Ledger Visualizations</h3>
      </div>

      {totalSpent === 0 ? (
        <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '1rem' }}>
            <line x1="18" y1="2" x2="22" y2="6"></line>
            <path d="M12 20V10"></path>
            <path d="M18 20V4"></path>
            <path d="M6 20v-4"></path>
          </svg>
          <h4 className="empty-title">No spending data</h4>
          <p className="empty-desc">Breakdowns and charts will render once you log expenses.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem' }}>
          
          {/* Left Block: Category Donut Chart */}
          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '0.3px' }}>Category Breakdown</h4>
            <div className="chart-container" style={{ padding: 0, justifyContent: 'flex-start', flexWrap: 'nowrap' }}>
              
              {/* Donut SVG Wrap */}
              <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 160 160"
                  className="svg-donut"
                >
                  <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    className="donut-segment"
                    stroke="hsla(222, 20%, 20%, 0.3)"
                    strokeWidth={STROKE_WIDTH}
                    fill="transparent"
                  />

                  {chartData.map((seg) => {
                    const strokeDash = (seg.percent / 100) * CIRCUMFERENCE;
                    const strokeOffset = CIRCUMFERENCE - (seg.startPercent / 100) * CIRCUMFERENCE;
                    const isHovered = hoveredCat === seg.category;
                    
                    return (
                      <circle
                        key={seg.category}
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS}
                        className="donut-segment"
                        stroke={categoryColors[seg.category]}
                        strokeWidth={isHovered ? STROKE_WIDTH + 3 : STROKE_WIDTH}
                        strokeDasharray={`${strokeDash} ${CIRCUMFERENCE - strokeDash}`}
                        strokeDashoffset={strokeOffset}
                        fill="transparent"
                        onMouseEnter={() => setHoveredCat(seg.category)}
                        onMouseLeave={() => setHoveredCat(null)}
                        style={{
                          transformOrigin: 'center',
                          opacity: hoveredCat && !isHovered ? 0.45 : 1,
                          transition: 'all var(--transition-fast)'
                        }}
                      />
                    );
                  })}
                </svg>

                {/* Restricted overlay box that fits perfectly in the hole */}
                <div className="chart-center-wrapper">
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>
                    {centerDisplay.title}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: '0.05rem 0', whiteSpace: 'nowrap' }}>
                    {centerDisplay.amount}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    {centerDisplay.sub}
                  </div>
                </div>
              </div>

              {/* Legend Grid */}
              <div className="chart-legend" style={{ marginLeft: '1.25rem' }}>
                {Object.keys(categoryTotals).map(cat => {
                  const amount = categoryTotals[cat];
                  const percent = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                  const isHovered = hoveredCat === cat;

                  return (
                    <div
                      key={cat}
                      className="legend-item"
                      onMouseEnter={() => setHoveredCat(cat)}
                      onMouseLeave={() => setHoveredCat(null)}
                      style={{
                        borderLeft: isHovered ? `3px solid ${categoryColors[cat]}` : '3px solid transparent',
                        background: isHovered ? 'hsla(222, 25%, 15%, 0.4)' : 'transparent',
                        paddingLeft: '0.4rem',
                        opacity: hoveredCat && !isHovered ? 0.5 : 1,
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div className="legend-color-label">
                        <span className="legend-dot" style={{ background: categoryColors[cat] }}></span>
                        <span style={{ fontWeight: isHovered ? '600' : '400', fontSize: '0.8rem' }}>{cat}</span>
                      </div>
                      <div className="legend-value" style={{ fontSize: '0.8rem' }}>
                        {percent}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Block: Daily Expense Trend Bar Chart */}
          <div className="bar-chart-container">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '0.3px' }}>7-Day Expense Trend</h4>
            <div style={{ position: 'relative', width: '100%', height: '160px' }}>
              <svg width="100%" height="100%" viewBox="0 0 340 160" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0.75" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Guidelines */}
                <line x1="35" y1="15" x2="330" y2="15" className="chart-axis-line" />
                <line x1="35" y1="75" x2="330" y2="75" className="chart-axis-line" />
                <line x1="35" y1="135" x2="330" y2="135" stroke="var(--border-color)" strokeWidth="1" />

                {/* Y-Axis Amount Indicators */}
                <text x="28" y="19" fill="var(--text-muted)" fontSize="8" fontWeight="600" textAnchor="end">{formatCurrency(maxDailyAmount)}</text>
                <text x="28" y="79" fill="var(--text-muted)" fontSize="8" fontWeight="600" textAnchor="end">{formatCurrency(maxDailyAmount / 2)}</text>
                <text x="28" y="139" fill="var(--text-muted)" fontSize="8" fontWeight="600" textAnchor="end">₹0</text>

                {/* Date Bars Grid */}
                {dailyTrend.map((d, idx) => {
                  const H = (d.amount / maxDailyAmount) * 120; // Max height 120px
                  const Y = 135 - H;
                  const X = 45 + idx * 40; // Balanced spacings
                  const isHovered = hoveredBarIdx === idx;

                  return (
                    <g key={d.dateStr}>
                      {/* Invisible hover trigger area for easier targeting */}
                      <rect
                        x={X - 6}
                        y="10"
                        width="32"
                        height="135"
                        fill="transparent"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredBarIdx(idx)}
                        onMouseLeave={() => setHoveredBarIdx(null)}
                      />

                      {/* Bar Rectangle */}
                      {d.amount > 0 && (
                        <rect
                          className="chart-bar-rect"
                          x={X}
                          y={Y}
                          width="20"
                          height={H}
                          rx="4"
                          fill="url(#bar-gradient)"
                          onMouseEnter={() => setHoveredBarIdx(idx)}
                          onMouseLeave={() => setHoveredBarIdx(null)}
                          style={{
                            transformOrigin: `center 135px`,
                            transform: isHovered ? 'scaleX(1.05)' : 'none',
                            transition: 'all var(--transition-fast)'
                          }}
                        />
                      )}

                      {/* X-Axis Date text */}
                      <text
                        x={X + 10}
                        y="152"
                        fill={isHovered ? 'var(--accent-cyan)' : 'var(--text-secondary)'}
                        fontSize="8.5"
                        fontWeight={isHovered ? '600' : '500'}
                        textAnchor="middle"
                        style={{ transition: 'color var(--transition-fast)' }}
                      >
                        {d.label}
                      </text>

                      {/* Interactive amount tooltip above bar */}
                      {isHovered && d.amount > 0 && (
                        <text
                          x={X + 10}
                          y={Y - 8}
                          className="chart-tooltip-text animate-fade-in"
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

        </div>
      )}
    </div>
  );
}
