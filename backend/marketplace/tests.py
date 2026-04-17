from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Application, EmployerProfile, Project, StudentProfile

User = get_user_model()


class MarketplaceApiTests(APITestCase):
    def test_login_creates_student_profile_and_returns_token(self):
        response = self.client.post(
            reverse('login'),
            {
                'email': 'student@example.com',
                'password': 'pass1234',
                'role': 'student',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['role'], 'student')
        self.assertTrue(StudentProfile.objects.filter(user__username='student@example.com').exists())

    def test_employer_can_create_project(self):
        user = User.objects.create_user(
            username='employer@example.com',
            email='employer@example.com',
            password='pass1234',
        )
        EmployerProfile.objects.create(user=user, company_name='NoBroke')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.key}')

        response = self.client.post(
            reverse('project-list-create'),
            {
                'title': 'Frontend Internship',
                'description': 'Build Angular pages',
                'tech_stack': 'Angular, DRF',
                'project_type': 'internship',
                'is_active': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Project.objects.count(), 1)
        self.assertEqual(Project.objects.first().owner, user)

    def test_student_can_apply_and_employer_can_update_status(self):
        employer = User.objects.create_user(
            username='employer@example.com',
            email='employer@example.com',
            password='pass1234',
        )
        EmployerProfile.objects.create(user=employer, company_name='NoBroke')
        project = Project.objects.create(
            owner=employer,
            title='Analytics UI',
            description='Create Angular dashboards',
            tech_stack='Angular, Python',
        )

        student = User.objects.create_user(
            username='student@example.com',
            email='student@example.com',
            password='pass1234',
        )
        StudentProfile.objects.create(user=student, skills='Angular', github='https://github.com/student')

        student_token = Token.objects.create(user=student)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {student_token.key}')
        create_response = self.client.post(
            reverse('application-list-create'),
            {'project': project.id, 'message': 'Ready to help!'},
            format='json',
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Application.objects.count(), 1)

        employer_token = Token.objects.create(user=employer)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {employer_token.key}')
        update_response = self.client.patch(
            reverse('application-detail', kwargs={'pk': Application.objects.first().id}),
            {'status': 'accepted'},
            format='json',
        )

        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data['status'], 'accepted')

    def test_employer_sees_only_applications_for_own_projects(self):
        employer = User.objects.create_user(
            username='owner@example.com',
            email='owner@example.com',
            password='pass1234',
        )
        EmployerProfile.objects.create(user=employer, company_name='Owner Co')
        own_project = Project.objects.create(
            owner=employer,
            title='Own Project',
            description='Owned by current employer',
            tech_stack='Angular',
        )

        other_employer = User.objects.create_user(
            username='other@example.com',
            email='other@example.com',
            password='pass1234',
        )
        EmployerProfile.objects.create(user=other_employer, company_name='Other Co')
        other_project = Project.objects.create(
            owner=other_employer,
            title='Other Project',
            description='Owned by another employer',
            tech_stack='Django',
        )

        student = User.objects.create_user(
            username='student2@example.com',
            email='student2@example.com',
            password='pass1234',
        )
        StudentProfile.objects.create(user=student, skills='Angular', github='https://github.com/student2')
        Application.objects.create(project=own_project, applicant=student)
        Application.objects.create(project=other_project, applicant=student)

        employer_token = Token.objects.create(user=employer)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {employer_token.key}')
        response = self.client.get(reverse('application-list-create'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['projectId'], own_project.id)
