# Recipe Generator API

## Project Description

This project is an API that generates recipes and their corresponding images. It leverages several technologies:
- **FastAPI** for building the API.
- **Google Gemini Model** for generating recipe-related content.
- **Getimg.ai** API for generating images based on the recipe details. (https://getimg.ai/) to create your API KEY
- **Supabase** service to store and manage data.

The API exposes endpoints to generate recipes from text or images, upload images, and manage recipe and user data.

## Environment Variables

Create a `.env` file in this directory with the required keys:

```properties
MODEL_API_KEY=your_google_gemini_api_key
IMAGE_GEN_MODEL_KEY=your_getimg_ai_api_key
IMAGE_GEN_MODEL_URL=your_getimg_ai_url
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_api_key
API_KEY=your_custom_api_key
```

## How to Run

### Running in a Local Environment

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create and configure your `.env` file as described above.

3. Install the dependencies:

```bash
pip install -r requirements.txt
```

4. Run the FastAPI application using Uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Base URL
```
http://localhost:8000
```

### Health Check
- **GET** `/` - Check if the API is running

### Generate Service (`/generate`)
- **POST** `/generate/recipe` - Generate a recipe from text or images
  - Request body: `RecipePrompt` (text, language, files)
  - Returns: Generated recipe in JSON format

- **POST** `/generate/image` - Generate an image based on recipe description
  - Request body: `{ "description": "string" }`
  - Returns: Generated image URL

### Recipes Service (`/recipes`)
- **POST** `/recipes/add` - Save a recipe to the database
  - Request body: `Recipe` model
  - Returns: Saved recipe data

- **GET** `/recipes/` - Get all recipes with pagination
  - Query params: `offset` (default: 0), `limit` (default: 10)
  - Returns: List of recipes

- **GET** `/recipes/{recipe_id}` - Get a specific recipe by ID
  - Path param: `recipe_id` (integer)
  - Returns: Recipe object or null

### Upload Service (`/upload`)
- **POST** `/upload/image` - Upload an image to storage
  - Request body: `{ "url": "image_url_string" }`
  - Returns: Public URL of uploaded image

## Authentication

All endpoints (except `/`) require an API key in the request header:

```
Header: api-key: your_custom_api_key
```

The API key must match the `API_KEY` environment variable.
