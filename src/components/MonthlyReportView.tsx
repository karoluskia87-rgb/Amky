import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Calendar, 
  Printer, 
  Download, 
  Upload, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Info,
  Shield,
  Briefcase,
  PiggyBank,
  HandCoins,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { CooperativeState, generateMonthlyReport, formatRupiah } from '../storageUtils';

interface MonthlyReportViewProps {
  state: CooperativeState;
  onImportState: (importedState: CooperativeState) => void;
}

export default function MonthlyReportView({
  state,
  onImportState
}: MonthlyReportViewProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const years = [2025, 2026, 2027, 2028];

  // Generate Report
  const report = generateMonthlyReport(selectedMonth, selectedYear, state);

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Export database state to JSON file
  const handleExportState = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `koperasi_database_backup_${selectedYear}_${selectedMonth}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import database state from JSON file
  const handleImportState = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess(false);
    
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Basic schema validations
        if (parsed.members && parsed.savings && parsed.loans && parsed.installments && parsed.cashFlow) {
          onImportState(parsed);
          setImportSuccess(true);
          // clear input value
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          setImportError('File JSON tidak valid. Skema database koperasi simpan pinjam tidak cocok.');
        }
      } catch (err) {
        setImportError('Gagal membaca file JSON. Pastikan format file benar.');
      }
    };
    fileReader.readAsText(files[0]);
  };

  return (
    <div className="space-y-6">
      {/* Configuration & Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-xs no-print">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase">Periode Laporan:</span>
          </div>
          
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
          >
            {monthNames.map((name, index) => (
              <option key={index} value={index + 1}>{name}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan
          </button>
          <button
            onClick={handleExportState}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-medium text-xs px-4 py-2 rounded-xl transition cursor-pointer"
            title="Ekspor seluruh database ke file JSON"
          >
            <Download className="w-4 h-4" /> Cadangkan Basis Data
          </button>
          
          {/* Hidden file input for import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportState}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-medium text-xs px-4 py-2 rounded-xl transition cursor-pointer"
            title="Pulihkan database dari file JSON"
          >
            <Upload className="w-4 h-4" /> Pulihkan Data
          </button>
        </div>
      </div>

      {/* Alerts for Import feedback */}
      {importError && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-center gap-2 no-print">
          <AlertCircle className="w-4 h-4" />
          <span>{importError}</span>
        </div>
      )}
      {importSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs flex items-center gap-2 no-print">
          <Shield className="w-4 h-4" />
          <span>Database berhasil dipulihkan dari cadangan eksternal! Halaman di-refresh.</span>
        </div>
      )}

      {/* The Printable Financial Report */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm print-card space-y-8">
        
        {/* Report Header */}
        <div className="text-center pb-6 border-b border-slate-100">
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest no-print">
            Laporan Keuangan Otomatis
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 font-sans mt-3">
            LAPORAN BULANAN KOPERASI SIMPAN PINJAM
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Periode Bulan: {monthNames[selectedMonth - 1]} {selectedYear}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 italic">
            Dihasilkan secara otomatis oleh sistem akuntansi koperasi per {new Date().toLocaleDateString('id-ID')}
          </p>
        </div>

        {/* NERACA KEUANGAN (BALANCE SHEET) */}
        <div className="space-y-4">
          <h3 className="text-xs font-black bg-slate-900 text-white px-3 py-1.5 rounded-lg font-sans tracking-wider uppercase">
            I. NERACA KEUANGAN (ASSETS, LIABILITIES & EQUITY)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: AKTIVA (Assets) */}
            <div className="border border-slate-150 rounded-2xl overflow-hidden flex flex-col justify-between">
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 font-bold text-slate-700 text-xs flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-600" /> AKTIVA (Harta Kekayaan)
              </div>
              <div className="p-4 space-y-4 text-xs flex-1">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-800 block">Saldo Kas / Bank Koperasi</span>
                    <span className="text-[10px] text-slate-400">Kas kasir + dana mengendap</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">{formatRupiah(report.cashBalance)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-800 block">Piutang Pinjaman Anggota</span>
                    <span className="text-[10px] text-slate-400">Outstanding pinjaman beredar di lapangan</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">{formatRupiah(report.outstandingLoans)}</span>
                </div>
              </div>
              <div className="bg-slate-50/75 border-t border-slate-150 px-4 py-3 font-bold text-slate-800 text-xs flex justify-between">
                <span>TOTAL AKTIVA (ASET)</span>
                <span className="font-mono text-indigo-700">{formatRupiah(report.totalAssets)}</span>
              </div>
            </div>

            {/* Right Column: PASIVA (Liabilities & Equity) */}
            <div className="border border-slate-150 rounded-2xl overflow-hidden flex flex-col justify-between">
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 font-bold text-slate-700 text-xs flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4 text-emerald-600" /> PASIVA (Kewajiban & Ekuitas)
              </div>
              <div className="p-4 space-y-3 text-xs flex-1">
                {/* Liabilities */}
                <div className="space-y-1.5 pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-500 text-[10px] block uppercase">A. KEWAJIBAN (Simpanan Anggota)</span>
                  <div className="flex justify-between pl-2">
                    <span className="text-slate-600">1. Simpanan Pokok</span>
                    <span className="font-mono text-slate-700">{formatRupiah(report.totalSavings.pokok)}</span>
                  </div>
                  <div className="flex justify-between pl-2">
                    <span className="text-slate-600">2. Simpanan Wajib</span>
                    <span className="font-mono text-slate-700">{formatRupiah(report.totalSavings.wajib)}</span>
                  </div>
                  <div className="flex justify-between pl-2">
                    <span className="text-slate-600">3. Simpanan Sukarela</span>
                    <span className="font-mono text-slate-700">{formatRupiah(report.totalSavings.sukarela)}</span>
                  </div>
                </div>

                {/* Equity */}
                <div className="space-y-1 pt-1">
                  <span className="font-bold text-slate-500 text-[10px] block uppercase">B. EKUITAS (Modal Sendiri)</span>
                  <div className="flex justify-between pl-2">
                    <div>
                      <span className="text-slate-600 block">Cadangan Koperasi & SHU Ditahan</span>
                      <span className="text-[9px] text-slate-400">Modal akumulatif + SHU berjalan</span>
                    </div>
                    <span className="font-mono text-slate-700 font-semibold">{formatRupiah(report.totalEquity)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50/75 border-t border-slate-150 px-4 py-3 font-bold text-slate-800 text-xs flex justify-between">
                <span>TOTAL PASIVA (KEWAJIBAN + MODAL)</span>
                <span className="font-mono text-indigo-700">{formatRupiah(report.totalSavings.total + report.totalEquity)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* LAPORAN LABA RUGI / SHU */}
        <div className="space-y-4">
          <h3 className="text-xs font-black bg-slate-900 text-white px-3 py-1.5 rounded-lg font-sans tracking-wider uppercase">
            II. LAPORAN LABA RUGI / SHU (PROFIT & LOSS STATEMENT)
          </h3>

          <div className="border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-150">
            {/* Income breakdown */}
            <div className="p-4 space-y-3.5 text-xs">
              <span className="font-extrabold text-indigo-950 text-xs block flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> PENDAPATAN OPERASIONAL (INCOME)
              </span>
              <div className="space-y-2 pl-3">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-600">1. Pendapatan Bunga Jasa Pinjaman Anggota</span>
                  <span className="font-mono text-slate-800 font-semibold">{formatRupiah(report.income.interest)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-600">2. Pendapatan Biaya Administrasi Pendaftaran Anggota</span>
                  <span className="font-mono text-slate-800 font-semibold">{formatRupiah(report.income.admin)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-600">3. Pendapatan Usaha Lainnya</span>
                  <span className="font-mono text-slate-800 font-semibold">{formatRupiah(report.income.other)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 pt-1">
                  <span>TOTAL PENDAPATAN KOPERASI</span>
                  <span className="font-mono text-emerald-600">{formatRupiah(report.income.total)}</span>
                </div>
              </div>
            </div>

            {/* Expense breakdown */}
            <div className="p-4 space-y-3.5 text-xs">
              <span className="font-extrabold text-indigo-950 text-xs block flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-rose-500" /> BIAYA & OPERASIONAL (EXPENSES)
              </span>
              <div className="space-y-2 pl-3">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-600">1. Beban Operasional Kantor & Rapat Pengurus</span>
                  <span className="font-mono text-slate-800 font-semibold">{formatRupiah(report.expenses.operational)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-600">2. Beban Insentif & Gaji Pengurus Bulanan</span>
                  <span className="font-mono text-slate-800 font-semibold">{formatRupiah(report.expenses.salary)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-600">3. Beban Perlengkapan & Penyusutan Alat</span>
                  <span className="font-mono text-slate-800 font-semibold">{formatRupiah(report.expenses.other)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 pt-1">
                  <span>TOTAL BIAYA OPERASIONAL</span>
                  <span className="font-mono text-rose-600">{formatRupiah(report.expenses.total)}</span>
                </div>
              </div>
            </div>

            {/* Net SHU result */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold font-sans tracking-wide">SISA HASIL USAHA (SHU) / LABA BERSIH BULANAN</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Bunga Pinjaman + Admin Pendaftaran dikurangi Beban Pengurus
                </span>
              </div>
              <span className={`text-lg font-black font-mono ${report.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {report.netProfit >= 0 ? '+' : ''}{formatRupiah(report.netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Signatures for Print Presentation */}
        <div className="grid grid-cols-2 gap-12 pt-16 text-center text-xs text-slate-600">
          <div>
            <p>Dipersiapkan Oleh,</p>
            <p className="font-bold text-slate-800 mt-16">PENGURUS / BENDAHARA KOPERASI</p>
            <p className="text-[10px] text-slate-400 mt-1">Sistem Administrasi Koperasi</p>
          </div>
          <div>
            <p>Disetujui Oleh,</p>
            <p className="font-bold text-slate-800 mt-16">KETUA KOPERASI SIMPAN PINJAM</p>
            <p className="text-[10px] text-slate-400 mt-1">Dewan Pengawas Utama</p>
          </div>
        </div>
      </div>
    </div>
  );
}
