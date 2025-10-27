import { Component } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserNavbar } from '../user-navbar/user-navbar';
import { environment } from '../services/environment';

interface RawCartV1 { gameId: number; title: string; price: number; qty: number; imageFileName?: string | null; }
interface RawCartLegacy { id: number; title: string; price: number; image?: string; qty?: number; }

interface CartItem {
  gameId: number;
  title: string;
  price: number;
  qty: number;
  imageFileName?: string | null;
}

interface DiscountCode {
  id?: number;
  code: string;
  amount: number;
  isPercent: boolean;
  maxUses?: number;
  usedCount?: number;
  isActive?: boolean;
  minOrderAmount?: number;
}

@Component({
  selector: 'app-user-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor, NgIf, UserNavbar],
  templateUrl: './user-cart.html',
  styleUrl: './user-cart.scss'
})
export class UserCart {
  balance = 0;
  cart: CartItem[] = [];
  cartKey = 'cart:guest';

  coupons: DiscountCode[] = [];
  selectedCoupon: DiscountCode | null = null;
  discountValue = 0;

  private imageBase = 'http://202.28.34.203:30000';

  async ngOnInit() {
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
    await this.loadCoupons();
  }

  async loadCoupons() {
    try {
      const res = await fetch(`${environment.apiOrigin}/api/DiscountCodes`);
      if (!res.ok) throw new Error('โหลดคูปองไม่สำเร็จ');
      const data = await res.json();
      this.coupons = (data || []).filter((c: any) => c.isActive);
    } catch (err) {
      console.error('โหลดคูปองไม่สำเร็จ:', err);
      this.coupons = [];
    }
  }

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

  imageUrl(item: CartItem): string {
    if (!item.imageFileName) return `${this.imageBase}/no-image.png`;
    if (!/^https?:\/\//i.test(item.imageFileName)) {
      return `${this.imageBase}/upload/${item.imageFileName}`;
    }
    return item.imageFileName;
  }

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

  itemTotal(item: CartItem): number { return item.price * item.qty; }
  get totalPrice(): number { return this.cart.reduce((s, it) => s + it.price * it.qty, 0); }
  get finalPrice(): number { return Math.max(this.totalPrice - this.discountValue, 0); }

  applyDiscount() {
    if (!this.selectedCoupon) {
      this.discountValue = 0;
      return;
    }

    const c = this.selectedCoupon;
    if (!c.isActive) {
      alert('คูปองนี้ไม่สามารถใช้งานได้');
      this.discountValue = 0;
      return;
    }

    if (c.minOrderAmount && this.totalPrice < c.minOrderAmount) {
      alert(`ต้องมียอดซื้อขั้นต่ำ ฿${c.minOrderAmount}`);
      this.discountValue = 0;
      return;
    }

    this.discountValue = c.isPercent
      ? (this.totalPrice * c.amount) / 100
      : c.amount;

    alert(`ใช้คูปอง ${c.code} แล้ว! 🎉`);
  }

  // ✅ เชื่อมต่อ backend ที่มีส่วนลดจริง
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

    try {
      const body = {
        userId,
        items: this.cart.map(c => ({ gameId: c.gameId, qty: c.qty })),
        couponCode: this.selectedCoupon?.code || null // ✅ ใช้ชื่อเดียวกับ backend
      };

      const res = await fetch(`${environment.apiOrigin}/api/wallet/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'ชำระเงินไม่สำเร็จ');
      }

      const data = await res.json();

      // ✅ อัปเดตยอดเงินหลังหักส่วนลดจริง
      if (cu) {
        cu.walletBalance = data.balanceAfter;
        localStorage.setItem('currentUser', JSON.stringify(cu));
        this.balance = cu.walletBalance;
      }

      alert(
        `✅ ${data.message}\n\n` +
        `ยอดก่อนลด: ฿${data.subtotal}\n` +
        `ส่วนลด: ฿${data.discount}\n` +
        `ยอดสุทธิ: ฿${data.total}\n\n` +
        `เกมที่ซื้อ:\n${(data.purchasedGames || []).join('\n')}`
      );

      this.clearCart();
      this.selectedCoupon = null;
      this.discountValue = 0;
    } catch (e: any) {
      alert(e?.message || 'เกิดข้อผิดพลาดระหว่างชำระเงิน');
    }
  }

  get cartCount(): number {
    return this.cart.reduce((sum, it) => sum + it.qty, 0);
  }
}
