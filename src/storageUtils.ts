import { Member, SavingsTransaction, Loan, LoanInstallment, CashFlowTransaction, FinancialReport } from './types';
import { initialMembers, initialSavings, initialLoans, initialInstallments, initialCashFlow } from './initialData';

// Cooperative Initial Capital (Modal Awal Koperasi) to ensure realistic positive balances
export const INITIAL_CAPITAL = 50000000; // Rp 50.000.000

export interface CooperativeState {
  members: Member[];
  savings: SavingsTransaction[];
  loans: Loan[];
  installments: LoanInstallment[];
  cashFlow: CashFlowTransaction[];
}

const STORAGE_KEY = 'koperasi_simpan_pinjam_state';

export function getInitialState(): CooperativeState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved state, using default mock data", e);
    }
  }
  
  const defaultState: CooperativeState = {
    members: initialMembers,
    savings: initialSavings,
    loans: initialLoans,
    installments: initialInstallments,
    cashFlow: initialCashFlow
  };
  saveState(defaultState);
  return defaultState;
}

export function saveState(state: CooperativeState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Helper: Format number to Rupiah
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Calculate individual member's savings balances
export function getMemberSavingsBalance(memberId: string, savings: SavingsTransaction[]) {
  const memberTrans = savings.filter(t => t.memberId === memberId);
  
  let pokok = 0;
  let wajib = 0;
  let sukarela = 0;
  
  memberTrans.forEach(t => {
    const change = t.transactionType === 'deposit' ? t.amount : -t.amount;
    if (t.type === 'pokok') pokok += change;
    else if (t.type === 'wajib') wajib += change;
    else if (t.type === 'sukarela') sukarela += change;
  });
  
  return {
    pokok,
    wajib,
    sukarela,
    total: pokok + wajib + sukarela
  };
}

// Calculate entire cooperative savings balances
export function getTotalSavingsBalances(savings: SavingsTransaction[], upToDateStr?: string) {
  const filtered = upToDateStr 
    ? savings.filter(s => s.date <= upToDateStr)
    : savings;

  let pokok = 0;
  let wajib = 0;
  let sukarela = 0;

  filtered.forEach(t => {
    const change = t.transactionType === 'deposit' ? t.amount : -t.amount;
    if (t.type === 'pokok') pokok += change;
    else if (t.type === 'wajib') wajib += change;
    else if (t.type === 'sukarela') sukarela += change;
  });

  return { pokok, wajib, sukarela, total: pokok + wajib + sukarela };
}

// Generate Financial Report for a specific Month and Year
export function generateMonthlyReport(
  month: number, // 1-12
  year: number,
  state: CooperativeState
): FinancialReport {
  const { savings, loans, installments, cashFlow } = state;

  // Month and year boundaries
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const endOfSelectedMonthStr = `${year}-${pad(month)}-${pad(lastDayOfMonth)}`;
  const startOfSelectedMonthStr = `${year}-${pad(month)}-01`;

  // 1. Calculate historical cash balance up to end of selected month
  // Starting Cash = Initial Capital (Rp 50,000,000)
  let cashBalance = INITIAL_CAPITAL;

  // Plus savings deposits, minus savings withdrawals up to end of selected month
  savings.forEach(t => {
    if (t.date <= endOfSelectedMonthStr) {
      cashBalance += (t.transactionType === 'deposit' ? t.amount : -t.amount);
    }
  });

  // Plus registration fees / admin income up to end of selected month
  cashFlow.forEach(c => {
    if (c.date <= endOfSelectedMonthStr) {
      if (c.type === 'income') {
        cashBalance += c.amount;
      } else {
        cashBalance -= c.amount;
      }
    }
  });

  // Plus loan installment payments (principal & interest) up to end of selected month
  installments.forEach(ins => {
    if (ins.date <= endOfSelectedMonthStr) {
      cashBalance += ins.amountPaid; // Adds the whole amount paid (principal + interest)
    }
  });

  // Minus loan disbursements (only approved / active / paid loans) up to end of selected month
  loans.forEach(l => {
    if (l.dateApproved && l.dateApproved <= endOfSelectedMonthStr) {
      if (l.status === 'active' || l.status === 'paid' || l.status === 'approved') {
        cashBalance -= l.amount;
      }
    }
  });

  // 2. Outstanding Loans up to end of selected month
  // Sum of all approved loans disbursed up to (M, Y) minus principal paid up to (M, Y)
  let outstandingLoans = 0;
  loans.forEach(l => {
    if (l.dateApproved && l.dateApproved <= endOfSelectedMonthStr) {
      if (l.status === 'active' || l.status === 'paid' || l.status === 'approved') {
        let principalPaidForThisLoan = 0;
        installments.forEach(ins => {
          if (ins.loanId === l.id && ins.date <= endOfSelectedMonthStr) {
            principalPaidForThisLoan += ins.principalPaid;
          }
        });
        const currentOwed = l.amount - principalPaidForThisLoan;
        outstandingLoans += Math.max(0, currentOwed);
      }
    }
  });

  const totalAssets = cashBalance + outstandingLoans;

  // 3. Total Member Savings (Liabilities) up to end of selected month
  const totalSavings = getTotalSavingsBalances(savings, endOfSelectedMonthStr);

  // 4. Equity = Assets - Liabilities (Total Savings)
  // In cooperative accounting, total Equity consists of Capital Reserves, initial capital, and accumulated SHU.
  const totalEquity = Math.max(0, totalAssets - totalSavings.total);

  // 5. MONTHLY INCOME (ONLY for the selected month)
  let monthlyInterestIncome = 0;
  installments.forEach(ins => {
    if (ins.date >= startOfSelectedMonthStr && ins.date <= endOfSelectedMonthStr) {
      monthlyInterestIncome += ins.interestPaid;
    }
  });

  let monthlyAdminIncome = 0;
  let monthlyOtherIncome = 0;
  cashFlow.forEach(c => {
    if (c.date >= startOfSelectedMonthStr && c.date <= endOfSelectedMonthStr && c.type === 'income') {
      if (c.category === 'admin_pendaftaran') {
        monthlyAdminIncome += c.amount;
      } else {
        monthlyOtherIncome += c.amount;
      }
    }
  });

  const totalIncome = monthlyInterestIncome + monthlyAdminIncome + monthlyOtherIncome;

  // 6. MONTHLY EXPENSES (ONLY for the selected month)
  let monthlyOperationalExpense = 0;
  let monthlySalaryExpense = 0;
  let monthlyOtherExpense = 0;

  cashFlow.forEach(c => {
    if (c.date >= startOfSelectedMonthStr && c.date <= endOfSelectedMonthStr && c.type === 'expense') {
      if (c.category === 'operasional') {
        monthlyOperationalExpense += c.amount;
      } else if (c.category === 'gaji') {
        monthlySalaryExpense += c.amount;
      } else {
        monthlyOtherExpense += c.amount;
      }
    }
  });

  const totalExpenses = monthlyOperationalExpense + monthlySalaryExpense + monthlyOtherExpense;

  // 7. Net Profit / SHU for the month
  const netProfit = totalIncome - totalExpenses;

  return {
    month,
    year,
    totalAssets,
    cashBalance,
    outstandingLoans,
    totalSavings,
    totalEquity,
    income: {
      interest: monthlyInterestIncome,
      admin: monthlyAdminIncome,
      other: monthlyOtherIncome,
      total: totalIncome
    },
    expenses: {
      operational: monthlyOperationalExpense,
      salary: monthlySalaryExpense,
      other: monthlyOtherExpense,
      total: totalExpenses
    },
    netProfit
  };
}

// Generate full trend of last 6 months reports
export function getSixMonthsTrend(state: CooperativeState, currentMonth: number, currentYear: number) {
  const trend = [];
  
  // Calculate for preceding 6 months
  for (let i = 5; i >= 0; i--) {
    let targetMonth = currentMonth - i;
    let targetYear = currentYear;
    if (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    const report = generateMonthlyReport(targetMonth, targetYear, state);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    
    trend.push({
      monthLabel: `${monthNames[targetMonth - 1]} ${targetYear}`,
      'Pendapatan (SHU)': report.income.total,
      'Beban Operasional': report.expenses.total,
      'SHU Bersih': report.netProfit,
      'Total Simpanan': report.totalSavings.total,
      'Total Pinjaman Aktif': report.outstandingLoans,
      'Kas Koperasi': report.cashBalance
    });
  }
  
  return trend;
}
