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

  // กระเป๋าเงิน (ตัวที่แสดงบนหน้า/ส่งให้ Navbar)
  walletBalance = 0;
  // ทำให้ <app-user-navbar [balance]="balance"> ใช้ค่าจาก walletBalance เสมอ
  get balance(): number { return this.walletBalance; }

  transactions: Transaction[] = [];

  isTopupModalOpen = false;
  selectedAmount = 0;
  customAmount = '';
  quickAmounts: number[] = [100, 200, 500, 1000, 2000, 5000];
  transactionFilter: 'all' | 'topup' | 'purchase' = 'all';

  constructor(private router: Router, private api: ApiService) {}

  async ngOnInit() {
    await this.loadUserData();
    await this.refreshWallet();      // ← ดึงยอดล่าสุดจาก /api/Wallet/{userId}
    await this.loadTransactions();
  }

  imageUrl(fileName?: string | null): string {
    if (!fileName) return '';
    if (!/^https?:\/\//i.test(fileName)) {
      return `http://202.28.34.203:30000/upload/${fileName}`;
    }
    return fileName;
  }

  async loadUserData() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return;
    const cached = JSON.parse(userJson) as User;

    try {
      const profile = await this.api.me(cached.email);
      this.currentUser = profile;
      this.walletBalance = Number(profile.walletBalance || 0);
      localStorage.setItem('currentUser', JSON.stringify(profile));
    } catch {
      this.currentUser = cached;
      this.walletBalance = Number(cached.walletBalance || 0);
    }
  }

  // ✅ ดึงยอดกระเป๋าตามจริงจาก backend
  private async refreshWallet() {
    try {
      const uid = this.currentUser?.id;
      if (!uid) return;
      const w = await this.api.getWalletByUserId(uid); // -> { id,userId,balance }
      if (w && typeof w.balance !== 'undefined') {
        this.walletBalance = Number(w.balance);
        // sync currentUser ใน localStorage ด้วย
        const cu = this.currentUser ? { ...this.currentUser, walletBalance: this.walletBalance } : null;
        if (cu) {
          this.currentUser = cu as User;
          localStorage.setItem('currentUser', JSON.stringify(cu));
        }
      }
    } catch {
      // เงียบไว้ เพื่อไม่ให้หน้าแตกถ้าเรียกไม่สำเร็จ
    }
  }

  async loadTransactions(): Promise<void> {
    try {
      const user = this.currentUser ?? JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!user?.email) { this.transactions = []; return; }
      const list = await this.api.getTransactionsByUser(user.email);
      this.transactions = (list ?? []).sort(
        (a: Transaction, b: Transaction) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch {
      this.transactions = [];
    }
  }

  // 💰 เติมเงิน (เชื่อม backend)
  async confirmTopup(): Promise<void> {
    if (this.selectedAmount <= 0) { alert('กรุณาเลือกจำนวนเงินที่ต้องการเติม'); return; }
    if (!this.currentUser) { alert('ไม่พบข้อมูลผู้ใช้'); return; }

    try {
      // เรียก /api/Wallet/topup
      const result = await this.api.topup(this.currentUser.id, this.selectedAmount);
      // บางเคส backend ส่ง { balance } หรือ { Balance } ให้รองรับทั้งคู่
      const newBalance = Number(result.balance ?? result.Balance ?? this.walletBalance);
      this.walletBalance = newBalance;
      this.currentUser.walletBalance = newBalance;
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      alert(`เติมเงินสำเร็จ! ยอดเงินใหม่: ฿${this.walletBalance.toLocaleString()}`);
      this.closeTopupModal();

      // ดึงยอดกระเป๋าล่าสุดจาก /api/Wallet/{userId} เพื่อความชัวร์
      await this.refreshWallet();
      await this.loadTransactions();
    } catch (err) {
      console.error('Topup error', err);
      alert('เติมเงินไม่สำเร็จ ❌');
    }
  }

  // ---------- Modal ----------
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
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) this.closeTopupModal();
  }
  selectQuickAmount(amount: number): void {
    this.selectedAmount = amount; this.customAmount = '';
  }
  onCustomAmountChange(): void {
    const amount = parseInt(this.customAmount, 10);
    this.selectedAmount = !isNaN(amount) && amount > 0 ? amount : 0;
  }

  // ---------- Auth ----------
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

  // ---------- UI helpers ----------
  get filteredTransactions(): Transaction[] {
    if (this.transactionFilter === 'all') return this.transactions;
    return this.transactions.filter(t => t.type === this.transactionFilter);
  }
  setFilter(filter: 'all' | 'topup' | 'purchase'): void { this.transactionFilter = filter; }
  getTransactionIcon(type: string): string { return type === 'topup' ? '💰' : '🎮'; }
  getTransactionClass(type: string): string { return type === 'topup' ? 'transaction-topup' : 'transaction-purchase'; }
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('th-TH', options);
  }
  formatCurrency(amount: number): string {
    return amount.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  get totalTopups(): number {
    return this.transactions.filter(t => t.type === 'topup').reduce((s, t) => s + t.amount, 0);
  }
  get totalPurchases(): number {
    return this.transactions.filter(t => t.type === 'purchase').reduce((s, t) => s + t.amount, 0);
  }
}
