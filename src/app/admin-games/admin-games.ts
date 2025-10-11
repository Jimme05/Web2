import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminNavbar } from "../admin-navbar/admin-navbar";
import { GameCard, Game } from '../game-card/game-card';

@Component({
  selector: 'app-admin-games',
  standalone: true,
  imports: [CommonModule, AdminNavbar, GameCard],
  templateUrl: './admin-games.html',
  styleUrls: ['./admin-games.scss']
})
export class AdminGames {
  constructor(private router: Router) {}

  // ===========================
  // 🎮 ตัวอย่างข้อมูลเกม
  // ===========================
  games: Game[] = [
    {
      id: '1',
      name: 'POINT BLANK',
      genre: 'FPS',
      price: 89,
      description: 'เกมยิงสุดมันส์ เล่นได้ฟรี!',
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/873420/header.jpg'
    }
  ];

  // ===========================
  // 📦 ตัวแปรสำหรับ modal เพิ่มเกม
  // ===========================
  showModal = false;
  previewImage: string | null = null;

  newGame: Game = {
    id: '',
    name: '',
    genre: '',
    price: 0,
    description: '',
    image: ''
  };

  // ===========================
  // 🎯 เปิด/ปิด modal
  // ===========================
  openAddModal() {
    this.showModal = true;
    this.newGame = { id: '', name: '', genre: '', price: 0, description: '', image: '' };
    this.previewImage = null;
  }

  closeModal(event?: MouseEvent) {
    if (event && (event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showModal = false;
    } else if (!event) {
      this.showModal = false;
    }
  }

  // ===========================
  // 🖼️ อัปโหลดรูปเกม
  // ===========================
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result as string;
        this.newGame.image = this.previewImage;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  // ===========================
  // ➕ เพิ่มเกมใหม่
  // ===========================
  addGame() {
    if (!this.newGame.name || !this.newGame.genre || !this.newGame.price) return;

    this.newGame.id = Date.now().toString();
    this.newGame.image = this.previewImage || '';

    this.games.push({ ...this.newGame });
    this.showModal = false;
  }

  // ===========================
  // 🗑️ ลบเกม
  // ===========================
  deleteGame(g: Game) {
    if (confirm(`คุณแน่ใจว่าจะลบ "${g.name}" หรือไม่?`)) {
      this.games = this.games.filter(x => x.id !== g.id);
    }
  }

  // ===========================
  // ✏️ แก้ไขเกม
  // ===========================
  editGame(g: Game) {
    alert(`ฟังก์ชันแก้ไข "${g.name}" กำลังพัฒนา 🔧`);
  }

  // ===========================
  // 🔹 ปุ่ม navbar (backup ไว้ใช้ได้)
  // ===========================
  goToDashboard() {
    this.router.navigate(['/admin']);
  }

  goToManageGames() {
    this.router.navigate(['/admin/games']);
  }

  goToUsers() {
    this.router.navigate(['/admin/users']);
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/']);
  }
}
