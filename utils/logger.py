import logging
import os
from logging.handlers import RotatingFileHandler

LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "app.log")
os.makedirs(LOG_DIR, exist_ok=True)

# Dosya boyutuna göre döndürmeli log dosyası (örneğin 5 MB'a ulaştığında yeni dosya açar)
file_handler = RotatingFileHandler(LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=3)
file_handler.setLevel(logging.INFO)
file_formatter = logging.Formatter(
    "%(asctime)s - [%(levelname)s] - %(name)s - %(message)s"
)
file_handler.setFormatter(file_formatter)

# Konsol için handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
console_formatter = logging.Formatter(
    "[%(levelname)s] - %(name)s - %(message)s"
)
console_handler.setFormatter(console_formatter)

# Root logger'a handler'ları ekle
logging.basicConfig(level=logging.DEBUG, handlers=[file_handler, console_handler])

def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
