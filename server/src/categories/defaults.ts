import type { CategoryCreate, Locale } from '@expenses/shared'

// Given to every new account so the first transaction can be added right away,
// named in the language the account was created in.
export const DEFAULT_CATEGORIES: Record<Locale, CategoryCreate[]> = {
  en: [
    { type: 'expense', name: 'Groceries', color: '#22c55e' },
    { type: 'expense', name: 'Rent', color: '#6366f1' },
    { type: 'expense', name: 'Utilities', color: '#0ea5e9' },
    { type: 'expense', name: 'Transport', color: '#f97316' },
    { type: 'expense', name: 'Eating out', color: '#ef4444' },
    { type: 'expense', name: 'Health', color: '#14b8a6' },
    { type: 'expense', name: 'Shopping', color: '#ec4899' },
    { type: 'expense', name: 'Entertainment', color: '#a855f7' },
    { type: 'expense', name: 'Other', color: '#64748b' },
    { type: 'income', name: 'Salary', color: '#22c55e' },
    { type: 'income', name: 'Bonus', color: '#eab308' },
    { type: 'income', name: 'Other income', color: '#64748b' },
  ],
  vi: [
    { type: 'expense', name: 'Đi chợ', color: '#22c55e' },
    { type: 'expense', name: 'Tiền nhà', color: '#6366f1' },
    { type: 'expense', name: 'Điện nước', color: '#0ea5e9' },
    { type: 'expense', name: 'Đi lại', color: '#f97316' },
    { type: 'expense', name: 'Ăn ngoài', color: '#ef4444' },
    { type: 'expense', name: 'Sức khỏe', color: '#14b8a6' },
    { type: 'expense', name: 'Mua sắm', color: '#ec4899' },
    { type: 'expense', name: 'Giải trí', color: '#a855f7' },
    { type: 'expense', name: 'Khác', color: '#64748b' },
    { type: 'income', name: 'Lương', color: '#22c55e' },
    { type: 'income', name: 'Thưởng', color: '#eab308' },
    { type: 'income', name: 'Thu nhập khác', color: '#64748b' },
  ],
}
