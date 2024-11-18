from django.urls import path
from .views import (
    task_list,
    task_detail,
    register_user,
    login_user
)

urlpatterns = [
    path('', task_list, name='task-list'),  # GET all tasks, POST new task
    path('<int:pk>/', task_detail, name='task-detail'),  # GET, PUT, DELETE specific task
]