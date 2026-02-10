import os
from supabase import Client, create_client
from google import genai

app_config = {
    "API_KEY": os.getenv("API_KEY"),
}

# Initialize Supabase client
supabase_client: Client = create_client(
    os.getenv("SUPABASE_URL", ""), 
    os.getenv("SUPABASE_KEY", "")
)

# Initialize GenAI client
gen_ai_client = genai.Client(api_key=os.getenv("MODEL_API_KEY", ""))

# Image generation configuration
image_gen_config = {
    "headers": {
        "Authorization": f"Bearer {os.getenv('IMAGE_GEN_MODEL_KEY', '')}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    },
    "url": os.getenv("IMAGE_GEN_MODEL_URL"), 
}