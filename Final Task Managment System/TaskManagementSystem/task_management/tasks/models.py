# tasks/models.py

from django.db import models
from django.contrib.auth.models import User

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    STATUS_CHOICES = [
        ('yet-to-start', 'Yet to Start'),
        ('in-progress', 'In Progress'),
        ('completed', 'Completed'),
        ('hold', 'Hold'),
    ]

    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(
        max_length=10, 
        choices=PRIORITY_CHOICES,
        default='low'
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES,
        default='yet-to-start'
    )
    deadline = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
