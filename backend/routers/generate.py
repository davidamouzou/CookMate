from datetime import datetime, timezone
import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse
from requests import post
import base64
import io
import json
from google import genai
from google.genai import types
from PIL import Image

from models.recipe import Recipe
from models.recipe_prompt import RecipePrompt
from config import config

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/generate", tags=["generate"])


def _error_response(message: str, status_code: int = 503) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": message})


def _extract_images(files: List[Dict[str, Any]]) -> List[Image.Image]:
    images: List[Image.Image] = []
    for f in files or []:
        try:
            img_data = base64.b64decode(f.get("base64", ""))
            image = Image.open(io.BytesIO(img_data))
            images.append(image)
        except Exception as exc:
            logger.warning("Skipping invalid image file: %s", exc)
    return images


def _build_prompt(text: str, language: str) -> str:
    return f"""
    Analyze the following user input: "{text}" and return an appropriate response in {language}:
    1. If the input is not related to ingredients or a dish, return the following response in JSON format and don't add created_at.
    2. If the input is relevant and describes specific ingredients or a dish, return a corresponding recipe in the form of JSON matching the Recipe schema.
    Note: The response must be formulated in the language {language} and should be only JSON, not any other message.
    """.strip()


def _parse_model_response(raw_text: str) -> Dict[str, Any]:
    # Remove markdown fences if present
    cleaned = raw_text.replace("```json", "").replace("```", "").strip()
    try:
        parsed = json.loads(cleaned)
        # If it's a recipe, validate it with Recipe model (pydantic)
        try:
            validated = Recipe.model_validate(parsed)  # pydantic v2
            return validated.model_dump()  # return plain dict
        except Exception:
            # If validation fails, return parsed raw JSON
            return parsed
    except json.JSONDecodeError as exc:
        raise ValueError(f"Model response not valid JSON: {exc}")


@router.post("/recipe")
async def generate_recipe(recipe_prompt: RecipePrompt):
    """Generate a recipe from user input.

    Steps:
    1. Validate input
    2. Extract images (if any)
    3. Build prompt
    4. Call the text model
    5. Parse the response and post-process
    """
    payload = recipe_prompt.model_dump()

    # 1) Validate basic input
    text = payload.get("text", "").strip()
    language = payload.get("language", "en")
    if not text:
        return _error_response("No text provided", status_code=400)

    # 2) Extract images
    images = _extract_images(payload.get("files", []))

    # 3) Build prompt
    prompt = _build_prompt(text, language)

    # 4) Call the model
    try:
        client = genai.Client(api_key=config.get("model_api_key"))
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt, *images],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=Recipe,
            ),
        )
        client.close()
    except Exception as exc:
        logger.exception("Model call failed")
        return _error_response(f"Model call failed: {exc}")

    # 5) Parse and post-process
    try:
        result = _parse_model_response(response.text)
    except ValueError as exc:
        logger.exception("Failed to parse model response: %s", exc)
        return _error_response(str(exc), status_code=502)

    # Add created_at when appropriate
    if isinstance(result, dict) and "created_at" not in result:
        result["created_at"] = datetime.now(timezone.utc).isoformat()

    return result


@router.post("/image")
async def generate_image(req: Request):
    data = await req.json()
    description = data.get("description", "")
    if not description:
        return _error_response("No description provided", status_code=400)

    headers = {
        "Authorization": f"Bearer {config.get('image_gen_model_key')}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    payload = {
        "style": "photorealism",
        "prompt": description,
        "aspect_ratio": "1:1",
        "output_format": "png",
        "response_format": "url",
        "width": 832,
        "height": 832,
    }

    try:
        response = post(config.get('image_gen_model_url'), json=payload, headers=headers)
    except Exception as exc:
        logger.exception("Image generation request failed")
        return _error_response(f"Image generation request failed: {exc}")

    if response.status_code == 200:
        try:
            return response.json()
        except Exception:
            return Response(status_code=502, content=b"Invalid response from image generation service")
    else:
        return Response(status_code=response.status_code, content=response.content)