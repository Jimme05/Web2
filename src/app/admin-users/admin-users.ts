import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminNavbar } from '../admin-navbar/admin-navbar';
import { CommonModule } from '@angular/common';
interface User {
  id: string;
  username: string;
  email: string;
  walletBalance: number;
  profileImage?: string;
}

@Component({
  selector: 'app-admin-users',
  imports: [CommonModule, AdminNavbar],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss'
})
export class AdminUsers {
users: User[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // โหลดข้อมูล user จาก localStorage
    const usersJson = localStorage.getItem('users');
    if (usersJson) {
      this.users = JSON.parse(usersJson);
    } else {
      // ตัวอย่าง mock data
      this.users = [
        {
          id: '1',
          username: 'nameUser',
          email: 'example@email.com',
          walletBalance: 1500,
          profileImage: ''
        },
        {
          id: '2',
          username: 'playerX',
          email: 'playerx@mail.com',
          walletBalance: 200,
          profileImage: ''
        }
      ];
    }
  }

  viewHistory(user: User) {
    alert(`แสดงประวัติของ ${user.username}`);
    // ตัวอย่าง: this.router.navigate(['/admin/user-history', user.id]);
  }
}
