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


      // 🟧 (optional) โหลดจำนวนโค้ดส่วนลด
      this.totalCoupons = 0; // ถ้ายังไม่มี endpoint ก็ใส่ค่า mock ไปก่อน

      // 🏆 โหลดเกมขายดี (สุ่มโชว์)
      this.bestSellers = games
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map((g: any) => ({
          id: g.id,
          name: g.title,
        }));
    } catch (err) {
      console.error('โหลดข้อมูล Dashboard ไม่สำเร็จ', err);
    }
  }
}
