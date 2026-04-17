import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from './services/api.service';
import { User } from './models/user';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.css'
})
export class AppComponent {
  constructor(private api: ApiService, private router: Router) {}

  get currentUser(): User | null {
    return this.api.getCurrentUser();
  }

  get role(): User['role'] {
    return this.currentUser?.role ?? 'guest';
  }

  logout(): void {
    this.api.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
