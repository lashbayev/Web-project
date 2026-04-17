import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Project } from '../../models/project';
import { User } from '../../models/user';

type ApplicationRecord = {
  id: number;
  projectId: number;
  userId: number;
  userEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
};

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  applications: ApplicationRecord[] = [];

  title = '';
  description = '';
  tech_stack = '';
  search = '';
  techFilter = '';
  error = '';
  success = '';

  constructor(
    private api: ApiService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProjects();
      this.loadApplications();
    }
  }

  get currentUser(): User | null {
    return this.api.getCurrentUser();
  }

  get role(): User['role'] {
    return this.currentUser?.role ?? 'guest';
  }

  get isStudent(): boolean {
    return this.role === 'student';
  }

  get isEmployer(): boolean {
    return this.role === 'employer';
  }

  get employerApplications(): Array<ApplicationRecord & { projectTitle: string }> {
    return this.applications
      .map((application) => {
        const project = this.projects.find((item) => item.id === application.projectId);
        return {
          ...application,
          projectTitle: project?.title ?? `Project #${application.projectId}`
        };
      })
      .sort((a, b) => b.id - a.id);
  }

  loadProjects(): void {
    this.api.getProjects().subscribe({
      next: (data) => {
        this.projects = data;
        this.applyFilters();
      },
      error: () => {
        this.error = 'Failed to load projects.';
      }
    });
  }

  loadApplications(): void {
    if (!this.currentUser) {
      this.applications = [];
      return;
    }

    this.api.getApplications().subscribe({
      next: (data) => {
        this.applications = data;
      },
      error: (err: Error) => {
        this.error = err.message || 'Failed to load applications.';
      }
    });
  }

  applyFilters(): void {
    const search = this.search.trim().toLowerCase();
    const tech = this.techFilter.trim().toLowerCase();

    this.filteredProjects = this.projects.filter((project) => {
      const haystack = `${project.title} ${project.description} ${project.tech_stack}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      const matchesTech = !tech || project.tech_stack.toLowerCase().includes(tech);
      return matchesSearch && matchesTech;
    });
  }

  createProject(): void {
    this.error = '';
    this.success = '';

    this.api.createProject({
      title: this.title,
      description: this.description,
      tech_stack: this.tech_stack
    }).subscribe({
      next: () => {
        this.title = '';
        this.description = '';
        this.tech_stack = '';
        this.success = 'Project created successfully.';
        this.loadProjects();
      },
      error: (err: Error) => {
        this.error = err.message || 'Create failed.';
      }
    });
  }

  deleteProject(projectId: number): void {
    this.error = '';
    this.success = '';

    this.api.deleteProject(projectId).subscribe({
      next: () => {
        this.success = 'Project deleted successfully.';
        this.loadProjects();
        this.loadApplications();
      },
      error: (err: Error) => {
        this.error = err.message || 'Delete failed.';
      }
    });
  }

  apply(projectId: number): void {
    this.error = '';
    this.success = '';

    this.api.applyToProject(projectId).subscribe({
      next: () => {
        this.success = 'Application sent.';
        this.loadApplications();
      },
      error: (err: Error) => {
        this.error = err.message || 'Apply failed.';
      }
    });
  }

  updateApplicationStatus(
    applicationId: number,
    status: 'accepted' | 'rejected'
  ): void {
    this.error = '';
    this.success = '';

    this.api.updateApplicationStatus(applicationId, status).subscribe({
      next: () => {
        this.success = status === 'accepted' ? 'Application accepted.' : 'Application rejected.';
        this.loadApplications();
      },
      error: (err: Error) => {
        this.error = err.message || 'Update failed.';
      }
    });
  }

  getStudentApplication(projectId: number): ApplicationRecord | undefined {
    const user = this.currentUser;
    if (!user) {
      return undefined;
    }

    return this.applications.find((item) => item.projectId === projectId && item.userId === user.id);
  }

  hasApplied(projectId: number): boolean {
    const user = this.currentUser;
    if (!user) {
      return false;
    }

    return this.applications.some((item) => item.projectId === projectId && item.userId === user.id);
  }
}
