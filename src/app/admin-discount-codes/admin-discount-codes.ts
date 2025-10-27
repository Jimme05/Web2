import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavbar } from '../admin-navbar/admin-navbar';
import { ApiService } from '../services/service';

@Component({
  selector: 'app-admin-discount-codes',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbar],
  templateUrl: './admin-discount-codes.html',
  styleUrl: './admin-discount-codes.scss'
})
export class AdminDiscountCodes implements OnInit {  // ✅ เพิ่ม implements OnInit
  couponName = '';
  usageLimit = 1;
  discountPercent = 5;
  loading = false;
  coupons: any[] = [];

  constructor(private api: ApiService) {}

  async ngOnInit(): Promise<void> {   // ✅ มี Promise<void> ชัดเจน
    await this.loadCoupons();
  }

  async loadCoupons(): Promise<void> {
    try {
      const res = await this.api.getDiscountCodes();
      this.coupons = res;
    } catch (error) {
      console.error('โหลดคูปองไม่สำเร็จ:', error);
      this.coupons = [];
    }
  }

 async createCoupon(): Promise<void> {
  if (!this.couponName || this.discountPercent <= 0) {
    alert('กรุณากรอกข้อมูลให้ครบ');
    return;
  }

  this.loading = true;
  try {
    const data = {
      codeName: this.couponName,        // ✅ ตรงกับ backend
      discountPercent: this.discountPercent,
      usageLimit: this.usageLimit,
      isActive: true
    };

    await this.api.createDiscountCode(data);
    alert('✅ สร้างคูปองสำเร็จ');
    this.couponName = '';
    this.usageLimit = 1;
    this.discountPercent = 5;
    await this.loadCoupons();
  } catch (err) {
    console.error('Error:', err);
    alert('❌ ไม่สามารถสร้างคูปองได้');
  } finally {
    this.loading = false;
  }
}
}