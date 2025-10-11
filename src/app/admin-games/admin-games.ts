import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminNavbar } from "../admin-navbar/admin-navbar";
import { GameCard, Game } from '../game-card/game-card';
import { ApiService } from '../services/service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-games',
  standalone: true,
  imports: [CommonModule, AdminNavbar, GameCard,FormsModule],
  templateUrl: './admin-games.html',
  styleUrls: ['./admin-games.scss']
})
export class AdminGames implements OnInit {
  constructor(private router: Router, private api: ApiService) {}

  games: Game[] = [];
  showModal = false;
  previewImage: string | null = null;
  selectedFile: File | null = null;

  newGame: Game = {
    id: '',
    name: '',
    genre: '',
    price: 0,
    description: '',
    image: ''
  };

  ngOnInit(): void {
    this.loadGames();
  }

  // ✅ โหลดเกมจาก backend (.NET)
  async loadGames() {
    try {
      const res = await this.api.getGames();
      this.games = res.map((g: any) => ({
        id: g.id,
        name: g.title,
        genre: g.genre,
        price: g.price,
        description: g.description,
        image: g.imagePath
          ? `http://202.28.34.203:30000/upload/${g.imagePath}`
          : 'assets/default-game.jpg'
      }));
    } catch (err) {
      console.error('โหลดเกมไม่สำเร็จ', err);
    }
  }

  // ===========================
  // Modal Control
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
  // Upload File + Preview
  // ===========================
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => (this.previewImage = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  // ===========================
  // เพิ่มเกมใหม่
  // ===========================
  async addGame() {
    if (!this.newGame.name || !this.newGame.genre || !this.newGame.price) return;

    try {
      let fileName = '';

      // ✅ อัปโหลดไฟล์ก่อน (ถ้ามี)
      if (this.selectedFile) {
        const form = new FormData();
        form.append('file', this.selectedFile, this.selectedFile.name);

        const uploadRes = await fetch('http://202.28.34.203:30000/upload', {
          method: 'POST',
          body: form
        });

        if (!uploadRes.ok) throw new Error('อัปโหลดรูปไม่สำเร็จ');
        const data = await uploadRes.json();
        fileName = data.storedName || data.filename || '';
      }

      // ✅ ส่งข้อมูลไปหลังบ้าน .NET
      const payload = {
        title: this.newGame.name,
        genre: this.newGame.genre,
        description: this.newGame.description,
        price: this.newGame.price,
        imagePath: fileName
      };

      await this.api.createGame(payload);
      alert('เพิ่มเกมสำเร็จ ✅');
      this.showModal = false;
      await this.loadGames();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }

  // ===========================
  // ลบเกม
  // ===========================
  async deleteGame(g: Game) {
    if (!confirm(`คุณแน่ใจว่าจะลบ "${g.name}" หรือไม่?`)) return;

    try {
      await this.api.deleteGame(g.id);
      this.games = this.games.filter(x => x.id !== g.id);
      alert('ลบเกมเรียบร้อย ✅');
    } catch (err) {
      alert('ลบเกมไม่สำเร็จ ❌');
    }
  }

  // ===========================
  // แก้ไขเกม (เพิ่มภายหลัง)
  // ===========================
  editGame(g: Game) {
    alert(`ฟังก์ชันแก้ไข "${g.name}" กำลังพัฒนา 🔧`);
  }
}
