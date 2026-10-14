import type { Member, Expense, Settlement } from '../types';

/**
 * Calculates the minimized debt graph using the Greedy Min-Cash Flow algorithm.
 * Collapses N*(N-1)/2 complex debts into at most N-1 direct payments.
 */
export function calculateMinimizedSettlements(
  members: Member[],
  expenses: Expense[],
  alreadySettled: Settlement[] = []
): Settlement[] {
  if (members.length < 2) return [];

  // 1. Calculate net balance for each member
  // Positive = member should receive money (creditor)
  // Negative = member owes money (debtor)
  const balances: Record<string, number> = {};
  members.forEach((m) => {
    balances[m.id] = 0;
  });

  // Calculate debts from expenses
  for (const expense of expenses) {
    const payerId = expense.paidById;
    // The payer is credited the total amount
    balances[payerId] = (balances[payerId] || 0) + expense.totalAmount;

    // Each participant in the split is debited their share
    for (const split of expense.splits) {
      balances[split.memberId] = (balances[split.memberId] || 0) - split.amount;
    }
  }

  // Adjust for already settled settlements
  for (const settled of alreadySettled) {
    if (settled.isSettled) {
      // The debtor paid the creditor
      balances[settled.fromMemberId] = (balances[settled.fromMemberId] || 0) + settled.amount;
      balances[settled.toMemberId] = (balances[settled.toMemberId] || 0) - settled.amount;
    }
  }

  // 2. Separate into debtors and creditors
  interface PersonBalance {
    id: string;
    amount: number;
  }

  const debtors: PersonBalance[] = [];
  const creditors: PersonBalance[] = [];

  for (const [id, balance] of Object.entries(balances)) {
    // Round to 2 decimal places to avoid floating point inaccuracies
    const rounded = Math.round(balance * 100) / 100;
    if (rounded < -0.01) {
      debtors.push({ id, amount: -rounded }); // store positive value of debt
    } else if (rounded > 0.01) {
      creditors.push({ id, amount: rounded });
    }
  }

  const settlements: Settlement[] = [];

  // Sort descending by amount for greedy matching
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleAmount = Math.min(debtor.amount, creditor.amount);
    const roundedSettle = Math.round(settleAmount * 100) / 100;

    if (roundedSettle > 0.01) {
      settlements.push({
        id: `settle-${debtor.id}-${creditor.id}-${roundedSettle}`,
        fromMemberId: debtor.id,
        toMemberId: creditor.id,
        amount: roundedSettle,
        isSettled: false,
      });
    }

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount < 0.01) dIdx++;
    if (creditor.amount < 0.01) cIdx++;
  }

  return settlements;
}

/**
 * Returns net balance summary for each member
 */
export function getMemberNetBalances(
  members: Member[],
  expenses: Expense[],
  alreadySettled: Settlement[] = []
): Record<string, number> {
  const balances: Record<string, number> = {};
  members.forEach((m) => {
    balances[m.id] = 0;
  });

  for (const expense of expenses) {
    balances[expense.paidById] = (balances[expense.paidById] || 0) + expense.totalAmount;
    for (const split of expense.splits) {
      balances[split.memberId] = (balances[split.memberId] || 0) - split.amount;
    }
  }

  for (const settled of alreadySettled) {
    if (settled.isSettled) {
      balances[settled.fromMemberId] = (balances[settled.fromMemberId] || 0) + settled.amount;
      balances[settled.toMemberId] = (balances[settled.toMemberId] || 0) - settled.amount;
    }
  }

  for (const id of Object.keys(balances)) {
    balances[id] = Math.round(balances[id] * 100) / 100;
  }

  return balances;
}
