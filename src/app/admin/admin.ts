import { Component, OnInit } from '@angular/core';
import { AdminNavbar } from "../admin-navbar/admin-navbar";
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [AdminNavbar, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class Admin implements OnInit {
  constructor(private router: Router, private api: ApiService) {}

  totalGames = 0;
  totalUsers = 0;
  totalSales = 0;
  totalCoupons = 0;
  bestSellers: any[] = [];

  async ngOnInit() {
    await this.loadSummary();
  }

  async loadSummary() {
    try {
      // 🟦 โหลดจำนวนเกมทั้งหมด
      const games = await this.api.getGames();
      this.totalGames = games.length;

      // 🟩 โหลดจำนวนผู้ใช้ (ถ้ามี endpoint จริง)
      try {
        const usersRes = await fetch(`${this.api['baseUrl']}/Auth/all`);
        this.totalUsers = usersRes.ok ? (await usersRes.json()).length : 0;
      } catch {
        this.totalUsers = 0;
      }

      // 🟧 โหลดคูปอง
      try {
        const coupons = await this.api.getDiscountCodes();
        this.totalCoupons = (coupons || []).filter((c: any) => c.active).length;
      } catch {
        this.totalCoupons = 0;
      }

      // 🟥 โหลดยอดขายรวม
      try {
        const txnsRes = await fetch(`${this.api['baseUrl']}/Transactions`);
        if (txnsRes.ok) {
          const txns = await txnsRes.json();
          this.totalSales = txns
            .filter((t: any) => t.type === 'purchase')
            .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        }
      } catch {
        this.totalSales = 0;
      }

      // 🏆 โหลดอันดับเกมขายดี
      await this.loadBestSellers(games);
    } catch (err) {
      console.error('❌ โหลดข้อมูล Dashboard ไม่สำเร็จ:', err);
    }
  }

  // 🏆 โหลดอันดับขายดี
  async loadBestSellers(games: any[]) {
    try {
      // ✅ ถ้ามี API /Games/best-sellers ให้ลองเรียกก่อน
      const res = await fetch(`${this.api['baseUrl']}/Games/best-sellers`);
      if (res.ok) {
        const list = await res.json();
        this.bestSellers = (list || []).map((g: any, i: number) => ({
          id: g.id,
          rank: i + 1,
          name: g.title || g.name,
          sold: g.totalSold || g.sold || 0,
          image: g.imagePath
            ? `http://202.28.34.203:30000/upload/${g.imagePath}`
            : g.fileName
            ? `http://202.28.34.203:30000/upload/${g.fileName}`
            : 'assets/no-image.png',
        }));
        return;
      }
    } catch (err) {
      console.warn('⚠️ ไม่มี API /Games/best-sellers — ใช้ mock data แทน');
    }

    // 🔸 ถ้าไม่มี API จริง ใช้ mock จาก games ธรรมดา
    this.bestSellers = games
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map((g: any, index: number) => ({
        id: g.id,
        rank: index + 1,
        name: g.title || g.name,
        sold: Math.floor(Math.random() * 500), // mock ยอดขาย
        image: g.fileName
          ? `http://202.28.34.203:30000/upload/${g.fileName}`
          : g.imagePath
          ? `http://202.28.34.203:30000/upload/${g.imagePath}`
          : 'assets/no-image.png',
      }));
  }
}
