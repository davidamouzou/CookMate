from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.config import supabase_client
from backend.models.recipe import Recipe

recipe_table = supabase_client.table("recipes")
router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.post("/add")
def save(recipe: Recipe):
    try:
        json_data = recipe.model_dump()
        res = recipe_table.insert(json_data).execute()
        return res.data
    except Exception as e:
        return JSONResponse(status_code=503, content=f"Error: {e}")


@router.get("/{recipe_id}")
def get_recipe(recipe_id: int):
    try:
        res = recipe_table.select("*").eq('id', recipe_id).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        return JSONResponse(status_code=503, content=f"Error: {e}")


@router.get("/")
def get_all(offset: int = 0, limit: int = 10):
    if (limit - offset) > 10:
        limit = offset + 10

    try:
        response = recipe_table.select('*').range(offset, limit).order('id', desc=True).execute()
        return response.data
    except Exception as e:
        return JSONResponse(status_code=503, content=f"Error: {e}")