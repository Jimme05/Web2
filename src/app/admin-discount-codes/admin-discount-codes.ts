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
  couponName = '';
  discountPercent = 5;
  usageLimit: number | null = 1;
  perUserLimit: number | null = 1; // ✅ เพิ่มใหม่
  isPercent = false;
  minOrderAmount: number | null = null;
  startAt: string | null = null;
  endAt: string | null = null;
  isActive = true;
  loading = false;

  // สถานะแก้ไข
  editing = false;
  editingId: number | null = null;

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

  // ✅ สร้างหรืออัปเดตคูปอง
  async saveCoupon(): Promise<void> {
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
      if (this.editing && this.editingId) {
        // 🟡 แก้ไขคูปอง
        await this.discounts.updateDiscount(this.editingId, {
          amount: this.discountPercent,
          isPercent: this.isPercent,
          maxUses: this.usageLimit,
          perUserLimit: this.perUserLimit, // ✅ ส่งเพิ่ม
          minOrderAmount: this.minOrderAmount,
          startAt: this.startAt,
          endAt: this.endAt,
          isActive: this.isActive
        });
        alert('✅ แก้ไขคูปองสำเร็จ');
      } else {
        // 🟢 สร้างใหม่
        await this.discounts.createDiscount({
          code: this.couponName.trim().toUpperCase(),
          amount: this.discountPercent,
          isPercent: this.isPercent,
          maxUses: this.usageLimit,
          perUserLimit: this.perUserLimit, // ✅ ส่งเพิ่ม
          minOrderAmount: this.minOrderAmount,
          startAt: this.startAt,
          endAt: this.endAt,
          isActive: this.isActive
        });
        alert('✅ สร้างคูปองสำเร็จ');
      }

      this.resetForm();
      await this.loadCoupons();
    } catch (err: any) {
      console.error('Error:', err);
      alert(err?.message || '❌ ไม่สามารถบันทึกคูปองได้');
    } finally {
      this.loading = false;
    }
  }

  editCoupon(c: DiscountCodeModel) {
    this.editing = true;
    this.editingId = c.id;
    this.couponName = c.code;
    this.discountPercent = c.amount;
    this.isPercent = c.isPercent;
    this.usageLimit = c.maxUses ?? null;
    this.perUserLimit = c.perUserLimit ?? null; // ✅ โหลดเข้าฟอร์ม
    this.minOrderAmount = c.minOrderAmount ?? null;
    this.startAt = c.startAt ?? null;
    this.endAt = c.endAt ?? null;
    this.isActive = c.isActive;
  }

  cancelEdit() {
    this.resetForm();
  }

  async deleteCoupon(c: DiscountCodeModel) {
    if (!confirm(`ต้องการลบคูปอง "${c.code}" ใช่หรือไม่?`)) return;

    try {
      await this.discounts.deleteDiscount(c.id);
      alert('🗑️ ลบคูปองสำเร็จ');
      await this.loadCoupons();
    } catch (err) {
      console.error('ลบไม่สำเร็จ:', err);
      alert('❌ ไม่สามารถลบคูปองได้');
    }
  }

  private resetForm() {
    this.couponName = '';
    this.discountPercent = 5;
    this.usageLimit = 1;
    this.perUserLimit = 1;
    this.isPercent = false;
    this.minOrderAmount = null;
    this.startAt = null;
    this.endAt = null;
    this.isActive = true;
    this.editing = false;
    this.editingId = null;
  }
}
