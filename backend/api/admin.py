from django.contrib import admin
from .models import singup
from .models import Subscriber

# Register your models here.

admin.site.register(singup)

@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "subscribed_at")
    search_fields = ("email",)