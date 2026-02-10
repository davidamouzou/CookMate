from routers.upload import get_image_extension, rename_image


def test_get_image_extension_strips_query_params():
    ext = get_image_extension("https://example.com/photo.png?token=abc")
    assert ext == "png"


def test_get_image_extension_invalid_extension_raises():
    try:
        get_image_extension("https://example.com/photo.verylongext")
    except ValueError as exc:
        assert "Invalid or missing file extension" in str(exc)
    else:
        raise AssertionError("Expected ValueError for invalid extension")


def test_rename_image_uses_extension():
    filename = rename_image("jpg")
    assert filename.endswith(".jpg")
    assert "_" in filename
