# tasks/serializers.py

from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'priority', 'status', 'deadline']
        read_only_fields = ['id']

    def create(self, validated_data):
        # Get the user from context
        user = self.context['request'].user
        # Add user to validated_data
        validated_data['user'] = user
        # Create and return the task
        return Task.objects.create(**validated_data)

    def validate_priority(self, value):
        valid_priorities = ['low', 'medium', 'high']
        if value.lower() not in valid_priorities:
            raise serializers.ValidationError(f"Priority must be one of: {', '.join(valid_priorities)}")
        return value.lower()

    def validate_status(self, value):
        valid_statuses = ['yet-to-start', 'in-progress', 'completed', 'hold']
        if value.lower() not in valid_statuses:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(valid_statuses)}")
        return value.lower()

# Serializer for user registration
class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password', 'email']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data['email']
        )
        return user

# Serializer for login (authentication)
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if user is None:
            raise serializers.ValidationError('Invalid username or password')
        return user
