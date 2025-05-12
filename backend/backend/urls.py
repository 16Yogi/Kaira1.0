from django.urls import path
from api.views import SignupAPIView, chat_view, login_view,subscribe_email
from django.contrib import admin

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/signup/', SignupAPIView.as_view(), name='signup'),
    path('api/login/', login_view, name='login'),
    path('api/chat/', chat_view, name='chat'),
    path('api/subscribe/', subscribe_email, name='subscribe_email'),
]
