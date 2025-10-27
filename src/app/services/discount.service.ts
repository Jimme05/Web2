import { Injectable } from '@angular/core';
import { environment } from '../services/environment';

/** ====== Types ====== **/
export interface CreateDiscountDto {
  code: string;          // เช่น "SAVE10" (แนะนำส่งเป็นพิมพ์ใหญ่)
  amount: number;        // 50 = 50 บาท หรือ 10 = 10%
  isPercent: boolean;    // true = เปอร์เซ็นต์, false = จำนวนเงิน
  maxUses?: number | null;
  perUserLimit?: number | null;
  minOrderAmount?: number | null;
  startAt?: string | null;  // ISO string (ถ้ามี)
  endAt?: string | null;    // ISO string (ถ้ามี)
  isActive?: boolean;
}

export interface DiscountCodeModel extends Required<Omit<CreateDiscountDto, 'startAt'|'endAt'|'isActive'>> {
  id: number;
  usedCount: number;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PreviewDiscountDto {
  code: string;
  userId: number;
  orderAmount: number; // ยอดก่อนหัก
}

export interface PreviewResult {
  discountApplied: number; // มูลค่าส่วนลดที่ใช้ได้
  finalAmount: number;     // ยอดหลังหัก
}

export interface PurchaseRequestDto {
  userId: number;
  gameIds: number[];       // id เกมในคำสั่งซื้อ
  amount: number;          // ยอดรวมก่อนหัก
  discountCode?: string;   // optional
}

export interface PurchaseResult {
  balance: number;         // ยอดเงินคงเหลือหลังตัด
  discountApplied: number; // ส่วนลดที่ใช้จริง
  finalAmount: number;     // ยอดที่ถูกตัดจริง
}

@Injectable({ providedIn: 'root' })
export class DiscountService {
  private base = environment.apiOrigin; // ชี้ไปยัง .NET บน Render (HTTPS)

  /** Utility: ดึง JSON และโยน error ข้อความอ่านง่าย */
  private async json<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  /** =========================
   *  Admin — จัดการโค้ด
   *  ========================= */
  async createDiscount(dto: CreateDiscountDto): Promise<DiscountCodeModel> {
    // บังคับอัปเปอร์เคสเล็กน้อยที่ฝั่ง client
    const payload = { ...dto, code: dto.code.trim().toUpperCase() };
    const res = await fetch(`${this.base}/api/DiscountCodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return this.json<DiscountCodeModel>(res);
  }

  async listDiscounts(): Promise<DiscountCodeModel[]> {
    const res = await fetch(`${this.base}/api/DiscountCodes`);
    return this.json<DiscountCodeModel[]>(res);
  }

  async getDiscountByCode(code: string): Promise<DiscountCodeModel> {
    const res = await fetch(`${this.base}/api/DiscountCodes/${encodeURIComponent(code.trim().toUpperCase())}`);
    return this.json<DiscountCodeModel>(res);
  }

  /** =========================
   *  Preview ส่วนลดก่อนสั่งซื้อ
   *  ========================= */
  async previewDiscount(code: string, userId: number, orderAmount: number): Promise<PreviewResult> {
    const payload: PreviewDiscountDto = {
      code: code.trim().toUpperCase(),
      userId,
      orderAmount
    };
    const res = await fetch(`${this.base}/api/DiscountCodes/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return this.json<PreviewResult>(res);
  }

  /** =========================
   *  Purchase + ส่วนลดแบบอะตอมมิก
   *  (ฝั่ง .NET จะทำ: ตรวจโค้ด → คำนวณส่วนลด → ตัดเงิน → เพิ่ม UserGames → เก็บธุรกรรม)
   *  ========================= */
  async purchase(userId: number, gameIds: number[], amount: number, discountCode?: string): Promise<PurchaseResult> {
    const payload: PurchaseRequestDto = {
      userId,
      gameIds,
      amount,
      discountCode: discountCode?.trim() ? discountCode.trim().toUpperCase() : undefined
    };
    const res = await fetch(`${this.base}/api/Wallet/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return this.json<PurchaseResult>(res);
  }
}
