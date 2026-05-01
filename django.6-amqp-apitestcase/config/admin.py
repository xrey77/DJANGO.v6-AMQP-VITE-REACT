from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from users.models import User
from .forms import UserCreationForm, UserChangeForm

class CustomUserAdmin(UserAdmin):
    add_form = UserCreationForm
    form = UserChangeForm
    model = User
    list_display = ['email', 'username', 'is_staff', 'date_of_birth'] # Add your new fields

    # Define custom fieldsets for the change form
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('date_of_birth',)}),
    )
    # Define custom fieldsets for the add form
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('date_of_birth',)}),
    )

admin.site.register(User, CustomUserAdmin)


