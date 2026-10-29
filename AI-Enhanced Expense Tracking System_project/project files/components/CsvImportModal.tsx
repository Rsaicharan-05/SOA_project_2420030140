import React, { useState, useRef } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { Icons } from './Icons';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatCurrency } from '../constants';
import { detectCategory } from '../services/categoryDetector';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (imported: Omit<Transaction, 'id'>[]) => void;
  currency: string;
}

interface ParsedRow {
  date: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  raw: string;
}

// Universal CSV line parser handling quotes
function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  return lines.map(line => {
    const row: string[] = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim().replace(/^["']|["']$/g, ''));
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim().replace(/^["']|["']$/g, ''));
    return row;
  });
}

const CsvImportModal: React.FC<Props> = ({ isOpen, onClose, onImport, currency }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCsv(text);
        if (rows.length < 2) {
          setError('CSV must contain a header row and at least one transaction row.');
          setIsProcessing(false);
          return;
        }

        const headers = rows[0].map(h => h.toLowerCase());
        
        // Find best column indexes
        const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('time') || h.includes('when'));
        const titleIdx = headers.findIndex(h => h.includes('desc') || h.includes('title') || h.includes('merchant') || h.includes('narration') || h.includes('particular') || h.includes('name'));
        const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('amt') || h.includes('debit') || h.includes('price') || h.includes('total') || h.includes('cost'));
        const categoryIdx = headers.findIndex(h => h.includes('cat') || h.includes('tag'));
        const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('cr/dr') || h.includes('dr/cr'));

        if (amountIdx === -1) {
          setError('Could not identify an Amount column. Please ensure header has "Amount" or "Debit".');
          setIsProcessing(false);
          return;
        }

        const results: ParsedRow[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || row.every(cell => !cell)) continue;

          // Amount parsing
          const rawAmt = row[amountIdx] || '0';
          const cleanAmt = parseFloat(rawAmt.replace(/[^0-9.-]/g, ''));
          if (isNaN(cleanAmt) || cleanAmt === 0) continue;

          const amount = Math.abs(cleanAmt);

          // Type parsing
          let type: TransactionType = 'expense';
          if (typeIdx !== -1 && row[typeIdx]) {
            const rawType = row[typeIdx].toLowerCase();
            if (rawType.includes('cr') || rawType.includes('income') || rawType.includes('deposit')) {
              type = 'income';
            }
          } else if (cleanAmt > 0 && (headers[amountIdx].includes('credit') || headers[amountIdx].includes('income'))) {
            type = 'income';
          }

          // Date parsing
          let dateStr = new Date().toISOString();
          if (dateIdx !== -1 && row[dateIdx]) {
            const parsedD = new Date(row[dateIdx]);
            if (!isNaN(parsedD.getTime())) {
              dateStr = parsedD.toISOString();
            }
          }

          // Title parsing
          const title = (titleIdx !== -1 && row[titleIdx]) 
            ? row[titleIdx].trim() 
            : `Imported Transaction #${i}`;

          // Category
          let category: Category = type === 'income' ? 'Salary' : 'Others';
          if (categoryIdx !== -1 && row[categoryIdx]) {
            const rawCat = row[categoryIdx];
            const matchedCat = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find(
              c => c.toLowerCase() === rawCat.toLowerCase()
            );
            if (matchedCat) category = matchedCat;
          } else {
            const auto = detectCategory(title, type);
            if (auto) category = auto;
          }

          results.push({
            date: dateStr,
            title,
            amount,
            type,
            category,
            raw: row.join(', ')
          });
        }

        if (results.length === 0) {
          setError('No valid transaction rows found in the CSV file.');
        } else {
          setParsedRows(results);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setError('Could not read the selected file.');
      setIsProcessing(false);
    };
    reader.readAsText(selectedFile);
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    const transactionsToImport = parsedRows.map(r => ({
      type: r.type,
      amount: r.amount,
      title: r.title,
      category: r.category,
      date: r.date,
      notes: 'Imported from CSV'
    }));

    onImport(transactionsToImport);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icons.FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Import Bank CSV / Spreadsheet</h3>
              <p className="text-xs text-gray-400">Batch import transactions from your bank statement</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Dropzone */}
        {!file ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 hover:border-brand-500 hover:bg-brand-50/20 rounded-2xl p-8 text-center cursor-pointer transition-colors space-y-3 my-4"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-500">
              <Icons.Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Click or drag & drop your CSV file here</p>
              <p className="text-xs text-gray-400 mt-1">Supports bank statements, Mint exports, and custom CSV spreadsheets</p>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".csv,text/csv" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
          </div>
        ) : (
          <div className="space-y-4 my-2 flex-1 flex flex-col min-h-0">
            {/* File info pill */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 truncate">
                <Icons.FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="text-gray-400 font-normal">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button 
                type="button"
                onClick={() => { setFile(null); setParsedRows([]); setError(null); }}
                className="text-xs text-brand-600 hover:underline font-medium"
              >
                Change File
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {isProcessing && (
              <div className="py-8 text-center text-xs text-gray-500 space-y-2">
                <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p>Analyzing CSV columns and auto-detecting categories...</p>
              </div>
            )}

            {/* Parsed Preview Table */}
            {parsedRows.length > 0 && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700">
                    Previewing {parsedRows.length} valid transactions
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Categories auto-tagged ✨
                  </span>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-y-auto max-h-56 divide-y divide-gray-50 no-scrollbar">
                  {parsedRows.slice(0, 50).map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-gray-50">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-800 truncate">{row.title}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(row.date).toLocaleDateString()} • {row.category}
                        </p>
                      </div>
                      <span className={`font-bold flex-shrink-0 ${
                        row.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                      }`}>
                        {row.type === 'income' ? '+' : '-'}{formatCurrency(row.amount, currency)}
                      </span>
                    </div>
                  ))}
                  {parsedRows.length > 50 && (
                    <div className="p-2 text-center text-[11px] text-gray-400 bg-gray-50">
                      + {parsedRows.length - 50} more records
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedRows.length === 0}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-sm shadow-brand-500/20"
          >
            Import {parsedRows.length > 0 ? `${parsedRows.length} Transactions` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CsvImportModal;
