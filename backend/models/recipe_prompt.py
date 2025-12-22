from pydantic import BaseModel


class RecipePrompt(BaseModel):
    text: str
    language: str = "en"
    files: list[dict] = []
