from datetime import datetime, timezone

import config
from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse
from requests import post
import base64
import io
import json
from google import genai
from google.genai import types
from PIL import Image  # Pillow library for image manipulation

from backend.models.recipe import Recipe
from backend.models.recipe_prompt import RecipePrompt
from backend.config import config


router = APIRouter(prefix="/generate", tags=["generate"])

@router.post("/recipe")
async def generate_recipe(recipe_prompt: RecipePrompt):
    data = recipe_prompt.model_dump()
    try:
        # Configuration of the Gemini model
        client = genai.Client(api_key=config.get("model_api_key"))

        list_file = []
        if data.get('files'):
            # Convert the base64 string to an image
            for imageBase in data['files']:
                img_data = base64.b64decode(imageBase['base64'])
                image = Image.open(io.BytesIO(img_data))
                list_file.append(image)

        prompt = f"""
        Analyze the following user input: "{data['text']}" and return an appropriate response in {data['language']}:
        1. If the input is not related to ingredients or a dish, return the following response in JSON format and don't add created_at.
        2. If the input is relevant and describes specific ingredients or a dish, return a corresponding recipe in the form of
        Note: The response must be formulated in the language {data['language']} and should be only JSON, not any other message.
        """
        
        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=[prompt, *list_file],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=Recipe,
            )
        )
        client.close()

        cleaned = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(cleaned)
        data['created_at'] = datetime.now(timezone.utc).isoformat()
        return data
    except Exception as e:
        return JSONResponse(status_code=503, content=f"Error: {e}")
    

@router.post("/image")
async def generate_image(req: Request):
    data = await req.json()

    # Request headers
    headers = {
        "Authorization": f"Bearer {config.get('image_gen_model_key')}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    payload = {
        "style": "photorealism",
        "prompt": data['description'],
        "aspect_ratio": "1:1",
        "output_format": "png",
        "response_format": "url",
        "width": 832,
        "height": 832,
    }

    response = post(
        config.get('image_gen_model_url'),
        json=payload, headers=headers
    )

    if response.status_code == 200:
        data = response.json()
        return data
    else:
        return Response(status_code=response.status_code, content=response.content)