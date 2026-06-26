import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  PiggyBank, 
  HandCoins, 
  FileText, 
  BookOpen, 
  ChevronRight, 
  TrendingUp, 
  ShieldCheck, 
  Coins,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Member, 
  SavingsTransaction, 
  Loan, 
  LoanInstallment, 
  CashFlowTransaction, 
  LoanStatus 
} from './types';
import { 
  getInitialState, 
  saveState, 
  CooperativeState, 
  formatRupiah 
} from './storageUtils';

// Modular views
import DashboardOverview from './components/DashboardOverview';
import MemberManagement from './components/MemberManagement';
import SavingsManagement from './components/SavingsManagement';
import LoanManagement from './components/LoanManagement';
import MonthlyReportView from './components/MonthlyReportView';

export default function App() {
  const [state, setState] = useState<CooperativeState>(() => getInitialState());
  const [activeTab, setActiveTab] = useState<string>('dasbor');

  // Direct modal controls for Parent-Child triggers
  const [directAddMemberTrigger, setDirectAddMemberTrigger] = useState(false);
  const [directSavingsTrigger, setDirectSavingsTrigger] = useState(false);
  const [directLoanTrigger, setDirectLoanTrigger] = useState(false);

  // Sync state and local storage helper
  const updateState = (updater: (prev: CooperativeState) => CooperativeState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  };

  // Add Member Handler (Includes option to auto-disburse Simpanan Pokok & registration Admin)
  const handleAddMember = (newMember: Member, autoDeposit: boolean) => {
    updateState(prev => {
      const updatedMembers = [...prev.members, newMember];
      let updatedSavings = [...prev.savings];
      let updatedCashFlow = [...prev.cashFlow];

      if (autoDeposit) {
        // 1. Simpanan Pokok Deposit of Rp 200,000
        const lastSavNum = updatedSavings.length > 0 
          ? parseInt(updatedSavings[updatedSavings.length - 1].id.split('-')[1]) 
          : 0;
        const newSavId = `SAV-${String(lastSavNum + 1).padStart(4, '0')}`;
        
        const pokokTx: SavingsTransaction = {
          id: newSavId,
          memberId: newMember.id,
          date: newMember.joinDate,
          type: 'pokok',
          amount: 200000,
          transactionType: 'deposit',
          notes: `Simpanan Pokok pendaftaran awal anggota ${newMember.name}`
        };
        updatedSavings.push(pokokTx);

        // 2. Admin Registration Income of Rp 25,000 in Cashflow ledger
        const lastCshNum = updatedCashFlow.length > 0
          ? parseInt(updatedCashFlow[updatedCashFlow.length - 1].id.split('-')[1])
          : 0;
        const newCshId = `CSH-${String(lastCshNum + 1).padStart(4, '0')}`;

        const adminFeeTx: CashFlowTransaction = {
          id: newCshId,
          date: newMember.joinDate,
          type: 'income',
          category: 'admin_pendaftaran',
          amount: 25000,
          notes: `Biaya pendaftaran Admin Anggota Baru ${newMember.id} - ${newMember.name}`
        };
        updatedCashFlow.push(adminFeeTx);
      }

      return {
        ...prev,
        members: updatedMembers,
        savings: updatedSavings,
        cashFlow: updatedCashFlow
      };
    });
  };

  // Edit Member details handler
  const handleEditMember = (updatedMember: Member) => {
    updateState(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === updatedMember.id ? updatedMember : m)
    }));
  };

  // Add savings transaction handler
  const handleAddSavingsTransaction = (newTransaction: SavingsTransaction) => {
    updateState(prev => ({
      ...prev,
      savings: [...prev.savings, newTransaction]
    }));
  };

  // Add a loan request handler
  const handleAddLoan = (newLoan: Loan) => {
    updateState(prev => ({
      ...prev,
      loans: [...prev.loans, newLoan]
    }));
  };

  // Approve / Reject Loan Application handler
  const handleUpdateLoanStatus = (loanId: string, status: LoanStatus) => {
    updateState(prev => {
      const loan = prev.loans.find(l => l.id === loanId);
      if (!loan) return prev;

      let updatedCashFlow = [...prev.cashFlow];
      
      const updatedLoans = prev.loans.map(l => {
        if (l.id === loanId) {
          const approvedDate = new Date().toISOString().split('T')[0];
          return {
            ...l,
            status,
            dateApproved: status === 'active' ? approvedDate : undefined
          };
        }
        return l;
      });

      // If approved (status becomes 'active'), record a cash disbursement outflow expense
      if (status === 'active') {
        const lastCshNum = updatedCashFlow.length > 0
          ? parseInt(updatedCashFlow[updatedCashFlow.length - 1].id.split('-')[1])
          : 0;
        const newCshId = `CSH-${String(lastCshNum + 1).padStart(4, '0')}`;
        
        const member = prev.members.find(m => m.id === loan.memberId);

        const disburseTx: CashFlowTransaction = {
          id: newCshId,
          date: new Date().toISOString().split('T')[0],
          type: 'expense',
          category: 'lain_lain',
          amount: loan.amount,
          notes: `Pencairan dana kredit pinjaman ${loan.id} - ${member?.name || ''}`
        };
        updatedCashFlow.push(disburseTx);
      }

      return {
        ...prev,
        loans: updatedLoans,
        cashFlow: updatedCashFlow
      };
    });
  };

  // Pay Installment handler (Automatically increments payments, subtracts balance, and caps paid state)
  const handlePayInstallment = (newInstallment: LoanInstallment) => {
    updateState(prev => {
      // Find associated loan
      const associatedLoan = prev.loans.find(l => l.id === newInstallment.loanId);
      if (!associatedLoan) return prev;

      // Update Loan parameters
      const nextPaidCount = associatedLoan.installmentsPaid + 1;
      const nextRemaining = Math.max(0, associatedLoan.remainingBalance - newInstallment.principalPaid);
      const isCompleted = nextPaidCount >= associatedLoan.tenor || nextRemaining <= 0;

      const updatedLoans = prev.loans.map(l => {
        if (l.id === associatedLoan.id) {
          return {
            ...l,
            installmentsPaid: nextPaidCount,
            remainingBalance: nextRemaining,
            status: isCompleted ? ('paid' as LoanStatus) : l.status
          };
        }
        return l;
      });

      // Record interest part as income into the cash flow ledger
      const lastCshNum = prev.cashFlow.length > 0
        ? parseInt(prev.cashFlow[prev.cashFlow.length - 1].id.split('-')[1])
        : 0;
      const newCshId = `CSH-${String(lastCshNum + 1).padStart(4, '0')}`;

      const interestIncomeTx: CashFlowTransaction = {
        id: newCshId,
        date: newInstallment.date,
        type: 'income',
        category: 'bunga_pinjaman',
        amount: newInstallment.interestPaid,
        notes: `Penerimaan bunga pinjaman angsuran ke-${newInstallment.installmentNumber} dari kontrak ${associatedLoan.id}`
      };

      return {
        ...prev,
        loans: updatedLoans,
        installments: [...prev.installments, newInstallment],
        cashFlow: [...prev.cashFlow, interestIncomeTx]
      };
    });
  };

  // Database recovery state import handler
  const handleImportState = (importedState: CooperativeState) => {
    setState(importedState);
    saveState(importedState);
    
    // Quick reload trigger
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // Switch tab and raise modal trigger in the target component
  const triggerAddMember = () => {
    setActiveTab('anggota');
    setDirectAddMemberTrigger(true);
  };

  const triggerSavings = () => {
    setActiveTab('simpanan');
    setDirectSavingsTrigger(true);
  };

  const triggerLoan = () => {
    setActiveTab('pinjaman');
    setDirectLoanTrigger(true);
  };

  const menuItems = [
    { id: 'dasbor', label: 'Dasbor Utama', icon: LayoutDashboard },
    { id: 'anggota', label: 'Manajemen Anggota', icon: Users },
    { id: 'simpanan', label: 'Simpanan / Tabungan', icon: PiggyBank },
    { id: 'pinjaman', label: 'Pinjaman & Kredit', icon: HandCoins },
    { id: 'laporan', label: 'Laporan Keuangan', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Sidebar - HIDDEN during printing for clean paper sheets! */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 no-print border-r border-slate-800">
        {/* Brand header */}
        <div className="p-5 flex items-center gap-3 bg-slate-950">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-tight leading-none font-sans">
              KSP SEJAHTERA
            </h1>
            <span className="text-[10px] text-indigo-400 font-bold block mt-1 tracking-wider uppercase">
              Koperasi Simpan Pinjam
            </span>
          </div>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setDirectAddMemberTrigger(false);
                  setDirectSavingsTrigger(false);
                  setDirectLoanTrigger(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                    : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </nav>

        {/* User profile section at bottom */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 font-bold text-xs">
            A
          </div>
          <div className="truncate">
            <span className="text-[11px] font-bold text-white block">Administrator</span>
            <span className="text-[9px] text-slate-500 block">karolusduan@gmail.com</span>
          </div>
        </div>
      </aside>

      {/* Main Container Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full transition-all duration-300">
        
        {/* Top Header Row - hidden in print */}
        <header className="flex justify-between items-center pb-5 mb-5 border-b border-slate-200/60 no-print">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Panel Administrasi</h2>
            <h1 className="text-xl font-bold text-slate-800 mt-1 capitalize font-sans">
              {activeTab === 'dasbor' ? 'Dashboard Overview' : 
               activeTab === 'anggota' ? 'Anggota & Nasabah' : 
               activeTab === 'simpanan' ? 'Buku Kas Tabungan' : 
               activeTab === 'pinjaman' ? 'Portofolio Kredit' : 
               'Laporan Bulanan Neraca & SHU'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-500 font-semibold bg-slate-100 px-2 py-1 rounded">
              SERVER PERSISTENT OK
            </span>
          </div>
        </header>

        {/* Main interactive Tab panels with animate presets */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dasbor' && (
            <DashboardOverview 
              state={state} 
              setActiveTab={setActiveTab}
              openAddMemberModal={triggerAddMember}
              openSavingsModal={triggerSavings}
              openLoanModal={triggerLoan}
            />
          )}

          {activeTab === 'anggota' && (
            <MemberManagement 
              members={state.members}
              savings={state.savings}
              loans={state.loans}
              installments={state.installments}
              onAddMember={handleAddMember}
              onEditMember={handleEditMember}
              showAddModalDirectly={directAddMemberTrigger}
              onCloseAddModalDirectly={() => setDirectAddMemberTrigger(false)}
            />
          )}

          {activeTab === 'simpanan' && (
            <SavingsManagement 
              members={state.members}
              savings={state.savings}
              onAddTransaction={handleAddSavingsTransaction}
              showModalDirectly={directSavingsTrigger}
              onCloseModalDirectly={() => setDirectSavingsTrigger(false)}
            />
          )}

          {activeTab === 'pinjaman' && (
            <LoanManagement 
              members={state.members}
              loans={state.loans}
              installments={state.installments}
              onAddLoan={handleAddLoan}
              onUpdateLoanStatus={handleUpdateLoanStatus}
              onPayInstallment={handlePayInstallment}
              showModalDirectly={directLoanTrigger}
              onCloseModalDirectly={() => setDirectLoanTrigger(false)}
            />
          )}

          {activeTab === 'laporan' && (
            <MonthlyReportView 
              state={state}
              onImportState={handleImportState}
            />
          )}
        </motion.div>
      </main>

      {/* Bottom Navigation for Mobile touch targets (Responsive support) */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 text-slate-400 flex md:hidden justify-around py-2.5 z-40 no-print text-[9px] font-bold">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setDirectAddMemberTrigger(false);
                setDirectSavingsTrigger(false);
                setDirectLoanTrigger(false);
              }}
              className={`flex flex-col items-center gap-1 cursor-pointer ${
                isActive ? 'text-indigo-400' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.id === 'laporan' ? 'Laporan' : item.id === 'simpanan' ? 'Simpanan' : item.id === 'pinjaman' ? 'Pinjaman' : item.id === 'anggota' ? 'Anggota' : 'Dasbor'}</span>
            </button>
          );
        })}
      </nav>
      {/* Margin helper for mobile view so content isn't chopped by the bottom sticky bar */}
      <div className="h-14 md:hidden block no-print shrink-0" />
    </div>
  );
}
