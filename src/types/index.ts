export type SplitType = 'EQUAL' | 'CUSTOM';

export interface Member {
  id: string;
  name: string;
  upiId: string;
  phone?: string;
  avatarColor: string;
}

export interface SplitDetail {
  memberId: string;
  amount: number;
  note?: string;
}

export interface Expense {
  id: string;
  title: string;
  totalAmount: number;
  paidById: string;
  date: string; // ISO string
  tag: string;
  splitType: SplitType;
  splits: SplitDetail[];
  customNote?: string;
}

export interface Settlement {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  isSettled?: boolean;
  settledAt?: string;
}

export interface QuickTag {
  id: string;
  label: string;
  icon: string;
  isCustom?: boolean;
}

export type TimeFilter = 'ALL' | 'THIS_WEEK' | 'THIS_MONTH';

export type AppTheme = 'weeknd' | 'purple';

export interface AppState {
  members: Member[];
  expenses: Expense[];
  settledTransactions: Settlement[];
  customTags: QuickTag[];
}

export interface UserProfile {
  name: string;
  upiId: string;
  phone?: string;
  avatarColor: string;
}
