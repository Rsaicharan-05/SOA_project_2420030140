import { Transaction, UserProfile } from '../types';
import { formatCurrency, getCurrencySymbol } from '../constants';

/**
 * Dynamically exports transactions to a styled PDF document.
 * Libraries (jsPDF, autoTable) are loaded on-demand to keep initial app load fast.
 */
export async function exportToPDF(transactions: Transaction[], profile: UserProfile): Promise<void> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  const autoTable = autoTableModule.default || autoTableModule;

  const doc = new jsPDF();
  const currencySymbol = getCurrencySymbol(profile.currency);

  // Header
  doc.setFontSize(22);
  doc.setTextColor(2, 132, 199); // Sky/Brand blue
  doc.text('AI EXPENSE TRACKING', 20, 20);

  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(`Transaction Report for: ${profile.name}`, 20, 29);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 36);

  // Summary Metrics
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = income - expense;

  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text('Financial Summary', 20, 50);

  doc.setFontSize(10);
  doc.text(`Total Records: ${transactions.length}`, 20, 58);
  doc.setTextColor(22, 163, 74); // Green
  doc.text(`Total Income: ${formatCurrency(income, profile.currency)}`, 20, 65);
  doc.setTextColor(220, 38, 38); // Red
  doc.text(`Total Expenses: ${formatCurrency(expense, profile.currency)}`, 20, 72);
  doc.setTextColor(netBalance >= 0 ? 22 : 220, netBalance >= 0 ? 163 : 38, netBalance >= 0 ? 74 : 38);
  doc.text(`Net Balance: ${formatCurrency(netBalance, profile.currency)}`, 20, 79);
  doc.setTextColor(0, 0, 0);

  // Table Data
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const tableData = sorted.map(t => [
    new Date(t.date).toLocaleDateString(),
    t.type.toUpperCase(),
    t.category,
    t.title,
    `${currencySymbol}${Number(t.amount).toFixed(2)}`,
  ]);

  (autoTable as any)(doc, {
    startY: 90,
    head: [['Date', 'Type', 'Category', 'Description', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [2, 132, 199], // Brand 600
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [240, 249, 255],
    },
    margin: { left: 20, right: 20 },
  });

  doc.save(`ai-expense-tracking-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Dynamically exports transactions to an Excel (.xlsx) workbook.
 * XLSX is loaded on-demand so it doesn't inflate initial app bundle.
 */
export async function exportToExcel(transactions: Transaction[], profile: UserProfile): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // Sheet 1: Transactions
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const transactionData = sorted.map(t => ({
    Date: new Date(t.date).toLocaleDateString(),
    Type: t.type.toUpperCase(),
    Category: t.category,
    Description: t.title,
    Amount: t.amount,
    Currency: profile.currency,
  }));

  const ws = XLSX.utils.json_to_sheet(transactionData);

  // Column formatting
  ws['!cols'] = [
    { wch: 14 }, // Date
    { wch: 10 }, // Type
    { wch: 16 }, // Category
    { wch: 28 }, // Description
    { wch: 14 }, // Amount
    { wch: 10 }, // Currency
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

  // Sheet 2: Summary
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const categories = Object.entries(
    transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  const summaryData = [
    { Metric: 'App Name', Value: 'AI EXPENSE TRACKING' },
    { Metric: 'User', Value: profile.name },
    { Metric: 'Export Date', Value: new Date().toLocaleDateString() },
    { Metric: 'Total Transactions', Value: transactions.length },
    { Metric: 'Total Income', Value: income },
    { Metric: 'Total Expenses', Value: expense },
    { Metric: 'Net Balance', Value: income - expense },
    { Metric: 'Currency', Value: profile.currency },
    { Metric: '', Value: '' },
    { Metric: '--- Category Breakdown ---', Value: '' },
    ...categories.map(([cat, amount]) => ({
      Metric: cat,
      Value: amount,
    })),
  ];

  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 26 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  XLSX.writeFile(wb, `ai-expense-tracking-report-${new Date().toISOString().split('T')[0]}.xlsx`);
}
