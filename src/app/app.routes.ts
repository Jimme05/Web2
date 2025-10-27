import { Routes } from '@angular/router';
import { Main } from './main/main';
import { Admin } from './admin/admin';
import { Home } from './home/home';
import { Profile } from './profile/profile';
import { EditProfile } from './edit-profile/edit-profile';
import { AdminGames } from './admin-games/admin-games';
import { AdminUsers } from './admin-users/admin-users';
import { UserLibrary } from './user-library/user-library';
import { UserCart } from './user-cart/user-cart';
import { AdminProfile } from './admin-profile/admin-profile';
import { AdminEditProfile } from './admin-edit-profile/admin-edit-profile';
import { UserHistory } from './user-history/user-history';

export const routes: Routes = [
  // ✅ ให้หน้าแรก redirect ไป Home (เปลี่ยนเป็น Main ก็ได้)
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // ✅ กลุ่มหน้า Home (อย่าลืมมี <router-outlet> ใน Home)
  {
    path: 'home',
    component: Home,
    children: [
      { path: '', component: UserLibrary },         // /home (ค่าเริ่มต้น)
      { path: 'user-library', component: UserLibrary },
      { path: 'user-cart', component: UserCart },
    ],
  },

  // ✅ กลุ่มหน้า Admin (อย่าลืมมี <router-outlet> ใน Admin)
  {
    path: 'admin',
    component: Admin,
    children: [
      { path: '', component: AdminProfile },          // /admin (ค่าเริ่มต้น)
      { path: 'games', component: AdminGames },       // /admin/games
      { path: 'users', component: AdminUsers },       // /admin/users
      { path: 'profile', component: AdminProfile },   // /admin/profile
      { path: 'edit-profile', component: AdminEditProfile },
      { path: 'user-history/:id', component: UserHistory },
    ],
  },

  // ✅ หน้าทั่วไปนอกกลุ่ม
  { path: 'profile', component: Profile },
  { path: 'edit-profile', component: EditProfile },

  // ✅ กัน 404 ทั้งระบบ
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
];
