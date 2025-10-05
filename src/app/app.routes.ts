import { Routes } from '@angular/router';
import { Main } from './main/main';
import { Admin } from './admin/admin';
import { Home } from './home/home';
import { Profile } from './profile/profile';

export const routes: Routes = [
    { path: '', component: Main },
    { path: 'admin', component: Admin },
    { path: 'home', component: Home },
    { path: 'profile', component : Profile}
];
