import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")
os.environ.setdefault("API_KEY", "test-key")
os.environ.setdefault("MODEL_API_KEY", "test-key")
os.environ.setdefault("IMAGE_GEN_MODEL_KEY", "test-key")
os.environ.setdefault("IMAGE_GEN_MODEL_URL", "https://example.com/image-gen")
