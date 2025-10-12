import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main.html',
  styleUrls: ['./main.scss']
})
export class Main {
  // tab
  activeTab: 'login' | 'register' = 'login';
  showAuthCard = false;

  // login
  loginEmail = '';
  loginPassword = '';
  loginError = '';
  isLoggingIn = false;

  // register
  registerUsername = '';
  registerEmail = '';
  registerPassword = '';
  registerConfirmPassword = '';
  registerError = '';
  registerSuccess = '';
  isRegistering = false;

  // current user
  user: { id?: number; email?: string; role?: 'Admin' | 'User' } | null = null;

  constructor(private api: ApiService, private router: Router) { }

  // ภาพโปรไฟล์ (upload + preview)
  previewImage: string | null = null;
  selectedFile: File | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => (this.previewImage = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  switchTab(tab: 'login' | 'register') {
    this.activeTab = tab;
    this.showAuthCard = true;
    this.loginError = '';
    this.registerError = '';
    this.registerSuccess = '';
  }

  // =====================
  // 🔐 LOGIN
  // =====================
  async onLogin() {
    this.loginError = '';
    if (!this.loginEmail || !this.loginPassword) {
      this.loginError = 'กรอกอีเมลและรหัสผ่าน';
      return;
    }
    if (this.isLoggingIn) return;

    this.isLoggingIn = true;
    try {
      const res = await this.api.login(this.loginEmail, this.loginPassword);
      this.user = res;
      localStorage.setItem('currentUser', JSON.stringify(res));

      this.loginEmail = '';
      this.loginPassword = '';

      if (res.role === 'Admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/home']);
      }
    } catch (err: any) {
      this.loginError = err?.message || 'เข้าสู่ระบบล้มเหลว';
    } finally {
      this.isLoggingIn = false;
    }
  }

  // =====================
  // 📝 REGISTER (อัปโหลดไป 203 ก่อน แล้วส่งชื่อไฟล์ไป .NET)
  // =====================
  async onRegister() {
    this.registerError = '';
    this.registerSuccess = '';

    if (!this.registerUsername || !this.registerEmail || !this.registerPassword) {
      this.registerError = 'กรอกข้อมูลให้ครบถ้วน';
      return;
    }

    try {
      const result = await this.api.registerMultipart(
        this.registerUsername,
        this.registerEmail,
        this.registerPassword,
        this.selectedFile ?? undefined
      );
      this.registerSuccess = 'สมัครสมาชิกสำเร็จ!';
      // เคลียร์ฟอร์มตามต้องการ...
    } catch (err: any) {
      this.registerError = err.message || 'สมัครสมาชิกไม่สำเร็จ';
    }
  }


  // 🚪 LOGOUT
  logout() {
    this.user = null;
    this.showAuthCard = false;
    this.router.navigate(['/']);
  }

  get isLoggedIn() {
    return !!this.user;
  }
}
