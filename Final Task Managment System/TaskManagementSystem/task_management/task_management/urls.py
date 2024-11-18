from django.contrib import admin
from django.urls import path, include
from tasks.views import register_user, login_user, task_list, task_detail

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include([
        path('register/', register_user, name='register'),
        path('login/', login_user, name='login'),
        path('tasks/', include('tasks.urls')),
    ])),
    path('api/tasks/', task_list, name='task-list'),
    path('api/tasks/<int:pk>/', task_detail, name='task-detail'),
]


