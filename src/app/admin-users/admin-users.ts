import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminNavbar } from '../admin-navbar/admin-navbar';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/service';

interface User {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
  profileImage?: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, AdminNavbar],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.scss']
})
export class AdminUsers implements OnInit {
  users: User[] = [];
  loading = false;
  error = '';

  constructor(private router: Router, private api: ApiService) {}

  async ngOnInit() {
    this.loading = true;
    try {
      const data = await (await this.api.getUsers()).toPromise() as User[];
      this.users = data ?? [];
    } catch (err) {
      console.error(err);
      this.error = 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้';
    } finally {
      this.loading = false;
    }
  }

  viewHistory(user: User) {
    this.router.navigate(['/admin/user-history', user.id]);
  }
}
