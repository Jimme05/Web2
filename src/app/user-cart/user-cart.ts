import { Component } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserNavbar } from '../user-navbar/user-navbar';

interface RawCartV1 { gameId: number; title: string; price: number; qty: number; imageFileName?: string | null; }
interface RawCartLegacy { id: number; title: string; price: number; image?: string; qty?: number; }

interface CartItem {
  gameId: number;
  title: string;
  price: number;
  qty: number;
  imageFileName?: string | null;
}

@Component({
  selector: 'app-user-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor, NgIf, UserNavbar],
  templateUrl: './user-cart.html',
  styleUrl: './user-cart.scss'
})

export class UserCart {
  // แสดงบน navbar
  balance = 0;

  // ตะกร้า
  cart: CartItem[] = [];
  cartKey = 'cart:<userId>';
  
  // ส่วนลด
  discountCode = '';
  discountValue = 0;

  // base รูปจากเซิร์ฟเวอร์ 203
  private imageBase = 'http://202.28.34.203:30000';

  ngOnInit() {
    // ดึง currentUser เพื่อทำ key cart แยกตามคน และโหลดยอดเงิน
    const cu = localStorage.getItem('currentUser');
    if (cu) {
      try {
        const u = JSON.parse(cu);
        const keyId = u?.id || u?.email || 'guest';
        this.cartKey = `cart:${keyId}`;
        this.balance = Number(u?.walletBalance ?? 100);
      } catch {
        this.cartKey = 'cart:guest';
      }
    }
    this.loadCart();
  }

  // ===== Helpers =====
  private normalize(raw: RawCartV1 | RawCartLegacy): CartItem {
    // รองรับของใหม่ (addToCart) และของเก่า
    const asV1 = raw as RawCartV1;
    const asLegacy = raw as RawCartLegacy;

    if (typeof (asV1 as any).gameId === 'number') {
      return {
        gameId: asV1.gameId,
        title: asV1.title,
        price: asV1.price,
        qty: asV1.qty ?? 1,
        imageFileName: asV1.imageFileName ?? null
      };
    }
    // legacy: { id,title,price,image, qty? }
     
    return {
      gameId: asLegacy.id,
      title: asLegacy.title,
      price: asLegacy.price,
      qty: asLegacy.qty ?? 1,
      imageFileName: asLegacy.image ?? null
     
    };
  }
  
  private saveCart() {
    localStorage.setItem(this.cartKey, JSON.stringify(this.cart));
  }

  loadCart() {
    const raw = localStorage.getItem(this.cartKey);
    if (!raw) {
      this.cart = [];
      return;
    }
    try {
      const arr = JSON.parse(raw) as Array<RawCartV1 | RawCartLegacy>;
      this.cart = arr.map(x => this.normalize(x));
    } catch {
      this.cart = [];
    }
    
    
  }

  // ===== รูป =====
imageUrl(item: CartItem): string {
  if (!item.imageFileName) return 'http://202.28.34.203:30000/no-image.png';
  if (!/^https?:\/\//i.test(item.imageFileName)) {
    return `http://202.28.34.203:30000/upload/${item.imageFileName}`;
  }
  return item.imageFileName;
}


  // ===== จำนวน / ลบ =====
  increase(item: CartItem) {
    item.qty += 1;
    this.saveCart();
  }

  decrease(item: CartItem) {
    item.qty -= 1;
    if (item.qty <= 0) {
      this.cart = this.cart.filter(x => x.gameId !== item.gameId);
    }
    this.saveCart();
  }

  removeFromCart(item: CartItem) {
    this.cart = this.cart.filter(x => x.gameId !== item.gameId);
    this.saveCart();
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
  }

  // ===== คำนวณราคา =====
  itemTotal(item: CartItem): number {
    return item.price * item.qty;
  }

  get totalPrice(): number {
    return this.cart.reduce((sum, it) => sum + it.price * it.qty, 0);
  }

  get finalPrice(): number {
    return Math.max(this.totalPrice - this.discountValue, 0);
  }

  // ===== ส่วนลด (เดิม) =====
  applyDiscount() {
    if (this.discountCode.trim().toLowerCase() === 'save10') {
      this.discountValue = this.totalPrice * 0.1;
      alert('ใช้โค้ดส่วนลดสำเร็จ! ลด 10%');
    } else {
      alert('รหัสส่วนลดไม่ถูกต้อง');
      this.discountValue = 0;
    }
  }

  // ===== Checkout พื้นฐาน (ตัดยอดจาก localStorage currentUser) =====
  checkout() {
    if (this.cart.length === 0) {
      alert('ตะกร้าว่าง');
      return;
    }
    if (this.finalPrice > this.balance) {
      alert('ยอดเงินไม่พอ 💸');
      return;
    }

    // ตัดเงินฝั่ง client (localStorage)
    const cuRaw = localStorage.getItem('currentUser');
    if (cuRaw) {
      try {
        const cu = JSON.parse(cuRaw);
        cu.walletBalance = Number(cu.walletBalance ?? 0) - this.finalPrice;
        localStorage.setItem('currentUser', JSON.stringify(cu));
        this.balance = cu.walletBalance;
      } catch {}
    }

    // เก็บประวัติธุรกรรมแบบง่าย ๆ ฝั่ง client (optional)
    const txKey = 'transactions';
    const txRaw = localStorage.getItem(txKey);
    const txList = txRaw ? JSON.parse(txRaw) : [];
    txList.push({
      id: Date.now().toString(),
      userId: (JSON.parse(cuRaw || '{}')?.id) ?? 'guest',
      type: 'purchase',
      amount: this.finalPrice,
      description: `ซื้อเกม ${this.cart.length} รายการ`,
      balanceBefore: this.balance + this.finalPrice,
      balanceAfter: this.balance,
      gamesPurchased: this.cart.map(x => x.title),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(txKey, JSON.stringify(txList));

    alert('ชำระเงินสำเร็จ! ✅');

    this.clearCart();
    this.discountCode = '';
    this.discountValue = 0;
  }

  // สำหรับ Navbar
  get cartCount(): number {
    return this.cart.reduce((sum, it) => sum + it.qty, 0);
  }
}
