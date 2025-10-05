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

  async register(name: string, email: string, password: string, AvatarUrl?: string) {
    const res = await fetch(`${this.baseUrl}/Auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, AvatarUrl })
    });
    if (!res.ok) throw new Error((await res.text()) || 'Register failed');
    return res.json();
  }
}
