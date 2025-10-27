import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavbar } from '../admin-navbar/admin-navbar';
import { DiscountService, DiscountCodeModel } from '../services/discount.service';

@Component({
  selector: 'app-admin-discount-codes',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbar],
  templateUrl: './admin-discount-codes.html',
  styleUrl: './admin-discount-codes.scss'
})
export class AdminDiscountCodes implements OnInit {
  // ฟอร์ม
  couponName = '';           // ชื่อโค้ด เช่น SAVE10
  discountPercent = 5;       // ค่า "amount" ถ้า isPercent = true
  usageLimit: number | null = 1;  // maxUses (รวมทุกคน)
  isPercent = false;          // true = ส่วนลดเป็น %, false = ลดเป็นจำนวนเงิน
  minOrderAmount: number | null = null;
  startAt: string | null = null;  // ISO string เช่น '2025-10-28T00:00:00Z'
  endAt: string | null = null;
  isActive = true;

  loading = false;

  // รายการคูปอง
  coupons: DiscountCodeModel[] = [];

  constructor(private discounts: DiscountService) {}

  async ngOnInit(): Promise<void> {
    await this.loadCoupons();
  }

  async loadCoupons(): Promise<void> {
    try {
      this.coupons = await this.discounts.listDiscounts();
    } catch (error) {
      console.error('โหลดคูปองไม่สำเร็จ:', error);
      this.coupons = [];
    }
  }

  async createCoupon(): Promise<void> {
    if (!this.couponName.trim()) {
      alert('กรุณากรอกชื่อโค้ด');
      return;
    }
    if (this.discountPercent <= 0) {
      alert('กรุณากรอกมูลค่าส่วนลด (> 0)');
      return;
    }

    this.loading = true;
    try {
      await this.discounts.createDiscount({
        code: this.couponName.trim().toUpperCase(), // normalize เป็นพิมพ์ใหญ่
        amount: this.discountPercent,
        isPercent: this.isPercent,
        maxUses: this.usageLimit ?? null,
        perUserLimit: null,
        minOrderAmount: this.minOrderAmount,
        startAt: this.startAt,
        endAt: this.endAt,
        isActive: this.isActive
      });

      alert('✅ สร้างคูปองสำเร็จ');
      // รีเซ็ตฟอร์มบางช่อง
      this.couponName = '';
      this.discountPercent = 5;
      this.usageLimit = 1;
      this.isPercent = true;
      this.minOrderAmount = null;
      this.startAt = null;
      this.endAt = null;
      this.isActive = true;

      await this.loadCoupons();
    } catch (err: any) {
      console.error('Error:', err);
      alert(err?.message || '❌ ไม่สามารถสร้างคูปองได้');
    } finally {
      this.loading = false;
    }
  }
}
