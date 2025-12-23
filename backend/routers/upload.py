from datetime import datetime
import uuid
from urllib.parse import urlparse
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import requests

from backend.config import supabase_client

router = APIRouter(prefix="/upload", tags=["upload"])


def rename_image(extension: str) -> str:
    unique_id = uuid.uuid4().hex  # Generate a unique identifier
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")  # Generate a timestamp
    return f"{timestamp}_{unique_id}.{extension}"


def get_image_extension(url: str) -> str:
    # Parse the URL and remove query parameters
    url_without_params = urlparse(url)._replace(query='').geturl()

    # Extract the extension from the file name
    extension = url_without_params.split('.')[-1].lower()

    # Validate that the extension exists and is plausible
    if not extension or len(extension) > 5:  # Arbitrary max length for extensions
        raise ValueError(f"Invalid or missing file extension in URL: {url}")
    return extension


@router.post("/image")
async def upload_image(req: Request):
    data = await req.json()
    try:
        # Download the image
        response = requests.get(data['url'], timeout=10)  # Set a timeout for the request
        response.raise_for_status()  # Raise an HTTPError for bad responses (4xx, 5xx)
        # Extract the image extension
        image_format = get_image_extension(data['url'])
        # Generate a unique file name
        file_name = rename_image(extension=image_format)

        # Upload the image to the specified Supabase bucket
        upload_response = supabase_client.storage.from_("recipe-gen-images").upload(
            file_name, response.content, {"content-type": f"image/{image_format}"}
        )
        return {
           "url": f"https://kwzdocspghdcsinmkpex.supabase.co/storage/v1/object/public/{upload_response.full_path}",
            "details": upload_response,
        }
    except Exception as e:
        return JSONResponse(status_code=503, content=f"Error: {e}")