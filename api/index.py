import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi import FastAPI
from main import app as backend_app

app = FastAPI()
app.mount("/api", backend_app)
