import { Component, Input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './user-navbar.html',
  styleUrl: './user-navbar.scss'
})
export class UserNavbar {
  @Input() balance: number = 0;
  @Input() cartCount: number = 0;

  constructor(private router: Router) {}

  goToProfile() {
    this.router.navigate(['/profile']);
  }
  goToLibrary() {
    this.router.navigate(['/home/user-library']);
  }

  goToCart() {
    this.router.navigate(['/home/user-cart']);
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/']);
  }
}
