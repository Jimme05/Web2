import { Component } from '@angular/core';

@Component({
  selector: 'app-admin',
  imports: [],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class Admin {
  totalGames = 10;
  totalUsers = 2;
  totalSales = 0;
  totalCoupons = 0;

  bestSellers = [
    { rank: 1, name: 'Cyberpunk Adventure', sold: 2500 },
    { rank: 2, name: 'Racing Thunder', sold: 2100 },
    { rank: 3, name: 'Space Strategy', sold: 1800 },
    { rank: 4, name: 'Combat Elite', sold: 1500 },
    { rank: 5, name: 'Fantasy Quest', sold: 1200 }
  ];
}
