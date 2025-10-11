import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserNavbar } from "../user-navbar/user-navbar";
import { ApiService } from '../services/service';
import { environment } from '../services/environment';

export interface Game {
  id: number;
  title: string;
  genre: string;
  price: number;
  rank: number;
  imagePath?: string; // ชื่อไฟล์รูปจาก backend (ถ้ามี)
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [UserNavbar, CommonModule, FormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  balance = 5000;

  constructor(private router: Router, private api: ApiService) {}

  games: Game[] = [];

  searchTerm = '';
  selectedGenre = 'ทุกประเภท';
  genres = ['ทุกประเภท', 'RPG', 'Racing', 'Strategy', 'FPS', 'Adventure', 'Action'];

  async ngOnInit() {
    await this.loadGames(); // โหลดครั้งแรก
  }

  async loadGames() {
  try {
    this.games = await this.api.getGames(this.searchTerm, this.selectedGenre === 'ทุกประเภท' ? '' : this.selectedGenre);
  } catch (err) {
    console.error('โหลดเกมไม่สำเร็จ', err);
    this.games = [];
  }
}
  addToCart(game: Game) {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart.push(game);
  localStorage.setItem('cart', JSON.stringify(cart));
  alert(`เพิ่ม ${game.title} ลงในตะกร้าแล้ว 🛒`);
}
  // เรียกตอนพิมพ์ค้นหา
  onSearchChange() {
    this.loadGames();
  }

  // เรียกตอนเปลี่ยนประเภท
  onGenreChange() {
    this.loadGames();
  }

  imageUrl(imagePath?: string | null): string {
    // ถ้า server เก็บไฟล์ไว้ที่ 203 เช่น /upload/<imagePath>
    return `http://202.28.34.203:30000/upload/${imagePath}`;
  }

  // 👤 ไปหน้าโปรไฟล์
  async goToProfile() {
    await this.router.navigate(['/profile']);
  }

  // 🚪 ออกจากระบบ
  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    localStorage.removeItem('transactions');
    localStorage.removeItem('walletBalance');
    alert('ออกจากระบบเรียบร้อย ✅');
    this.router.navigate(['/']);
  }
}
