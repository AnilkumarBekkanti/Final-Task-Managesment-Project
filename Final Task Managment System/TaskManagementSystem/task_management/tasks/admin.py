from django.contrib import admin
from django.utils.html import format_html
from .models import Task

# Unregister if it's already registered
try:
    admin.site.unregister(Task)
except admin.sites.NotRegistered:
    pass

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'priority_badge', 'status_badge', 'deadline', 'created_at')
    list_filter = ('status', 'priority', 'deadline')
    search_fields = ('title', 'description', 'user__username')
    ordering = ('-created_at',)
    date_hierarchy = 'deadline'
    
    fieldsets = (
        ('Task Information', {
            'fields': (('title', 'user'), 'description')
        }),
        ('Status & Priority', {
            'fields': (('status', 'priority'), 'deadline')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 10

    def priority_badge(self, obj):
        colors = {
            'high': 'red',
            'medium': 'orange',
            'low': 'green'
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            colors[obj.priority],
            obj.priority.upper()
        )
    priority_badge.short_description = 'Priority'

    def status_badge(self, obj):
        colors = {
            'yet-to-start': '#808080',
            'in-progress': '#0096FF',
            'completed': '#00FF00',
            'hold': '#FFA500'
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            colors[obj.status],
            obj.status.upper()
        )
    status_badge.short_description = 'Status'
