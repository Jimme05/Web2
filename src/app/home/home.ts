import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface Game {
  id: number;
  title: string;
  genre: string;
  price: number;
  rank: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  balance = 5000;

  constructor(private router: Router) {}

  games: Game[] = [
    { id: 1, title: 'Cyberpunk Adventure', genre: 'RPG', price: 1590, rank: 1 },
    { id: 2, title: 'Racing Thunder', genre: 'Racing', price: 1299, rank: 2 },
    { id: 3, title: 'Space Strategy', genre: 'Strategy', price: 899, rank: 3 },
    { id: 4, title: 'Combat Elite', genre: 'FPS', price: 990, rank: 4 },
    { id: 5, title: 'Fantasy Quest', genre: 'Adventure', price: 1200, rank: 5 },
    { id: 6, title: 'Mech Warrior', genre: 'Action', price: 1100, rank: 6 }
  ];

  searchTerm = '';
  selectedGenre = 'ทุกประเภท';
  genres = ['ทุกประเภท', 'RPG', 'Racing', 'Strategy', 'FPS', 'Adventure', 'Action'];

  // =====================
  // 👤 ไปหน้าโปรไฟล์
  // =====================
  async goToProfile() {
    await this.router.navigate(['/profile']);
  }

  // =====================
  // 🚪 ออกจากระบบ (รีเซ็ต session)
  // =====================
  logout() {
    // ✅ เคลียร์ข้อมูล session ทั้งหมด
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    localStorage.removeItem('transactions');
    localStorage.removeItem('walletBalance');
    // หรือจะล้างทั้งหมดเลยก็ได้
    // localStorage.clear();

    alert('ออกจากระบบเรียบร้อย ✅');

    // ✅ พากลับไปหน้าแรก (เช่น หน้า main/login)
    this.router.navigate(['/']);
  }
}
