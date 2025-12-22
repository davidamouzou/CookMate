import os
from supabase import Client, create_client

config = {
    "model_api_key": os.getenv("MODEL_API_KEY"),
    "image_gen_model_key": os.getenv("IMAGE_GEN_MODEL_KEY"),
    "image_gen_model_url": os.getenv("IMAGE_GEN_MODEL_URL"),
    "supabase_key": os.getenv("SUPABASE_KEY"),
    "supabase_url": os.getenv("SUPABASE_URL"),
    "API_KEY": os.getenv("API_KEY"),
}

supabase_client: Client = create_client(config.get('supabase_url'), config.get('supabase_key'))