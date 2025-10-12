import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserNavbar } from "../user-navbar/user-navbar";
import { ApiService } from '../services/service';

export interface Game {
  id: number;
  title: string;
  genre: string;
  price: number;
  rank: number;
  description?: string;
  releaseDate?: string;
  imagePath?: string;
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
  ownedGameIds: number[] = []; // ✅ เก็บ ID เกมในคลังจริงจาก API
  cart: CartItem[] = [];
  games: Game[] = [];
  allGames: Game[] = [];

  searchTerm = '';
  selectedGenre = 'ทุกประเภท';
  genres = ['ทุกประเภท', 'RPG', 'Racing', 'Strategy', 'FPS', 'Adventure', 'Action'];

  cartKey = 'cart:guest';

  constructor(private router: Router, private api: ApiService) {}

  async ngOnInit() {
    await this.initializeUser();
    await this.loadGames();
    await this.loadOwnedGames(); // ✅ โหลดคลังจริงของผู้ใช้จาก API
  }

  async initializeUser() {
    const cu = localStorage.getItem('currentUser');
    if (!cu) return;
    try {
      const u = JSON.parse(cu);
      const keyId = u?.id || u?.email || 'guest';
      this.cartKey = `cart:${keyId}`;
      this.walletBalance = u.walletBalance || 0;
      this.loadCart();
    } catch {}
  }

  /** ✅ โหลดคลังเกมของผู้ใช้จาก API */
  async loadOwnedGames() {
    const userRaw = localStorage.getItem('currentUser');
    if (!userRaw) return;

    const user = JSON.parse(userRaw);
    try {
      const library = await this.api.getLibraryByEmail(user.email);
      // สมมติว่า API คืนค่า [{ gameId: 1, ... }]
      this.ownedGameIds = (library || []).map((g: any) => g.gameId);
      console.log('🎮 Owned games:', this.ownedGameIds);
    } catch (err) {
      console.error('โหลดคลังเกมไม่สำเร็จ', err);
      this.ownedGameIds = [];
    }
  }

  /** ✅ เช็กว่าเกมนี้เคยซื้อแล้วหรือยัง */
  alreadyOwned(gameId: number): boolean {
    return this.ownedGameIds.includes(gameId);
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

  inCart(gameId: number): boolean {
    return this.cart.some(it => it.gameId === gameId);
  }

  /** 🛒 เพิ่มเกมลงตะกร้า */
  addToCart(g: Game) {
    if (this.alreadyOwned(g.id)) {
      alert(`คุณเป็นเจ้าของ "${g.title}" อยู่แล้ว 🎮`);
      return;
    }

    const raw = localStorage.getItem(this.cartKey);
    let cart: CartItem[] = raw ? JSON.parse(raw) : [];

    const already = cart.find(x => x.gameId === g.id);
    if (already) {
      alert(`"${g.title}" อยู่ในตะกร้าแล้ว`);
      return;
    }

    cart.push({
      gameId: g.id,
      title: g.title,
      price: g.price,
      qty: 1,
      imageFileName: g.imagePath ?? null
    });

    localStorage.setItem(this.cartKey, JSON.stringify(cart));
    this.cart = cart;
    alert(`เพิ่ม "${g.title}" ลงตะกร้าแล้ว!`);
  }

  /** 🎮 โหลดรายการเกมทั้งหมด */
  async loadGames() {
    try {
      const res = await this.api.getGames();
      this.allGames = res.map((g: any) => ({
        ...g,
        description: g.description || 'ไม่มีคำอธิบายสำหรับเกมนี้',
        releaseDate: g.releaseDate || 'ไม่ระบุวันที่เปิดตัว',
      }));
      this.applyFilters();
    } catch (err) {
      console.error('โหลดเกมไม่สำเร็จ', err);
      this.games = [];
    }
  }

  /** 🔍 ฟิลเตอร์ชื่อ/ประเภท */
  applyFilters() {
    const searchLower = this.searchTerm.toLowerCase().trim();
    const selected = this.selectedGenre;
    this.games = this.allGames.filter(g => {
      const matchName = g.title.toLowerCase().includes(searchLower);
      const matchGenre = selected === 'ทุกประเภท' || g.genre === selected;
      return matchName && matchGenre;
    });
  }

  onSearchChange() { this.applyFilters(); }
  onGenreChange() { this.applyFilters(); }

  imageUrl(imagePath?: string | null): string {
    return `http://202.28.34.203:30000/upload/${imagePath}`;
  }

  showGameDetail(game: Game) {
    this.selectedGame = game;
    document.body.style.overflow = 'hidden';
  }

  closeDetail(event?: MouseEvent) {
    if (event && (event.target as HTMLElement).classList.contains('popup-overlay')) {
      this.selectedGame = null;
    } else if (!event) {
      this.selectedGame = null;
    }
    document.body.style.overflow = 'auto';
  }

  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    localStorage.removeItem('transactions');
    localStorage.removeItem('walletBalance');
    alert('ออกจากระบบเรียบร้อย ✅');
    this.router.navigate(['/']);
  }
}
