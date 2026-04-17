import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
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
  private readonly tokenKey = 'nb_token';
  private readonly userKey = 'nb_user';
  private readonly baseUrl = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  login(data: { email: string; password: string; role?: 'student' | 'employer' }): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.baseUrl}/login/`, data).pipe(
      tap(({ token, user }) => {
        this.writeStorage(this.tokenKey, token);
        this.writeStorage(this.userKey, JSON.stringify(user));
      }),
      catchError((error) => this.handleError(error))
    );
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/projects/`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  createProject(project: Pick<Project, 'title' | 'description' | 'tech_stack'>): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects/`, project).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  deleteProject(projectId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/projects/${projectId}/`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  applyToProject(projectId: number): Observable<ApplicationRecord> {
    return this.http.post<ApplicationRecord>(`${this.baseUrl}/applications/`, { project: projectId }).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  updateApplicationStatus(
    applicationId: number,
    status: 'accepted' | 'rejected'
  ): Observable<ApplicationRecord> {
    return this.http.patch<ApplicationRecord>(
      `${this.baseUrl}/applications/${applicationId}/`,
      { status }
    ).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  logout(): Observable<{ success: boolean }> {
    if (!this.getToken()) {
      this.clearSession();
      return of({ success: true });
    }

    return this.http.post<{ success: boolean }>(`${this.baseUrl}/logout/`, {}).pipe(
      tap(() => this.clearSession()),
      catchError(() => {
        this.clearSession();
        return of({ success: true });
      })
    );
  }

  getCurrentUser(): User | null {
    const raw = this.readStorage(this.userKey);
    return raw ? JSON.parse(raw) as User : null;
  }

  getProfile(): Observable<User> {
    return this.http.get<{ user: User }>(`${this.baseUrl}/profile/`).pipe(
      map((response) => response.user),
      tap((user) => this.writeStorage(this.userKey, JSON.stringify(user))),
      catchError((error) => this.handleError(error))
    );
  }

  updateProfile(patch: Pick<User, 'skills' | 'github'>): Observable<User> {
    return this.http.patch<{ user: User }>(`${this.baseUrl}/profile/`, patch).pipe(
      map((response) => response.user),
      tap((user) => this.writeStorage(this.userKey, JSON.stringify(user))),
      catchError((error) => this.handleError(error))
    );
  }

  getApplications(): Observable<ApplicationRecord[]> {
    return this.http.get<ApplicationRecord[]>(`${this.baseUrl}/applications/`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private getToken(): string | null {
    return this.readStorage(this.tokenKey);
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

  private clearSession(): void {
    this.removeStorage(this.tokenKey);
    this.removeStorage(this.userKey);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Something went wrong. Please try again.';

    if (error.error) {
      if (typeof error.error === 'string') {
        message = error.error;
      } else if (typeof error.error.detail === 'string') {
        message = error.error.detail;
      } else if (typeof error.error.password?.[0] === 'string') {
        message = error.error.password[0];
      } else if (typeof error.error.non_field_errors?.[0] === 'string') {
        message = error.error.non_field_errors[0];
      } else {
        const firstValue = Object.values(error.error)[0];
        if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') {
          message = firstValue[0];
        }
      }
    }

    if (error.status === 0) {
      message = 'Cannot connect to the server. Make sure the Django backend is running on port 8000.';
    }

    return throwError(() => new Error(message));
  }
}
