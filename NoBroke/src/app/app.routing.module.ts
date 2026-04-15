import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { ProfileComponent } from './components/profile/profile.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'projects', component: ProjectsComponent },
  { path: 'profile', component: ProfileComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}