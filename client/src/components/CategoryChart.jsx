import React, { useState, useMemo } from 'react';
import { formatCurrency } from './SummaryPanel';

export default function CategoryChart({ expenses }) {
  const [hoveredCat, setHoveredCat] = useState(null);

  // Group all expenses by category (cumulative across all logs)
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

  // Convert totals to segments data
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
    }).filter(d => d.amount > 0); // Only render categories with spending
  }, [categoryTotals, totalSpent]);

  // Donut Circle Math
  const RADIUS = 50;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~314.159
  const STROKE_WIDTH = 16;
  const CENTER = 80;

  // Render centered text inside donut
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
      sub: `${expenses.length} transaction${expenses.length === 1 ? '' : 's'}`
    };
  }, [hoveredCat, categoryTotals, totalSpent, expenses.length]);

  return (
    <div className="glass-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="card-header">
        <h3 className="card-title">Spending Breakdown</h3>
      </div>

      {totalSpent === 0 ? (
        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
          <div className="empty-icon">📊</div>
          <h4 className="empty-title">No spending data</h4>
          <p className="empty-desc">Chart will display once you log expenses.</p>
        </div>
      ) : (
        <div className="chart-container">
          {/* SVG Donut */}
          <div style={{ position: 'relative', width: '160px', height: '160px' }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 160 160"
              className="svg-donut"
            >
              {/* Empty background track */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                className="donut-segment"
                stroke="hsla(222, 20%, 20%, 0.3)"
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
              />

              {chartData.map((seg, idx) => {
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
                    strokeWidth={isHovered ? STROKE_WIDTH + 4 : STROKE_WIDTH}
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

            {/* Absolute overlay for centered text */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.5px' }}>
                {centerDisplay.title}
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: '0.1rem 0' }}>
                {centerDisplay.amount}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {centerDisplay.sub}
              </span>
            </div>
          </div>

          {/* Interactive Legend Grid */}
          <div className="chart-legend">
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
                    paddingLeft: isHovered ? '0.5rem' : '0.5rem',
                    opacity: hoveredCat && !isHovered ? 0.5 : 1,
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div className="legend-color-label">
                    <span className="legend-dot" style={{ background: categoryColors[cat] }}></span>
                    <span style={{ fontWeight: isHovered ? '600' : '400' }}>{cat}</span>
                  </div>
                  <div className="legend-value">
                    {formatCurrency(amount)} ({percent}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
