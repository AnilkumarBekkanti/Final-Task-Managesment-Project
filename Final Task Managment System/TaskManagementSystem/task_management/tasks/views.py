from django.contrib.auth import login, logout, authenticate
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from django.db import IntegrityError
from django.core.exceptions import ValidationError
import logging
import traceback

from .models import Task
from .serializers import (
    UserRegisterSerializer, 
    LoginSerializer, 
    TaskSerializer
)
from .filters import TaskFilter

logger = logging.getLogger(__name__)

# User Registration Views
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'detail': 'User registered successfully',
                'token': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Alternative Registration View
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    try:
        print("Registration request received:", request.data)  # Debug print
        
        # Get the data
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        # Validate required fields
        if not all([username, email, password]):
            return Response({
                'detail': 'Please provide username, email and password'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if username exists
        if User.objects.filter(username=username).exists():
            return Response({
                'detail': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if email exists
        if User.objects.filter(email=email).exists():
            return Response({
                'detail': 'Email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        print(f"User created successfully: {username}")  # Debug print

        return Response({
            'detail': 'User registered successfully',
            'username': username
        }, status=status.HTTP_201_CREATED)

    except IntegrityError as e:
        print(f"IntegrityError: {str(e)}")  # Debug print
        return Response({
            'detail': 'Username or email already exists'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Registration error: {str(e)}")  # Debug print
        return Response({
            'detail': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

# Authentication Views
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            print("Login attempt for username:", request.data.get('username'))  # Debug print
            
            username = request.data.get('username')
            password = request.data.get('password')

            if not username or not password:
                return Response({
                    'detail': 'Please provide both username and password'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Authenticate user
            user = authenticate(username=username, password=password)
            print("Authentication result:", user)  # Debug print

            if user is not None:
                # Generate tokens
                refresh = RefreshToken.for_user(user)
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'username': user.username
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'detail': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)

        except Exception as e:
            print("Login error:", str(e))  # Debug print
            return Response({
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            token = RefreshToken(refresh_token)
            token.blacklist()
            logout(request)
            return Response({
                "message": "Logged out successfully!"
            }, status=status.HTTP_200_OK)
        except Exception:
            return Response({
                "message": "Invalid token"
            }, status=status.HTTP_400_BAD_REQUEST)

# Task Views
class TaskListView(generics.ListAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = (DjangoFilterBackend,)
    filterset_class = TaskFilter
    ordering_fields = ['created_at', 'deadline']
    ordering = ['created_at']

    def get_queryset(self):
        # Only return tasks belonging to the current user
        return Task.objects.filter(user=self.request.user)

class TaskCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("Received task data:", request.data)  # Debug print
        
        # Add the user to the task data
        task_data = request.data.copy()
        task_data['user'] = request.user.id

        serializer = TaskSerializer(data=task_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        print("Validation errors:", serializer.errors)  # Debug print
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TaskUpdateView(generics.UpdateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only allow updating user's own tasks
        return Task.objects.filter(user=self.request.user)

class TaskDeleteView(generics.DestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only allow deleting user's own tasks
        return Task.objects.filter(user=self.request.user)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_list(request):
    try:
        if request.method == 'GET':
            tasks = Task.objects.filter(user=request.user)
            serializer = TaskSerializer(tasks, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            print("Received data:", request.data)  # Debug print
            
            # Create serializer with context
            serializer = TaskSerializer(
                data=request.data, 
                context={'request': request}
            )
            
            if serializer.is_valid():
                # Save without explicitly passing user
                task = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                print("Validation errors:", serializer.errors)  # Debug print
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        print(f"Error in task_list view: {str(e)}")  # Debug print
        return Response(
            {'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def task_detail(request, pk):
    try:
        task = Task.objects.get(pk=pk, user=request.user)
    except Task.DoesNotExist:
        return Response(
            {'detail': 'Task not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = TaskSerializer(task)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    try:
        print("Login attempt:", request.data)  # Debug print
        
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({
                'detail': 'Please provide both username and password'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Authenticate user
        user = authenticate(username=username, password=password)
        print("Authentication result:", user)  # Debug print

        if user is not None:
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'username': user.username
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'detail': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

    except Exception as e:
        print("Login error:", str(e))  # Debug print
        return Response({
            'detail': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)