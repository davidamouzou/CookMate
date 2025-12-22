from datetime import datetime, timezone
from pydantic import BaseModel
from pydantic import BaseModel, Field


class NutritionFacts(BaseModel):
    calories: str = ""
    protein: str = ""
    carbohydrates: str = ""
    fat: str = ""
    vitamins: str = ""
    minerals: str = ""
    dietary_fiber: str = ""
    sugar: str = ""
    salt: str = ""
    antioxidants: str = ""


class Recipe(BaseModel):
    created_at: str = datetime.now(timezone.utc).isoformat()
    recipe_name: str
    ingredients: list[str]  # ingredients to compose recipe
    instructions: list[str]
    continent: str
    language: str
    duration_to_cook: int
    servings: int
    difficulty: str
    cuisine: str
    description: str
    meal_type: str
    nutrition_facts: NutritionFacts = NutritionFacts()
    image: str = ""