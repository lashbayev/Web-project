import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project } from '../models/project';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  login(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login/`, data);
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/projects/`);
  }

  createProject(project: any): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects/`, project);
  }

  apply(projectId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/applications/`, { project: projectId });
  }
}