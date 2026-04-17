from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Application, Project
from .serializers import (
    ApplicationSerializer,
    ApplicationStatusSerializer,
    LoginSerializer,
    LogoutSerializer,
    ProjectSerializer,
    StudentProfileSerializer,
    serialize_user,
)

def _is_employer(user) -> bool:
    return hasattr(user, 'employer_profile')


def _is_student(user) -> bool:
    return hasattr(user, 'student_profile')


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']
    return Response(
        {
            'token': serializer.validated_data['token'],
            'user': serialize_user(user),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    serializer = LogoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    Token.objects.filter(user=request.user).delete()
    return Response({'success': True}, status=status.HTTP_200_OK)


class ProjectListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        projects = Project.objects.active()
        return Response(ProjectSerializer(projects, many=True).data)

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)
        if not _is_employer(request.user):
            return Response({'detail': 'Only employers can create projects.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(owner=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectDetailView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return None

    def get(self, request, pk):
        project = self.get_object(pk)
        if not project:
            return Response({'detail': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProjectSerializer(project).data)

    def put(self, request, pk):
        return self._update(request, pk, partial=False)

    def patch(self, request, pk):
        return self._update(request, pk, partial=True)

    def _update(self, request, pk, partial: bool):
        project = self.get_object(pk)
        if not project:
            return Response({'detail': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)
        if project.owner_id != request.user.id:
            return Response({'detail': 'You can edit only your own projects.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ProjectSerializer(project, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save(owner=request.user)
        return Response(serializer.data)

    def delete(self, request, pk):
        project = self.get_object(pk)
        if not project:
            return Response({'detail': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)
        if project.owner_id != request.user.id:
            return Response({'detail': 'You can delete only your own projects.'}, status=status.HTTP_403_FORBIDDEN)

        project.delete()
        return Response({'success': True}, status=status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'user': serialize_user(request.user)})

    def patch(self, request):
        if not _is_student(request.user):
            return Response({'detail': 'Only students can update profile details.'}, status=status.HTTP_403_FORBIDDEN)

        profile = request.user.student_profile
        serializer = StudentProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'user': serialize_user(request.user)})


class ApplicationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if _is_employer(request.user):
            applications = Application.objects.select_related('project', 'applicant').filter(
                project__owner=request.user
            )
        else:
            applications = Application.objects.select_related('project', 'applicant').filter(applicant=request.user)
        return Response(ApplicationSerializer(applications, many=True).data)

    def post(self, request):
        if not _is_student(request.user):
            return Response({'detail': 'Only students can apply to projects.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.validated_data['project']

        if project.owner_id == request.user.id:
            return Response({'detail': 'You cannot apply to your own project.'}, status=status.HTTP_400_BAD_REQUEST)

        application, created = Application.objects.get_or_create(
            project=project,
            applicant=request.user,
            defaults={'message': serializer.validated_data.get('message', '')},
        )
        if not created:
            return Response({'detail': 'You already applied to this project.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ApplicationSerializer(application).data, status=status.HTTP_201_CREATED)


class ApplicationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            application = Application.objects.select_related('project', 'applicant').get(pk=pk)
        except Application.DoesNotExist:
            return Response({'detail': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        if application.project.owner_id != request.user.id:
            return Response({'detail': 'Only the project owner can update application status.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ApplicationStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application.status = serializer.validated_data['status']
        application.save(update_fields=['status', 'updated_at'])
        return Response(ApplicationSerializer(application).data)
