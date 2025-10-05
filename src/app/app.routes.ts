import { Routes } from '@angular/router';
import { MainComponent } from './main/main';
import { Admin } from './admin/admin';
import { Home } from './home/home';

export const routes: Routes = [
    { path: '', component: MainComponent },
    { path: 'admin', component: Admin },
    { path: 'home', component: Home }
];
