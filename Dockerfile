FROM node:18-alpine

# SQLite3 ve build tools için gerekli paketleri yükle
RUN apk add --no-cache python3 make gcc g++ sqlite

# Çalışma dizinini ayarla
WORKDIR /app

# package.json dosyasını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Uygulama dosyalarını kopyala
COPY . .

# SQLite veritabanını oluştur
RUN node database.js

# Port 3000'i aç
EXPOSE 3000

# Uygulamayı başlat
CMD ["node", "app.js"]
