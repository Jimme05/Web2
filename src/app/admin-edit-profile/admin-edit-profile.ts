// src/app/admin-edit-profile/admin-edit-profile.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/service';
import { AdminNavbar } from '../admin-navbar/admin-navbar';

interface Admin {
  id?: number | string;
  name: string;
  email: string;
  profileImage?: string;
  walletBalance?: number;
  createdAt?: string;
}

@Component({
  selector: 'app-admin-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbar],
  templateUrl: './admin-edit-profile.html',
  styleUrls: ['./admin-edit-profile.scss'],
})
export class AdminEditProfile {
  currentAdmin: Admin | null = null;

  name = '';
  email = '';
  profileImage = '';
  password = '';
  confirmPassword = '';

  previewImage: string | null = null;
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

    this.currentAdmin = JSON.parse(raw);
    if (this.currentAdmin) {
      this.name = this.currentAdmin.name;
      this.email = this.currentAdmin.email;
      this.profileImage = this.currentAdmin.profileImage || '';
    }
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
      this.errorMessage = 'กรุณากรอกชื่อผู้ดูแลและอีเมล';
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

      // ✅ อัปเดตฝั่ง client
      if (this.currentAdmin) {
        this.currentAdmin.name = this.name;
        if (this.selectedFile) {
          this.currentAdmin.profileImage = this.selectedFile.name;
        }
        localStorage.setItem('currentUser', JSON.stringify(this.currentAdmin));
      }

      this.successMessage = 'บันทึกข้อมูลแอดมินสำเร็จ ✅';
      setTimeout(() => this.router.navigate(['/admin/profile']), 900);
    } catch (err: any) {
      this.errorMessage = err?.message || 'อัปเดตไม่สำเร็จ ❌';
    }
  }

  cancel() {
    this.router.navigate(['/admin/profile']);
  }
}
