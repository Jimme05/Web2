import { Component } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserNavbar } from '../user-navbar/user-navbar';

interface CartItem {
  id: number;
  title: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-user-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor, NgIf, UserNavbar],
  templateUrl: './user-cart.html',
  styleUrl: './user-cart.scss'
})
export class UserCart {
  balance: number = 2000;
  cart: CartItem[] = [
    {
      id: 1,
      title: 'Name Game',
      price: 89.0,
      image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/873420/header.jpg'
    }
  ];

  discountCode: string = '';
  discountValue: number = 0;

  get totalPrice(): number {
    return this.cart.reduce((sum, item) => sum + item.price, 0);
  }

  get finalPrice(): number {
    return Math.max(this.totalPrice - this.discountValue, 0);
  }

  removeFromCart(item: CartItem) {
    this.cart = this.cart.filter(x => x.id !== item.id);
  }

  applyDiscount() {
    if (this.discountCode.trim().toLowerCase() === 'save10') {
      this.discountValue = this.totalPrice * 0.1;
      alert('ใช้โค้ดส่วนลดสำเร็จ! ลด 10%');
    } else {
      alert('รหัสส่วนลดไม่ถูกต้อง');
      this.discountValue = 0;
    }
  }

  checkout() {
    if (this.finalPrice > this.balance) {
      alert('ยอดเงินไม่พอ 💸');
      return;
    }

    this.balance -= this.finalPrice;
    alert('ชำระเงินสำเร็จ! ✅');
    this.cart = [];
    this.discountCode = '';
    this.discountValue = 0;
  }
}
