import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserNavbar } from '../user-navbar/user-navbar';
import { ApiService } from '../services/service';

interface LibraryItemDto {
  gameId: number;
  title: string;
  genre: string;
  priceCurrent: number;
  imagePath?: string | null;   // ชื่อไฟล์รูปจาก DB (เช่น "abc.png")
  totalQty: number;
  lastPurchasedAt: string;
  totalSpent: number;
}

interface OwnedGameVm {
  id: number;
  title: string;
  genre: string;
  price: number;
  qty: number;
  purchasedAt: string;
  image: string;               // URL ที่พร้อมโชว์
}

@Component({
  selector: 'app-user-library',
  standalone: true,
  imports: [CommonModule, UserNavbar],
  templateUrl: './user-library.html',
  styleUrl: './user-library.scss',
})
export class UserLibrary implements OnInit {
  balance = 0;
  cartCount = 0;
  ownedGames: OwnedGameVm[] = [];

  // base URL รูปที่ 203
  private imgBase = 'http://202.28.34.203:30000';

  constructor(private api: ApiService) {}

  async ngOnInit() {
    await this.loadOwnedGames();
  }

  private imageUrl(fileName?: string | null): string {
    if (!fileName) return `${this.imgBase}/no-image.png`;
    // ถ้าเป็นแค่ชื่อไฟล์ ให้ประกอบ URL
    if (!/^https?:\/\//i.test(fileName)) {
      return `${this.imgBase}/upload/${fileName}`;
    }
    return fileName;
  }

  // ✅ โหลดข้อมูลคลังเกมของ user จาก API
  async loadOwnedGames() {
    const userRaw = localStorage.getItem('currentUser');
    if (!userRaw) {
      this.ownedGames = [];
      this.balance = 0;
      this.cartCount = 0;
      return;
    }

    const user = JSON.parse(userRaw) as { id: number; email: string; walletBalance?: number };

    // 1) โหลดยอดเงินล่าสุดจากเส้น /api/Wallet/{userId} (ถ้ามี)
    try {
      const wallet = await this.api.getLibraryByUserId(user.id); // { id, userId, balance }
      this.balance = Number(wallet?.balance ?? user.walletBalance ?? 0);
    } catch {
      this.balance = Number(user.walletBalance ?? 0);
    }

    // 2) โหลดตะกร้า เพื่อแสดงจำนวนบน Navbar
    const cartKey = `cart:${user.id || user.email || 'guest'}`;
    try {
      const raw = localStorage.getItem(cartKey);
      const cart = raw ? JSON.parse(raw) as Array<{ qty?: number }> : [];
      this.cartCount = cart.reduce((sum, it) => sum + (Number(it.qty ?? 1)), 0);
    } catch {
      this.cartCount = 0;
    }

    // 3) โหลด “คลังเกม” จากเส้น /api/Library/by-email
    try {
      const list = await this.api.getLibraryByEmail(user.email) as LibraryItemDto[];
      this.ownedGames = (list || []).map(it => ({
        id: it.gameId,
        title: it.title,
        genre: it.genre,
        price: it.priceCurrent,
        qty: it.totalQty,
        purchasedAt: it.lastPurchasedAt,
        image: this.imageUrl(it.imagePath),
      }));
    } catch (err) {
      console.error('โหลดคลังเกมไม่สำเร็จ', err);
      this.ownedGames = [];
    }
  }
}
