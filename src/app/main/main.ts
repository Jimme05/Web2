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
  registerImage = '';
  registerError = '';
  registerSuccess = '';
  isRegistering = false;

  // current user
  user: { id?: number; email?: string; role?: 'Admin'|'User' } | null = null;

   constructor(private api: ApiService, private router: Router) {}
   

   previewImage: string | null = null;
selectedFile: File | null = null;

onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    this.selectedFile = file;

    // แสดง preview
    const reader = new FileReader();
    reader.onload = () => {
      this.previewImage = reader.result as string;
    };
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
    this.isLoggingIn = true;
    try {
      const res = await this.api.login(this.loginEmail, this.loginPassword);
      // res = { id, email, role }
      this.user = res;
      localStorage.setItem('currentUser', JSON.stringify(res)); // เก็บ session ฝั่ง client

      // เคลียร์ฟอร์ม
      this.loginEmail = '';
      this.loginPassword = '';

      // ✅ เช็ค role แล้วพาไปหน้าเหมาะสม
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
  // 📝 REGISTER
  // =====================
  async onRegister() {
  if (!this.registerUsername || !this.registerEmail || !this.registerPassword) {
    this.registerError = 'กรอกข้อมูลให้ครบถ้วน';
    return;
  }

  const formData = new FormData();
  formData.append('name', this.registerUsername);
  formData.append('email', this.registerEmail);
  formData.append('password', this.registerPassword);
  if (this.selectedFile) {
    formData.append('profileImage', this.selectedFile, this.selectedFile.name);
  }

  try {
    const res = await fetch('https://8f963cb2b5ea.ngrok-free.app/api/Auth/register', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error(await res.text());
    this.registerSuccess = 'สมัครสมาชิกสำเร็จ!';
  } catch (err: any) {
    this.registerError = err.message;
  }
}


  // 🚪 LOGOUT
  logout() {
    this.user = null;
    this.showAuthCard = false;
    this.router.navigate(['/']); // กลับไปหน้าแรก
  }

  // computed
  get isLoggedIn() {
    return !!this.user;
  }
}
