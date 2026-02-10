import json

from routers import generate


def test_build_prompt_includes_text_and_language():
    prompt = generate._build_prompt("tomate", "fr")
    assert "tomate" in prompt
    assert "fr" in prompt


def test_parse_model_response_invalid_json_raises():
    try:
        generate._parse_model_response("not-json")
    except ValueError as exc:
        assert "not valid JSON" in str(exc)
    else:
        raise AssertionError("Expected ValueError for invalid JSON")


def test_parse_model_response_valid_recipe_returns_dict():
    payload = {
        "recipe_name": "Test",
        "ingredients": ["a"],
        "instructions": ["b"],
        "continent": "Europe",
        "language": "en",
        "duration_to_cook": 10,
        "servings": 2,
        "difficulty": "easy",
        "cuisine": "test",
        "description": "desc",
        "meal_type": "dinner",
        "nutrition_facts": {},
        "image": "",
    }
    result = generate._parse_model_response(json.dumps(payload))
    assert result["recipe_name"] == "Test"
    assert result["ingredients"] == ["a"]
