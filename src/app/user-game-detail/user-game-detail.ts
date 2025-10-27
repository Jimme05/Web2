import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/service';

@Component({
  selector: 'app-user-game-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-game-detail.html',
  styleUrl: './user-game-detail.scss'
})
export class UserGameDetail implements OnInit {
  game: any = null;
  private imageBase = 'http://202.28.34.203:30000';

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      await this.loadGame(id);
    }
  }

  async loadGame(id: number) {
    try {
      const res = await fetch(`${this.api['baseUrl']}/Games/${id}`);
      if (!res.ok) throw new Error('ไม่พบข้อมูลเกม');
      const g = await res.json();
      this.game = {
        ...g,
        imageUrl: g.fileName
          ? `${this.imageBase}/upload/${g.fileName}`
          : 'assets/no-image.png'
      };
    } catch (err) {
      console.error(err);
      this.game = null;
    }
  }
}
