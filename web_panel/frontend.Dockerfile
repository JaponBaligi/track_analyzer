# Frontend Dockerfile
FROM node:20-alpine

# Çalışma dizini
WORKDIR /app

# Paket dosyalarını kopyala
COPY package*.json /app/

# Bağımlılıkları yükle
RUN npm install

# Kodları kopyala
COPY . /app

# React build al (Electron kullanıyorsan, build sonrası electron başlatabilirsin)
RUN npm run build

# Development için React başlat (production’da serve kullanılır)
CMD ["npm", "start"]
