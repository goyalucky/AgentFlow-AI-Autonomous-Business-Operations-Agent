import os
import shutil
from fastapi import UploadFile

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class FileService:
    @staticmethod
    def save_file(file: UploadFile) -> str:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        # Rewind file pointer to beginning
        file.file.seek(0)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return file_path

    @staticmethod
    def get_file_path(filename: str) -> str:
        return os.path.join(UPLOAD_DIR, filename)