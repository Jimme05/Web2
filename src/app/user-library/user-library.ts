import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserNavbar } from '../user-navbar/user-navbar';
import { ApiService } from '../services/service';
import { environment } from '../services/environment';

interface Game {
  id: number;
  title: string;
  genre: string;
  price: number;
  imagePath?: string;
  image?: string; // ใช้โชว์ในหน้า
}

@Component({
  selector: 'app-user-library',
  standalone: true,
  imports: [CommonModule, UserNavbar],
  templateUrl: './user-library.html',
  styleUrl: './user-library.scss',
})
export class UserLibrary implements OnInit {
  balance: number = 0;
  cartCount: number = 0;
  ownedGames: Game[] = [];

  constructor(private api: ApiService) {}

  async ngOnInit() {
    await this.loadOwnedGames();
  }

  // ✅ ดึงข้อมูลเกมที่ user เป็นเจ้าของ
  async loadOwnedGames() {
    const userRaw = localStorage.getItem('currentUser');
    if (!userRaw) return;

    const user = JSON.parse(userRaw);

    // ดึง balance (ไว้แสดงบน navbar)
    this.balance = user.walletBalance || 0;

    // ตรวจสอบว่ามี ownedGames (array ของ id)
    if (!user.ownedGames || user.ownedGames.length === 0) {
      this.ownedGames = [];
      return;
    }

    try {
      // ดึงเกมทั้งหมดจาก backend
      const allGames = await this.api.getGames();

      // กรองเฉพาะเกมที่ user เป็นเจ้าของ
      this.ownedGames = allGames
        .filter((g: any) => user.ownedGames.includes(g.id))
        .map((g: any) => ({
          id: g.id,
          title: g.title,
          genre: g.genre,
          price: g.price,
          image: g.imagePath
            ? `${environment.apiOrigin}/upload/${g.imagePath}`
            : 'assets/default-game.jpg',
        }));
    } catch (err) {
      console.error('โหลดคลังเกมไม่สำเร็จ', err);
      this.ownedGames = [];
    }
  }
}
