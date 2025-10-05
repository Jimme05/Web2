import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';


@Component({
  selector: 'app-main',
  templateUrl: './main.html',
  styleUrls: ['./main.css']
})
export class MainComponent {
  // UI state
  isLoggedIn = false;
  isLoginModalOpen = false;
  isRegisterModalOpen = false;

  // Login form
  loginEmail = '';
  loginPassword = '';
  loginError: string | null = null;

  // Register form
  registerUsername = '';
  registerEmail = '';
  registerPassword = '';
  registerConfirmPassword = '';
  registerImage = '';
  registerError: string | null = null;
  registerSuccess: string | null = null;
  profilePreview: string = '';

  constructor(private api: ApiService) {}

  // 🔑 Modal Control
  openModal(type: 'login' | 'register') {
    if (type === 'login') this.isLoginModalOpen = true;
    if (type === 'register') this.isRegisterModalOpen = true;
  }

  closeModal(type: 'login' | 'register') {
    if (type === 'login') this.isLoginModalOpen = false;
    if (type === 'register') this.isRegisterModalOpen = false;
  }

  switchModal(from: 'login' | 'register', to: 'login' | 'register') {
    this.closeModal(from);
    this.openModal(to);
  }

  closeModalOnOverlay(event: MouseEvent, type: 'login' | 'register') {
    if (event.target && (event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal(type);
    }
  }

  // 🔐 Login
  handleLogin() {
    this.loginError = null;
    this.api.login(this.loginEmail, this.loginPassword).subscribe({
      next: (res: any) => {
        this.isLoggedIn = true;
        this.closeModal('login');
      },
      error: (err) => {
        this.loginError = err.error?.message || 'เข้าสู่ระบบล้มเหลว';
      }
    });
  }

  // ✨ Register
  handleRegister() {
    this.registerError = null;
    if (this.registerPassword !== this.registerConfirmPassword) {
      this.registerError = 'รหัสผ่านไม่ตรงกัน';
      return;
    }
    this.api.register(this.registerEmail, this.registerPassword).subscribe({
      next: (res: any) => {
        this.registerSuccess = 'สมัครสมาชิกสำเร็จ';
        setTimeout(() => {
          this.switchModal('register', 'login');
        }, 1500);
      },
      error: (err) => {
        this.registerError = err.error?.message || 'สมัครสมาชิกไม่สำเร็จ';
      }
    });
  }

  // 👋 Logout
  logout() {
    this.isLoggedIn = false;
  }

  // 🖼 Preview Profile Image
  onImageChange() {
    if (this.registerImage) {
      this.profilePreview = `<img src="${this.registerImage}" alt="preview" style="width:80px;height:80px;border-radius:50%;margin:10px auto;display:block;">`;
    } else {
      this.profilePreview = '';
    }
  }
}
