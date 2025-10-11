import { Injectable } from '@angular/core';

// src/app/services/service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'https://wepapi-59g1.onrender.com/api';

  async login(email: string, password: string) {
    const res = await fetch(`${this.baseUrl}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error((await res.text()) || 'Login failed');
    return res.json(); // <-- จะได้ { id, email, role }
  }

  async register(Name: string, Email: string, Password: string, profileImage?: string) {
    const res = await fetch(`${this.baseUrl}/Auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Name, Email, Password, profileImage })
    });
    if (!res.ok) throw new Error((await res.text()) || 'Register failed');
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
  async getGames() {
    const res = await fetch(this.baseUrl + '/Games');
    if (!res.ok) throw new Error('โหลดเกมไม่สำเร็จ');
    return res.json();
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
}
