import type { Expense, Member, TimeFilter } from '../types';

/**
 * Creates a pre-composed WhatsApp message for marking a debt as paid.
 * Can launch directly to a phone number or general WhatsApp share.
 */
export function createSettlementWhatsAppUrl(
  fromName: string,
  toName: string,
  amount: number,
  toPhone?: string,
  note = 'KharchaSplit Settlement'
): { url: string; message: string } {
  const formattedAmount = `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const message = 
`⚡ *KHARCHASPLIT PAYMENT SETTLED* ⚡
━━━━━━━━━━━━━━━━━━━━━━
Hey *${toName}*,
I have marked our balance as *PAID*!

💵 *Amount:* ${formattedAmount}
👤 *From:* ${fromName}
📅 *Date:* ${today}
📝 *Note:* ${note}

Kindly verify in your GPay / PhonePe / Bank app. Cheers! 🍻
━━━━━━━━━━━━━━━━━━━━━━`;

  const encoded = encodeURIComponent(message);
  const cleanPhone = toPhone ? toPhone.replace(/[^0-9]/g, '') : '';
  const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;

  return { url, message };
}

/**
 * Generates an itemized Weekly/Monthly Expense Report for WhatsApp with tag breakdowns & spenders
 */
export function createExpenseReportWhatsAppUrl(
  expenses: Expense[],
  members: Member[],
  filter: TimeFilter,
  shareableUrl?: string
): { url: string; message: string } {
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  // 1. Total Spend
  const totalSpend = expenses.reduce((sum, e) => sum + e.totalAmount, 0);

  // 2. Spending per member
  const spenderTotals: Record<string, number> = {};
  members.forEach((m) => {
    spenderTotals[m.id] = 0;
  });

  // 3. Spending per tag
  const tagTotals: Record<string, number> = {};

  for (const exp of expenses) {
    spenderTotals[exp.paidById] = (spenderTotals[exp.paidById] || 0) + exp.totalAmount;
    tagTotals[exp.tag] = (tagTotals[exp.tag] || 0) + exp.totalAmount;
  }

  const periodTitle =
    filter === 'THIS_WEEK'
      ? 'THIS WEEK\'S EXPENSES'
      : filter === 'THIS_MONTH'
      ? 'THIS MONTH\'S EXPENSES'
      : 'ALL TIME EXPENSES';

  const dateStr = new Date().toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });

  // Build Spenders Breakdown
  const spenderLines = Object.entries(spenderTotals)
    .filter(([, amt]) => amt > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id, amt]) => {
      const name = memberMap.get(id) || 'Unknown';
      return `• *${name}:* ₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    })
    .join('\n');

  // Build Tags Breakdown
  const tagLines = Object.entries(tagTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, amt]) => {
      return `• *${tag}:* ₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    })
    .join('\n');

  // Build Recent Items List (Top 5 recent)
  const recentItems = expenses
    .slice(0, 5)
    .map((e) => {
      const payer = memberMap.get(e.paidById) || 'Unknown';
      return `• ${e.title} (₹${e.totalAmount}) — _Paid by ${payer}_ [${e.tag}]`;
    })
    .join('\n');

  const shareLinkSection = shareableUrl
    ? `\n🔗 *View Live Ledger & Settle via UPI:*\n${shareableUrl}\n`
    : '';

  const message =
`🍷 *KHARCHASPLIT — ${periodTitle} (${dateStr})* 🍷
━━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL SPEND:* ₹${totalSpend.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
👥 *Flatmates:* ${members.map((m) => m.name).join(', ')}

📊 *SPENDER LEADERBOARD:*
${spenderLines || '• No expenses recorded'}

🏷️ *EXPENSES BY TAG:*
${tagLines || '• No categorized expenses'}

📝 *RECENT TRANSACTIONS:*
${recentItems || '• None'}${shareLinkSection}━━━━━━━━━━━━━━━━━━━━━━
_Sent via KharchaSplit • Zero Cloud Ledger_`;

  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/?text=${encoded}`;

  return { url, message };
}
