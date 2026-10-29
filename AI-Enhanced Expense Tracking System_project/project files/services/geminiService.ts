import { ReceiptData, Transaction } from "../types";
import { formatCurrency } from "../constants";

/**
 * Local intelligent spending analysis engine.
 * Provides instant, grounded financial insights based on actual transaction records
 * as a seamless fallback if the remote Gemini AI server or key is unavailable.
 */
function generateLocalInsights(transactions: Transaction[], currency: string = 'INR'): string {
  const expenses = transactions.filter(t => t.type === 'expense');
  const income = transactions.filter(t => t.type === 'income');

  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const catTotals: Record<string, number> = {};
  expenses.forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });

  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const topCat = sortedCats[0];
  const topCatPercent = totalExpense > 0 && topCat ? Math.round((topCat[1] / totalExpense) * 100) : 0;

  const bullets: string[] = [];

  // Point 1: Top category analysis
  if (topCat) {
    bullets.push(`• **Top Category Impact:** Your highest expense area is **${topCat[0]}** (${formatCurrency(topCat[1], currency)}), accounting for **${topCatPercent}%** of your total spending. Setting a monthly limit here offers the highest savings leverage.`);
  } else {
    bullets.push(`• **Even Distribution:** Your spending is currently distributed across smaller, diverse purchases with no single category dominating.`);
  }

  // Point 2: Cashflow & Savings ratio
  if (totalIncome > 0) {
    const net = totalIncome - totalExpense;
    const savingsRatio = Math.round((net / totalIncome) * 100);
    if (savingsRatio >= 20) {
      bullets.push(`• **Strong Savings Ratio:** You are retaining **${savingsRatio}%** (${formatCurrency(net, currency)}) of your total income. You are in great financial health.`);
    } else if (savingsRatio > 0) {
      bullets.push(`• **Positive Net Surplus:** You have a net surplus of **${formatCurrency(net, currency)}** (${savingsRatio}% savings rate). Trimming small discretionary purchases can help hit the 20% savings milestone.`);
    } else {
      bullets.push(`• **Spending Alert:** Total expenses (${formatCurrency(totalExpense, currency)}) exceed recorded income (${formatCurrency(totalIncome, currency)}). Consider reviewing non-essential purchases to restore a positive balance.`);
    }
  } else {
    const avgExpense = expenses.length > 0 ? Math.round(totalExpense / expenses.length) : 0;
    bullets.push(`• **Average Ticket Size:** Your average expenditure is **${formatCurrency(avgExpense, currency)}** across ${expenses.length} records. Adding your income will unlock full net savings analysis.`);
  }

  // Point 3: Second category or habit tip
  if (sortedCats.length > 1) {
    bullets.push(`• **Secondary Spend Observation:** Your second largest category is **${sortedCats[1][0]}** at **${formatCurrency(sortedCats[1][1], currency)}**. Check if any recurring subscriptions or frequent small transactions can be streamlined.`);
  } else {
    bullets.push(`• **Track Consistently:** Continue logging your daily expenses to unlock deeper trend charts, streak badges, and level unlocks.`);
  }

  return `${bullets.join('\n\n')}\n\n*Smart analysis generated from your local records.*`;
}

/**
 * Scan a receipt image via the server-side Gemini endpoint.
 * Protects the API key by never exposing it to the client.
 */
export const scanReceipt = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<ReceiptData> => {
  try {
    const response = await fetch('/api/scan-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image, mimeType }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMessage = data?.error || 'Failed to scan receipt image.';
      throw new Error(errorMessage);
    }

    return (data.data || {}) as ReceiptData;
  } catch (error: any) {
    console.error("Receipt Scan Error:", error);
    throw error;
  }
};

/**
 * Request spending insights from server-side Gemini endpoint.
 * Automatically falls back to local smart engine if Gemini is unavailable or key is invalid.
 */
export const getSpendingInsights = async (transactions: Transaction[], currency: string = 'INR'): Promise<string> => {
  const expenses = transactions.filter(t => t.type === 'expense');

  if (expenses.length === 0 && transactions.length === 0) {
    return "Add some expenses or income records to get personalized financial insights!";
  }

  try {
    const response = await fetch('/api/spending-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactions }),
    });

    const data = await response.json();

    if (response.ok && data.success && data.insights) {
      return data.insights;
    }

    // If server returned error (e.g. invalid key or 503), fall back seamlessly to local analyzer
    return generateLocalInsights(transactions, currency);
  } catch (error) {
    console.warn("Falling back to local spending insights engine:", error);
    return generateLocalInsights(transactions, currency);
  }
};

/**
 * Check if the Gemini API key is configured on the backend.
 */
export const checkAiStatus = async (): Promise<{ hasGeminiKey: boolean; model: string }> => {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) return { hasGeminiKey: false, model: 'unknown' };
    const data = await res.json();
    return {
      hasGeminiKey: Boolean(data.hasGeminiKey),
      model: data.model || 'gemini-2.5-flash',
    };
  } catch {
    return { hasGeminiKey: false, model: 'unknown' };
  }
};
