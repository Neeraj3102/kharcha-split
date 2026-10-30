import React, { useState } from 'react';
import { X, Upload, AlertCircle, Download } from 'lucide-react';
import type { Member, Expense, QuickTag, AppTheme, SplitType } from '../types';
import { sanitizeAmount, sanitizeCsvCell, sanitizeText } from '../utils/securitySanitizer';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  tags: QuickTag[];
  onImportExpenses: (expenses: Omit<Expense, 'id'>[]) => void;
  theme?: AppTheme;
}

interface ParsedRow {
  title: string;
  amount: number;
  paidById: string;
  paidByName: string;
  date: string;
  tag: string;
  splitType: SplitType;
  isValid: boolean;
  error?: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  members,
  tags,
  onImportExpenses,
  theme = 'weeknd',
}) => {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;
  const isPurple = theme === 'purple';

  const defaultTag = tags[0]?.label || 'General';
  const defaultMember = members[0] || { id: 'm-1', name: 'Member' };

  const handleDownloadSample = () => {
    const memberName = members[0]?.name || 'Neeraj';
    const sampleCsv = `Date,Title,Amount,PaidBy,Tag,SplitType\n${new Date().toISOString().slice(0, 10)},Swiggy Dinner,850,${memberName},Food,EQUAL\n${new Date().toISOString().slice(0, 10)},Wi-Fi Recharge,999,${memberName},Utilities,EQUAL\n${new Date().toISOString().slice(0, 10)},Groceries,1200,${memberName},Groceries,EQUAL`;
    
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'kharcha_sample_import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvContent = (content: string) => {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setImportStatus('CSV must contain a header row and at least one data row.');
      return;
    }

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const dateIdx = header.indexOf('date');
    const titleIdx = header.indexOf('title');
    const amountIdx = header.indexOf('amount');
    const paidByIdx = header.findIndex((h) => h === 'paidby' || h === 'paid_by' || h === 'payer');
    const tagIdx = header.indexOf('tag');
    const splitTypeIdx = header.findIndex((h) => h === 'splittype' || h === 'split_type');

    const results: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length === 0 || (parts.length === 1 && !parts[0])) continue;

      const rawTitle = titleIdx !== -1 ? parts[titleIdx] : parts[1] || 'Expense';
      const title = sanitizeCsvCell(rawTitle);
      const rawAmount = amountIdx !== -1 ? parts[amountIdx] : parts[2] || '0';
      const amountCheck = sanitizeAmount(rawAmount);
      const amount = amountCheck.value;
      const rawDate = dateIdx !== -1 ? parts[dateIdx] : parts[0] || new Date().toISOString();
      const rawPaidBy = paidByIdx !== -1 ? parts[paidByIdx] : parts[3] || defaultMember.name;
      const rawTag = tagIdx !== -1 ? parts[tagIdx] : parts[4] || defaultTag;
      const tag = sanitizeText(rawTag, 30) || defaultTag;
      const splitTypeRaw = splitTypeIdx !== -1 ? parts[splitTypeIdx] : 'EQUAL';
      const splitType: SplitType = splitTypeRaw.toUpperCase() === 'CUSTOM' ? 'CUSTOM' : 'EQUAL';

      // Match paidBy to member
      const matched = members.find(
        (m) => m.name.toLowerCase() === rawPaidBy.toLowerCase() || m.id === rawPaidBy
      );

      let isValid = true;
      let error = '';

      if (!title) {
        isValid = false;
        error = 'Missing title';
      } else if (!amountCheck.isValid) {
        isValid = false;
        error = amountCheck.error || 'Invalid amount';
      }

      results.push({
        title,
        amount,
        paidById: matched?.id || defaultMember.id,
        paidByName: matched?.name || defaultMember.name,
        date: new Date(rawDate).toString() !== 'Invalid Date' ? new Date(rawDate).toISOString() : new Date().toISOString(),
        tag: tag || defaultTag,
        splitType,
        isValid,
        error,
      });
    }

    setParsedRows(results);
    setHasParsed(true);
    setImportStatus(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleCommitImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('No valid rows found to import.');
      return;
    }

    const expensesToSave: Omit<Expense, 'id'>[] = validRows.map((row) => {
      // Split equally across all members
      const count = members.length || 1;
      const share = Math.floor((row.amount / count) * 100) / 100;
      const remainder = Math.round((row.amount - share * count) * 100) / 100;

      const splits = members.map((m, idx) => ({
        memberId: m.id,
        amount: idx === 0 ? Math.round((share + remainder) * 100) / 100 : share,
      }));

      return {
        title: row.title,
        totalAmount: row.amount,
        paidById: row.paidById,
        date: row.date,
        tag: row.tag,
        splitType: 'EQUAL',
        splits,
      };
    });

    onImportExpenses(expensesToSave);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85vh] cursor-default"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                isPurple ? 'bg-purple-600/30 text-purple-400' : 'bg-rose-600/30 text-rose-400'
              }`}
            >
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-heading">Bulk Import Expenses (CSV)</h3>
              <p className="text-[10px] text-zinc-400">Import past records or split sheets in one tap</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {!hasParsed ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-white/5">
                <div>
                  <span className="font-semibold text-zinc-200">Need a starting template?</span>
                  <p className="text-[11px] text-zinc-400">Headers: Date, Title, Amount, PaidBy, Tag</p>
                </div>
                <button
                  onClick={handleDownloadSample}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sample CSV</span>
                </button>
              </div>

              {/* File upload drag drop */}
              <div className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-zinc-900/40 relative">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 mx-auto text-zinc-500 mb-2" />
                <p className="font-bold text-white text-xs">Drop your .csv file here or click to browse</p>
                <p className="text-[11px] text-zinc-500 mt-1">Supports standard CSV exports from Excel, Google Sheets, or Splitwise</p>
              </div>

              {/* Or paste directly */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Or paste raw CSV text:
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Date,Title,Amount,PaidBy,Tag&#10;2026-10-24,Dinner,1200,Neeraj,Food"
                  className="w-full h-28 bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 font-mono text-[11px] text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {importStatus && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}

              <button
                disabled={!csvText.trim()}
                onClick={() => parseCsvContent(csvText)}
                className={`w-full py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                  csvText.trim()
                    ? isPurple
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                Parse & Preview Rows
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">
                  Preview ({parsedRows.filter((r) => r.isValid).length} / {parsedRows.length} valid rows)
                </span>
                <button
                  onClick={() => {
                    setHasParsed(false);
                    setParsedRows([]);
                  }}
                  className="text-zinc-400 hover:text-white transition-all underline cursor-pointer text-[11px]"
                >
                  Upload different file
                </button>
              </div>

              <div className="border border-white/5 rounded-xl overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full min-w-[340px] text-left text-[11px]">
                  <thead className="bg-zinc-900 border-b border-white/5 text-zinc-400">
                    <tr>
                      <th className="p-2">Status</th>
                      <th className="p-2">Title</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Paid By</th>
                      <th className="p-2">Tag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-zinc-950/60">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'text-zinc-200' : 'text-rose-400 bg-rose-950/20'}>
                        <td className="p-2">
                          {row.isValid ? (
                            <span className="text-emerald-400 font-mono">✓</span>
                          ) : (
                            <span className="text-rose-400 font-mono" title={row.error}>✕</span>
                          )}
                        </td>
                        <td className="p-2 font-semibold">{row.title}</td>
                        <td className="p-2 font-mono font-bold text-rose-400">₹{row.amount}</td>
                        <td className="p-2">{row.paidByName}</td>
                        <td className="p-2 text-zinc-400">{row.tag}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setHasParsed(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleCommitImport}
                  className={`px-5 py-2 rounded-xl font-bold cursor-pointer transition-all ${
                    isPurple
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  Import {parsedRows.filter((r) => r.isValid).length} Expenses
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
