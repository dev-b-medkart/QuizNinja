import os
import shutil

def is_valid_image_format(filename: str, valid_formats: set) -> bool:
    """Check if the file has a valid image format."""
    ext = os.path.splitext(filename)[-1].lower()
    return ext in valid_formats


# def is_valid_image_format(filename: str, valid_formats: set) -> bool:
#     """Check if the file has a valid image format."""
#     return any(filename.lower().endswith(ext) for ext in valid_formats)

def clear_directory(directory: str):
    """Remove all files in a directory."""
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        if os.path.isfile(file_path):
            os.remove(file_path)
