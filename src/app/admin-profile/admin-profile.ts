import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminNavbar } from '../admin-navbar/admin-navbar';
import { ApiService } from '../services/service';
import { environment } from '../services/environment';

interface Admin {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
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

  imageUrl(fileName?: string | null): string {
    if (!fileName) return 'assets/admin-avatar.png';
    const path = fileName.startsWith('/') ? fileName : `/profile/${fileName}`;
    return `${environment.apiOrigin}${path}`;
  }

  async loadAdminData() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return;

    const user = JSON.parse(userJson);

    try {
      const profile = await this.api.me(user.email);

      this.currentAdmin = profile;
      this.walletBalance = profile.walletBalance || 0;
      this.profileImageUrl = this.imageUrl(profile.profileImage);
    } catch (err) {
      console.error('โหลดข้อมูลแอดมินไม่สำเร็จ', err);
      this.currentAdmin = user;
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
