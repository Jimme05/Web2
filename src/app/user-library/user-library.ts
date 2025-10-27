import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserNavbar } from '../user-navbar/user-navbar';
import { ApiService } from '../services/service';

interface LibraryItemDto {
  gameId: number;
  title: string;
  genre: string;
  priceCurrent: number;
  imagePath?: string | null;
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
  image: string;
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
  selectedGame: OwnedGameVm | null = null; // ✅ เก็บเกมที่กดเพื่อโชว์ popup

  private imgBase = 'http://202.28.34.203:30000';

  constructor(private api: ApiService) {}

  async ngOnInit() {
    await this.loadOwnedGames();
  }

  private imageUrl(fileName?: string | null): string {
    if (!fileName) return `${this.imgBase}/no-image.png`;
    if (!/^https?:\/\//i.test(fileName)) {
      return `${this.imgBase}/upload/${fileName}`;
    }
    return fileName;
  }

  async loadOwnedGames() {
    const userRaw = localStorage.getItem('currentUser');
    if (!userRaw) {
      this.ownedGames = [];
      this.balance = 0;
      this.cartCount = 0;
      return;
    }

    const user = JSON.parse(userRaw) as { id: number; email: string; walletBalance?: number };

    try {
      const wallet = await this.api.getWalletByUserId(user.id);
      this.balance = Number(wallet?.balance ?? user.walletBalance ?? 0);
    } catch {
      this.balance = Number(user.walletBalance ?? 0);
    }

    const cartKey = `cart:${user.id || user.email || 'guest'}`;
    try {
      const raw = localStorage.getItem(cartKey);
      const cart = raw ? JSON.parse(raw) as Array<{ qty?: number }> : [];
      this.cartCount = cart.reduce((sum, it) => sum + (Number(it.qty ?? 1)), 0);
    } catch {
      this.cartCount = 0;
    }

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

  // ✅ เปิด popup รายละเอียด
  showGameDetail(game: OwnedGameVm) {
    this.selectedGame = game;
  }

  // ✅ ปิด popup รายละเอียด
  closeDetail(event?: Event) {
    if (event) event.stopPropagation();
    this.selectedGame = null;
  }
}
