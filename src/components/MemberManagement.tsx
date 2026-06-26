import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Phone, 
  Mail, 
  MapPin, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  UserX,
  CreditCard,
  PiggyBank,
  History,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Member, SavingsTransaction, Loan, LoanInstallment } from '../types';
import { getMemberSavingsBalance, formatRupiah } from '../storageUtils';

interface MemberManagementProps {
  members: Member[];
  savings: SavingsTransaction[];
  loans: Loan[];
  installments: LoanInstallment[];
  onAddMember: (newMember: Member, autoDeposit: boolean) => void;
  onEditMember: (updatedMember: Member) => void;
  showAddModalDirectly?: boolean;
  onCloseAddModalDirectly?: () => void;
}

export default function MemberManagement({
  members,
  savings,
  loans,
  installments,
  onAddMember,
  onEditMember,
  showAddModalDirectly = false,
  onCloseAddModalDirectly
}: MemberManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(showAddModalDirectly);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Forms states
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    nik: '',
    phone: '',
    address: '',
    email: '',
    autoDeposit: true // Setor pokok & admin otomatis
  });

  const [editMemberForm, setEditMemberForm] = useState<Member>({
    id: '',
    name: '',
    nik: '',
    phone: '',
    address: '',
    email: '',
    joinDate: '',
    status: 'active'
  });

  // Handle outside activation if triggered from parent
  React.useEffect(() => {
    if (showAddModalDirectly) {
      setIsAddModalOpen(true);
    }
  }, [showAddModalDirectly]);

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    if (onCloseAddModalDirectly) onCloseAddModalDirectly();
  };

  // Filter members
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.nik.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle Add Member Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name || !newMemberForm.nik) return;

    // Generate standard member ID e.g. KOP-0006
    const lastNum = members.length > 0 
      ? parseInt(members[members.length - 1].id.split('-')[1]) 
      : 0;
    const newId = `KOP-${String(lastNum + 1).padStart(4, '0')}`;

    const newMember: Member = {
      id: newId,
      name: newMemberForm.name,
      nik: newMemberForm.nik,
      phone: newMemberForm.phone || '-',
      address: newMemberForm.address || '-',
      email: newMemberForm.email || '-',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    onAddMember(newMember, newMemberForm.autoDeposit);
    
    // Reset form
    setNewMemberForm({
      name: '',
      nik: '',
      phone: '',
      address: '',
      email: '',
      autoDeposit: true
    });
    handleCloseAddModal();
  };

  // Handle Edit Member Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEditMember(editMemberForm);
    setIsEditModalOpen(false);
    // If the selected member was the one edited, update the view details
    if (selectedMember && selectedMember.id === editMemberForm.id) {
      setSelectedMember(editMemberForm);
    }
  };

  const openEditModal = (member: Member) => {
    setEditMemberForm(member);
    setIsEditModalOpen(true);
  };

  // Compute specific member figures
  const getMemberDetails = (memberId: string) => {
    const memberSavings = getMemberSavingsBalance(memberId, savings);
    const memberLoans = loans.filter(l => l.memberId === memberId);
    
    const activeLoan = memberLoans.find(l => l.status === 'active');
    const totalLoanAmount = memberLoans.reduce((sum, l) => sum + l.amount, 0);

    const historyTrans = savings
      .filter(s => s.memberId === memberId)
      .sort((a, b) => b.date.localeCompare(a.date));

    return {
      savings: memberSavings,
      loans: memberLoans,
      activeLoan,
      totalLoanAmount,
      history: historyTrans
    };
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight font-sans">
            Manajemen Anggota Koperasi
          </h1>
          <p className="text-xs text-slate-400">
            Daftar, edit, dan pantau status keuangan simpan pinjam dari setiap anggota aktif.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/10 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Registrasi Anggota Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, No ID, atau NIK..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl capitalize transition cursor-pointer ${
                statusFilter === filter
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent'
              }`}
            >
              {filter === 'all' ? 'Semua Status' : filter === 'active' ? 'Aktif' : 'Nonaktif'}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid/List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table/List of Members */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">No ID / Nama</th>
                  <th className="py-3.5 px-4">NIK & Kontak</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Gabung Sejak</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <tr 
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`hover:bg-indigo-50/30 transition cursor-pointer ${
                        selectedMember?.id === member.id ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded block w-max">
                          {member.id}
                        </span>
                        <span className="font-bold text-slate-800 mt-1 block">
                          {member.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-400 font-mono block text-[10px]">NIK: {member.nik}</span>
                        <span className="text-slate-500 block mt-0.5">{member.phone}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                          member.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {member.status === 'active' ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> Aktif
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Nonaktif
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-500">
                        {member.joinDate}
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditModal(member)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg hover:text-indigo-600 transition cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Tidak ada anggota koperasi ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Member Detailed Insights Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
          {selectedMember ? (
            (() => {
              const details = getMemberDetails(selectedMember.id);
              return (
                <div className="space-y-5">
                  {/* Title & Basic Identity */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        {selectedMember.id}
                      </span>
                      <h3 className="font-extrabold text-slate-800 text-base font-sans mt-1.5">
                        {selectedMember.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 block mt-0.5">NIK: {selectedMember.nik}</span>
                    </div>
                    <button
                      onClick={() => openEditModal(selectedMember)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Contact Info */}
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedMember.phone}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{selectedMember.email}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                      <span className="leading-relaxed">{selectedMember.address}</span>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Savings Summary */}
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-3">
                      <PiggyBank className="w-4 h-4 text-emerald-600" /> Rincian Simpanan Anggota
                    </h4>
                    <div className="bg-slate-50/80 rounded-xl p-3.5 space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Simpanan Pokok</span>
                        <span className="font-bold text-slate-800 font-mono">{formatRupiah(details.savings.pokok)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Simpanan Wajib</span>
                        <span className="font-bold text-slate-800 font-mono">{formatRupiah(details.savings.wajib)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Simpanan Sukarela</span>
                        <span className="font-bold text-slate-800 font-mono">{formatRupiah(details.savings.sukarela)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200/60 pt-2 font-bold">
                        <span className="text-slate-700">Total Simpanan</span>
                        <span className="text-emerald-600 font-mono">{formatRupiah(details.savings.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Loan Summary */}
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-3">
                      <CreditCard className="w-4 h-4 text-amber-600" /> Pinjaman Berjalan
                    </h4>
                    {details.activeLoan ? (
                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pokok Pinjaman</span>
                          <span className="font-bold text-slate-800 font-mono">{formatRupiah(details.activeLoan.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Bunga Per Bulan</span>
                          <span className="font-bold text-slate-800 font-mono">{details.activeLoan.interestRate}% Flat</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Angsuran Dibayar</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {details.activeLoan.installmentsPaid} / {details.activeLoan.tenor} Bulan
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-amber-200/50 pt-2 font-bold">
                          <span className="text-slate-700">Sisa Pokok</span>
                          <span className="text-amber-700 font-mono">{formatRupiah(details.activeLoan.remainingBalance)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-slate-50/50 rounded-xl text-slate-400 text-[11px]">
                        Anggota tidak memiliki pinjaman aktif saat ini
                      </div>
                    )}
                  </div>

                  {/* Transaction History Mini Log */}
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-2.5">
                      <History className="w-3.5 h-3.5 text-indigo-600" /> Log Transaksi Terbaru
                    </h4>
                    <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                      {details.history.length > 0 ? (
                        details.history.slice(0, 3).map((hist) => (
                          <div key={hist.id} className="flex justify-between items-center text-[11px] p-2 bg-slate-50 rounded-lg">
                            <div>
                              <span className="font-semibold text-slate-700 block">
                                {hist.transactionType === 'deposit' ? 'Setor' : 'Tarik'} {hist.type.toUpperCase()}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">{hist.date}</span>
                            </div>
                            <span className={`font-bold font-mono ${hist.transactionType === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {hist.transactionType === 'deposit' ? '+' : '-'}{formatRupiah(hist.amount)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-slate-400 text-[10px]">Belum ada mutasi tabungan</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-20 text-slate-400">
              <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-xs font-semibold">Pilih Anggota</p>
              <p className="text-[10px] mt-0.5">Klik salah satu baris anggota di samping untuk melihat rincian tabungan & pinjaman lengkap.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-indigo-950 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm">Registrasi Anggota Baru</h3>
                </div>
                <button 
                  onClick={handleCloseAddModal}
                  className="text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ahmad Hidayat"
                    value={newMemberForm.name}
                    onChange={(e) => setNewMemberForm({...newMemberForm, name: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Nomor Induk Kependudukan (NIK) *</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="16 Digit NIK KTP"
                    value={newMemberForm.nik}
                    onChange={(e) => setNewMemberForm({...newMemberForm, nik: e.target.value.replace(/\D/g, '')})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">No. Handphone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="Contoh: 0812345678"
                      value={newMemberForm.phone}
                      onChange={(e) => setNewMemberForm({...newMemberForm, phone: e.target.value})}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Alamat Email</label>
                    <input
                      type="email"
                      placeholder="ahmad@email.com"
                      value={newMemberForm.email}
                      onChange={(e) => setNewMemberForm({...newMemberForm, email: e.target.value})}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Alamat Rumah Lengkap</label>
                  <textarea
                    rows={2}
                    placeholder="Tulis alamat rumah domisili saat ini..."
                    value={newMemberForm.address}
                    onChange={(e) => setNewMemberForm({...newMemberForm, address: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs resize-none"
                  />
                </div>

                <div className="bg-indigo-50/60 rounded-xl p-3.5 border border-indigo-100 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="autoDeposit"
                    checked={newMemberForm.autoDeposit}
                    onChange={(e) => setNewMemberForm({...newMemberForm, autoDeposit: e.target.checked})}
                    className="mt-0.5 rounded focus:ring-indigo-500 text-indigo-600 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="autoDeposit" className="font-bold text-slate-800 block cursor-pointer">
                      Bayar Pokok Awal & Pendaftaran Otomatis
                    </label>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Sistem akan langsung mencatat setoran **Simpanan Pokok (Rp 200.000)** dan pemasukan **Admin Pendaftaran (Rp 25.000)** untuk mematuhi regulasi keuangan koperasi.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseAddModal}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-xl font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-indigo-600/15"
                  >
                    Daftarkan Anggota
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Member Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm">Edit Data Anggota ({editMemberForm.id})</h3>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editMemberForm.name}
                    onChange={(e) => setEditMemberForm({...editMemberForm, name: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">NIK</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={editMemberForm.nik}
                    onChange={(e) => setEditMemberForm({...editMemberForm, nik: e.target.value.replace(/\D/g, '')})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">No. Handphone</label>
                    <input
                      type="text"
                      value={editMemberForm.phone}
                      onChange={(e) => setEditMemberForm({...editMemberForm, phone: e.target.value})}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Alamat Email</label>
                    <input
                      type="email"
                      value={editMemberForm.email}
                      onChange={(e) => setEditMemberForm({...editMemberForm, email: e.target.value})}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Alamat Rumah</label>
                  <textarea
                    rows={2}
                    value={editMemberForm.address}
                    onChange={(e) => setEditMemberForm({...editMemberForm, address: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Status Keanggotaan</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditMemberForm({...editMemberForm, status: 'active'})}
                      className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1 border cursor-pointer transition ${
                        editMemberForm.status === 'active'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" /> Aktif
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMemberForm({...editMemberForm, status: 'inactive'})}
                      className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1 border cursor-pointer transition ${
                        editMemberForm.status === 'inactive'
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <UserX className="w-4 h-4" /> Nonaktif
                    </button>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-xl font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition cursor-pointer"
                  >
                    Simpan Perubahan
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
