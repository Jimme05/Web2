import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
export interface Game {
  id: string;
  name: string;
  genre: string;
  price: number;
  description?: string;
  image: string;
}
@Component({
  selector: 'app-game-card',
  imports: [CommonModule],
  templateUrl: './game-card.html',
  styleUrl: './game-card.scss'
})
export class GameCard {
 @Input() game!: Game; // รับข้อมูลเกมจาก parent
  @Output() edit = new EventEmitter<Game>();
  @Output() delete = new EventEmitter<Game>();
}
