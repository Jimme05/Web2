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
    { path: '', component: Main },
    { path: 'admin', component: Admin },
    { path: 'home', component: Home },
    { path: 'profile', component : Profile},
    { path: 'edit-profile', component: EditProfile },
    { path: 'admin/games', component: AdminGames },
    { path: 'admin/users', component: AdminUsers },
    { path: 'home/user-library', component: UserLibrary },
    { path: 'home/user-cart', component: UserCart },
    { path: 'admin/profile', component: AdminProfile },
    { path: 'admin/edit-profile', component: AdminEditProfile },
    { path: 'admin/user-history/:id', component: UserHistory }

];
