import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  skills = '';
  github = '';
  message = '';
  error = '';

  constructor(private api: ApiService) {
    const user = this.api.getCurrentUser();
    this.skills = user?.skills ?? '';
    this.github = user?.github ?? '';
  }

  get currentUser(): User | null {
    return this.api.getCurrentUser();
  }

  get role(): User['role'] {
    return this.currentUser?.role ?? 'guest';
  }

  saveProfile(): void {
    this.error = '';
    this.message = '';

    if (this.role !== 'student') {
      this.error = 'Only students can edit profile details.';
      return;
    }

    const updated = this.api.updateProfile({
      skills: this.skills,
      github: this.github
    });

    if (!updated) {
      this.error = 'Please login first.';
      return;
    }

    this.skills = updated.skills;
    this.github = updated.github;
    this.message = 'Profile updated.';
  }
}
