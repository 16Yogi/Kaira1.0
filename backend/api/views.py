import os
import json
import csv
from datetime import datetime

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from django.conf import settings

from dotenv import load_dotenv
import pandas as pd
import requests
import google.generativeai as genai

from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import singup, Subscriber

load_dotenv()

# ---------------------------
# Logging Function
# ---------------------------
def log_prompt(prompt_text):
    log_dir = os.path.join(os.path.dirname(__file__), "prompt_logs")
    os.makedirs(log_dir, exist_ok=True)

    log_file = os.path.join(log_dir, "prompts.csv")
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    file_exists = os.path.isfile(log_file)
    with open(log_file, mode="a", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        if not file_exists:
            writer.writerow(["timestamp", "prompt"])
        writer.writerow([current_time, prompt_text])

# ---------------------------
# Signup Serializer & API
# ---------------------------
class SignUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = singup
        fields = ['name', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return singup.objects.create(**validated_data)

class SignupAPIView(APIView):
    def post(self, request):
        serializer = SignUpSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ---------------------------
# Login View
# ---------------------------
@csrf_exempt
def login_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data.'}, status=400)

        email = data.get("email", "")
        password = data.get("password", "")

        if not email or not password:
            return JsonResponse({'error': 'Email and password are required.'}, status=400)

        try:
            user = singup.objects.get(email=email)
        except singup.DoesNotExist:
            return JsonResponse({'error': 'Invalid credentials'}, status=400)

        if check_password(password, user.password):
            return JsonResponse({'message': 'Login successful'}, status=200)
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=400)
    else:
        return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

# ---------------------------
# Subscribe Email View
# ---------------------------
@csrf_exempt
def subscribe_email(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email")

            if not email:
                return JsonResponse({'error': 'Email is required'}, status=400)

            Subscriber.objects.get_or_create(email=email)

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

# ---------------------------
# Chat View with Prompt Logging
# ---------------------------
cleaned_dir = r'C:\Users\yogendra_m\Desktop\Data\Kaira_AI\Kaira\backend\api\clean_dataset'

@csrf_exempt
def chat_view(request):
    if request.method != "POST":
        return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

    try:
        payload = json.loads(request.body)
        user_message = payload.get("message", "").strip()
        if not user_message:
            return JsonResponse({'error': 'Message is required.'}, status=400)

        # Log the prompt
        log_prompt(user_message)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data.'}, status=400)

    try:
        def prompt_query(prompt):
            if not os.path.exists(cleaned_dir):
                return JsonResponse({'error': f'clean_dataset directory not found at {cleaned_dir}'}, status=500)

            files = [f for f in os.listdir(cleaned_dir) if f.endswith(('.csv', '.json'))]
            prompt = prompt.lower()

            for file in files:
                path = os.path.join(cleaned_dir, file)
                try:
                    if file.endswith('.csv'):
                        df = pd.read_csv(path)
                    elif file.endswith('.json'):
                        df = pd.read_json(path)
                    else:
                        continue

                    for col in df.columns:
                        if prompt in col.lower():
                            col_data = df[[col]].dropna().head()
                            if not col_data.empty:
                                return f"🔍 Found column match in {file}:\n{col_data.to_string(index=False)}"

                    match_rows = df[df.astype(str).apply(lambda row: row.str.lower().str.contains(prompt).any(), axis=1)]
                    if not match_rows.empty:
                        return f"🔍 Found cell match in {file}:\n{match_rows.head().to_string(index=False)}"

                except Exception as e:
                    print(f"⚠️ Error processing {file}: {e}")

            return None 

        if "news" in user_message.lower():
            news_api_key = os.environ.get("NEWS_API")
            url = "https://newsapi.org/v2/everything"
            params = {
                "q": "latest",
                "from": datetime.now().strftime("%Y-%m-%d"),
                "sortBy": "publishedAt",
                "pageSize": 5,
                "apiKey": news_api_key
            }

            try:
                response = requests.get(url, params=params)
                data = response.json()
                if response.status_code == 200 and data.get("articles"):
                    headlines = [f"📰 {article['title']}" for article in data["articles"][:5]]
                    return JsonResponse({"response": "🗞️ Top News Headlines:\n" + "\n".join(headlines)})
                else:
                    return JsonResponse({"response": "⚠️ Couldn't fetch news at the moment."})
            except Exception as e:
                return JsonResponse({"response": f"❌ Error fetching news: {str(e)}"})

        if "kaira" in user_message.lower():
            genai.configure(api_key=os.environ["GEMINI_API_KEY"])
            generation_config = {
                "temperature": 1,
                "top_p": 0.95,
                "top_k": 64,
                "max_output_tokens": 65536,
                "response_mime_type": "text/plain",
            }

            model = genai.GenerativeModel(model_name="gemini-1.5-flash", generation_config=generation_config)
            chat = model.start_chat(history=[])
            response = chat.send_message(user_message)

            return JsonResponse({"response": response.text})

        local_result = prompt_query(user_message)
        if local_result:
            return JsonResponse({"response": local_result})

        # Fallback to Gemini for general prompts
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        generation_config = {
            "temperature": 1,
            "top_p": 0.95,
            "top_k": 64,
            "max_output_tokens": 65536,
            "response_mime_type": "text/plain",
        }

        model = genai.GenerativeModel(model_name="gemini-1.5-flash", generation_config=generation_config)
        chat = model.start_chat(history=[])
        response = chat.send_message(user_message)

        return JsonResponse({"response": response.text})

    except Exception as e:
        return JsonResponse({'error': f'Error generating response: {str(e)}'}, status=500)
