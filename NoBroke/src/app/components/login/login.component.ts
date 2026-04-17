import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  selectedRole: 'student' | 'employer' = 'student';

  constructor(private api: ApiService, private router: Router) {}

  login(): void {
    this.error = '';

    this.api.login({
      email: this.email,
      password: this.password,
      role: this.selectedRole
    }).subscribe({
      next: () => {
        this.router.navigate(['/projects']);
      },
      error: (err: Error) => {
        this.error = err.message || 'Login failed.';
      }
    });
  }
}
