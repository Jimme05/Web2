import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // ✅ เพิ่มบรรทัดนี้

interface User {
  id: string;
  username: string;
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
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
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

  constructor(private router: Router) {} // ✅ inject Router

  ngOnInit(): void {
    this.loadUserData();
    this.loadTransactions();
  }

  loadUserData(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      this.currentUser = JSON.parse(userJson);
      this.walletBalance = this.currentUser?.walletBalance || 0;
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
    // ✅ ลบข้อมูล session ทั้งหมด
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    localStorage.removeItem('transactions');
    localStorage.removeItem('walletBalance');

    // หรือจะล้างทั้งหมดก็ได้
    // localStorage.clear();

    // แจ้งเตือน
    alert('ออกจากระบบเรียบร้อย ✅');

    // กลับไปหน้า home
    this.router.navigate(['/']);
  }

  // =====================
  // 💰 MODAL / WALLET / TRANSACTION (คงเดิม)
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

    this.saveTransaction(transaction);
    this.updateUserWallet(balanceAfter);

    alert(`เติมเงินสำเร็จ! ฿${this.selectedAmount.toLocaleString()}`);
    this.closeTopupModal();
    this.loadTransactions();
  }

  private saveTransaction(transaction: Transaction): void {
    const transactionsJson = localStorage.getItem('transactions');
    const transactions: Transaction[] = transactionsJson ? JSON.parse(transactionsJson) : [];
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }

  private updateUserWallet(newBalance: number): void {
    if (!this.currentUser) return;
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

    const usersJson = localStorage.getItem('users');
    if (usersJson) {
      const users: User[] = JSON.parse(usersJson);
      const userIndex = users.findIndex(u => u.id === this.currentUser?.id);
      if (userIndex !== -1) {
        users[userIndex].walletBalance = newBalance;
        localStorage.setItem('users', JSON.stringify(users));
      }
    }
  }

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
}
