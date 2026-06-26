import React from 'react';
import { 
  Users, 
  PiggyBank, 
  HandCoins, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  DollarSign,
  Briefcase
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { CooperativeState, formatRupiah, generateMonthlyReport, getSixMonthsTrend } from '../storageUtils';

interface DashboardOverviewProps {
  state: CooperativeState;
  setActiveTab: (tab: string) => void;
  openAddMemberModal: () => void;
  openSavingsModal: () => void;
  openLoanModal: () => void;
}

export default function DashboardOverview({
  state,
  setActiveTab,
  openAddMemberModal,
  openSavingsModal,
  openLoanModal
}: DashboardOverviewProps) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  // Generate current month report
  const currentReport = generateMonthlyReport(currentMonth, currentYear, state);

  // Active members count
  const activeMembersCount = state.members.filter(m => m.status === 'active').length;

  // Active loans count
  const activeLoansCount = state.loans.filter(l => l.status === 'active').length;

  // Pending loans count
  const pendingLoansCount = state.loans.filter(l => l.status === 'pending').length;

  // Get historical trend
  const trendData = getSixMonthsTrend(state, currentMonth, currentYear);

  // Savings composition data for Pie Chart
  const pieData = [
    { name: 'Simpanan Pokok', value: currentReport.totalSavings.pokok, color: '#4F46E5' }, // Indigo
    { name: 'Simpanan Wajib', value: currentReport.totalSavings.wajib, color: '#10B981' }, // Emerald
    { name: 'Simpanan Sukarela', value: currentReport.totalSavings.sukarela, color: '#F59E0B' } // Amber
  ];

  // Combine recent activities across savings, loans and installments
  const recentSavings = state.savings.map(s => {
    const member = state.members.find(m => m.id === s.memberId);
    return {
      id: s.id,
      date: s.date,
      type: 'savings',
      title: `${s.transactionType === 'deposit' ? 'Setoran' : 'Penarikan'} ${s.type.toUpperCase()}`,
      subtitle: member ? member.name : s.memberId,
      amount: s.amount,
      isIncome: s.transactionType === 'deposit',
      color: s.transactionType === 'deposit' ? 'text-emerald-600' : 'text-rose-600'
    };
  });

  const recentLoans = state.loans.map(l => {
    const member = state.members.find(m => m.id === l.memberId);
    return {
      id: l.id,
      date: l.dateRequested,
      type: 'loan',
      title: `Pengajuan Pinjaman (${l.status.toUpperCase()})`,
      subtitle: member ? member.name : l.memberId,
      amount: l.amount,
      isIncome: false,
      color: l.status === 'approved' || l.status === 'active' ? 'text-blue-600' : 'text-amber-600'
    };
  });

  const recentInstallments = state.installments.map(ins => {
    const member = state.members.find(m => m.id === ins.memberId);
    return {
      id: ins.id,
      date: ins.date,
      type: 'installment',
      title: `Angsuran Bayar (Ke-${ins.installmentNumber})`,
      subtitle: member ? member.name : ins.memberId,
      amount: ins.amountPaid,
      isIncome: true,
      color: 'text-indigo-600'
    };
  });

  const allActivities = [...recentSavings, ...recentLoans, ...recentInstallments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Koperasi Simpan Pinjam Modern
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-2 font-sans">
            Halo, Pengurus Koperasi! 👋
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Selamat datang kembali di sistem administrasi koperasi. Hari ini adalah waktu yang tepat untuk meninjau laporan keuangan otomatis bulanan dan memantau anggota.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={openAddMemberModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Anggota
          </button>
          <button 
            onClick={openSavingsModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/10 transition-all cursor-pointer"
          >
            <PiggyBank className="w-4 h-4" /> Transaksi Simpanan
          </button>
          <button 
            onClick={openLoanModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-600/10 transition-all cursor-pointer"
          >
            <HandCoins className="w-4 h-4" /> Ajukan Pinjaman
          </button>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4"
        >
          <div className="p-3.5 bg-indigo-50 rounded-xl text-indigo-600">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Aset Koperasi</span>
            <span className="text-xl font-bold text-slate-800 font-mono block mt-0.5">
              {formatRupiah(currentReport.totalAssets)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Kas: {formatRupiah(currentReport.cashBalance)}
            </span>
          </div>
        </motion.div>

        {/* Total Savings Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4"
        >
          <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Simpanan Anggota</span>
            <span className="text-xl font-bold text-slate-800 font-mono block mt-0.5">
              {formatRupiah(currentReport.totalSavings.total)}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium block mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Wajib + Pokok + Sukarela
            </span>
          </div>
        </motion.div>

        {/* Active Loans Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4"
        >
          <div className="p-3.5 bg-amber-50 rounded-xl text-amber-600">
            <HandCoins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Pinjaman Beredar</span>
            <span className="text-xl font-bold text-slate-800 font-mono block mt-0.5">
              {formatRupiah(currentReport.outstandingLoans)}
            </span>
            <span className="text-[10px] text-amber-600 font-medium block mt-1">
              {activeLoansCount} Aktif {pendingLoansCount > 0 ? `| ${pendingLoansCount} Menunggu` : ''}
            </span>
          </div>
        </motion.div>

        {/* Member Count Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4"
        >
          <div className="p-3.5 bg-sky-50 rounded-xl text-sky-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Anggota Aktif</span>
            <span className="text-xl font-bold text-slate-800 font-mono block mt-0.5">
              {activeMembersCount} Orang
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Dari {state.members.length} total pendaftar
            </span>
          </div>
        </motion.div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm font-sans">Tren Keuangan Koperasi (6 Bulan Terakhir)</h3>
              <p className="text-xs text-slate-400">Pendapatan bunga, administrasi vs beban operasional bulanan</p>
            </div>
            <button 
              onClick={() => setActiveTab('laporan')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
            >
              Lihat Laporan Detail &rarr;
            </button>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip 
                  formatter={(value: any) => [formatRupiah(Number(value)), '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="Pendapatan (SHU)" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="Beban Operasional" stroke="#F59E0B" strokeWidth={1.5} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Savings Composition Pie Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col">
          <h3 className="font-bold text-slate-800 text-sm font-sans mb-1">Komposisi Dana Simpanan</h3>
          <p className="text-xs text-slate-400 mb-4">Pembagian jenis simpanan anggota periode berjalan</p>
          
          <div className="h-[180px] w-full relative flex items-center justify-center">
            {currentReport.totalSavings.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatRupiah(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs font-medium">Belum ada dana simpanan masuk</div>
            )}
            {currentReport.totalSavings.total > 0 && (
              <div className="absolute text-center">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Tabungan</span>
                <span className="block text-sm font-extrabold text-slate-800 font-mono mt-0.5">
                  {formatRupiah(currentReport.totalSavings.total)}
                </span>
              </div>
            )}
          </div>

          {/* Custom Legends */}
          <div className="mt-4 space-y-2.5 flex-1 flex flex-col justify-end">
            {pieData.map((item, index) => {
              const pct = currentReport.totalSavings.total > 0
                ? ((item.value / currentReport.totalSavings.total) * 100).toFixed(1)
                : '0';
              return (
                <div key={index} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-500 font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 font-mono">{formatRupiah(item.value)}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-semibold">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activities & Fast Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm font-sans">Aktivitas Transaksi Terbaru</h3>
              <p className="text-xs text-slate-400">Log mutasi masuk dan keluar dari koperasi secara real-time</p>
            </div>
            <button 
              onClick={() => setActiveTab('simpanan')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
            >
              Lihat Semua &rarr;
            </button>
          </div>
          
          <div className="divide-y divide-slate-100">
            {allActivities.length > 0 ? (
              allActivities.map((activity, index) => (
                <div key={activity.id + '-' + index} className="py-3 flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      activity.type === 'savings' ? 'bg-emerald-50 text-emerald-600' :
                      activity.type === 'loan' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {activity.isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">{activity.title}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {activity.subtitle} &bull; {activity.date}
                      </span>
                    </div>
                  </div>
                  <div className={`font-bold font-mono text-xs ${activity.color}`}>
                    {activity.isIncome ? '+' : '-'}{formatRupiah(activity.amount)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">Belum ada transaksi koperasi tercatat</div>
            )}
          </div>
        </div>

        {/* Co-op Policy Info Panel */}
        <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl p-5 border border-indigo-100/50 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-indigo-900 text-sm font-sans flex items-center gap-1.5">
              💡 Ketentuan & Kebijakan
            </h3>
            <p className="text-[11px] text-indigo-700 mt-1 leading-relaxed">
              Koperasi Simpan Pinjam mematuhi regulasi standard koperasi Indonesia dengan rincian default berikut:
            </p>
            
            <div className="mt-4 space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span>Simpanan Pokok</span>
                <span className="font-semibold text-slate-800 font-mono">Rp 200.000 <span className="text-[10px] text-slate-400 font-normal">(Sekali)</span></span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span>Simpanan Wajib</span>
                <span className="font-semibold text-slate-800 font-mono">Rp 50.000 <span className="text-[10px] text-slate-400 font-normal">(Bulanan)</span></span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span>Bunga Pinjaman</span>
                <span className="font-semibold text-slate-800 font-mono">1.0% - 1.5% <span className="text-[10px] text-slate-400 font-normal">(Flat/Bln)</span></span>
              </div>
              <div className="flex justify-between pb-1">
                <span>Pendaftaran</span>
                <span className="font-semibold text-slate-800 font-mono">Rp 25.000 <span className="text-[10px] text-slate-400 font-normal">(Admin)</span></span>
              </div>
            </div>
          </div>
          
          <div className="mt-5 p-3 bg-white rounded-xl border border-indigo-100 flex items-start gap-2.5">
            <div className="text-indigo-600 font-bold mt-0.5 text-xs">ℹ️</div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Sistem menghitung **SHU (Sisa Hasil Usaha)** bulanan secara dinamis berdasarkan akumulasi pendapatan bunga & biaya admin dikurangi operasional kantor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
