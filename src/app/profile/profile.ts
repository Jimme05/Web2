import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/service';
import { UserNavbar } from "../user-navbar/user-navbar";

interface User {
  id: number;
  name: string;
  email: string;
  profileImage: string | null;
  role: string;
  walletBalance: number;
  ownedGames: string[];
  createdAt: string;
}

interface Transaction {
  id: number;
  userId: number;
  type: 'topup' | 'purchase';
  amount: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
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
  currentUser: User | null = null;
  walletBalance = 0;
  transactions: Transaction[] = [];

  isTopupModalOpen = false;
  selectedAmount = 0;
  customAmount = '';
  quickAmounts: number[] = [100, 200, 500, 1000, 2000, 5000];
  transactionFilter: 'all' | 'topup' | 'purchase' = 'all';

  constructor(private router: Router, private api: ApiService) { }

  async ngOnInit() {
    await this.loadUserData();
    await this.loadTransactions();
  }

  // =====================
  // 🎯 รูปโปรไฟล์จากเซิร์ฟเวอร์ 203
  // =====================
  imageUrl(fileName?: string | null): string {
    if (!fileName) return '';
    if (!/^https?:\/\//i.test(fileName)) {
      return `http://202.28.34.203:30000/upload/${fileName}`;
    }
    return fileName;
  }

  // =====================
  // 👤 โหลดข้อมูลผู้ใช้
  // =====================
  async loadUserData() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return;

    const cached = JSON.parse(userJson) as User;
    try {
      const profile = await this.api.me(cached.email);
      this.currentUser = profile;
      this.walletBalance = profile.walletBalance || 0;
      localStorage.setItem('currentUser', JSON.stringify(profile));
    } catch (err) {
      console.error('โหลดข้อมูลผู้ใช้ไม่สำเร็จ', err);
      this.currentUser = cached;
      this.walletBalance = cached.walletBalance || 0;
    }
  }

  // =====================
  // 📜 โหลดประวัติธุรกรรมจาก API
  // =====================
  async loadTransactions(): Promise<void> {
    try {
      const user = this.currentUser ?? JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!user?.email) {
        this.transactions = [];
        return;
      }
      const list = await this.api.getTransactionsByUser(user.email);
      this.transactions = (list ?? []).sort(
        (a: Transaction, b: Transaction) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (e) {
      console.error('โหลดประวัติธุรกรรมไม่สำเร็จ', e);
      this.transactions = [];
    }
  }

  // =====================
  // 💰 เติมเงิน (เชื่อม backend)
  // =====================
  async confirmTopup(): Promise<void> {
    if (this.selectedAmount <= 0) {
      alert('กรุณาเลือกจำนวนเงินที่ต้องการเติม');
      return;
    }
    if (!this.currentUser) {
      alert('ไม่พบข้อมูลผู้ใช้');
      return;
    }

    try {
      const result = await this.api.topup(this.currentUser.id, this.selectedAmount);

      this.walletBalance = result.balance;
      if (this.currentUser) this.currentUser.walletBalance = result.balance;
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      alert(`เติมเงินสำเร็จ! ยอดเงินใหม่: ฿${this.walletBalance.toLocaleString()}`);
      this.closeTopupModal();
      await this.loadTransactions();
    } catch (err: any) {
      console.error('Topup error', err);
      alert('เติมเงินไม่สำเร็จ ❌');
    }
  }



  // =====================
  // Modal controls
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

  // =====================
  // 🔒 LOGOUT
  // =====================
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
  // 📜 TRANSACTION UI HELPERS
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
  // =====================
  // 📊 รวมยอดเติมเงิน / ซื้อเกมทั้งหมด
  // =====================
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

}
