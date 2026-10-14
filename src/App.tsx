import { useState, useEffect } from 'react';
import type {
  Member,
  Expense,
  Settlement,
  QuickTag,
  TimeFilter,
  AppState,
} from './types';
import {
  loadInitialState,
  saveStateToLocalStorage,
  DEFAULT_INDIAN_TAGS,
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

export function App() {
  const [state, setState] = useState<AppState>(loadInitialState);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

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
    if (state.members.length <= 2) {
      alert('At least two flatmates are required for splitting.');
      return;
    }
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

  // Share compressed URL link (Zero Database Sharing)
  const handleShareLink = () => {
    const shareUrl = compressStateToUrl(state);
    navigator.clipboard.writeText(shareUrl);
  };

  const liveShareUrl = compressStateToUrl(state);

  return (
    <div className="min-h-screen bg-[#08080a] bg-weeknd-grid text-zinc-100 flex flex-col font-sans">
      {/* Header with Weeknd neon styling, stats & actions */}
      <Header
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        onOpenAddMember={() => setIsAddMemberOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onShareLink={handleShareLink}
        totalGroupSpend={totalGroupSpend}
        activeMemberCount={state.members.length}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-10">
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
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-500 glass-panel-subtle mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-white tracking-wider">
              KHARCHA<span className="text-rose-500">SPLIT</span>
            </span>
            <span>•</span>
            <span>Zero Cloud Indian Flatmate Ledger</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-rose-400 font-mono">
              NPCI UPI Protocol
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-400 font-mono">
              Netlify $0 Free Tier
            </span>
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
      />
    </div>
  );
}

export default App;
