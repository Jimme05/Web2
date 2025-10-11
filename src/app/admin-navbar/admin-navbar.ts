import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-navbar.html',
  styleUrl: './admin-navbar.scss'
})
export class AdminNavbar {
  constructor(private router: Router) {}

  // ฟังก์ชันสำหรับปุ่มต่าง ๆ
  goToDashboard() {
    this.router.navigate(['/admin']);
  }

  goToManageGames() {
    this.router.navigate(['/admin/games']);
  }

  goToUsers() {
    this.router.navigate(['/admin/users']);
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/']);
  }
}
