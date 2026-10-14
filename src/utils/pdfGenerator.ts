import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AppState, Expense, Member, Settlement, TimeFilter } from '../types';

/**
 * Generates a comprehensive, professional PDF document of the entire flatmate ledger
 */
export function generateFullLedgerPdf(
  state: AppState,
  netBalances: Record<string, number>,
  settlements: Settlement[]
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header Banner
  doc.setFillColor(15, 15, 20); // Dark Charcoal/Black Header
  doc.rect(0, 0, pageWidth, 42, 'F');

  doc.setTextColor(255, 0, 59); // Accent
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('KHARCHASPLIT', 14, 20);

  doc.setTextColor(220, 220, 230);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Indian Bachelor & Flatmate Shared Expense Ledger', 14, 28);

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.setTextColor(160, 160, 175);
  doc.text(`Generated on: ${dateStr}`, pageWidth - 14, 28, { align: 'right' });

  let currentY = 52;

  // 2. Summary KPI Cards
  const totalSpend = state.expenses.reduce((sum, e) => sum + e.totalAmount, 0);

  doc.setFillColor(245, 245, 250);
  doc.roundedRect(14, currentY, (pageWidth - 38) / 3, 24, 3, 3, 'F');
  doc.roundedRect(14 + (pageWidth - 38) / 3 + 5, currentY, (pageWidth - 38) / 3, 24, 3, 3, 'F');
  doc.roundedRect(14 + ((pageWidth - 38) / 3) * 2 + 10, currentY, (pageWidth - 38) / 3, 24, 3, 3, 'F');

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 110);
  doc.text('TOTAL GROUP SPEND', 18, currentY + 7);
  doc.text('TOTAL TRANSACTIONS', 18 + (pageWidth - 38) / 3 + 5, currentY + 7);
  doc.text('ACTIVE MEMBERS', 18 + ((pageWidth - 38) / 3) * 2 + 10, currentY + 7);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 25);
  doc.text(`Rs. ${totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 18, currentY + 18);
  doc.text(`${state.expenses.length} bills`, 18 + (pageWidth - 38) / 3 + 5, currentY + 18);
  doc.text(`${state.members.length} flatmates`, 18 + ((pageWidth - 38) / 3) * 2 + 10, currentY + 18);

  currentY += 34;

  // 3. Flatmates & Live Net Balance Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 40);
  doc.text('1. Flatmates & Net Balances', 14, currentY);
  currentY += 4;

  const memberMap = new Map(state.members.map((m) => [m.id, m]));

  const memberRows = state.members.map((m) => {
    const bal = netBalances[m.id] || 0;
    const status =
      bal > 0.01
        ? `Gets back Rs. ${bal.toFixed(2)}`
        : bal < -0.01
        ? `Owes Rs. ${Math.abs(bal).toFixed(2)}`
        : 'Settled (Rs. 0.00)';
    return [m.name, m.upiId, m.phone ? `+91 ${m.phone}` : '-', status];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Flatmate Name', 'UPI ID', 'WhatsApp Phone', 'Net Balance']],
    body: memberRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 30, 38], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 4. Minimized Settlements Table (Greedy Algorithm)
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 40);
  doc.text('2. Minimized Settlements (Greedy Min-Cash Flow)', 14, currentY);
  currentY += 4;

  if (settlements.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 110);
    doc.text('All debts are completely settled! No pending payments.', 14, currentY + 5);
    currentY += 14;
  } else {
    const settleRows = settlements.map((s) => {
      const from = memberMap.get(s.fromMemberId)?.name || 'Unknown';
      const to = memberMap.get(s.toMemberId)?.name || 'Unknown';
      const toUpi = memberMap.get(s.toMemberId)?.upiId || '-';
      return [from, '->', to, `Rs. ${s.amount.toFixed(2)}`, toUpi];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['From (Debtor)', '', 'To (Creditor)', 'Payable Amount', 'Payee UPI ID']],
      body: settleRows,
      theme: 'grid',
      headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // 5. Detailed Expense Feed
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 40);
  doc.text('3. Detailed Expense History', 14, currentY);
  currentY += 4;

  const expenseRows = state.expenses.map((e) => {
    const payer = memberMap.get(e.paidById)?.name || 'Unknown';
    const date = new Date(e.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
    const splitsSummary = e.splits
      .map((s) => {
        const name = memberMap.get(s.memberId)?.name || '?';
        return `${name}: Rs.${s.amount}${s.note ? ` (${s.note})` : ''}`;
      })
      .join(', ');

    return [
      date,
      e.title,
      e.tag,
      payer,
      `Rs. ${e.totalAmount.toFixed(2)}`,
      splitsSummary,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Title', 'Tag', 'Paid By', 'Amount', 'Split Breakdown']],
    body: expenseRows,
    theme: 'striped',
    headStyles: { fillColor: [40, 40, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      5: { cellWidth: 70 },
    },
  });

  return doc;
}

/**
 * Generates an itemized Weekly/Monthly Expense Report PDF
 */
export function generateExpenseReportPdf(
  expenses: Expense[],
  members: Member[],
  filter: TimeFilter
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const periodTitle =
    filter === 'THIS_WEEK'
      ? "THIS WEEK'S REPORT"
      : filter === 'THIS_MONTH'
      ? "THIS MONTH'S REPORT"
      : 'ALL TIME REPORT';

  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  // Header Banner
  doc.setFillColor(15, 15, 22);
  doc.rect(0, 0, pageWidth, 42, 'F');

  doc.setTextColor(245, 158, 11); // Amber / Yellow
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('KHARCHASPLIT EXPENSE SUMMARY', 14, 20);

  doc.setTextColor(220, 220, 230);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(periodTitle, 14, 28);

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.setTextColor(160, 160, 175);
  doc.text(`Generated on: ${dateStr}`, pageWidth - 14, 28, { align: 'right' });

  let currentY = 52;

  // Totals calculations
  const totalSpend = expenses.reduce((sum, e) => sum + e.totalAmount, 0);

  const spenderTotals: Record<string, number> = {};
  members.forEach((m) => {
    spenderTotals[m.id] = 0;
  });

  const tagTotals: Record<string, number> = {};

  for (const exp of expenses) {
    spenderTotals[exp.paidById] = (spenderTotals[exp.paidById] || 0) + exp.totalAmount;
    tagTotals[exp.tag] = (tagTotals[exp.tag] || 0) + exp.totalAmount;
  }

  // Summary box
  doc.setFillColor(245, 245, 250);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setTextColor(90, 90, 100);
  doc.text('TOTAL PERIOD EXPENSES:', 20, currentY + 9);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text(`Rs. ${totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 20, currentY + 17);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 100);
  doc.text(`${expenses.length} bills recorded across ${members.length} flatmates`, pageWidth - 20, currentY + 14, {
    align: 'right',
  });

  currentY += 32;

  // Spender Leaderboard Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 40);
  doc.text('Spender Leaderboard', 14, currentY);
  currentY += 4;

  const spenderRows = Object.entries(spenderTotals)
    .filter(([_, amt]) => amt > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id, amt]) => {
      const name = memberMap.get(id) || 'Unknown';
      const percentage = totalSpend > 0 ? ((amt / totalSpend) * 100).toFixed(1) + '%' : '0%';
      return [name, `Rs. ${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, percentage];
    });

  autoTable(doc, {
    startY: currentY,
    head: [['Flatmate', 'Total Paid', 'Share of Total']],
    body: spenderRows.length > 0 ? spenderRows : [['No expenses', 'Rs. 0.00', '0%']],
    theme: 'grid',
    headStyles: { fillColor: [30, 30, 40], textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Tag Category Breakdown
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 40);
  doc.text('Category Tag Breakdown', 14, currentY);
  currentY += 4;

  const tagRows = Object.entries(tagTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, amt]) => {
      const percentage = totalSpend > 0 ? ((amt / totalSpend) * 100).toFixed(1) + '%' : '0%';
      return [tag, `Rs. ${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, percentage];
    });

  autoTable(doc, {
    startY: currentY,
    head: [['Category Tag', 'Total Spent', '% of Total']],
    body: tagRows.length > 0 ? tagRows : [['No categories', 'Rs. 0.00', '0%']],
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11], textColor: [30, 30, 40] },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Transactions list
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 40);
  doc.text('Itemized Transactions', 14, currentY);
  currentY += 4;

  const itemRows = expenses.map((e) => {
    const payer = memberMap.get(e.paidById) || 'Unknown';
    const date = new Date(e.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
    return [date, e.title, e.tag, payer, `Rs. ${e.totalAmount.toFixed(2)}`];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Title', 'Category', 'Paid By', 'Amount']],
    body: itemRows.length > 0 ? itemRows : [['-', 'No transactions', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [40, 40, 50], textColor: [255, 255, 255] },
    styles: { fontSize: 8.5, cellPadding: 3 },
  });

  return doc;
}

/**
 * Triggers native Web Share API with PDF file if supported on device (e.g. Mobile WhatsApp sharing),
 * or falls back to browser file download.
 */
export async function downloadOrSharePdf(doc: jsPDF, filename: string, title: string): Promise<'shared' | 'downloaded'> {
  const pdfBlob = doc.output('blob');
  const file = new File([pdfBlob], filename, { type: 'application/pdf' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title,
        text: `${title} generated via KharchaSplit.`,
      });
      return 'shared';
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        doc.save(filename);
        return 'downloaded';
      }
      return 'shared';
    }
  } else {
    doc.save(filename);
    return 'downloaded';
  }
}
