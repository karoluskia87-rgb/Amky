import React, { useState } from 'react';
import { 
  HandCoins, 
  Search, 
  Plus, 
  Calendar, 
  User, 
  Percent, 
  Clock, 
  Calculator,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  History,
  Info,
  DollarSign,
  Briefcase,
  TrendingUp,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Member, Loan, LoanInstallment, LoanStatus } from '../types';
import { formatRupiah, CooperativeState } from '../storageUtils';

interface LoanManagementProps {
  members: Member[];
  loans: Loan[];
  installments: LoanInstallment[];
  onAddLoan: (newLoan: Loan) => void;
  onUpdateLoanStatus: (loanId: string, status: LoanStatus) => void;
  onPayInstallment: (installment: LoanInstallment) => void;
  showModalDirectly?: boolean;
  onCloseModalDirectly?: () => void;
}

export default function LoanManagement({
  members,
  loans,
  installments,
  onAddLoan,
  onUpdateLoanStatus,
  onPayInstallment,
  showModalDirectly = false,
  onCloseModalDirectly
}: LoanManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'paid'>('all');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(showModalDirectly);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'calculator'>('list');

  // Request Loan Form State
  const [requestForm, setRequestForm] = useState({
    memberId: '',
    amount: '',
    interestRate: '1.0',
    tenor: '12',
    purpose: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Pay Installment Form State
  const [selectedLoanForInstallment, setSelectedLoanForInstallment] = useState<Loan | null>(null);
  const [installmentForm, setInstallmentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [formError, setFormError] = useState('');

  React.useEffect(() => {
    if (showModalDirectly) {
      setIsRequestModalOpen(true);
    }
  }, [showModalDirectly]);

  const handleCloseRequestModal = () => {
    setIsRequestModalOpen(false);
    if (onCloseModalDirectly) onCloseModalDirectly();
  };

  // Calculator computations
  const calcAmount = parseFloat(requestForm.amount) || 0;
  const calcTenor = parseInt(requestForm.tenor) || 1;
  const calcInterest = parseFloat(requestForm.interestRate) || 0;

  const calcPrincipalPerMonth = Math.round(calcAmount / calcTenor);
  const calcInterestPerMonth = Math.round(calcAmount * (calcInterest / 100));
  const calcTotalPerMonth = calcPrincipalPerMonth + calcInterestPerMonth;
  const calcTotalInterestPaid = calcInterestPerMonth * calcTenor;
  const calcTotalRepayment = calcAmount + calcTotalInterestPaid;

  // Filter loan list
  const filteredLoans = loans.filter(l => {
    const member = members.find(m => m.id === l.memberId);
    const name = member ? member.name.toLowerCase() : '';
    
    const matchesSearch = 
      l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.includes(searchTerm.toLowerCase()) ||
      l.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => b.dateRequested.localeCompare(a.dateRequested));

  // Handle Request Loan Submission
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!requestForm.memberId) {
      setFormError('Silakan pilih anggota koperasi.');
      return;
    }

    const member = members.find(m => m.id === requestForm.memberId);
    if (member?.status !== 'active') {
      setFormError('Hanya anggota aktif yang diperbolehkan mengajukan pinjaman.');
      return;
    }

    const numAmount = parseFloat(requestForm.amount);
    if (isNaN(numAmount) || numAmount <= 100000) {
      setFormError('Jumlah nominal pinjaman harus di atas Rp 100.000.');
      return;
    }

    // Check if member already has an active or pending loan
    const existingLoans = loans.filter(l => l.memberId === requestForm.memberId && (l.status === 'active' || l.status === 'pending'));
    if (existingLoans.length > 0) {
      setFormError('Anggota ini masih memiliki pengajuan pinjaman yang tertunda atau pinjaman aktif yang belum lunas.');
      return;
    }

    // Generate loan ID e.g. PIN-0005
    const lastNum = loans.length > 0
      ? parseInt(loans[loans.length - 1].id.split('-')[1])
      : 0;
    const newLoanId = `PIN-${String(lastNum + 1).padStart(4, '0')}`;

    const newLoan: Loan = {
      id: newLoanId,
      memberId: requestForm.memberId,
      amount: numAmount,
      interestRate: parseFloat(requestForm.interestRate),
      tenor: parseInt(requestForm.tenor),
      purpose: requestForm.purpose || 'Modal Usaha',
      dateRequested: requestForm.date,
      status: 'pending',
      installmentsPaid: 0,
      remainingBalance: numAmount
    };

    onAddLoan(newLoan);

    // Reset Form
    setRequestForm({
      memberId: '',
      amount: '',
      interestRate: '1.0',
      tenor: '12',
      purpose: '',
      date: new Date().toISOString().split('T')[0]
    });
    handleCloseRequestModal();
  };

  // Open Installment Modal
  const openInstallmentModal = (loan: Loan) => {
    setSelectedLoanForInstallment(loan);
    const nextInstallmentNum = loan.installmentsPaid + 1;
    const member = members.find(m => m.id === loan.memberId);
    
    setInstallmentForm({
      date: new Date().toISOString().split('T')[0],
      notes: `Bayar angsuran ke-${nextInstallmentNum} pinjaman ${loan.id} - ${member?.name || ''}`
    });
    setIsInstallmentModalOpen(true);
    setFormError('');
  };

  // Handle Pay Installment Submit
  const handleInstallmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForInstallment) return;

    const loan = selectedLoanForInstallment;
    const nextInstallmentNum = loan.installmentsPaid + 1;

    // Monthly payments
    const principalPaid = Math.round(loan.amount / loan.tenor);
    const interestPaid = Math.round(loan.amount * (loan.interestRate / 100));
    const totalPaid = principalPaid + interestPaid;

    // Generate installment ID e.g. INS-0007
    const lastNum = installments.length > 0
      ? parseInt(installments[installments.length - 1].id.split('-')[1])
      : 0;
    const newInsId = `INS-${String(lastNum + 1).padStart(4, '0')}`;

    const newInstallment: LoanInstallment = {
      id: newInsId,
      loanId: loan.id,
      memberId: loan.memberId,
      date: installmentForm.date,
      installmentNumber: nextInstallmentNum,
      amountPaid: totalPaid,
      principalPaid,
      interestPaid,
      notes: installmentForm.notes
    };

    onPayInstallment(newInstallment);
    setIsInstallmentModalOpen(false);
    setSelectedLoanForInstallment(null);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-100 no-print">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-3 text-xs font-bold px-4 transition border-b-2 cursor-pointer ${
            activeTab === 'list' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Daftar Pinjaman Koperasi
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`pb-3 text-xs font-bold px-4 transition border-b-2 cursor-pointer ${
            activeTab === 'calculator' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Simulasi Kalkulator Kredit
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-6">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight font-sans">
                Manajemen Kredit & Pinjaman
              </h1>
              <p className="text-xs text-slate-400">
                Persetujuan pengajuan pinjaman anggota, pemantauan tenor, dan pencatatan angsuran bulanan.
              </p>
            </div>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/10 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Ajukan Pinjaman Baru
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Sedang Menunggu Review</span>
                <span className="text-lg font-bold text-slate-800 font-mono block mt-1">
                  {loans.filter(l => l.status === 'pending').length} Pengajuan
                </span>
              </div>
              <span className="p-2 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold">Review</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Kredit Berjalan (Aktif)</span>
                <span className="text-lg font-bold text-slate-800 font-mono block mt-1">
                  {loans.filter(l => l.status === 'active').length} Kontrak
                </span>
              </div>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">Lancar</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Pinjaman Lunas</span>
                <span className="text-lg font-bold text-slate-800 font-mono block mt-1">
                  {loans.filter(l => l.status === 'paid').length} Kontrak
                </span>
              </div>
              <span className="p-2 bg-sky-50 text-sky-600 rounded-lg text-xs font-bold">Selesai</span>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari pinjaman berdasarkan Nama, No Pinjaman, atau Keperluan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
              />
            </div>
            
            <div className="flex gap-2">
              {(['all', 'pending', 'active', 'paid'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl capitalize transition cursor-pointer ${
                    statusFilter === s
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {s === 'all' ? 'Semua Kredit' : s === 'pending' ? 'Review' : s === 'active' ? 'Aktif' : 'Lunas'}
                </button>
              ))}
            </div>
          </div>

          {/* Loan Grid Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">ID Kredit / Anggota</th>
                    <th className="py-3.5 px-4">Detail Pinjaman</th>
                    <th className="py-3.5 px-4">Keperluan</th>
                    <th className="py-3.5 px-4">Angsuran Paid</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredLoans.length > 0 ? (
                    filteredLoans.map((loan) => {
                      const member = members.find(m => m.id === loan.memberId);
                      
                      // Compute month repayment figures
                      const principalPerMonth = Math.round(loan.amount / loan.tenor);
                      const interestPerMonth = Math.round(loan.amount * (loan.interestRate / 100));
                      const totalPerMonth = principalPerMonth + interestPerMonth;

                      return (
                        <tr key={loan.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded block w-max">
                              {loan.id}
                            </span>
                            <span className="font-bold text-slate-800 mt-1 block">
                              {member ? member.name : loan.memberId}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Anggota: {loan.memberId}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 font-mono block">
                              {formatRupiah(loan.amount)}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {loan.tenor} Bln &bull; Bunga {loan.interestRate}% Flat
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 italic max-w-[150px] truncate" title={loan.purpose}>
                            {loan.purpose}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5 min-w-[60px] max-w-[100px] overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full" 
                                  style={{ width: `${(loan.installmentsPaid / loan.tenor) * 100}%` }}
                                />
                              </div>
                              <span className="font-mono text-[10px] font-bold text-slate-600">
                                {loan.installmentsPaid} / {loan.tenor}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono block mt-1">
                              Angsuran: {formatRupiah(totalPerMonth)} / bln
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              loan.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              loan.status === 'active' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                              loan.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {loan.status === 'pending' ? 'REVIEW' :
                               loan.status === 'active' ? 'AKTIF' :
                               loan.status === 'paid' ? 'LUNAS' : 'DITOLAK'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              {loan.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => onUpdateLoanStatus(loan.id, 'active')}
                                    className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition cursor-pointer text-[10px] font-bold"
                                  >
                                    Setujui
                                  </button>
                                  <button
                                    onClick={() => onUpdateLoanStatus(loan.id, 'rejected')}
                                    className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 transition cursor-pointer text-[10px] font-bold"
                                  >
                                    Tolak
                                  </button>
                                </>
                              )}

                              {loan.status === 'active' && (
                                <button
                                  onClick={() => openInstallmentModal(loan)}
                                  className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition cursor-pointer text-[10px] font-bold shadow-xs flex items-center gap-1"
                                >
                                  Bayar Angsuran
                                </button>
                              )}

                              {loan.status === 'paid' && (
                                <span className="text-[10px] text-emerald-600 font-semibold italic">Selesai (Lunas)</span>
                              )}
                              
                              {loan.status === 'rejected' && (
                                <span className="text-[10px] text-slate-400 italic">Ditolak</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Tidak ada catatan pinjaman sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Loan Calculator tab */
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="font-extrabold text-slate-800 text-base font-sans flex items-center gap-1.5">
              <Calculator className="w-5 h-5 text-indigo-600" /> Simulasi Angsuran Pinjaman
            </h2>
            <p className="text-xs text-slate-400">
              Gunakan kalkulator di bawah ini untuk mensimulasikan besaran angsuran pokok & bunga koperasi flat bulanan.
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Nominal Pinjaman (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">Rp</span>
                  <input
                    type="text"
                    value={requestForm.amount}
                    onChange={(e) => setRequestForm({...requestForm, amount: e.target.value.replace(/\D/g, '')})}
                    placeholder="Contoh: 10000000"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-mono text-xs focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Tenor Jangka Waktu</label>
                  <select
                    value={requestForm.tenor}
                    onChange={(e) => setRequestForm({...requestForm, tenor: e.target.value})}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs cursor-pointer"
                  >
                    <option value="3">3 Bulan</option>
                    <option value="6">6 Bulan</option>
                    <option value="10">10 Bulan</option>
                    <option value="12">12 Bulan (1 Tahun)</option>
                    <option value="18">18 Bulan</option>
                    <option value="24">24 Bulan (2 Tahun)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Suku Bunga Flat (% / Bulan)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={requestForm.interestRate}
                      onChange={(e) => setRequestForm({...requestForm, interestRate: e.target.value})}
                      className="w-full pr-8 pl-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs outline-none transition"
                    />
                    <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                *Rumus perhitungan flat*: Angsuran Pokok = Pinjaman / Tenor. Bunga Bulanan = Pinjaman * % Bunga Flat. Total angsuran bernilai tetap setiap bulannya.
              </p>
            </div>
          </div>

          {/* Results side panel */}
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Hasil Simulasi Flat</span>
              <h3 className="text-sm font-semibold text-slate-300 mt-1">Rencana Pengembalian</h3>
              
              <div className="mt-6 space-y-4 font-mono">
                <div className="flex justify-between border-b border-white/10 pb-2.5">
                  <span className="text-xs text-slate-400">Angsuran Pokok / Bln</span>
                  <span className="text-sm font-bold text-slate-200">{formatRupiah(calcPrincipalPerMonth)}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2.5">
                  <span className="text-xs text-slate-400">Porsi Bunga / Bln</span>
                  <span className="text-sm font-bold text-slate-200">{formatRupiah(calcInterestPerMonth)}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2.5 pt-1">
                  <span className="text-xs text-slate-400">Total Bunga ({calcTenor} Bln)</span>
                  <span className="text-sm font-bold text-indigo-300">{formatRupiah(calcTotalInterestPaid)}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2.5 pt-1">
                  <span className="text-xs text-slate-400">Total Pengembalian</span>
                  <span className="text-sm font-bold text-emerald-400">{formatRupiah(calcTotalRepayment)}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-4 flex flex-col items-center">
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Tagihan Angsuran Bulanan</span>
              <span className="text-2xl md:text-3xl font-extrabold text-emerald-400 font-mono mt-1.5 block">
                {formatRupiah(calcTotalPerMonth)}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">Tetap selama {calcTenor} bulan ke depan</span>
            </div>
          </div>
        </div>
      )}

      {/* New Loan Application Modal */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="bg-indigo-950 p-4 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <HandCoins className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm">Pengajuan Kredit / Pinjaman Baru</h3>
                </div>
                <button 
                  onClick={handleCloseRequestModal}
                  className="text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[80vh] p-5">
                <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
                  {formError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 flex items-start gap-2 text-[11px] leading-relaxed">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Member select */}
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Pilih Anggota Pengaju *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <select
                        required
                        value={requestForm.memberId}
                        onChange={(e) => setRequestForm({...requestForm, memberId: e.target.value})}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs cursor-pointer appearance-none"
                      >
                        <option value="">-- Pilih Anggota --</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id} disabled={m.status !== 'active'}>
                            [{m.id}] {m.name} {m.status !== 'active' ? '(Nonaktif)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Amount requested */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-500 font-semibold mb-1">Nominal Pinjaman *</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">Rp</span>
                        <input
                          type="text"
                          required
                          value={requestForm.amount}
                          onChange={(e) => setRequestForm({...requestForm, amount: e.target.value.replace(/\D/g, '')})}
                          placeholder="Contoh: 5000000"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Tanggal</label>
                      <input
                        type="date"
                        required
                        value={requestForm.date}
                        onChange={(e) => setRequestForm({...requestForm, date: e.target.value})}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Tenor & Interest */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Tenor Kredit *</label>
                      <select
                        value={requestForm.tenor}
                        onChange={(e) => setRequestForm({...requestForm, tenor: e.target.value})}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs cursor-pointer"
                      >
                        <option value="3">3 Bulan</option>
                        <option value="6">6 Bulan</option>
                        <option value="10">10 Bulan</option>
                        <option value="12">12 Bulan (1 Tahun)</option>
                        <option value="18">18 Bulan</option>
                        <option value="24">24 Bulan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Bunga Flat (% / Bln) *</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={requestForm.interestRate}
                          onChange={(e) => setRequestForm({...requestForm, interestRate: e.target.value})}
                          className="w-full pl-3.5 pr-8 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs outline-none"
                        />
                        <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Keperluan Pinjaman *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Renovasi warung, modal kerajinan, dsb..."
                      value={requestForm.purpose}
                      onChange={(e) => setRequestForm({...requestForm, purpose: e.target.value})}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs"
                    />
                  </div>

                  {/* Live Simulation preview inside modal */}
                  {calcAmount > 0 && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                      <span className="text-[9px] font-bold text-indigo-700 block uppercase tracking-wider">Simulasi Angsuran Bulanan</span>
                      <div className="grid grid-cols-3 gap-2.5 pt-1 text-[10px] text-slate-600 font-mono">
                        <div>
                          <span className="block text-slate-400">Pokok:</span>
                          <span className="font-bold block text-slate-700">{formatRupiah(calcPrincipalPerMonth)}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400">Bunga:</span>
                          <span className="font-bold block text-slate-700">{formatRupiah(calcInterestPerMonth)}</span>
                        </div>
                        <div className="border-l border-slate-200 pl-3">
                          <span className="block text-slate-400 font-bold text-indigo-600">Total / Bln:</span>
                          <span className="font-bold text-indigo-700 block text-xs">{formatRupiah(calcTotalPerMonth)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseRequestModal}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-xl font-semibold hover:bg-slate-50 transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-indigo-600/15"
                    >
                      Ajukan Kredit
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment of Installment Modal */}
      <AnimatePresence>
        {isInstallmentModalOpen && selectedLoanForInstallment && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-indigo-900 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <HandCoins className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm">Pembayaran Angsuran Kredit</h3>
                </div>
                <button 
                  onClick={() => setIsInstallmentModalOpen(false)}
                  className="text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const loan = selectedLoanForInstallment;
                const nextNum = loan.installmentsPaid + 1;
                const principalPaid = Math.round(loan.amount / loan.tenor);
                const interestPaid = Math.round(loan.amount * (loan.interestRate / 100));
                const totalPaid = principalPaid + interestPaid;

                return (
                  <form onSubmit={handleInstallmentSubmit} className="p-5 space-y-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2 border.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">ID Pinjaman:</span>
                        <span className="font-bold text-slate-800 font-mono">{loan.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Angsuran Ke:</span>
                        <span className="font-bold text-indigo-600 font-mono">{nextNum} dari {loan.tenor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Sisa Pokok Sebelumnya:</span>
                        <span className="font-bold text-slate-800 font-mono">{formatRupiah(loan.remainingBalance)}</span>
                      </div>
                    </div>

                    <div className="space-y-3 font-mono text-slate-700 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/50">
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-[11px] text-slate-500">Angsuran Pokok</span>
                        <span className="font-bold">{formatRupiah(principalPaid)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-[11px] text-slate-500">Bunga flat ({loan.interestRate}%)</span>
                        <span className="font-bold">{formatRupiah(interestPaid)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 text-slate-900">
                        <span className="text-[11px]">Total Setor Angsuran</span>
                        <span className="text-emerald-600 text-sm">{formatRupiah(totalPaid)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Tanggal Bayar</label>
                        <input
                          type="date"
                          required
                          value={installmentForm.date}
                          onChange={(e) => setInstallmentForm({...installmentForm, date: e.target.value})}
                          className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Catatan Keterangan</label>
                      <input
                        type="text"
                        required
                        value={installmentForm.notes}
                        onChange={(e) => setInstallmentForm({...installmentForm, notes: e.target.value})}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs"
                      />
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsInstallmentModalOpen(false)}
                        className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-xl font-semibold hover:bg-slate-50 transition cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-indigo-600/15"
                      >
                        Catat Pembayaran
                      </button>
                    </div>
                  </form>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
