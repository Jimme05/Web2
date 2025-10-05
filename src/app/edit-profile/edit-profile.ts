// src/app/edit-profile/edit-profile.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/service'; // ✅ import ApiService

interface User {
  id?: number | string;
  name: string;
  email: string;
  profileImage?: string;   // เก็บชื่อไฟล์ที่ backend เซฟไว้
  walletBalance?: number;
  createdAt?: string;
}

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile.html',
  styleUrls: ['./edit-profile.scss'],
})
export class EditProfile {
  currentUser: User | null = null;

  name = '';
  email = '';            // อ่านอย่างเดียว (ใช้เป็น key อัปเดต)
  profileImage = '';     // เก็บชื่อไฟล์เดิม (ถ้ามี)
  password = '';
  confirmPassword = '';

  previewImage: string | null = null; // data URL สำหรับ preview
  selectedFile: File | null = null;

  errorMessage = '';
  successMessage = '';

  constructor(private router: Router, private api: ApiService) {}

  ngOnInit(): void {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      this.router.navigate(['/']);
      return;
    }
    
    this.currentUser = JSON.parse(raw);
    if (this.currentUser) {
      this.name = this.currentUser.name;
      this.email = this.currentUser.email;
      this.profileImage = this.currentUser.profileImage || '';
    }
    // ถ้าต้องการโชว์รูปปัจจุบันจากเซิร์ฟเวอร์ ให้ต่อเป็น URL เอง (ถ้ามี static serve)
    // ตัวอย่าง: this.serverImageUrl = `${API_BASE}/profile/${this.profileImage}`;
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => (this.previewImage = reader.result as string);
      reader.readAsDataURL(this.selectedFile);
    }
  }

  async saveProfile() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.name || !this.email) {
      this.errorMessage = 'กรุณากรอกชื่อผู้ใช้และอีเมล';
      return;
    }
    if (this.password && this.password !== this.confirmPassword) {
      this.errorMessage = 'รหัสผ่านไม่ตรงกัน';
      return;
    }

    try {
      await this.api.updateByEmailForm({
        email: this.email,
        name: this.name,
        password: this.password || undefined,
        file: this.selectedFile,
      });

      // อัปเดตฝั่ง client (เผื่อ API ไม่ส่ง body กลับ)
      if (this.currentUser) {
        this.currentUser.name = this.name;

        // ถ้ามีไฟล์ใหม่ ให้เก็บชื่อไฟล์ไว้ (สมมุติ backend เซฟตามชื่อเดิม)
        if (this.selectedFile) {
          this.currentUser.profileImage = this.selectedFile.name;
        }
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      }

      this.successMessage = 'บันทึกข้อมูลสำเร็จ ✅';
      setTimeout(() => this.router.navigate(['/profile']), 900);
    } catch (err: any) {
      this.errorMessage = err?.message || 'อัปเดตไม่สำเร็จ';
    }
  }

  cancel() {
    this.router.navigate(['/profile']);
  }
}
