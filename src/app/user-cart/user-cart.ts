import { Component } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserNavbar } from '../user-navbar/user-navbar';
import { environment } from '../services/environment'; // ✅ ใช้ base URL backend

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
  cartKey = 'cart:guest';

  // ส่วนลด
  discountCode = '';
  discountValue = 0;

  // รูปจากเซิร์ฟเวอร์ 203
  private imageBase = 'http://202.28.34.203:30000';

  ngOnInit() {
    // ทำ key ตะกร้าตามผู้ใช้ และโหลดยอดเงิน
    const cu = localStorage.getItem('currentUser');
    if (cu) {
      try {
        const u = JSON.parse(cu);
        const keyId = u?.id || u?.email || 'guest';
        this.cartKey = `cart:${keyId}`;
        this.balance = Number(u?.walletBalance ?? 0);
      } catch {
        this.cartKey = 'cart:guest';
      }
    }
    this.loadCart();
  }

  // ===== Helpers =====
  private normalize(raw: RawCartV1 | RawCartLegacy): CartItem {
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
    if (!item.imageFileName) return `${this.imageBase}/no-image.png`;
    if (!/^https?:\/\//i.test(item.imageFileName)) {
      return `${this.imageBase}/upload/${item.imageFileName}`;
    }
    return item.imageFileName;
  }

  // ===== จำนวน/ลบ =====
  increase(item: CartItem) { item.qty += 1; this.saveCart(); }
  decrease(item: CartItem) {
    item.qty -= 1;
    if (item.qty <= 0) this.cart = this.cart.filter(x => x.gameId !== item.gameId);
    this.saveCart();
  }
  removeFromCart(item: CartItem) {
    this.cart = this.cart.filter(x => x.gameId !== item.gameId);
    this.saveCart();
  }
  clearCart() { this.cart = []; this.saveCart(); }

  // ===== คำนวณราคา =====
  itemTotal(item: CartItem): number { return item.price * item.qty; }
  get totalPrice(): number { return this.cart.reduce((s, it) => s + it.price * it.qty, 0); }
  get finalPrice(): number { return Math.max(this.totalPrice - this.discountValue, 0); }

  // ===== ส่วนลด (ทดลอง) =====
  applyDiscount() {
    if (this.discountCode.trim().toLowerCase() === 'save10') {
      this.discountValue = this.totalPrice * 0.1;
      alert('ใช้โค้ดส่วนลดสำเร็จ! ลด 10%');
    } else {
      alert('รหัสส่วนลดไม่ถูกต้อง');
      this.discountValue = 0;
    }
  }

  // ===== Checkout กับ Backend =====
  async checkout() {
    if (this.cart.length === 0) {
      alert('ตะกร้าว่าง');
      return;
    }

    const cuRaw = localStorage.getItem('currentUser');
    const cu = cuRaw ? JSON.parse(cuRaw) : null;
    const userId = cu?.id;
    if (!userId) {
      alert('กรุณาเข้าสู่ระบบก่อนทำรายการ');
      return;
    }

    if (this.finalPrice > this.balance) {
      alert('ยอดเงินไม่พอ 💸');
      return;
    }

    try {
      // เตรียม body สำหรับ API /api/wallet/purchase
      const body = {
        userId,
        items: this.cart.map(c => ({ gameId: c.gameId, qty: c.qty }))
      };

      const res = await fetch(`${environment.apiOrigin}/api/wallet/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'ชำระเงินไม่สำเร็จ');
      }

      const data = await res.json();

      // อัปเดตยอดเงินใน localStorage ให้ตรงกับ backend
      if (cu) {
        cu.walletBalance = data?.balanceAfter ?? (cu.walletBalance - this.finalPrice);
        localStorage.setItem('currentUser', JSON.stringify(cu));
        this.balance = cu.walletBalance;
      }

      // เก็บธุรกรรมแบบฝั่ง client (optional)
      const txKey = 'transactions';
      const txRaw = localStorage.getItem(txKey);
      const txList = txRaw ? JSON.parse(txRaw) : [];
      txList.push({
        id: Date.now().toString(),
        userId,
        type: 'purchase',
        amount: data?.total ?? this.finalPrice,
        description: data?.purchasedGames?.join(', ') || `ซื้อเกม ${this.cart.length} รายการ`,
        balanceBefore: data?.balanceBefore ?? this.balance + this.finalPrice,
        balanceAfter: data?.balanceAfter ?? this.balance,
        gamesPurchased: this.cart.map(x => x.title),
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(txKey, JSON.stringify(txList));

      alert(`ชำระเงินสำเร็จ! ✅\n${(data?.purchasedGames || []).join('\n')}`);

      this.clearCart();
      this.discountCode = '';
      this.discountValue = 0;
    } catch (e: any) {
      alert(e?.message || 'เกิดข้อผิดพลาดระหว่างชำระเงิน');
    }
  }

  // สำหรับ Navbar
  get cartCount(): number {
    return this.cart.reduce((sum, it) => sum + it.qty, 0);
  }
}
