# Backend Dockerfile
FROM python:3.11-slim

# Ortam değişkenleri
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Çalışma dizini
WORKDIR /app

# Bağımlılıkları yükle
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Kodları kopyala
COPY . /app

# FastAPI çalıştır
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
