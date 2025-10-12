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
  selectedGame: Game | null = null;  // ✅ เก็บเกมที่คลิก
  showDetailModal = false;  // ✅ Modal รายละเอียด
  
  editMode = false; // ✅ โหมดแก้ไข

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
    const toImg = (p?: string | null) =>
      !p ? 'assets/default-game.jpg'
         : (/^https?:\/\//i.test(p) ? p : `/upload/${p}`); // ✅ ไปผ่าน Netlify Function

    const res = await this.api.getGames();
    this.games = res.map((g: any) => ({
      id: g.id,
      title: g.title,               // ✅ ใช้ title ให้ตรงกับ interface/UI
      genre: g.genre,
      price: g.price,
      description: g.description ?? '',
      image: toImg(g.imagePath)     // ✅ รูปไปที่ /upload/<fileName>
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
     this.editMode = false;
    this.newGame = { id: '', name: '', genre: '', price: 0, description: '', image: '' };
    this.previewImage = null;
  }
  openEditModal(g: Game) {
    this.showModal = true;
    this.editMode = true; // ✅ เปิดโหมดแก้ไข
    this.newGame = { ...g };
    this.previewImage = g.image;
    this.selectedGame = g;
  }


  closeModal(event?: MouseEvent) {
    if (event && (event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showModal = false;
    } else if (!event) {
      this.showModal = false;
    }
  }

   // ✅ เปิดรายละเอียดเกม
  openDetailModal(game: Game) {
    this.selectedGame = game;
    this.showDetailModal = true;
  }

  // ✅ ปิด modal รายละเอียด
  closeDetailModal(event?: MouseEvent) {
    if (event && (event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showDetailModal = false;
    } else if (!event) {
      this.showDetailModal = false;
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

  async updateGame() {
    if (!this.newGame.id) return;

    try {
      let fileName = '';

      // ✅ ถ้ามีอัปโหลดรูปใหม่
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

      const payload = {
        id: this.newGame.id,
        title: this.newGame.name,
        genre: this.newGame.genre,
        description: this.newGame.description,
        price: this.newGame.price,
        imagePath: fileName || this.newGame.image
      };

      await this.api.updateGame(payload.id, payload);

      // ✅ อัปเดตเฉพาะใน list ไม่ต้อง reload ทั้งหมด
      const index = this.games.findIndex(g => g.id === payload.id);
      if (index !== -1) {
        this.games[index] = {
          id: payload.id,
          name: payload.title,
          genre: payload.genre,
          description: payload.description,
          price: payload.price,
          image: fileName
            ? `http://202.28.34.203:30000/upload/${fileName}`
            : this.games[index].image
        };
      }

      alert('แก้ไขข้อมูลสำเร็จ ✅');
      this.showModal = false;
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
    this.openEditModal(g);
  }
}
