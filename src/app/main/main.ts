// main.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interface for User
interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  profileImage: string;
  role: string;
  walletBalance: number;
  ownedGames: string[];
  createdAt: string;
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main.html',
  styleUrls: ['./main.scss']
})
export class Main implements OnInit {
  // Login Form
  loginEmail: string = '';
  loginPassword: string = '';
  loginError: string = '';

  // Register Form
  registerUsername: string = '';
  registerEmail: string = '';
  registerPassword: string = '';
  registerConfirmPassword: string = '';
  registerImage: string = '';
  registerError: string = '';
  registerSuccess: string = '';

  // Modal State
  isLoginModalOpen: boolean = false;
  isRegisterModalOpen: boolean = false;

  // User State
  currentUser: User | null = null;
  profilePreview: string = '👤';

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  // =====================
  // 🎯 MODAL FUNCTIONS
  // =====================
  openModal(type: 'login' | 'register'): void {
    if (type === 'login') {
      this.isLoginModalOpen = true;
      this.loginError = '';
    } else {
      this.isRegisterModalOpen = true;
      this.registerError = '';
      this.registerSuccess = '';
    }
    document.body.style.overflow = 'hidden';
  }

  closeModal(type: 'login' | 'register'): void {
    if (type === 'login') {
      this.isLoginModalOpen = false;
      this.loginError = '';
    } else {
      this.isRegisterModalOpen = false;
      this.registerError = '';
      this.registerSuccess = '';
    }
    document.body.style.overflow = 'auto';
  }

  switchModal(from: 'login' | 'register', to: 'login' | 'register'): void {
    this.closeModal(from);
    setTimeout(() => this.openModal(to), 200);
  }

  closeModalOnOverlay(event: MouseEvent, type: 'login' | 'register'): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal(type);
    }
  }

  // =====================
  // 🔐 LOGIN
  // =====================
  handleLogin(): void {
    const users = this.getUsers();
    const user = users.find(
      (u) => u.email === this.loginEmail && u.password === this.loginPassword
    );

    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUser = user;
      this.loginError = '';
      this.closeModal('login');
      this.resetLoginForm();
      alert('เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ ' + user.username);
    } else {
      this.loginError = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    }
  }

  // =====================
  // 📝 REGISTER
  // =====================
  handleRegister(): void {
    // Validate password match
    if (this.registerPassword !== this.registerConfirmPassword) {
      this.registerError = 'รหัสผ่านไม่ตรงกัน';
      this.registerSuccess = '';
      return;
    }

    const users = this.getUsers();

    // Check if email exists
    if (users.some((u) => u.email === this.registerEmail)) {
      this.registerError = 'อีเมลนี้ถูกใช้งานแล้ว';
      this.registerSuccess = '';
      return;
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      username: this.registerUsername,
      email: this.registerEmail,
      password: this.registerPassword,
      profileImage: this.registerImage || '',
      role: 'user',
      walletBalance: 0,
      ownedGames: [],
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    this.registerError = '';
    this.registerSuccess = 'สมัครสมาชิกสำเร็จ! กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...';

    this.resetRegisterForm();
    this.profilePreview = '👤';

    setTimeout(() => {
      this.closeModal('register');
      this.registerSuccess = '';
      setTimeout(() => this.openModal('login'), 300);
    }, 2000);
  }

  // =====================
  // 🖼️ IMAGE PREVIEW
  // =====================
  onImageChange(): void {
    if (this.registerImage) {
      this.profilePreview = `<img src="${this.registerImage}" alt="Profile" onerror="this.parentElement.innerHTML='👤'">`;
    } else {
      this.profilePreview = '👤';
    }
  }

  // =====================
  // 🚪 LOGOUT
  // =====================
  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUser = null;
    alert('ออกจากระบบสำเร็จ');
  }

  // =====================
  // 🛠️ HELPER FUNCTIONS
  // =====================
  private getUsers(): User[] {
    const usersJson = localStorage.getItem('users');
    return usersJson ? JSON.parse(usersJson) : [];
  }

  private loadCurrentUser(): void {
    const currentUserJson = localStorage.getItem('currentUser');
    if (currentUserJson) {
      this.currentUser = JSON.parse(currentUserJson);
    }
  }

  private resetLoginForm(): void {
    this.loginEmail = '';
    this.loginPassword = '';
  }

  private resetRegisterForm(): void {
    this.registerUsername = '';
    this.registerEmail = '';
    this.registerPassword = '';
    this.registerConfirmPassword = '';
    this.registerImage = '';
  }

  // =====================
  // 🔍 GETTERS
  // =====================
  get isLoggedIn(): boolean {
    return this.currentUser !== null;
  }
}