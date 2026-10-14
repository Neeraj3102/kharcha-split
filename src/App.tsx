import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import type {
  Member,
  Expense,
  Settlement,
  QuickTag,
  TimeFilter,
  AppState,
  AppTheme,
} from './types';
import {
  loadInitialState,
  saveStateToLocalStorage,
  DEFAULT_INDIAN_TAGS,
  DEMO_STATE,
} from './utils/storage';
import {
  calculateMinimizedSettlements,
  getMemberNetBalances,
} from './utils/minCashFlow';
import { generateUpiQrCode } from './utils/upi';
import { compressStateToUrl } from './utils/urlState';

// Components
import { Header } from './components/Header';
import { SettlementCards } from './components/SettlementCards';
import { ExpenseList } from './components/ExpenseList';
import { AddExpenseModal } from './components/AddExpenseModal';
import { MemberManager } from './components/MemberManager';
import { QRCodeModal } from './components/QRCodeModal';
import { MarkPaidModal } from './components/MarkPaidModal';
import { ReportModal } from './components/ReportModal';
import { ShareLedgerModal } from './components/ShareLedgerModal';

export function App() {
  const [state, setState] = useState<AppState>(loadInitialState);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');

  // Changeable Theme (Weeknd vs Bumblebee)
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('kharchasplit_theme');
      if (saved === 'weeknd' || saved === 'bumblebee') return saved;
    } catch {
      // ignore
    }
    return 'weeknd';
  });

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShareLedgerOpen, setIsShareLedgerOpen] = useState(false);

  // QR Modal state
  const [qrState, setQrState] = useState<{
    isOpen: boolean;
    dataUrl: string;
    upiUri: string;
    toName: string;
    toUpiId: string;
    amount: number;
  }>({
    isOpen: false,
    dataUrl: '',
    upiUri: '',
    toName: '',
    toUpiId: '',
    amount: 0,
  });

  // Mark Paid Modal state
  const [markPaidSettlement, setMarkPaidSettlement] = useState<Settlement | null>(null);

  // Auto-save state to localStorage on every update
  useEffect(() => {
    saveStateToLocalStorage(state);
  }, [state]);

  // Persist theme choice
  useEffect(() => {
    try {
      localStorage.setItem('kharchasplit_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Combined Tags: Default Indian Quick Tags + Custom User Tags
  const allTags: QuickTag[] = [...DEFAULT_INDIAN_TAGS, ...state.customTags];

  // Filtered Expenses by Time Filter (All, Week, Month)
  const now = new Date();
  const filteredExpenses = state.expenses.filter((e) => {
    if (timeFilter === 'ALL') return true;
    const expDate = new Date(e.date);

    if (timeFilter === 'THIS_MONTH') {
      return (
        expDate.getMonth() === now.getMonth() &&
        expDate.getFullYear() === now.getFullYear()
      );
    }

    if (timeFilter === 'THIS_WEEK') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return expDate >= oneWeekAgo;
    }

    return true;
  });

  // Total Group Spend for selected period
  const totalGroupSpend = filteredExpenses.reduce((sum, e) => sum + e.totalAmount, 0);

  // Live Balances & Minimized Settlements (Greedy Min-Cash Flow)
  const netBalances = getMemberNetBalances(
    state.members,
    state.expenses,
    state.settledTransactions
  );

  const settlements = calculateMinimizedSettlements(
    state.members,
    state.expenses,
    state.settledTransactions
  );

  // Handlers
  const handleAddMember = (newMemberData: Omit<Member, 'id'>) => {
    const newMember: Member = {
      ...newMemberData,
      id: `m-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
  };

  const handleDeleteMember = (id: string) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
      expenses: prev.expenses.filter(
        (e) => e.paidById !== id && !e.splits.some((s) => s.memberId === id)
      ),
      settledTransactions: prev.settledTransactions.filter(
        (s) => s.fromMemberId !== id && s.toMemberId !== id
      ),
    }));
  };

  const handleResetAllData = () => {
    localStorage.removeItem('kharchasplit_v1_data');
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setState({
      members: [],
      expenses: [],
      settledTransactions: [],
      customTags: [],
    });
  };

  const handleLoadDemoData = () => {
    setState(DEMO_STATE);
  };

  const handleAddExpense = (newExpenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: `exp-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
    }));
  };

  const handleDeleteExpense = (id: string) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  const handleAddCustomTag = (tag: QuickTag) => {
    setState((prev) => ({
      ...prev,
      customTags: [...prev.customTags, tag],
    }));
  };

  // Open QR Code Modal
  const handleOpenQr = async (settlement: Settlement, upiUri: string) => {
    const toMember = state.members.find((m) => m.id === settlement.toMemberId);
    if (!toMember) return;

    try {
      const dataUrl = await generateUpiQrCode(upiUri);
      setQrState({
        isOpen: true,
        dataUrl,
        upiUri,
        toName: toMember.name,
        toUpiId: toMember.upiId,
        amount: settlement.amount,
      });
    } catch (err) {
      console.error(err);
      alert('Could not generate QR code');
    }
  };

  // Open Mark-as-Paid Modal
  const handleOpenMarkPaid = (settlement: Settlement) => {
    setMarkPaidSettlement(settlement);
  };

  // Confirm Settlement
  const handleConfirmSettlement = (settlement: Settlement) => {
    setState((prev) => ({
      ...prev,
      settledTransactions: [
        ...prev.settledTransactions,
        { ...settlement, isSettled: true, settledAt: new Date().toISOString() },
      ],
    }));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'weeknd' ? 'bumblebee' : 'weeknd'));
  };

  const liveShareUrl = compressStateToUrl(state);
  const isBumblebee = theme === 'bumblebee';

  return (
    <div className={`min-h-screen bg-[#08080a] bg-app-grid text-zinc-100 flex flex-col font-sans theme-${theme}`}>
      {/* Header with theme switcher, stats & actions */}
      <Header
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        onOpenAddMember={() => setIsAddMemberOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenShareLedger={() => setIsShareLedgerOpen(true)}
        totalGroupSpend={totalGroupSpend}
        activeMemberCount={state.members.length}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-10">
        {state.members.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center border border-white/10 space-y-4 max-w-xl mx-auto my-8">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border shadow-lg ${
                isBumblebee
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-yellow-950/40'
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-950/40'
              }`}
            >
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white font-heading">
                No Flatmates in Ledger
              </h2>
              <p className="text-xs text-zinc-400">
                All data has been cleared. Add your flatmates with their UPI IDs to begin splitting shared expenses, or reload the sample demo.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <button
                onClick={() => setIsAddMemberOpen(true)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg ${
                  isBumblebee
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-zinc-950 shadow-yellow-950'
                    : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950'
                }`}
              >
                + Add Flatmates
              </button>
              <button
                onClick={handleLoadDemoData}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Reload Sample Demo Data
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Section 1: Minimized Settlement Cards with UPI & QR */}
            <section>
              <SettlementCards
                settlements={settlements}
                members={state.members}
                onOpenQr={handleOpenQr}
                onOpenMarkPaid={handleOpenMarkPaid}
              />
            </section>

            {/* Section 2: Chronological Filterable Expense Feed */}
            <section>
              <ExpenseList
                expenses={filteredExpenses}
                members={state.members}
                onDeleteExpense={handleDeleteExpense}
              />
            </section>
          </>
        )}
      </main>

      {/* Footer (Removed NPCI UPI Protocol and Netlify 0 dollar tier as requested) */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-500 glass-panel-subtle mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-white tracking-wider">
              KHARCHA
              <span className={isBumblebee ? 'text-yellow-400' : 'text-rose-500'}>
                SPLIT
              </span>
            </span>
            <span>•</span>
            <span>Zero Cloud Indian Flatmate Ledger</span>
          </div>

          <div className="text-[11px] text-zinc-500">
            Split bills fairly • Settle instantly
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        members={state.members}
        tags={allTags}
        onAddCustomTag={handleAddCustomTag}
        onSaveExpense={handleAddExpense}
      />

      <MemberManager
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        members={state.members}
        netBalances={netBalances}
        onAddMember={handleAddMember}
        onDeleteMember={handleDeleteMember}
        onResetAllData={handleResetAllData}
        onLoadDemoData={handleLoadDemoData}
      />

      <QRCodeModal
        isOpen={qrState.isOpen}
        onClose={() => setQrState((prev) => ({ ...prev, isOpen: false }))}
        qrDataUrl={qrState.dataUrl}
        upiUri={qrState.upiUri}
        toName={qrState.toName}
        toUpiId={qrState.toUpiId}
        amount={qrState.amount}
      />

      <MarkPaidModal
        isOpen={!!markPaidSettlement}
        onClose={() => setMarkPaidSettlement(null)}
        settlement={markPaidSettlement}
        members={state.members}
        onConfirmSettlement={handleConfirmSettlement}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        expenses={state.expenses}
        members={state.members}
        shareableUrl={liveShareUrl}
        theme={theme}
      />

      <ShareLedgerModal
        isOpen={isShareLedgerOpen}
        onClose={() => setIsShareLedgerOpen(false)}
        state={state}
        theme={theme}
        shareableUrl={liveShareUrl}
      />
    </div>
  );
}

export default App;
