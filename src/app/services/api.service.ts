import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.API_URL;
  constructor(private http: HttpClient) {}

  register(email: string, password: string) {
    return this.http.post(`${this.base}/api/auth/register`, { email, password });
  }

  login(email: string, password: string) {
    return this.http.post(`${this.base}/api/auth/login`, { email, password });
  }

  me(email: string, password: string) {
    return this.http.post(`${this.base}/api/auth/me`, { email, password });
  }
}
