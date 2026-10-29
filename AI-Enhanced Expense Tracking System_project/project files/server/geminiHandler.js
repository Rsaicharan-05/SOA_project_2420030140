import { GoogleGenAI, Type } from '@google/genai';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]);

// Maximum image base64 length (approx 12MB unencoded)
const MAX_BASE64_LENGTH = 16 * 1024 * 1024;

/**
 * Handle receipt image scanning via Google Gemini.
 * Extracts total amount, date, merchant title, and category.
 *
 * @param {string} base64Image - Base64 encoded receipt image
 * @param {string} [mimeType='image/jpeg'] - MIME type of the image
 * @returns {Promise<{ amount?: number, date?: string, title?: string, category?: string }>}
 */
export async function handleScanReceipt(base64Image, mimeType = 'image/jpeg') {
  if (!base64Image || typeof base64Image !== 'string') {
    const error = new Error('Invalid image data provided for receipt scanning.');
    error.status = 400;
    throw error;
  }

  if (base64Image.length > MAX_BASE64_LENGTH) {
    const error = new Error('Receipt image exceeds maximum allowable size (12MB). Please upload a smaller image.');
    error.status = 413;
    throw error;
  }

  const normalizedMime = (mimeType || 'image/jpeg').toLowerCase().trim();
  const effectiveMime = ALLOWED_MIME_TYPES.has(normalizedMime) ? normalizedMime : 'image/jpeg';

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    const error = new Error('Gemini API key is not configured on the server. Please set GEMINI_API_KEY in your .env file.');
    error.status = 503;
    throw error;
  }

  // Strip potential data URL prefix if sent
  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const currentYear = new Date().getFullYear();

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          inlineData: {
            mimeType: effectiveMime,
            data: cleanBase64
          }
        },
        {
          text: `You are an expert receipt OCR analyzer for AI EXPENSE TRACKING.
Carefully examine this receipt image and extract:
1. 'amount': The final total amount paid as a positive number. Do not include currency symbols.
2. 'date': The date of transaction in ISO format 'YYYY-MM-DD'. If year is missing, assume ${currentYear}.
3. 'title': The merchant, store, or vendor name.
4. 'category': The single best category among: Food, Transport, Shopping, Bills, Entertainment, Health, Education, Others.

Return valid JSON adhering to the schema.`
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: 'Total amount paid' },
            date: { type: Type.STRING, description: 'ISO date YYYY-MM-DD' },
            title: { type: Type.STRING, description: 'Merchant or vendor name' },
            category: {
              type: Type.STRING,
              enum: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Others']
            }
          }
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return {
        amount: typeof parsed.amount === 'number' ? Math.abs(parsed.amount) : undefined,
        date: typeof parsed.date === 'string' ? parsed.date : undefined,
        title: typeof parsed.title === 'string' ? parsed.title.trim() : undefined,
        category: typeof parsed.category === 'string' ? parsed.category : undefined
      };
    }

    throw new Error('Could not parse receipt contents.');
  } catch (err) {
    const msg = String(err.message || '');
    if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
      const error = new Error('Invalid Google Gemini API key. Note: Google Gemini API keys from Google AI Studio typically start with "AIzaSy...". Please verify your key at https://aistudio.google.com/ and update your .env file.');
      error.status = 401;
      throw error;
    }
    if (err.status) throw err;
    const error = new Error(`AI receipt scan failed: ${msg || 'Unknown error'}`);
    error.status = 500;
    throw error;
  }
}

/**
 * Handle generating spending insights via Google Gemini.
 * Analyzes recent expense records and returns 3 concise suggestions grounded in data.
 *
 * @param {Array<object>} transactions - List of transactions
 * @returns {Promise<string>} - Formatted Markdown insights
 */
export async function handleSpendingInsights(transactions) {
  if (!Array.isArray(transactions)) {
    const error = new Error('Invalid request: transactions must be an array.');
    error.status = 400;
    throw error;
  }

  // Filter only valid expenses
  const expenses = transactions
    .filter(t => t && t.type === 'expense' && typeof t.amount === 'number' && !isNaN(t.amount))
    .slice(0, 50) // Limit to 50 items for context efficiency
    .map(e => ({
      date: typeof e.date === 'string' ? e.date.split('T')[0] : '',
      title: typeof e.title === 'string' ? e.title.slice(0, 60) : 'Expense',
      amount: Math.abs(e.amount),
      category: typeof e.category === 'string' ? e.category : 'Others'
    }));

  if (expenses.length === 0) {
    return 'Add some expense records to get AI-powered insights!';
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    const error = new Error('Gemini API key is not configured on the server. Please set GEMINI_API_KEY in your .env file.');
    error.status = 503;
    throw error;
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const prompt = `You are a friendly personal finance advisor for the web app 'AI EXPENSE TRACKING'.
Analyze these user expense records:
${JSON.stringify(expenses)}

Provide exactly 3 short, actionable, and encouraging bullet points about their spending habits and positive suggestions to improve their financial health.
Requirements:
1. Ground every recommendation directly in the provided records (reference specific categories, merchants, or patterns observed).
2. Keep the entire response under 150 words.
3. Format as a clean Markdown list with bullet points.
4. Tone should be supportive, practical, and non-judgmental.
5. Do not include guaranteed financial advice or investment recommendations.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt
    });

    let insights = response.text || 'Could not generate insights at the moment.';

    // Append standard financial disclaimer
    insights += '\n\n*Note: AI-generated suggestions are for informational and budgeting purposes only and do not constitute guaranteed financial advice.*';

    return insights;
  } catch (err) {
    const msg = String(err.message || '');
    if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
      const error = new Error('Invalid Google Gemini API key. Note: Google Gemini API keys from Google AI Studio typically start with "AIzaSy...". Please verify your key at https://aistudio.google.com/ and update your .env file.');
      error.status = 401;
      throw error;
    }
    if (err.status) throw err;
    const error = new Error(`AI spending analysis failed: ${msg || 'Unknown error'}`);
    error.status = 500;
    throw error;
  }
}
