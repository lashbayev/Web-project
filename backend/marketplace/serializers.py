from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from rest_framework import serializers
from rest_framework.authtoken.models import Token

from .models import Application, EmployerProfile, Project, StudentProfile

User = get_user_model()


def serialize_user(user: User) -> dict:
    student_profile = getattr(user, 'student_profile', None)
    employer_profile = getattr(user, 'employer_profile', None)
    role = 'guest'
    skills = ''
    github = ''

    if student_profile:
        role = 'student'
        skills = student_profile.skills
        github = student_profile.github
    elif employer_profile:
        role = 'employer'

    return {
        'id': user.id,
        'email': user.email,
        'role': role,
        'skills': skills,
        'github': github,
    }


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=4)
    role = serializers.ChoiceField(choices=['student', 'employer'], required=False)

    def validate(self, attrs):
        email = attrs['email'].strip().lower()
        password = attrs['password']
        role = attrs.get('role', 'student')

        user, created = User.objects.get_or_create(
            username=email,
            defaults={'email': email},
        )

        if created:
            user.set_password(password)
            user.save(update_fields=['password'])
        elif not user.check_password(password):
            raise serializers.ValidationError({'password': 'Invalid email or password.'})

        if not user.email:
            user.email = email
            user.save(update_fields=['email'])

        if role == 'student':
            StudentProfile.objects.get_or_create(user=user)
            EmployerProfile.objects.filter(user=user).delete()
        else:
            EmployerProfile.objects.get_or_create(user=user)
            StudentProfile.objects.filter(user=user).delete()

        token, _ = Token.objects.get_or_create(user=user)
        update_last_login(None, user)
        attrs['user'] = user
        attrs['token'] = token.key
        return attrs


class LogoutSerializer(serializers.Serializer):
    token = serializers.CharField(required=False, allow_blank=True)


class ApplicationStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            Application.STATUS_ACCEPTED,
            Application.STATUS_REJECTED,
        ]
    )


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ['skills', 'github', 'experience_level']


class ProjectSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id',
            'title',
            'description',
            'tech_stack',
            'project_type',
            'is_active',
            'owner',
            'owner_email',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'owner_email', 'created_at', 'updated_at']


class ApplicationSerializer(serializers.ModelSerializer):
    projectId = serializers.IntegerField(source='project_id', read_only=True)
    userId = serializers.IntegerField(source='applicant_id', read_only=True)
    userEmail = serializers.EmailField(source='applicant.email', read_only=True)
    projectTitle = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = Application
        fields = [
            'id',
            'project',
            'projectId',
            'projectTitle',
            'applicant',
            'userId',
            'userEmail',
            'message',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'applicant',
            'projectId',
            'projectTitle',
            'userId',
            'userEmail',
            'created_at',
            'updated_at',
        ]
