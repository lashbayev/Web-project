import { Component, OnInit } from '@angular/core';
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
export class ProfileComponent implements OnInit {
  skills = '';
  github = '';
  message = '';
  error = '';

  constructor(private api: ApiService) {
    const user = this.api.getCurrentUser();
    this.skills = user?.skills ?? '';
    this.github = user?.github ?? '';
  }

  ngOnInit(): void {
    if (!this.currentUser) {
      return;
    }

    this.api.getProfile().subscribe({
      next: (user) => {
        this.skills = user.skills;
        this.github = user.github;
      },
      error: (err: Error) => {
        this.error = err.message || 'Failed to load profile.';
      }
    });
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

    this.api.updateProfile({
      skills: this.skills,
      github: this.github
    }).subscribe({
      next: (updated) => {
        this.skills = updated.skills;
        this.github = updated.github;
        this.message = 'Profile updated.';
      },
      error: (err: Error) => {
        this.error = err.message || 'Failed to update profile.';
      }
    });
  }
}
