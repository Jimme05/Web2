import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface User {
  id: string;
  username: string;
  email: string;
  profileImage: string;
  walletBalance: number;
  createdAt: string;
  password?: string;
}

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.scss'
})
export class EditProfile {
  currentUser: User | null = null;

  username = '';
  email = '';
  profileImage = '';
  password = '';
  confirmPassword = '';

  errorMessage = '';
  successMessage = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    const userJson = localStorage.getItem('currentUser');
    // if (userJson) {
    //   this.currentUser = JSON.parse(userJson);
    //   this.username = this.currentUser.username;
    //   this.email = this.currentUser.email;
    //   this.profileImage = this.currentUser.profileImage;
    // } else {
    //   // ถ้าไม่มี session -> กลับหน้า login
    //   this.router.navigate(['/']);
    // }
  }

  // ===========================
  // 💾 บันทึกการเปลี่ยนแปลง
  // ===========================
  saveProfile(): void {
    if (!this.username || !this.email) {
      this.errorMessage = 'กรุณากรอกข้อมูลให้ครบถ้วน';
      return;
    }

    if (this.password && this.password !== this.confirmPassword) {
      this.errorMessage = 'รหัสผ่านไม่ตรงกัน';
      return;
    }

    if (!this.currentUser) return;

    // ✅ อัปเดต user ปัจจุบัน
    this.currentUser.username = this.username;
    this.currentUser.email = this.email;
    this.currentUser.profileImage = this.profileImage;
    if (this.password) this.currentUser.password = this.password;

    // ✅ บันทึกลง localStorage
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

    // ✅ อัปเดตใน users ทั้งหมด
    const usersJson = localStorage.getItem('users');
    if (usersJson) {
      const users: User[] = JSON.parse(usersJson);
      const idx = users.findIndex(u => u.id === this.currentUser!.id);
      if (idx !== -1) {
        users[idx] = this.currentUser!;
        localStorage.setItem('users', JSON.stringify(users));
      }
    }

    this.successMessage = 'บันทึกข้อมูลเรียบร้อย ✅';

    setTimeout(() => {
      this.router.navigate(['/profile']);
    }, 1500);
  }

  cancel(): void {
    this.router.navigate(['/profile']);
  }
}
