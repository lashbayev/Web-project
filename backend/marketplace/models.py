from django.conf import settings
from django.db import models
from django.utils import timezone


class ActiveProjectQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)


class StudentProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile',
    )
    skills = models.CharField(max_length=255, blank=True)
    github = models.URLField(blank=True)
    experience_level = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f'StudentProfile<{self.user.email or self.user.username}>'


class EmployerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employer_profile',
    )
    company_name = models.CharField(max_length=150, blank=True)
    website = models.URLField(blank=True)
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f'EmployerProfile<{self.user.email or self.user.username}>'


class Project(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects',
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    tech_stack = models.CharField(max_length=200)
    project_type = models.CharField(max_length=100, default='internship')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ActiveProjectQuerySet.as_manager()

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return self.title


class Application(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='applications',
    )
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications',
    )
    message = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['project', 'applicant'],
                name='unique_application_per_project_and_applicant',
            ),
        ]

    def __str__(self) -> str:
        return f'Application<{self.applicant_id}->{self.project_id}>'
