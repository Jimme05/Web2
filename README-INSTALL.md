# Web2 API Integration (SimpleAuth backend)

This bundle adds a simple API service and a Login test page to connect your Angular app to:
`https://wepapi-59g1.onrender.com`

## Files included
- `src/environments/environment.ts` (dev: http://localhost:5050)
- `src/environments/environment.prod.ts` (prod: https://wepapi-59g1.onrender.com)
- `src/app/services/api.service.ts`
- `src/app/pages/login/login.component.ts`
- `src/app/pages/login/login.component.html`

## How to apply
1. Copy these files into your `Web2` project (same paths).
2. Ensure Angular modules are imported:
   - In `app.module.ts`:
     ```ts
     import { HttpClientModule } from '@angular/common/http';
     import { FormsModule } from '@angular/forms';
     import { LoginComponent } from './app/pages/login/login.component'; // adjust relative path
     
     @NgModule({
       declarations: [LoginComponent],
       imports: [BrowserModule, HttpClientModule, FormsModule]
     })
     export class AppModule {}
     ```
   - Or, if your project uses **standalone components** (Angular v16+), add `provideHttpClient()` and import the component route accordingly.

3. Add a route to the Login page (if using Router):
   - In `app-routing.module.ts`:
     ```ts
     import { LoginComponent } from './app/pages/login/login.component';
     const routes: Routes = [
       { path: 'login', component: LoginComponent },
       { path: '**', redirectTo: 'login' }
     ];
     ```

4. Dev run with proxy (optional):
   - Create `proxy.conf.json` at project root:
     ```json
     {
       "/api": { "target": "http://localhost:5050", "secure": false, "changeOrigin": true }
     }
     ```
   - Update package.json script:
     ```json
     { "start": "ng serve --proxy-config proxy.conf.json" }
     ```
   - Start:
     ```bash
     npm install
     npm run start
     ```
   Your Angular dev will call backend via `/api/*` automatically.

5. Production:
   - Build Angular: `ng build --configuration production`
   - Deploy the generated `dist/` to your hosting.
   - Angular will call API at `https://wepapi-59g1.onrender.com` per `environment.prod.ts`.

## Notes
- Backend requires sending email/password for each auth-related call (no cookies/tokens). Make sure **HTTPS** is used in production.
- If you change your backend URL later, update both `environment.ts` and `environment.prod.ts`.
