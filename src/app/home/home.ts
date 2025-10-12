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

interface CartItem {
  gameId: number;
  title: string;
  price: number;
  qty: number;
  imageFileName?: string | null;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [UserNavbar, CommonModule, FormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  walletBalance = 0;
  selectedGame: Game | null = null;
  showDetailModal = false;

  constructor(private router: Router, private api: ApiService) { }

  games: Game[] = [];

  searchTerm = '';
  selectedGenre = 'ทุกประเภท';
  genres = ['ทุกประเภท', 'RPG', 'Racing', 'Strategy', 'FPS', 'Adventure', 'Action'];
  allGames: Game[] = []; // เก็บของเดิมไว้ก่อนกรอง
  cart: CartItem[] = [];
  cartKey = 'cart:guest'; // เปลี่ยนเป็น cart:<userId> ถ้าล็อกอิน

  async ngOnInit() {
    // ถ้ามี currentUser เก็บ userId/อีเมลไว้ เปลี่ยน key ให้เฉพาะคน
    const cu = localStorage.getItem('currentUser');
    if (cu) {
      try {
        const u = JSON.parse(cu);
        const keyId = u?.id || u?.email || 'guest';
        this.cartKey = `cart:${keyId}`;
      } catch { }
    }
    this.loadCart();

    await this.loadGames();
  }
  // ===== Cart helpers =====
  loadCart() {
    const raw = localStorage.getItem(this.cartKey);
    this.cart = raw ? JSON.parse(raw) : [];
  }

  saveCart() {
    localStorage.setItem(this.cartKey, JSON.stringify(this.cart));
  }

  get cartCount(): number {
    return this.cart.reduce((sum, it) => sum + it.qty, 0);
  }

  get cartTotal(): number {
    return this.cart.reduce((sum, it) => sum + it.qty * it.price, 0);
  }

  // เช็คว่าเกมนี้อยู่ในตะกร้าแล้วหรือยัง
  inCart(gameId: number): boolean {
    return this.cart.some(it => it.gameId === gameId);
  }

  addToCart(g: Game) {
    // ผูก key ตะกร้ากับผู้ใช้ (เหมือนเดิม)
    const cuRaw = localStorage.getItem('currentUser');
    let cartKey = 'cart:guest';
    if (cuRaw) {
      try {
        const cu = JSON.parse(cuRaw);
        const keyId = cu?.id || cu?.email || 'guest';
        cartKey = `cart:${keyId}`;
      } catch { }
    }

    // โหลดตะกร้าเดิม
    const raw = localStorage.getItem(cartKey);
    let cart: CartItem[] = raw ? JSON.parse(raw) : [];

    // ❌ ถ้ามีอยู่แล้ว ห้ามเพิ่มซ้ำ
    const already = cart.find(x => x.gameId === g.id);
    if (already) {
      alert(`คุณมี "${g.title}" อยู่ในตะกร้าแล้ว (เพิ่มได้เกมละ 1 ชิ้นเท่านั้น)`);
      return;
    }

    // ✅ เพิ่มใหม่ 1 ชิ้น
    cart.push({
      gameId: g.id,
      title: g.title,
      price: g.price,
      qty: 1,
      imageFileName: g.imagePath ?? null
    });

    localStorage.setItem(cartKey, JSON.stringify(cart));

    // sync state ถ้าเป็นตะกร้าของ key เดียวกัน
    if (cartKey === this.cartKey) this.cart = cart;

    alert(`เพิ่ม "${g.title}" ลงตะกร้าแล้ว!`);
  }



  async loadGames() {
    try {
      // ✅ ดึงจาก backend ก่อน
      const res = await this.api.getGames();
      this.allGames = res;

      // ✅ กรองชื่อ + ประเภท
      this.applyFilters();
    } catch (err) {
      console.error('โหลดเกมไม่สำเร็จ', err);
      this.games = [];
    }
  }

  applyFilters() {
    const searchLower = this.searchTerm.toLowerCase().trim();
    const selected = this.selectedGenre;

    this.games = this.allGames.filter(g => {
      const matchName = g.title.toLowerCase().includes(searchLower);
      const matchGenre = selected === 'ทุกประเภท' || g.genre === selected;
      return matchName && matchGenre;
    });
  }

  // เรียกตอนพิมพ์ค้นหา
  onSearchChange() {
    this.applyFilters();
  }

  // เมื่อเปลี่ยนประเภท
  onGenreChange() {
    this.applyFilters();
  }

  imageUrl(imagePath?: string | null): string {
    // ถ้า server เก็บไฟล์ไว้ที่ 203 เช่น /upload/<imagePath>
    return `http://202.28.34.203:30000/upload/${imagePath}`;
  }

  // 👤 ไปหน้าโปรไฟล์
  async goToProfile() {
    await this.router.navigate(['/profile']);
  }

  // ✅ เปิดการ์ดรายละเอียด
  showGameDetail(game: Game) {
    this.selectedGame = game;
    document.body.style.overflow = 'hidden'; // ปิด scroll
  }

  // ✅ ปิดการ์ด
  closeDetail(event?: MouseEvent) {
    if (event && (event.target as HTMLElement).classList.contains('popup-overlay')) {
      this.selectedGame = null;
    } else if (!event) {
      this.selectedGame = null;
    }
    document.body.style.overflow = 'auto';
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
