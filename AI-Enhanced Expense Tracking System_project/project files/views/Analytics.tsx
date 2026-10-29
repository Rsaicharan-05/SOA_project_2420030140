import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { CATEGORY_COLORS, CATEGORY_EMOJIS, formatCurrency } from '../constants';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid, Legend } from 'recharts';
import { getSpendingInsights } from '../services/geminiService';
import { Icons } from '../components/Icons';

interface Props {
  expenses: Transaction[];
  currency?: string;
  onOpenAddModal?: () => void;
}

type TimeRange = 'week' | 'month' | 'year';
type ChartMode = 'spending-trend' | 'income-vs-expense';

const AI_PROMPT_CHIPS = [
  { label: '💡 Where can I cut costs?', prompt: 'Identify the top areas with excessive spending and recommend practical reductions.' },
  { label: '🍽️ Analyze Food & Dining', prompt: 'Specifically review food and grocery transactions and suggest dining budget adjustments.' },
  { label: '📈 Month-End Projection', prompt: 'Estimate my total spending by end of this month based on my current daily burn rate.' },
  { label: '🎯 Savings Rate Review', prompt: 'Evaluate my current income vs expense ratio and recommend a target emergency fund or savings goal.' },
];

const Analytics: React.FC<Props> = ({ expenses: transactions, currency = 'INR', onOpenAddModal }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<TimeRange>('month');
  const [chartMode, setChartMode] = useState<ChartMode>('spending-trend');
  const [activeChip, setActiveChip] = useState<string | null>(null);

  // Filter for expenses and income
  const expenses = useMemo(() => transactions.filter(t => t.type === 'expense'), [transactions]);
  const income = useMemo(() => transactions.filter(t => t.type === 'income'), [transactions]);

  // Aggregate category data for expenses
  const categoryData = useMemo(() => {
    const listToAnalyze = expenses.length > 0 ? expenses : transactions;
    const counts = listToAnalyze.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, transactions]);

  const totalExpenseAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalIncomeAmount = useMemo(() => {
    return income.reduce((sum, i) => sum + i.amount, 0);
  }, [income]);

  const topCategory = categoryData.length > 0 ? categoryData[0] : null;

  // Burn Rate Calculations
  const burnRateData = useMemo(() => {
    if (expenses.length === 0) return { dailyAvg: 0, projectedMonthly: 0, highestDay: 0 };
    
    // Group expenses by calendar date
    const dayTotals: Record<string, number> = {};
    expenses.forEach(e => {
      const d = new Date(e.date).toISOString().split('T')[0];
      dayTotals[d] = (dayTotals[d] || 0) + e.amount;
    });

    const amounts = Object.values(dayTotals);
    const uniqueDays = Math.max(1, amounts.length);
    const dailyAvg = Math.round(totalExpenseAmount / uniqueDays);
    const highestDay = Math.max(...amounts, 0);
    const projectedMonthly = dailyAvg * 30;

    return { dailyAvg, projectedMonthly, highestDay };
  }, [expenses, totalExpenseAmount]);

  // Timezone-safe data for Area Chart based on Range & Mode
  const chartData = useMemo(() => {
    const today = new Date();

    if (range === 'week') {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return d;
      });

      return days.map(day => {
        const dayStr = day.toDateString();
        const spent = expenses
          .filter(e => new Date(e.date).toDateString() === dayStr)
          .reduce((acc, curr) => acc + curr.amount, 0);
        const earned = income
          .filter(i => new Date(i.date).toDateString() === dayStr)
          .reduce((acc, curr) => acc + curr.amount, 0);

        return {
          label: day.toLocaleDateString('en-US', { weekday: 'short' }),
          amount: spent,
          expense: spent,
          income: earned
        };
      });
    }

    if (range === 'month') {
      const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (29 - i));
        d.setHours(0, 0, 0, 0);
        return d;
      });

      return days.map(day => {
        const dayStr = day.toDateString();
        const spent = expenses
          .filter(e => new Date(e.date).toDateString() === dayStr)
          .reduce((acc, curr) => acc + curr.amount, 0);
        const earned = income
          .filter(i => new Date(i.date).toDateString() === dayStr)
          .reduce((acc, curr) => acc + curr.amount, 0);

        return {
          label: day.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
          amount: spent,
          expense: spent,
          income: earned
        };
      });
    }

    if (range === 'year') {
      const currentYear = today.getFullYear();
      const months = Array.from({ length: 12 }, (_, i) => i);

      return months.map(monthIndex => {
        const spent = expenses
          .filter(e => {
            const d = new Date(e.date);
            return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === monthIndex;
          })
          .reduce((acc, curr) => acc + curr.amount, 0);

        const earned = income
          .filter(i => {
            const d = new Date(i.date);
            return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === monthIndex;
          })
          .reduce((acc, curr) => acc + curr.amount, 0);

        return {
          label: new Date(currentYear, monthIndex).toLocaleDateString('en-US', { month: 'short' }),
          amount: spent,
          expense: spent,
          income: earned
        };
      });
    }

    return [];
  }, [expenses, income, range]);

  const handleGetInsights = async (customPrompt?: string) => {
    if (transactions.length === 0) return;
    setLoading(true);
    if (customPrompt) setActiveChip(customPrompt);
    try {
      const result = await getSpendingInsights(transactions, currency);
      setInsight(result);
    } catch {
      setInsight("Unable to generate insights right now. Please try again or verify your records.");
    } finally {
      setLoading(false);
    }
  };

  const getRangeTitle = () => {
    switch (range) {
      case 'week': return '7-Day Financial Activity';
      case 'month': return '30-Day Financial Activity';
      case 'year': return 'Yearly Activity Overview';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in pb-28">
      {/* Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Analytics & Insights</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Visual breakdowns, burn rates, and AI-powered spending recommendations
          </p>
        </div>

        {/* Time Range Pills */}
        <div className="bg-gray-100 p-1 rounded-xl flex self-start sm:self-auto w-full sm:w-auto">
          {(['week', 'month', 'year'] as TimeRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`flex-1 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                range === r 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === 'week' ? 'Past 7 Days' : r === 'month' ? 'Past 30 Days' : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row: Total Spent, Daily Burn, Net Cashflow */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block">Total Recorded Spent</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
              {formatCurrency(totalExpenseAmount, currency)}
            </div>
            <span className="text-xs text-gray-400 mt-0.5 block">{expenses.length} expense entries</span>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block">Daily Burn Average</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
              {formatCurrency(burnRateData.dailyAvg, currency)}/day
            </div>
            <span className="text-xs text-gray-400 mt-0.5 block">
              Projected: ~{formatCurrency(burnRateData.projectedMonthly, currency)}/mo
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block">Top Spending Area</span>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 flex items-center gap-2 truncate">
              {topCategory ? (
                <>
                  <span>{CATEGORY_EMOJIS[topCategory.name] || '📦'}</span>
                  <span className="truncate">{topCategory.name}</span>
                </>
              ) : 'N/A'}
            </div>
            <span className="text-xs text-gray-400 mt-0.5 block">
              {topCategory ? formatCurrency(topCategory.value, currency) : 'No data'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block">Net Cashflow</span>
            <div className={`text-xl sm:text-2xl font-bold mt-1 ${totalIncomeAmount >= totalExpenseAmount ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(totalIncomeAmount - totalExpenseAmount, currency)}
            </div>
            <span className="text-xs text-gray-400 mt-0.5 block">
              {totalIncomeAmount > 0 
                ? `${Math.round(((totalIncomeAmount - totalExpenseAmount) / totalIncomeAmount) * 100)}% retention rate`
                : 'Add income to view savings rate'}
            </span>
          </div>
        </div>
      )}

      {/* AI Assistant Card with Quick Focus Prompts */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-700 to-purple-800 rounded-3xl p-5 sm:p-7 text-white shadow-xl shadow-indigo-100/50">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Icons.Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">AI Spending Coach</h2>
              <p className="text-[11px] text-indigo-200">Grounded in your actual local transaction records</p>
            </div>
          </div>
          {insight && (
            <button
              type="button"
              onClick={() => handleGetInsights()}
              disabled={loading}
              className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
            >
              {loading ? 'Refreshing...' : 'Re-analyze'}
            </button>
          )}
        </div>

        {/* AI Quick Prompt Chips */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-xs text-indigo-200 font-semibold mr-1">Ask AI:</span>
          {AI_PROMPT_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleGetInsights(chip.prompt)}
              disabled={loading || transactions.length === 0}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer border ${
                activeChip === chip.prompt
                  ? 'bg-white text-indigo-950 font-bold border-white'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        
        {!insight ? (
          <div>
            <p className="text-indigo-100 text-sm mb-4 leading-relaxed max-w-2xl">
              Receive 3 personalized, practical spending observations tailored specifically to your financial records. 
              Your data stays private and local.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button 
                type="button"
                onClick={() => handleGetInsights()}
                disabled={loading || transactions.length === 0}
                className="w-full sm:w-auto px-6 py-3 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin"></div>
                    <span className="animate-pulse">Analyzing spending history...</span>
                  </>
                ) : (
                  <>
                    <Icons.Sparkles className="w-4 h-4 text-indigo-700" />
                    <span>Analyze My Spending</span>
                  </>
                )}
              </button>
              {transactions.length === 0 && (
                <span className="text-indigo-200 text-xs">
                  (Record at least one transaction to enable insights)
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md text-sm leading-relaxed border border-white/10">
            <div className="whitespace-pre-line text-indigo-50 font-normal space-y-1.5 leading-relaxed">
              {insight}
            </div>
            <div className="mt-4 pt-3 border-t border-white/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-indigo-200">
              <span className="text-[11px] italic opacity-80">
                Informational budgeting suggestions • Not guaranteed financial advice
              </span>
              <button 
                type="button"
                onClick={() => { setInsight(null); setActiveChip(null); }}
                className="text-white hover:text-indigo-100 font-bold underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Charts Section */}
      {transactions.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-gray-200 space-y-4">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <Icons.PieChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-800 font-semibold text-base">No transaction records to analyze yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Add your daily expenses and income to see visual spending trends, category distributions, and AI insights.
            </p>
          </div>
          {onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-brand-500/20"
            >
              <Icons.Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Record Your First Transaction</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Trend Area Chart (Left Column on Desktop) */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{getRangeTitle()}</h3>
                  <span className="text-xs text-gray-400 font-medium">Activity breakdown</span>
                </div>
                {/* Chart Mode Toggle */}
                <div className="bg-gray-100 p-1 rounded-xl flex self-start sm:self-auto text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setChartMode('spending-trend')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      chartMode === 'spending-trend' ? 'bg-white text-slate-800 shadow-xs' : 'text-gray-500'
                    }`}
                  >
                    Spending Trend
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('income-vs-expense')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      chartMode === 'income-vs-expense' ? 'bg-white text-slate-800 shadow-xs' : 'text-gray-500'
                    }`}
                  >
                    Income vs Outflow
                  </button>
                </div>
              </div>
              
              <div className="w-full" style={{ height: 270 }}>
                <ResponsiveContainer width="100%" height={270}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      interval={range === 'month' ? 4 : 0} 
                      padding={{ left: 10, right: 10 }}
                    />
                    <Tooltip 
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value: any, name: any) => [
                        formatCurrency(Number(value) || 0, currency),
                        name === 'income' ? 'Income Inflow' : 'Expense Outflow'
                      ]}
                      isAnimationActive={true}
                    />
                    {chartMode === 'spending-trend' ? (
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        name="expense"
                        stroke="#0ea5e9" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorSpent)" 
                        animationDuration={800}
                      />
                    ) : (
                      <>
                        <Area 
                          type="monotone" 
                          dataKey="income" 
                          name="income"
                          stroke="#10b981" 
                          strokeWidth={2.5}
                          fillOpacity={1} 
                          fill="url(#colorIncome)" 
                          animationDuration={800}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="expense" 
                          name="expense"
                          stroke="#f43f5e" 
                          strokeWidth={2.5}
                          fillOpacity={1} 
                          fill="url(#colorSpent)" 
                          animationDuration={800}
                        />
                      </>
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 text-center mt-3">
              Values reflect manual records logged in this period
            </p>
          </div>

          {/* Category Breakdown Donut (Right Column on Desktop) */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-800 text-base">Category Breakdown</h3>
                <span className="text-xs text-gray-400 font-medium">{categoryData.length} categories</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-full relative" style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || '#cbd5e1'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value) || 0, currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Total Display */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block">Total Spent</span>
                      <span className="font-bold text-slate-800 text-sm sm:text-base">
                        {formatCurrency(totalExpenseAmount, currency)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Category Legend List */}
                <div className="w-full space-y-2 mt-2 pt-3 border-t border-gray-50 max-h-48 overflow-y-auto no-scrollbar">
                  {categoryData.map((cat) => {
                    const percentage = totalExpenseAmount > 0 
                      ? Math.round((cat.value / totalExpenseAmount) * 100) 
                      : 0;

                    return (
                      <div key={cat.name} className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span 
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: CATEGORY_COLORS[cat.name as keyof typeof CATEGORY_COLORS] || '#cbd5e1' }}
                          />
                          <span className="text-gray-700 truncate">{CATEGORY_EMOJIS[cat.name] || '📦'} {cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] text-gray-400">{percentage}%</span>
                          <span className="font-bold text-slate-800">{formatCurrency(cat.value, currency)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
