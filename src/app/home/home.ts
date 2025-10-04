import { Component } from '@angular/core';
interface Game {
  id: number;
  title: string;
  genre: string;
  price: number;
  rank: number;
}
@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
balance = 5000;

  games: Game[] = [
    { id: 1, title: 'Cyberpunk Adventure', genre: 'RPG', price: 1590, rank: 1 },
    { id: 2, title: 'Racing Thunder', genre: 'Racing', price: 1299, rank: 2 },
    { id: 3, title: 'Space Strategy', genre: 'Strategy', price: 899, rank: 3 },
    { id: 4, title: 'Combat Elite', genre: 'FPS', price: 990, rank: 4 },
    { id: 5, title: 'Fantasy Quest', genre: 'Adventure', price: 1200, rank: 5 },
    { id: 6, title: 'Mech Warrior', genre: 'Action', price: 1100, rank: 6 }
  ];

  searchTerm = '';
  selectedGenre = 'ทุกประเภท';

  genres = ['ทุกประเภท', 'RPG', 'Racing', 'Strategy', 'FPS', 'Adventure', 'Action'];

  // ฟังก์ชันค้นหาเกม
  

  logout() {
    alert('ออกจากระบบเรียบร้อย ✅');
  }
}
