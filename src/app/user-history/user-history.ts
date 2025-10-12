import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/service';
import { AdminNavbar } from '../admin-navbar/admin-navbar';

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
  selector: 'app-user-history',
  imports: [CommonModule, AdminNavbar],
  templateUrl: './user-history.html',
  styleUrl: './user-history.scss'
})
export class UserHistory implements OnInit{
userId!: number;
  transactions: Transaction[] = [];
  userEmail: string = '';
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  async ngOnInit() {
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    await this.loadTransactions();
  }

  async loadTransactions() {
    try {
      this.loading = true;
      this.transactions = await this.api.getTransactionsByUser(undefined, this.userId);
    } catch (err) {
      console.error('โหลดประวัติไม่สำเร็จ', err);
      this.transactions = [];
    } finally {
      this.loading = false;
    }
  }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getTransactionColor(type: string): string {
    return type === 'topup' ? '#4CAF50' : '#E53935';
  }

  goBack() {
    this.router.navigate(['/admin/users']);
  }
}
