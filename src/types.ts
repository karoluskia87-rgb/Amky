export type MemberStatus = 'active' | 'inactive';

export interface Member {
  id: string; // e.g. "KOP-0001"
  name: string;
  nik: string;
  phone: string;
  address: string;
  email: string;
  joinDate: string;
  status: MemberStatus;
}

export type SavingsType = 'pokok' | 'wajib' | 'sukarela';
export type SavingsTransactionType = 'deposit' | 'withdrawal';

export interface SavingsTransaction {
  id: string;
  memberId: string;
  date: string;
  type: SavingsType;
  amount: number;
  transactionType: SavingsTransactionType;
  notes?: string;
}

export type LoanStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'paid';

export interface Loan {
  id: string; // e.g. "PIN-0001"
  memberId: string;
  amount: number; // Pokok pinjaman
  interestRate: number; // Bunga per bulan (flat, e.g. 1%)
  tenor: number; // Jangka waktu (bulan)
  purpose: string;
  dateRequested: string;
  dateApproved?: string;
  status: LoanStatus;
  installmentsPaid: number; // Berapa kali angsuran telah dibayar
  remainingBalance: number; // Sisa pokok yang harus dibayar
}

export interface LoanInstallment {
  id: string; // e.g. "ANG-0001"
  loanId: string;
  memberId: string;
  date: string;
  installmentNumber: number;
  amountPaid: number; // Total bayar (Pokok + Bunga)
  principalPaid: number; // Bagian pokok
  interestPaid: number; // Bagian bunga
  notes?: string;
}

export type ExpenseCategory = 'operasional' | 'gaji' | 'perlengkapan' | 'lain_lain';
export type IncomeCategory = 'admin_pendaftaran' | 'bunga_pinjaman' | 'lain_lain';

export interface CashFlowTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: ExpenseCategory | IncomeCategory;
  amount: number;
  notes: string;
}

export interface FinancialReport {
  month: number; // 1-12
  year: number;
  totalAssets: number;
  cashBalance: number;
  outstandingLoans: number;
  totalSavings: {
    pokok: number;
    wajib: number;
    sukarela: number;
    total: number;
  };
  totalEquity: number;
  income: {
    interest: number;
    admin: number;
    other: number;
    total: number;
  };
  expenses: {
    operational: number;
    salary: number;
    other: number;
    total: number;
  };
  netProfit: number; // SHU (Sisa Hasil Usaha)
}
