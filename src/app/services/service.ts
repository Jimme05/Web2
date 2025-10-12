import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root' // ✅ สำคัญมาก
})
export class ApiService {
  private baseUrl = 'https://wepapi-59g1.onrender.com/api'
  private pho = 'http://202.28.34.203:30000';
  constructor(private http: HttpClient) { }


  async login(email: string, password: string) {
    const res = await fetch(`${this.baseUrl}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error((await res.text()) || 'Login failed');
    return res.json(); // <-- จะได้ { id, email, role }
  }

  async registerMultipart(name: string, email: string, password: string, file?: File) {
    const fd = new FormData();
    // ชื่อ key ต้องตรงกับ DTO (ตัวพิมพ์เล็ก/ใหญ่ไม่ซีเรียส แต่ให้สะอาด ๆ ตามนี้)
    fd.append('Name', name);
    fd.append('Email', email);
    fd.append('Password', password);
    if (file) fd.append('ProfileImage', file, file.name);

    const res = await fetch(`${this.baseUrl}/Auth/register`, {
      method: 'POST',
      body: fd,                 // ❌ ห้ามใส่ headers 'Content-Type'
      credentials: 'include'    // ถ้ามี cookie
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  async topup(userId: number, amount: number): Promise<any> {
  const now = new Date().toISOString();
  
  const payload = {
    id: 0,
    userId,
    type: 'topup',
    amount,
    balanceBefore: 0,   // ให้ backend คำนวณจริงเองได้
    balanceAfter: 0,
    description: `เติมเงินจำนวน ${amount} บาท`,
    createdAt: now
  };

  const res = await fetch(`${this.baseUrl}/Wallet/topup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Topup failed');
  }

  return res.json();
}



  async me(email: string) {
    const res = await fetch(`${this.baseUrl}/Auth/me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error(await res.text() || 'Fetch profile failed');
    return res.json(); // { id, name, email, role, profileImage, ... }
  }

  async updateProfile(email: string, formData: FormData) {
    return fetch(`${this.baseUrl}/Auth/me/${email}`, {
      method: "PUT",
      body: formData
    });
  }
  async updateByEmailForm(
    payload: { email: string; name: string; password?: string; file?: File | null }
  ) {
    const fd = new FormData();
    fd.append('Email', payload.email);
    fd.append('Name', payload.name);
    if (payload.password) fd.append('Password', payload.password);
    if (payload.file) fd.append('profileImage', payload.file, payload.file.name);

    const res = await fetch(`${this.baseUrl}/Auth/updateByEmail`, {
      method: 'PUT',
      // อย่าเซ็ต Content-Type เอง ให้ browser ใส่ multipart boundary ให้
      body: fd,
    });

    // บางกรณี API ตอบ 200 แต่ไม่มี body -> อย่าพยายาม parse JSON
    const ct = res.headers.get('content-type') || '';
    let data: any = null;
    if (ct.includes('application/json')) {
      data = await res.json();
    } else {
      // มีแต่ข้อความ/ว่าง
      const t = await res.text();
      data = t || null;
    }

    if (!res.ok) {
      // โยนข้อความ error ที่อ่านได้จริง ๆ
      const msg = (data && data.message) || (typeof data === 'string' ? data : res.statusText);
      throw new Error(msg || 'Update failed');
    }
    return data; // อาจเป็น null ได้ ถ้า API ไม่ส่ง body
  }
  async getGames(search: string = '', genre: string = '') {
    // ✅ รองรับ query parameters เช่น ?search=FPS&genre=Action
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (genre) params.append('genre', genre);

    const res = await fetch(`${this.baseUrl}/Games?${params.toString()}`);
    if (!res.ok) throw new Error('โหลดเกมไม่สำเร็จ');

    const data = await res.json();

    // ✅ เติม URL รูปจาก 203 ให้เกมแต่ละรายการ
    return data.map((g: any) => ({
      ...g,
      imageUrl: g.FileName
        ? `${this.pho}/upload/${g.FileName}`
        : 'assets/no-image.png'
    }));
  }
 imageUrl(fileName?: string | null): string {
  if (!fileName) return 'assets/default.png';
  return `/upload/${fileName}`; // ✅ Netlify จะ redirect ไปยัง proxy HTTPS ให้อัตโนมัติ
}

  // คลังเกมของผู้ใช้ด้วย userId
async getLibraryByUserId(userId: number) {
  const res = await fetch(`${this.baseUrl}/Library/${userId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // UserLibraryItemDto[]
}

// คลังเกมของผู้ใช้ด้วยอีเมล
async getLibraryByEmail(email: string) {
  const res = await fetch(`${this.baseUrl}/Library/by-email?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ตรวจเป็นเจ้าของเกมแล้วหรือยัง
async hasGame(userId: number, gameId: number) {
  const res = await fetch(`${this.baseUrl}/Library/has/${userId}/${gameId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ owned: boolean }>;
}


  async createGame(data: any) {
    const res = await fetch(this.baseUrl + '/Games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('เพิ่มเกมไม่สำเร็จ');
    return res.json();
  }

  async deleteGame(id: string) {
    const res = await fetch(`${this.baseUrl}/Games/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('ลบเกมไม่สำเร็จ');
    return res.json();
  }

  async updateGame(id: string, data: any) {
    const res = await fetch(`${this.baseUrl}/Games/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('อัปเดตเกมไม่สำเร็จ');
    return res.json();
  }
  async getUsers() {
    return this.http.get(`${this.baseUrl}/Transactions`);
  }

  async getTransactionsByUser(email?: string, userId?: number) {
    let query = '';
    if (email) query = `email=${encodeURIComponent(email)}`;
    else if (userId) query = `userId=${userId}`;
    else throw new Error('ต้องระบุ email หรือ userId');

    const res = await fetch(`${this.baseUrl}/Transactions/by-user?${query}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
  async getWalletByUserId(userId: number): Promise<{ id: number; userId: number; balance: number }> {
  const res = await fetch(`${this.baseUrl}/Wallet/${userId}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'ไม่สามารถดึงข้อมูลกระเป๋าเงินได้');
  }

  return res.json();
}


}
