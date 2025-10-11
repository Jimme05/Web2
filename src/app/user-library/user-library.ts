import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserNavbar } from '../user-navbar/user-navbar';

interface Game {
  id: number;
  title: string;
  genre: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-user-library',
  standalone: true,
  imports: [CommonModule, UserNavbar],
  templateUrl: './user-library.html',
  styleUrl: './user-library.scss'
})
export class UserLibrary {
  balance: number = 2000.00;
  cartCount: number = 0;

  ownedGames: Game[] = [
    {
      id: 1,
      title: 'POINT BLANK',
      genre: 'RPG',
      price: 89.00,
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/873420/header.jpg'
    }
  ];
}
