import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminNavbar } from '../admin-navbar/admin-navbar';
import { ApiService } from '../services/service';


interface Admin {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  role: string;
  walletBalance: number;
  createdAt: string;
}

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbar],
  templateUrl: './admin-profile.html',
  styleUrls: ['./admin-profile.scss']
})
export class AdminProfile {
  currentAdmin: Admin | null = null;
  profileImageUrl: string = '';
  walletBalance = 0;

  constructor(private api: ApiService, private router: Router) {}

  async ngOnInit() {
    await this.loadAdminData();
  }

  // ======================
  // 🖼️ ดึง URL ของรูปโปรไฟล์
  // ======================
  imageUrl(fileName?: string | null): string {
  if (!fileName) {
    // ถ้าไม่มีรูปให้ใช้ default avatar
    return 'assets/admin-avatar.png';
  }

  // ถ้าเป็น URL เต็ม (มี http/https อยู่แล้ว) ให้ใช้ตามนั้นเลย
  if (/^https?:\/\//i.test(fileName)) {
    return fileName;
  }

  // ✅ เปลี่ยนจากเรียกตรงเป็นเรียกผ่าน proxy ของ Netlify
  // ตัว proxy จะ redirect ไปที่ 203 โดยอัตโนมัติ (ปลอดภัยเพราะผ่าน HTTPS)
  return `/upload/${fileName}`;
}

  // ======================
  // 👤 โหลดข้อมูลแอดมินจาก backend
  // ======================
  async loadAdminData() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return;

    const user = JSON.parse(userJson);

    try {
      const profile = await this.api.me(user.email);

      this.currentAdmin = profile;
      this.walletBalance = profile.walletBalance || 0;

      // ✅ ใช้ฟังก์ชัน imageUrl เพื่อดึงรูปจาก 203
      this.profileImageUrl = this.imageUrl(profile.profileImage);
    } catch (err) {
      console.error('โหลดข้อมูลแอดมินไม่สำเร็จ', err);
      this.currentAdmin = user;
      this.profileImageUrl = this.imageUrl(user.profileImage);
    }
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/']);
  }

  goToEditProfile() {
    this.router.navigate(['/admin/edit-profile']);
  }
}
