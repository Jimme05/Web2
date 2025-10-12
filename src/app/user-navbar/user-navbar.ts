import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/service';

@Component({
  selector: 'app-user-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './user-navbar.html',
  styleUrl: './user-navbar.scss'
})
export class UserNavbar implements OnInit, OnDestroy {
  /** รับค่าจากภายนอกได้ แต่ถ้าไม่ส่งมา จะโหลดเอง */
  @Input() balance: number = 0;
  @Input() cartCount: number = 0;

  private cartKey = 'cart:guest';
  private userId: number | null = null;
  private email: string | null = null;

  constructor(private router: Router, private api: ApiService) {}

  // --------------------
  // Lifecycle
  // --------------------
  async ngOnInit() {
    // อ่าน currentUser เพื่อทำ key ของตะกร้าให้เฉพาะคน + ใช้ userId ไปดึง wallet
    const cuRaw = localStorage.getItem('currentUser');
    if (cuRaw) {
      try {
        const cu = JSON.parse(cuRaw);
        this.userId = Number(cu?.id ?? null);
        this.email = cu?.email ?? null;

        const keyId = cu?.id || cu?.email || 'guest';
        this.cartKey = `cart:${keyId}`;
      } catch {}
    }

    // โหลดยอดเงิน (ถ้า caller ไม่ได้ส่ง balance เข้ามา)
    await this.loadWallet();

    // โหลดจำนวนสินค้าในตะกร้า
    this.loadCartCount();

    // อัปเดตอัตโนมัติถ้ามี tab อื่นแก้ localStorage
    window.addEventListener('storage', this.onStorageChange);
  }

  ngOnDestroy() {
    window.removeEventListener('storage', this.onStorageChange);
  }

  // ให้ component อื่นเรียกซ้ำได้ หลังเติมเงิน/ซื้อเกม
  public async refresh() {
    await this.loadWallet();
    this.loadCartCount();
  }

  // --------------------
  // Loaders
  // --------------------
  private async loadWallet() {
    try {
      // ถ้าไม่ได้รู้ userId ก็ข้าม
      if (!this.userId && !this.email) return;

      // ดึงจาก API: GET /api/Wallet/{userId}
      if (this.userId) {
        const w = await this.api.getWalletByUserId(this.userId);
        this.balance = Number(w?.balance ?? 0);
        return;
      }

      // (สำรอง) ถ้าไม่มี userId แต่มี currentUser ใน localStorage
      const cuRaw = localStorage.getItem('currentUser');
      if (cuRaw) {
        const cu = JSON.parse(cuRaw);
        this.balance = Number(cu?.walletBalance ?? this.balance ?? 0);
      }
    } catch {
      // เงียบไว้ก่อน กัน navbar พัง
    }
  }

  private loadCartCount() {
    try {
      const raw = localStorage.getItem(this.cartKey);
      if (!raw) {
        this.cartCount = 0;
        return;
      }
      const items: Array<{ qty?: number }> = JSON.parse(raw);
      this.cartCount = items.reduce((sum, it) => sum + (Number(it.qty ?? 1)), 0);
    } catch {
      this.cartCount = 0;
    }
  }

  // ฟัง event เวลา localStorage เปลี่ยน (เช่น อีกแท็บหนึ่งเพิ่มของลงตะกร้า)
  private onStorageChange = (e: StorageEvent) => {
    if (!e.key) return;
    if (e.key === this.cartKey || e.key.startsWith('cart:')) {
      this.loadCartCount();
    }
    if (e.key === 'currentUser') {
      // อัปเดตยอด balance ถ้ามีการแก้ไข currentUser
      this.loadWallet();
    }
  };

  // --------------------
  // Navigation
  // --------------------
  goToProfile() {
    this.router.navigate(['/profile']);
  }
  goToLibrary() {
    this.router.navigate(['/home/user-library']);
  }
  goToCart() {
    this.router.navigate(['/home/user-cart']);
  }
  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/']);
  }
}
