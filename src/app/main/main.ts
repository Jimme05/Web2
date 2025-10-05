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
  registerImage = '';
  registerError = '';
  registerSuccess = '';
  isRegistering = false;

  // current user
  user: { username?: string; email?: string; role?: string; image?: string } | null = null;

  constructor(private api: ApiService, private router: Router) {}

  switchTab(tab: 'login' | 'register') {
    this.activeTab = tab;
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
    this.isLoggingIn = true;
    try {
      const res = await this.api.login(this.loginEmail, this.loginPassword);
      this.user = res?.user ?? { email: this.loginEmail };

      this.loginEmail = '';
      this.loginPassword = '';

      // ✅ เช็ค role แล้ว redirect
      if (this.user?.role === 'Admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/home']);
      }

      alert(`เข้าสู่ระบบสำเร็จ${this.user?.username ? ' คุณ ' + this.user.username : ''}!`);
    } catch (err: any) {
      this.loginError = err.message || 'เข้าสู่ระบบล้มเหลว';
    } finally {
      this.isLoggingIn = false;
    }
  }

  // =====================
  // 📝 REGISTER
  // =====================
  async onRegister() {
    this.registerError = '';
    this.registerSuccess = '';

    if (!this.registerUsername || !this.registerEmail || !this.registerPassword) {
      this.registerError = 'กรอกข้อมูลให้ครบถ้วน';
      return;
    }
    if (this.registerPassword !== this.registerConfirmPassword) {
      this.registerError = 'รหัสผ่านไม่ตรงกัน';
      return;
    }

    this.isRegistering = true;
    try {
      await this.api.register(this.registerUsername, this.registerEmail, this.registerPassword, this.registerImage);
      this.registerSuccess = 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ';
      this.registerUsername = '';
      this.registerEmail = '';
      this.registerPassword = '';
      this.registerConfirmPassword = '';
      this.registerImage = '';
      this.activeTab = 'login';
    } catch (err: any) {
      this.registerError = err.message || 'สมัครสมาชิกไม่สำเร็จ';
    } finally {
      this.isRegistering = false;
    }
  }

  // 🚪 LOGOUT
  logout() {
    this.user = null;
    this.router.navigate(['/']); // กลับไปหน้าแรก
  }

  // computed
  get isLoggedIn() {
    return !!this.user;
  }
}
