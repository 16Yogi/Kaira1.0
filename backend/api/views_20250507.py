import os
import json
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from dotenv import load_dotenv
import google.generativeai as genai
from api.models import singup  # Assuming 'singup' is your model
from django.contrib.auth.hashers import make_password, check_password
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.http import JsonResponse
load_dotenv()
import os
import json
from django.core.mail import send_mail
from .models import singup, Subscriber
from django.conf import settings
from .models import singup

# Serializer for the Sign model
class SignUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = singup
        fields = ['name', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}  # Do not return the password in API responses
        }
    
    def create(self, validated_data):
        # Hash password before saving
        validated_data['password'] = make_password(validated_data['password'])
        return singup.objects.create(**validated_data)

# API View for signup
class SignupAPIView(APIView):
    def post(self, request):
        serializer = SignUpSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'User created successfully'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@csrf_exempt
def login_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data.'}, status=400)

        email = data.get("email", "").strip()
        password = data.get("password", "").strip()

        if not email or not password:
            return JsonResponse({'error': 'Email and password are required.'}, status=400)

        # Fetch only email and password fields
        users = singup.objects.values('email', 'password')

        # Match input with records
        for user in users:
            if email == user['email'] and password == user['password']:
                return JsonResponse({
                    'message': 'Login successful',
                    'redirect_url': 'http://localhost:5173/'
                }, status=200)
        return JsonResponse({'error': 'Invalid credentials'}, status=400)
    
    return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)


@csrf_exempt
def chat_view(request):
    if request.method != "POST":
        return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

    try:
        payload = json.loads(request.body)
        user_message = payload.get("message", "").strip()
        if not user_message:
            return JsonResponse({'error': 'Message is required.'}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data.'}, status=400)

    try:
        # Configure the generative AI model
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])

        generation_config = {
            "temperature": 1,
            "top_p": 0.95,
            "top_k": 64,
            "max_output_tokens": 65536,
            "response_mime_type": "text/plain",
        }

        # Using a specific model name for Gemini
        model = genai.GenerativeModel(model_name="gemini-1.5-flash", generation_config=generation_config)
        chat = model.start_chat(history=[])
        response = chat.send_message(user_message)

        return JsonResponse({"response": response.text})

    except Exception as e:
        # Catching and logging any errors related to the Google API
        return JsonResponse({'error': f'Error generating response: {str(e)}'}, status=500)
    
@csrf_exempt
def subscribe_email(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email")

            if not email:
                return JsonResponse({'error': 'Email is required'}, status=400)

            # Save email in database
            Subscriber.objects.get_or_create(email=email)

            # Send email to admin
            send_mail(
                subject="New Subscriber",
                message=f"New subscriber: {email}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.EMAIL_HOST_USER],
                fail_silently=False,
            )

            return JsonResponse({'message': 'Subscription successful!'}, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Only POST allowed'}, status=405)
