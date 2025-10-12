import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/service';
import { UserNavbar } from "../user-navbar/user-navbar";

interface User {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  role: string;
  walletBalance: number;
  ownedGames: string[];
  createdAt: string;
}

interface Transaction {
  id: string;
  userId: string | number;
  type: 'topup' | 'purchase';
  amount: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  gamesPurchased?: string[];
  createdAt: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UserNavbar],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile {
  balance = 5000;
  currentUser: User | null = null;

  walletBalance = 0;
  transactions: Transaction[] = [];
  isTopupModalOpen = false;
  selectedAmount = 0;
  customAmount = '';
  quickAmounts: number[] = [100, 200, 500, 1000, 2000, 5000];
  transactionFilter: 'all' | 'topup' | 'purchase' = 'all';

  constructor(private router: Router, private api: ApiService) {}

  async ngOnInit() {
    await this.loadUserData();
    await this.loadTransactions(); // ← ดึงจาก backend
  }

  // 🎯 รูปโปรไฟล์จากเซิร์ฟเวอร์ 203 (โฟลเดอร์ /upload)
  imageUrl(fileName?: string | null): string {
    if (!fileName) return '';
    // ถ้าหลังบ้านเก็บแค่ชื่อไฟล์ เช่น "abc.jpg"
    if (!/^https?:\/\//i.test(fileName)) {
      return `http://202.28.34.203:30000/upload/${fileName}`;
    }
    // ถ้าเป็น URL เต็มอยู่แล้ว
    return fileName;
  }

  // ✅ โหลดข้อมูลผู้ใช้ (ใช้ email ที่เก็บไว้ตอนล็อกอิน)
  async loadUserData() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return;

    const cached = JSON.parse(userJson) as User;
    try {
      const profile = await this.api.me(cached.email);
      this.currentUser = profile;
      this.walletBalance = profile.walletBalance || 0;
      localStorage.setItem('currentUser', JSON.stringify(profile)); // sync ล่าสุด
    } catch (err: any) {
      console.error('โหลดข้อมูลผู้ใช้ไม่สำเร็จ', err);
      this.currentUser = cached; // fallback
      this.walletBalance = cached.walletBalance || 0;
    }
  }

  // 📜 โหลดประวัติธุรกรรมจาก API
  async loadTransactions(): Promise<void> {
    try {
      const user = this.currentUser ?? JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!user?.email) {
        this.transactions = [];
        return;
      }
      // ใช้ endpoint: GET /api/Transactions/by-user?email=...
      const list = await this.api.getTransactionsByUser(user.email);
      // เรียงใหม่ -> ล่าสุดก่อน (ถ้าหลังบ้านไม่เรียงมาให้)
      this.transactions = (list ?? []).sort(
        (a: Transaction, b: Transaction) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (e) {
      console.error('โหลดประวัติธุรกรรมไม่สำเร็จ', e);
      this.transactions = [];
    }
  }

  // 🔒 LOGOUT
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    localStorage.removeItem('transactions');
    localStorage.removeItem('walletBalance');
    alert('ออกจากระบบเรียบร้อย ✅');
    this.router.navigate(['/']);
  }

  async goToEditProfile() {
    await this.router.navigate(['/edit-profile']);
  }

  // =====================
  // 📜 TRANSACTIONS (UI helpers)
  // =====================
  get filteredTransactions(): Transaction[] {
    if (this.transactionFilter === 'all') return this.transactions;
    return this.transactions.filter(t => t.type === this.transactionFilter);
  }

  setFilter(filter: 'all' | 'topup' | 'purchase'): void {
    this.transactionFilter = filter;
  }

  getTransactionIcon(type: string): string {
    return type === 'topup' ? '💰' : '🎮';
  }

  getTransactionClass(type: string): string {
    return type === 'topup' ? 'transaction-topup' : 'transaction-purchase';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('th-TH', options);
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  get totalTopups(): number {
    return this.transactions
      .filter(t => t.type === 'topup')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  get totalPurchases(): number {
    return this.transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  // =====================
  // 💰 MODAL / WALLET / TRANSACTION (ฝั่ง client เดิม)
  // =====================
  openTopupModal(): void {
    this.isTopupModalOpen = true;
    this.selectedAmount = 0;
    this.customAmount = '';
    document.body.style.overflow = 'hidden';
  }

  closeTopupModal(): void {
    this.isTopupModalOpen = false;
    this.selectedAmount = 0;
    this.customAmount = '';
    document.body.style.overflow = 'auto';
  }

  closeModalOnOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeTopupModal();
    }
  }

  selectQuickAmount(amount: number): void {
    this.selectedAmount = amount;
    this.customAmount = '';
  }

  onCustomAmountChange(): void {
    const amount = parseInt(this.customAmount);
    this.selectedAmount = !isNaN(amount) && amount > 0 ? amount : 0;
  }

  confirmTopup(): void {
    if (this.selectedAmount <= 0) {
      alert('กรุณาเลือกจำนวนเงินที่ต้องการเติม');
      return;
    }
    if (!this.currentUser) {
      alert('ไม่พบข้อมูลผู้ใช้');
      return;
    }

    const balanceBefore = this.walletBalance;
    const balanceAfter = balanceBefore + this.selectedAmount;

    const tx: Transaction = {
      id: Date.now().toString(),
      userId: this.currentUser.id,
      type: 'topup',
      amount: this.selectedAmount,
      description: `เติมเงินจำนวน ฿${this.selectedAmount.toLocaleString()}`,
      balanceBefore,
      balanceAfter,
      createdAt: new Date().toISOString()
    };

    this.walletBalance = balanceAfter;
    this.currentUser.walletBalance = balanceAfter;

    // (ถ้าต้องการ บันทึก localStorage ชั่วคราว)
    // const localTx = JSON.parse(localStorage.getItem('transactions') || '[]');
    // localTx.push(tx);
    // localStorage.setItem('transactions', JSON.stringify(localTx));

    alert(`เติมเงินสำเร็จ! ฿${this.selectedAmount.toLocaleString()}`);
    this.closeTopupModal();

    // โหลดประวัติใหม่จาก backend (ถ้ามีทำ topup API จริง ให้ call แล้วค่อยรีเฟรช)
    this.loadTransactions();
  }
}
