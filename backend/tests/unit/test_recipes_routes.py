from routers import recipes as recipes_router


class FakeResponse:
    def __init__(self, data):
        self.data = data


class FakeTable:
    def __init__(self, data):
        self._data = data
        self.last_range = None
        self.last_eq = None

    def insert(self, _):
        return self

    def select(self, _):
        return self

    def eq(self, key, value):
        self.last_eq = (key, value)
        return self

    def range(self, offset, limit):
        self.last_range = (offset, limit)
        return self

    def order(self, *_args, **_kwargs):
        return self

    def execute(self):
        return FakeResponse(self._data)


def test_get_recipe_returns_first_item(monkeypatch):
    fake = FakeTable([{ "id": 1 }])
    monkeypatch.setattr(recipes_router, "recipe_table", fake)

    result = recipes_router.get_recipe(1)

    assert result == {"id": 1}
    assert fake.last_eq == ("id", 1)


def test_get_recipe_returns_none_when_empty(monkeypatch):
    fake = FakeTable([])
    monkeypatch.setattr(recipes_router, "recipe_table", fake)

    result = recipes_router.get_recipe(99)

    assert result is None


def test_get_all_caps_range_to_ten(monkeypatch):
    fake = FakeTable([{ "id": 1 }])
    monkeypatch.setattr(recipes_router, "recipe_table", fake)

    recipes_router.get_all(offset=0, limit=50)

    assert fake.last_range == (0, 10)
