import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Project } from '../models/project';
import { User } from '../models/user';

type ApplicationRecord = {
  id: number;
  projectId: number;
  userId: number;
  userEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly useMock = true;
  private readonly tokenKey = 'nb_token';
  private readonly userKey = 'nb_user';
  private readonly projectsKey = 'nb_projects';
  private readonly applicationsKey = 'nb_applications';
  private readonly baseUrl = 'http://localhost:8000/api';
  private readonly demoDelay = 250;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.seedMockData();
  }

  login(data: { email: string; password: string; role?: 'student' | 'employer' }): Observable<{ token: string; user: User }> {
    if (!this.useMock) {
      return this.http.post<{ token: string; user: User }>(`${this.baseUrl}/login/`, data);
    }

    const email = data.email.trim().toLowerCase();
    const password = data.password.trim();

    if (!email || !password) {
      return throwError(() => new Error('Please enter email and password.'));
    }

    const requestedRole = data.role ?? (email.includes('employer') ? 'employer' : 'student');
    let user: User | null = null;

    if (requestedRole === 'student') {
      user = {
        id: 1,
        email,
        role: 'student',
        skills: 'Angular, TypeScript, UX Writing',
        github: 'https://github.com/student-demo'
      };
    } else if (requestedRole === 'employer') {
      user = {
        id: 2,
        email,
        role: 'employer',
        skills: 'Hiring, Product Strategy, Team Building',
        github: 'https://github.com/employer-demo'
      };
    }

    if (!user || password.length < 4) {
      return throwError(() => new Error('Enter any email and a password with at least 4 characters.'));
    }

    const token = `mock-jwt-token-${user.role}`;
    this.writeStorage(this.tokenKey, token);
    this.writeStorage(this.userKey, JSON.stringify(user));

    return of({ token, user }).pipe(delay(this.demoDelay));
  }

  getProjects(): Observable<Project[]> {
    if (!this.useMock) {
      return this.http.get<Project[]>(`${this.baseUrl}/projects/`);
    }

    return of(this.readProjects()).pipe(delay(this.demoDelay));
  }

  createProject(project: Pick<Project, 'title' | 'description' | 'tech_stack'>): Observable<Project> {
    if (!this.useMock) {
      return this.http.post<Project>(`${this.baseUrl}/projects/`, project);
    }

    const user = this.getCurrentUser();

    if (!user || user.role !== 'employer') {
      return throwError(() => new Error('Only employers can create projects.'));
    }

    if (!project.title.trim() || !project.description.trim() || !project.tech_stack.trim()) {
      return throwError(() => new Error('Fill in title, description, and tech stack.'));
    }

    const projects = this.readProjects();
    const newProject: Project = {
      id: Date.now(),
      title: project.title.trim(),
      description: project.description.trim(),
      tech_stack: project.tech_stack.trim()
    };

    this.writeStorage(this.projectsKey, JSON.stringify([newProject, ...projects]));
    return of(newProject).pipe(delay(this.demoDelay));
  }

  deleteProject(projectId: number): Observable<{ success: boolean }> {
    if (!this.useMock) {
      return this.http.delete<{ success: boolean }>(`${this.baseUrl}/projects/${projectId}/`);
    }

    const user = this.getCurrentUser();

    if (!user || user.role !== 'employer') {
      return throwError(() => new Error('Only employers can delete projects.'));
    }

    const projects = this.readProjects();
    const projectExists = projects.some((project) => project.id === projectId);

    if (!projectExists) {
      return throwError(() => new Error('Project not found.'));
    }

    const updatedProjects = projects.filter((project) => project.id !== projectId);
    const updatedApplications = this.readApplications().filter((item) => item.projectId !== projectId);

    this.writeStorage(this.projectsKey, JSON.stringify(updatedProjects));
    this.writeStorage(this.applicationsKey, JSON.stringify(updatedApplications));

    return of({ success: true }).pipe(delay(this.demoDelay));
  }

  applyToProject(projectId: number): Observable<{ success: boolean }> {
    if (!this.useMock) {
      return this.http.post<{ success: boolean }>(`${this.baseUrl}/applications/`, { project: projectId });
    }

    const user = this.getCurrentUser();

    if (!user || user.role !== 'student') {
      return throwError(() => new Error('Only students can apply to projects.'));
    }

    const applications = this.readApplications();
    const alreadyApplied = applications.some((item) => item.projectId === projectId && item.userId === user.id);

    if (alreadyApplied) {
      return throwError(() => new Error('You already applied to this project.'));
    }

    applications.unshift({
      id: Date.now(),
      projectId,
      userId: user.id,
      userEmail: user.email,
      status: 'pending'
    });
    this.writeStorage(this.applicationsKey, JSON.stringify(applications));

    return of({ success: true }).pipe(delay(this.demoDelay));
  }

  updateApplicationStatus(
    applicationId: number,
    status: 'accepted' | 'rejected'
  ): Observable<{ success: boolean }> {
    if (!this.useMock) {
      return this.http.patch<{ success: boolean }>(
        `${this.baseUrl}/applications/${applicationId}/`,
        { status }
      );
    }

    const user = this.getCurrentUser();

    if (!user || user.role !== 'employer') {
      return throwError(() => new Error('Only employers can manage applications.'));
    }

    const applications = this.readApplications();
    const index = applications.findIndex((item) => item.id === applicationId);

    if (index === -1) {
      return throwError(() => new Error('Application not found.'));
    }

    applications[index] = {
      ...applications[index],
      status
    };

    this.writeStorage(this.applicationsKey, JSON.stringify(applications));
    return of({ success: true }).pipe(delay(this.demoDelay));
  }

  logout(): void {
    this.removeStorage(this.tokenKey);
    this.removeStorage(this.userKey);
  }

  getCurrentUser(): User | null {
    const raw = this.readStorage(this.userKey);
    return raw ? JSON.parse(raw) as User : null;
  }

  updateProfile(patch: Pick<User, 'skills' | 'github'>): User | null {
    const user = this.getCurrentUser();
    if (!user) {
      return null;
    }

    const updatedUser: User = {
      ...user,
      skills: patch.skills.trim(),
      github: patch.github.trim()
    };

    this.writeStorage(this.userKey, JSON.stringify(updatedUser));
    return updatedUser;
  }

  getApplications(): ApplicationRecord[] {
    return this.readApplications();
  }

  private seedMockData(): void {
    if (!this.isBrowser()) {
      return;
    }

    if (!this.readStorage(this.projectsKey)) {
      this.writeStorage(this.projectsKey, JSON.stringify([
        {
          id: 101,
          title: 'Frontend Internship for EdTech Product',
          description: 'Build responsive Angular pages, improve student dashboard flows, and ship features with a mentor.',
          tech_stack: 'Angular, TypeScript, SCSS'
        },
        {
          id: 102,
          title: 'Pet-project Team: AI Study Planner',
          description: 'Join a student team building an MVP that recommends study plans and tracks learning habits.',
          tech_stack: 'Angular, Firebase, Python'
        },
        {
          id: 103,
          title: 'Startup Internship: Product Analytics UI',
          description: 'Create clean reporting screens and reusable components for a young analytics platform.',
          tech_stack: 'Angular, RxJS, Node.js'
        },
        {
          id: 104,
          title: 'Remote Team for Open Source Career Hub',
          description: 'Work on project cards, candidate profiles, and collaboration features for junior talent.',
          tech_stack: 'Angular, NestJS, PostgreSQL'
        }
      ]));
    }

    if (!this.readStorage(this.applicationsKey)) {
      this.writeStorage(this.applicationsKey, JSON.stringify([]));
    }
  }

  private readProjects(): Project[] {
    const raw = this.readStorage(this.projectsKey);
    return raw ? JSON.parse(raw) as Project[] : [];
  }

  private readApplications(): ApplicationRecord[] {
    const raw = this.readStorage(this.applicationsKey);
    return raw ? JSON.parse(raw) as ApplicationRecord[] : [];
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private readStorage(key: string): string | null {
    return this.isBrowser() ? localStorage.getItem(key) : null;
  }

  private writeStorage(key: string, value: string): void {
    if (this.isBrowser()) {
      localStorage.setItem(key, value);
    }
  }

  private removeStorage(key: string): void {
    if (this.isBrowser()) {
      localStorage.removeItem(key);
    }
  }
}
