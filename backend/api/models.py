from django.db import models

# Create your models here.

class singup(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    # Note: In production, you should store hashed passwords.
    password = models.CharField(max_length=128)

    def __str__(self):
        return self.email
    
class Subscriber(models.Model):
    email = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email
    
