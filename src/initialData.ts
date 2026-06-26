import { Member, SavingsTransaction, Loan, LoanInstallment, CashFlowTransaction } from './types';

export const initialMembers: Member[] = [
  {
    id: "KOP-0001",
    name: "Budi Santoso",
    nik: "3171012345670001",
    phone: "081234567890",
    address: "Jl. Merdeka No. 10, Jakarta Pusat",
    email: "budi.santoso@email.com",
    joinDate: "2026-01-15",
    status: "active"
  },
  {
    id: "KOP-0002",
    name: "Siti Aminah",
    nik: "3171023456780002",
    phone: "082345678901",
    address: "Jl. Mawar Gg. 5 No. 12, Jakarta Barat",
    email: "siti.aminah@email.com",
    joinDate: "2026-02-10",
    status: "active"
  },
  {
    id: "KOP-0003",
    name: "Dewi Lestari",
    nik: "3171034567890003",
    phone: "083456789012",
    address: "Perum Indah Blok C3, Tangerang",
    email: "dewi.lestari@email.com",
    joinDate: "2026-03-01",
    status: "active"
  },
  {
    id: "KOP-0004",
    name: "Ahmad Hidayat",
    nik: "3171045678900004",
    phone: "084567890123",
    address: "Jl. Kebon Jeruk No. 45, Jakarta Barat",
    email: "ahmad.hidayat@email.com",
    joinDate: "2026-04-05",
    status: "active"
  },
  {
    id: "KOP-0005",
    name: "Bambang Wijaya",
    nik: "3171056789010005",
    phone: "085678901234",
    address: "Jl. Sudirman Kav 21, Jakarta Selatan",
    email: "bambang.wijaya@email.com",
    joinDate: "2026-05-12",
    status: "active"
  }
];

export const initialSavings: SavingsTransaction[] = [
  // KOP-0001 - Budi Santoso
  { id: "SAV-0001", memberId: "KOP-0001", date: "2026-01-15", type: "pokok", amount: 200000, transactionType: "deposit", notes: "Simpanan Pokok Awal" },
  { id: "SAV-0002", memberId: "KOP-0001", date: "2026-01-15", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Jan" },
  { id: "SAV-0003", memberId: "KOP-0001", date: "2026-02-15", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Feb" },
  { id: "SAV-0004", memberId: "KOP-0001", date: "2026-02-20", type: "sukarela", amount: 500000, transactionType: "deposit", notes: "Tabungan Sukarela Tambahan" },
  { id: "SAV-0005", memberId: "KOP-0001", date: "2026-03-15", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Mar" },
  { id: "SAV-0006", memberId: "KOP-0001", date: "2026-04-15", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Apr" },
  { id: "SAV-0007", memberId: "KOP-0001", date: "2026-05-15", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Mei" },
  { id: "SAV-0008", memberId: "KOP-0001", date: "2026-05-25", type: "sukarela", amount: 200000, transactionType: "withdrawal", notes: "Penarikan Sukarela Darurat" },
  { id: "SAV-0009", memberId: "KOP-0001", date: "2026-06-15", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Jun" },

  // KOP-0002 - Siti Aminah
  { id: "SAV-0010", memberId: "KOP-0002", date: "2026-02-10", type: "pokok", amount: 200000, transactionType: "deposit", notes: "Simpanan Pokok Awal" },
  { id: "SAV-0011", memberId: "KOP-0002", date: "2026-02-10", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Feb" },
  { id: "SAV-0012", memberId: "KOP-0002", date: "2026-03-10", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Mar" },
  { id: "SAV-0013", memberId: "KOP-0002", date: "2026-04-10", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Apr" },
  { id: "SAV-0014", memberId: "KOP-0002", date: "2026-04-18", type: "sukarela", amount: 1000000, transactionType: "deposit", notes: "Titip Sukarela Bonus Usaha" },
  { id: "SAV-0015", memberId: "KOP-0002", date: "2026-05-10", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Mei" },
  { id: "SAV-0016", memberId: "KOP-0002", date: "2026-06-10", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Jun" },

  // KOP-0003 - Dewi Lestari
  { id: "SAV-0017", memberId: "KOP-0003", date: "2026-03-01", type: "pokok", amount: 200000, transactionType: "deposit", notes: "Simpanan Pokok Awal" },
  { id: "SAV-0018", memberId: "KOP-0003", date: "2026-03-01", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Mar" },
  { id: "SAV-0019", memberId: "KOP-0003", date: "2026-04-01", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Apr" },
  { id: "SAV-0020", memberId: "KOP-0003", date: "2026-05-01", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Mei" },
  { id: "SAV-0021", memberId: "KOP-0003", date: "2026-06-01", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Jun" },
  { id: "SAV-0022", memberId: "KOP-0003", date: "2026-06-18", type: "sukarela", amount: 300000, transactionType: "deposit", notes: "Setoran Sukarela" },

  // KOP-0004 - Ahmad Hidayat
  { id: "SAV-0023", memberId: "KOP-0004", date: "2026-04-05", type: "pokok", amount: 200000, transactionType: "deposit", notes: "Simpanan Pokok Awal" },
  { id: "SAV-0024", memberId: "KOP-0004", date: "2026-04-05", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Apr" },
  { id: "SAV-0025", memberId: "KOP-0004", date: "2026-05-05", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Mei" },
  { id: "SAV-0026", memberId: "KOP-0004", date: "2026-06-05", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Jun" },

  // KOP-0005 - Bambang Wijaya
  { id: "SAV-0027", memberId: "KOP-0005", date: "2026-05-12", type: "pokok", amount: 200000, transactionType: "deposit", notes: "Simpanan Pokok Awal" },
  { id: "SAV-0028", memberId: "KOP-0005", date: "2026-05-12", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Mei" },
  { id: "SAV-0029", memberId: "KOP-0005", date: "2026-06-12", type: "wajib", amount: 50000, transactionType: "deposit", notes: "Simpanan Wajib Jun" }
];

export const initialLoans: Loan[] = [
  {
    id: "PIN-0001",
    memberId: "KOP-0001",
    amount: 5000000,
    interestRate: 1, // 1% per bulan flat
    tenor: 10, // 10 bulan
    purpose: "Modal Tambahan Warung Kelontong",
    dateRequested: "2026-02-18",
    dateApproved: "2026-02-20",
    status: "active",
    installmentsPaid: 4, // Sudah bayar 4 kali (Maret, April, Mei, Juni)
    remainingBalance: 3000000 // 5jt - (500rb * 4) = sisa pokok 3jt
  },
  {
    id: "PIN-0002",
    memberId: "KOP-0002",
    amount: 10000000,
    interestRate: 1.2, // 1.2% per bulan flat
    tenor: 12, // 12 bulan
    purpose: "Biaya Pendidikan Anak Sekolah Tinggi",
    dateRequested: "2026-04-10",
    dateApproved: "2026-04-12",
    status: "active",
    installmentsPaid: 2, // Sudah bayar 2 kali (Mei, Juni)
    remainingBalance: 8333334 // 10jt - (833.333 * 2) = sisa pokok 8.33jt
  },
  {
    id: "PIN-0003",
    memberId: "KOP-0003",
    amount: 3000000,
    interestRate: 1,
    tenor: 6,
    purpose: "Perbaikan Atap Rumah Bocor",
    dateRequested: "2026-05-28",
    dateApproved: "2026-06-01",
    status: "active",
    installmentsPaid: 0, // Belum bayar (jatuh tempo Juli)
    remainingBalance: 3000000
  },
  {
    id: "PIN-0004",
    memberId: "KOP-0004",
    amount: 2000000,
    interestRate: 1,
    tenor: 5,
    purpose: "Beli Laptop Bekas untuk Anak Kuliah",
    dateRequested: "2026-06-20",
    status: "pending",
    installmentsPaid: 0,
    remainingBalance: 2000000
  }
];

export const initialInstallments: LoanInstallment[] = [
  // PIN-0001 (Budi Santoso, Pokok: 500rb, Bunga: 5jt * 1% = 50rb. Total: 550rb)
  { id: "INS-0001", loanId: "PIN-0001", memberId: "KOP-0001", date: "2026-03-20", installmentNumber: 1, amountPaid: 550000, principalPaid: 500000, interestPaid: 50000, notes: "Angsuran ke-1 PIN-0001" },
  { id: "INS-0002", loanId: "PIN-0001", memberId: "KOP-0001", date: "2026-04-20", installmentNumber: 2, amountPaid: 550000, principalPaid: 500000, interestPaid: 50000, notes: "Angsuran ke-2 PIN-0001" },
  { id: "INS-0003", loanId: "PIN-0001", memberId: "KOP-0001", date: "2026-05-20", installmentNumber: 3, amountPaid: 550000, principalPaid: 500000, interestPaid: 50000, notes: "Angsuran ke-3 PIN-0001" },
  { id: "INS-0004", loanId: "PIN-0001", memberId: "KOP-0001", date: "2026-06-20", installmentNumber: 4, amountPaid: 550000, principalPaid: 500000, interestPaid: 50000, notes: "Angsuran ke-4 PIN-0001" },

  // PIN-0002 (Siti Aminah, Pokok: 833.333, Bunga: 10jt * 1.2% = 120rb. Total: 953.333)
  { id: "INS-0005", loanId: "PIN-0002", memberId: "KOP-0002", date: "2026-05-12", installmentNumber: 1, amountPaid: 953333, principalPaid: 833333, interestPaid: 120000, notes: "Angsuran ke-1 PIN-0002" },
  { id: "INS-0006", loanId: "PIN-0002", memberId: "KOP-0002", date: "2026-06-12", installmentNumber: 2, amountPaid: 953333, principalPaid: 833333, interestPaid: 120000, notes: "Angsuran ke-2 PIN-0002" }
];

export const initialCashFlow: CashFlowTransaction[] = [
  // Income (selain bunga dari angsuran yang dihitung dinamis)
  { id: "CSH-0001", date: "2026-01-15", type: "income", category: "admin_pendaftaran", amount: 25000, notes: "Biaya pendaftaran Anggota KOP-0001" },
  { id: "CSH-0002", date: "2026-02-10", type: "income", category: "admin_pendaftaran", amount: 25000, notes: "Biaya pendaftaran Anggota KOP-0002" },
  { id: "CSH-0003", date: "2026-03-01", type: "income", category: "admin_pendaftaran", amount: 25000, notes: "Biaya pendaftaran Anggota KOP-0003" },
  { id: "CSH-0004", date: "2026-04-05", type: "income", category: "admin_pendaftaran", amount: 25000, notes: "Biaya pendaftaran Anggota KOP-0004" },
  { id: "CSH-0005", date: "2026-05-12", type: "income", category: "admin_pendaftaran", amount: 25000, notes: "Biaya pendaftaran Anggota KOP-0005" },

  // Expenses
  { id: "CSH-0006", date: "2026-01-31", type: "expense", category: "operasional", amount: 35000, notes: "Pembelian Buku Kas & Alat Tulis" },
  { id: "CSH-0007", date: "2026-02-28", type: "expense", category: "perlengkapan", amount: 120000, notes: "Cetak Buku Tabungan Anggota" },
  { id: "CSH-0008", date: "2026-03-31", type: "expense", category: "operasional", amount: 50000, notes: "Konsumsi Rapat Pengurus Bulanan" },
  { id: "CSH-0009", date: "2026-04-30", type: "expense", category: "operasional", amount: 50000, notes: "Konsumsi Rapat Pengurus Bulanan" },
  { id: "CSH-0010", date: "2026-05-31", type: "expense", category: "gaji", amount: 300000, notes: "Insentif Pengurus Kasir Bulanan Mei" },
  { id: "CSH-0011", date: "2026-06-15", type: "expense", category: "operasional", amount: 75000, notes: "Biaya internet & pulsa operasional" }
];
