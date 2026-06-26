import React, { useState } from 'react';
import { 
  PiggyBank, 
  Search, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  Calendar, 
  User, 
  PlusCircle, 
  MinusCircle,
  HelpCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Member, SavingsTransaction, SavingsType, SavingsTransactionType } from '../types';
import { getMemberSavingsBalance, formatRupiah, getTotalSavingsBalances } from '../storageUtils';

interface SavingsManagementProps {
  members: Member[];
  savings: SavingsTransaction[];
  onAddTransaction: (newTransaction: SavingsTransaction) => void;
  showModalDirectly?: boolean;
  onCloseModalDirectly?: () => void;
}

export default function SavingsManagement({
  members,
  savings,
  onAddTransaction,
  showModalDirectly = false,
  onCloseModalDirectly
}: SavingsManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | SavingsType>('all');
  const [txFilter, setTxFilter] = useState<'all' | SavingsTransactionType>('all');
  const [isModalOpen, setIsModalOpen] = useState(showModalDirectly);

  // Form state
  const [formData, setFormData] = useState({
    memberId: '',
    type: 'wajib' as SavingsType,
    transactionType: 'deposit' as SavingsTransactionType,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [formError, setFormError] = useState('');

  React.useEffect(() => {
    if (showModalDirectly) {
      setIsModalOpen(true);
    }
  }, [showModalDirectly]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onCloseModalDirectly) onCloseModalDirectly();
  };

  // Aggregated card totals
  const aggregated = getTotalSavingsBalances(savings);

  // Handle member selection to auto-adjust notes or type
  const handleMemberChange = (memberId: string) => {
    const selectedMember = members.find(m => m.id === memberId);
    if (!selectedMember) return;

    let defaultNotes = '';
    if (formData.transactionType === 'deposit') {
      if (formData.type === 'pokok') {
        defaultNotes = `Simpanan Pokok awal gabung ${selectedMember.name}`;
      } else if (formData.type === 'wajib') {
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const currentMonthName = monthNames[new Date().getMonth()];
        defaultNotes = `Simpanan Wajib bulan ${currentMonthName}`;
      } else {
        defaultNotes = `Setor Simpanan Sukarela ${selectedMember.name}`;
      }
    } else {
      defaultNotes = `Penarikan Simpanan Sukarela ${selectedMember.name}`;
    }

    setFormData(prev => ({
      ...prev,
      memberId,
      notes: defaultNotes
    }));
    setFormError('');
  };

  const handleTypeChange = (type: SavingsType) => {
    // If pokok or wajib, withdraw is generally not allowed in standard cooperatives
    const updatedTxType = (type === 'pokok' || type === 'wajib') ? 'deposit' : formData.transactionType;
    
    setFormData(prev => ({
      ...prev,
      type,
      transactionType: updatedTxType
    }));
    setFormError('');
  };

  const handleTxTypeChange = (transactionType: SavingsTransactionType) => {
    // Force sukarela if withdraw is clicked
    const updatedType = transactionType === 'withdrawal' ? 'sukarela' : formData.type;
    
    setFormData(prev => ({
      ...prev,
      transactionType,
      type: updatedType
    }));
    setFormError('');
  };

  // Filter savings logs
  const filteredSavings = savings.filter(tx => {
    const member = members.find(m => m.id === tx.memberId);
    const memberName = member ? member.name.toLowerCase() : '';
    
    const matchesSearch = 
      tx.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memberName.includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesTxType = txFilter === 'all' || tx.transactionType === txFilter;

    return matchesSearch && matchesType && matchesTxType;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Handle transaction submit with strict validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.memberId) {
      setFormError('Silakan pilih anggota koperasi terlebih dahulu.');
      return;
    }

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Jumlah nominal setoran/penarikan harus berupa angka positif.');
      return;
    }

    // Withdrawal validations
    if (formData.transactionType === 'withdrawal') {
      if (formData.type !== 'sukarela') {
        setFormError('Simpanan Pokok & Wajib tidak dapat ditarik kecuali anggota keluar dari keanggotaan.');
        return;
      }

      // Check current voluntary balance
      const memberBalance = getMemberSavingsBalance(formData.memberId, savings);
      if (numAmount > memberBalance.sukarela) {
        setFormError(`Saldo penarikan melebihi Simpanan Sukarela yang dimiliki anggota. Batas penarikan: ${formatRupiah(memberBalance.sukarela)}`);
        return;
      }
    }

    // Generate transaction ID
    const lastNum = savings.length > 0
      ? parseInt(savings[savings.length - 1].id.split('-')[1])
      : 0;
    const newTxId = `SAV-${String(lastNum + 1).padStart(4, '0')}`;

    const newTx: SavingsTransaction = {
      id: newTxId,
      memberId: formData.memberId,
      date: formData.date,
      type: formData.type,
      amount: numAmount,
      transactionType: formData.transactionType,
      notes: formData.notes || '-'
    };

    onAddTransaction(newTx);

    // Reset Form
    setFormData({
      memberId: '',
      type: 'wajib',
      transactionType: 'deposit',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight font-sans">
            Transaksi Simpanan Anggota
          </h1>
          <p className="text-xs text-slate-400">
            Kelola simpanan Pokok (awal), Wajib (bulanan), dan Sukarela (tabungan bebas) untuk seluruh anggota.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/10 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Catat Transaksi Baru
        </button>
      </div>

      {/* Aggregate Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Simpanan Pokok</span>
          <span className="text-lg font-bold text-slate-800 font-mono block mt-1">
            {formatRupiah(aggregated.pokok)}
          </span>
          <p className="text-[9px] text-slate-400 mt-1">Sifatnya mengikat saat registrasi anggota.</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Simpanan Wajib</span>
          <span className="text-lg font-bold text-slate-800 font-mono block mt-1">
            {formatRupiah(aggregated.wajib)}
          </span>
          <p className="text-[9px] text-slate-400 mt-1">Setoran wajib bulanan Rp 50.000 / anggota.</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Simpanan Sukarela</span>
          <span className="text-lg font-bold text-slate-800 font-mono block mt-1">
            {formatRupiah(aggregated.sukarela)}
          </span>
          <p className="text-[9px] text-slate-400 mt-1">Tabungan dinamis, bebas disetor/ditarik.</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4">
          <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">Total Seluruh Simpanan</span>
          <span className="text-xl font-extrabold text-emerald-700 font-mono block mt-1">
            {formatRupiah(aggregated.total)}
          </span>
          <p className="text-[9px] text-emerald-600 mt-1 font-semibold">Total liabilitas simpanan koperatif.</p>
        </div>
      </div>

      {/* Filter and search bars */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan Nama Anggota atau ID Transaksi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
          />
        </div>
        
        {/* Type Filter */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 flex items-center mr-1 uppercase">Jenis:</span>
          {(['all', 'pokok', 'wajib', 'sukarela'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                typeFilter === t
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent'
              }`}
            >
              {t === 'all' ? 'Semua' : t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Mutation Direction Filter */}
        <div className="flex flex-wrap gap-1.5 border-l md:border-l border-slate-100 md:pl-3">
          <span className="text-[10px] font-bold text-slate-400 flex items-center mr-1 uppercase">Arah:</span>
          {(['all', 'deposit', 'withdrawal'] as const).map((tx) => (
            <button
              key={tx}
              onClick={() => setTxFilter(tx)}
              className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                txFilter === tx
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent'
              }`}
            >
              {tx === 'all' ? 'Semua' : tx === 'deposit' ? 'Masuk' : 'Keluar'}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Log Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">No Transaksi</th>
                <th className="py-3.5 px-4">Anggota</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Jenis Simpanan</th>
                <th className="py-3.5 px-4">Deskripsi / Catatan</th>
                <th className="py-3.5 px-4 text-right">Jumlah (Nominal)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredSavings.length > 0 ? (
                filteredSavings.map((tx) => {
                  const member = members.find(m => m.id === tx.memberId);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-mono text-[10px] font-bold text-slate-500">
                        {tx.id}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{member ? member.name : tx.memberId}</span>
                        <span className="font-mono text-[9px] text-slate-400 block mt-0.5">ID: {tx.memberId}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                        {tx.date}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          tx.type === 'pokok' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          tx.type === 'wajib' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {tx.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate" title={tx.notes}>
                        {tx.notes}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-mono font-bold flex items-center justify-end gap-1 ${
                          tx.transactionType === 'deposit' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {tx.transactionType === 'deposit' ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          )}
                          {formatRupiah(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada log transaksi simpanan sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-emerald-950 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm">Catat Mutasi Simpanan</h3>
                </div>
                <button 
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 flex items-start gap-2 text-[11px] leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Member Dropdown */}
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Pilih Anggota Koperasi *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select
                      required
                      value={formData.memberId}
                      onChange={(e) => handleMemberChange(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition text-xs cursor-pointer appearance-none"
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

                {/* Mutasi Type (Deposit / Withdrawal) */}
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Arah Arus Dana *</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleTxTypeChange('deposit')}
                      className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1 border.5 transition cursor-pointer ${
                        formData.transactionType === 'deposit'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-slate-50 border-transparent text-slate-500'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" /> Setoran (Dana Masuk)
                    </button>
                    <button
                      type="button"
                      disabled={formData.type === 'pokok' || formData.type === 'wajib'}
                      onClick={() => handleTxTypeChange('withdrawal')}
                      className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1 border.5 transition cursor-pointer ${
                        formData.transactionType === 'withdrawal'
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-slate-50 border-transparent text-slate-500 disabled:opacity-50'
                      }`}
                      title={formData.type !== 'sukarela' ? 'Simpanan pokok/wajib tidak bisa ditarik' : ''}
                    >
                      <MinusCircle className="w-4 h-4" /> Penarikan (Tarik Sukarela)
                    </button>
                  </div>
                </div>

                {/* Savings Category Type */}
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Jenis Simpanan *</label>
                  <div className="flex gap-1.5">
                    {(['pokok', 'wajib', 'sukarela'] as const).map((t) => {
                      const isDisabled = formData.transactionType === 'withdrawal' && t !== 'sukarela';
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleTypeChange(t)}
                          className={`flex-1 py-2 rounded-lg font-bold uppercase text-[10px] border.5 transition cursor-pointer ${
                            formData.type === t
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : 'bg-slate-50 border-transparent text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount and Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Nominal Jumlah (Rp) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 50000"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value.replace(/\D/g, '')})}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Tanggal Transaksi</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-xs cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Keterangan / Deskripsi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Setoran sukarela denda pinalti dsb..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-xs"
                  />
                </div>

                {/* Alert Warning for Withdraw constraints */}
                {formData.transactionType === 'withdrawal' && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-[10px] leading-relaxed">
                    Sesuai Anggaran Dasar koperasi, penarikan simpanan hanya boleh dilakukan untuk jenis **Simpanan Sukarela**. Simpanan Pokok & Wajib mengendap seumur keanggotaan.
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-xl font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/15"
                  >
                    Simpan Mutasi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
