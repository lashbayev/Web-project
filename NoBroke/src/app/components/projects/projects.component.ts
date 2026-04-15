import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Project } from '../../models/project';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {

  projects: Project[] = [];

  title = '';
  description = '';
  tech_stack = '';
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.api.getProjects().subscribe({
      next: (data) => this.projects = data,
      error: () => this.error = 'Error loading projects'
    });
  }

  createProject() {
    this.api.createProject({
      title: this.title,
      description: this.description,
      tech_stack: this.tech_stack
    }).subscribe({
      next: () => this.loadProjects(),
      error: () => this.error = 'Create failed'
    });
  }

  apply(id: number) {
    this.api.apply(id).subscribe({
      error: () => this.error = 'Apply failed'
    });
  }
}