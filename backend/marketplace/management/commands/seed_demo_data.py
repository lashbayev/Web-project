from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from marketplace.models import EmployerProfile, Project, StudentProfile

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates demo users and projects for local development.'

    def handle(self, *args, **options):
        employer, _ = User.objects.get_or_create(
            username='employer@example.com',
            defaults={'email': 'employer@example.com'},
        )
        employer.set_password('pass1234')
        employer.email = 'employer@example.com'
        employer.save()
        EmployerProfile.objects.get_or_create(
            user=employer,
            defaults={
                'company_name': 'NoBroke Labs',
                'website': 'https://nobroke.local',
                'bio': 'Hiring students for internships and startup projects.',
            },
        )

        student, _ = User.objects.get_or_create(
            username='student@example.com',
            defaults={'email': 'student@example.com'},
        )
        student.set_password('pass1234')
        student.email = 'student@example.com'
        student.save()
        StudentProfile.objects.get_or_create(
            user=student,
            defaults={
                'skills': 'Angular, TypeScript, UX Writing',
                'github': 'https://github.com/student-demo',
                'experience_level': 'junior',
            },
        )

        demo_projects = [
            {
                'title': 'Frontend Internship for EdTech Product',
                'description': 'Build responsive Angular pages, improve dashboard flows, and ship features with a mentor.',
                'tech_stack': 'Angular, TypeScript, DRF',
                'project_type': 'internship',
            },
            {
                'title': 'Pet-project Team: AI Study Planner',
                'description': 'Join a student team building an MVP that recommends study plans and tracks learning habits.',
                'tech_stack': 'Angular, Python, PostgreSQL',
                'project_type': 'pet-project',
            },
        ]

        for item in demo_projects:
            Project.objects.get_or_create(
                owner=employer,
                title=item['title'],
                defaults=item,
            )

        self.stdout.write(self.style.SUCCESS('Demo users and projects are ready.'))
