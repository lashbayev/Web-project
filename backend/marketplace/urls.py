from django.urls import path

from .views import (
    ApplicationDetailView,
    ApplicationListCreateView,
    ProfileView,
    ProjectDetailView,
    ProjectListCreateView,
    login_view,
    logout_view,
)

urlpatterns = [
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('projects/', ProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('applications/', ApplicationListCreateView.as_view(), name='application-list-create'),
    path('applications/<int:pk>/', ApplicationDetailView.as_view(), name='application-detail'),
]
