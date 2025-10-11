import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/service'; // ✅ import ApiService
import { environment } from '../services/environment';
import { UserNavbar } from "../user-navbar/user-navbar";

interface User {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  role: string;
  walletBalance: number;
  ownedGames: string[];
  createdAt: string;
}

interface Transaction {
  id: string;
  userId: string;
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

  walletBalance: number = 0;
  transactions: Transaction[] = [];
  isTopupModalOpen: boolean = false;
  selectedAmount: number = 0;
  customAmount: string = '';
  quickAmounts: number[] = [100, 200, 500, 1000, 2000, 5000];
  transactionFilter: 'all' | 'topup' | 'purchase' = 'all';

  constructor(private router: Router, private api: ApiService) {}

  async ngOnInit() {
    await this.loadUserData();
    this.loadTransactions();
  }
  imageUrl(fileName?: string | null): string {
  if (!fileName) return '';
  // ถ้า backend เก็บเป็น "profile/xxxx.jpg" หรือ "/profile/xxxx.jpg" ก็ normalize ไว้
  const path = fileName.startsWith('/') ? fileName : `/profile/${fileName}`;
  return `${environment.apiOrigin}${path}`;
}


  // ✅ ดึงข้อมูลผู้ใช้จาก API (ใช้ email ที่เก็บไว้ตอน login)
  async loadUserData() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return;

    const user = JSON.parse(userJson) as User;
    try {
      const profile = await this.api.me(user.email);
      this.currentUser = profile;
      this.walletBalance = profile.walletBalance || 0;

      // sync localStorage ให้เป็นข้อมูลล่าสุด
      localStorage.setItem('currentUser', JSON.stringify(profile));
    } catch (err: any) {
      console.error('โหลดข้อมูลผู้ใช้ไม่สำเร็จ', err);
      this.currentUser = user; // fallback ใช้ข้อมูลเดิม
      this.walletBalance = user.walletBalance || 0;
    }
  }

  loadTransactions(): void {
    const transactionsJson = localStorage.getItem('transactions');
    if (transactionsJson) {
      const allTransactions: Transaction[] = JSON.parse(transactionsJson);
      this.transactions = allTransactions
        .filter(t => t.userId === this.currentUser?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
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

  // ... (ส่วนอื่น ๆ: wallet, transaction, modal, format) คงเดิม ...
  
  async goToEditProfile() {
    await this.router.navigate(['/edit-profile']);
  }
  // เพิ่มใน class Profile

// =====================
// 📜 TRANSACTIONS
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
// 💰 MODAL / WALLET / TRANSACTION
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
  if (!isNaN(amount) && amount > 0) {
    this.selectedAmount = amount;
  } else {
    this.selectedAmount = 0;
  }
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

  const transaction: Transaction = {
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


  alert(`เติมเงินสำเร็จ! ฿${this.selectedAmount.toLocaleString()}`);
  this.closeTopupModal();
  this.loadTransactions();
}

}
