import urllib.request
import json
import os
import sys
import io

# Force UTF-8 on Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Load from server/.env if it exists
def get_api_key():
    try:
        with open('server/.env', 'r') as f:
            for line in f:
                if line.startswith('GEMINI_API_KEY='):
                    return line.split('=')[1].strip().strip('"')
    except:
        pass
    return os.environ.get('GEMINI_API_KEY')

key = get_api_key()
if not key:
    print("❌ API Key not found in server/.env or environment.")
    sys.exit(1)

url = f"https://generativelanguage.googleapis.com/v1/models?key={key}"

try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode('utf-8'))
        with open('models.txt', 'w', encoding='utf-8') as f:
            f.write("✅ Generative Models Found:\n")
            for model in data.get('models', []):
                name = model['name'].replace('models/', '')
                if 'flash' in name or 'pro' in name:
                    f.write(f" - {name}\n")
except Exception as e:
    with open('models.txt', 'w', encoding='utf-8') as f:
        f.write(f"❌ Error: {str(e)}")
