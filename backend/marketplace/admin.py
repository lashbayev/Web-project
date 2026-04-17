from django.contrib import admin

from .models import Application, EmployerProfile, Project, StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'skills', 'github', 'experience_level')
    search_fields = ('user__username', 'user__email', 'skills')


@admin.register(EmployerProfile)
class EmployerProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'company_name', 'website')
    search_fields = ('user__username', 'user__email', 'company_name')


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'owner', 'project_type', 'is_active', 'created_at')
    search_fields = ('title', 'description', 'tech_stack', 'owner__email')
    list_filter = ('project_type', 'is_active')


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('id', 'project', 'applicant', 'status', 'created_at')
    search_fields = ('project__title', 'applicant__email')
    list_filter = ('status',)

# Register your models here.
