import base62
import requests
import json
import os
from datetime import datetime

# Database file - sadece UUID:name çiftleri tutulacak
DATABASE_FILE = "data/licensor_db.json"
AUTH_TOKEN_FILE = "config/auth_tokens.txt"

def load_database():
    """Sadece licensor veritabanını yükle"""
    if os.path.exists(DATABASE_FILE):
        try:
            with open(DATABASE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_database(db):
    """Veritabanını kaydet (sadece UUID:name)"""
    with open(DATABASE_FILE, 'w', encoding='utf-8') as f:
        json.dump(db, f, indent=2, ensure_ascii=False)

def get_auth_token():
    """auth_token.txt'den authorization token'ı oku"""
    try:
        with open(AUTH_TOKEN_FILE, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except FileNotFoundError:
        print(f"Hata: {AUTH_TOKEN_FILE} dosyası bulunamadı!")
        print("Lütfen önce Node.js scriptini çalıştırarak token oluşturun.")
        return None

def media_id_to_gid(media_id: str) -> str:
    """Track ID'yi GID'ye çevir"""
    return hex(base62.decode(media_id, charset=base62.CHARSET_INVERTED))[2:].zfill(32)

def get_licensor_uuid(track_id: str):
    """API'den licensor UUID'sini al"""
    auth_token = get_auth_token()
    if not auth_token:
        return None

    gid = media_id_to_gid(track_id)
    
    headers = {
        "accept": "application/json",
        "accept-language": "tr",
        "app-platform": "WebPlayer",
        "authorization": auth_token,
        <redacted_client_token>
        "referer": "https://open.spotify.com/",
    }
    
    url = f"https://example.invalid/metadata/4/track/{gid}?market=from_token"
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # UUID'yi bul
        for path in [['licensor', 'uuid'], ['album', 'licensor', 'uuid'], ['file', 'licensor', 'uuid']]:
            current = data
            for key in path:
                if isinstance(current, dict) and key in current:
                    current = current[key]
                else:
                    break
            else:
                return current
        
        return None
        
    except Exception as e:
        print(f"API Hatası: {str(e)}")
        return None

def main():
    db = load_database()
    
    while True:
        track_id = input("\nSpotify Track ID (çıkış için 'exit'): ").strip()
        if track_id.lower() == 'exit':
            break
        
        uuid = get_licensor_uuid(track_id)
        if not uuid:
            print("Licensor UUID bulunamadı")
            continue
        
        print(f"Licensor UUID: {uuid}")
        
        if uuid in db:
            print(f"Kayıtlı İsim: {db[uuid]}")
        else:
            cevap = input("Bu licensor için isim eklemek ister misiniz? (e/h): ").strip().lower()
            if cevap == 'e':
                isim = input("Licensor ismi: ").strip()
                db[uuid] = isim
                save_database(db)
                print(f"{uuid} -> {isim} eklendi")
    
    print("Çıkış yapılıyor...")
    save_database(db)

if __name__ == "__main__":
    main()