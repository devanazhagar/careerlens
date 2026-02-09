import sys
import json
import os
import urllib.request
import urllib.error
import argparse

# --- IMPORTANT ---
# This script is designed to be called by the Node.js backend via 'spawn'.
# It reads JSON from Stdin and writes JSON to Stdout.
# DO NOT Run this manually as a server (e.g. 'python server.py'). 
# The Node.js server (npm run start) handles the web server part.
# -----------------

# Force UTF-8 encoding for Windows terminal/stdout
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Priority: Env Var (set by arg or .env) -> Interactive Input
API_KEY = os.environ.get('GEMINI_API_KEY')

def list_available_models(key):
    """Diagnose 404 by listing what this key CAN see."""
    results = []
    for version in ["v1", "v1beta"]:
        url = f'https://generativelanguage.googleapis.com/{version}/models?key={key}'
        try:
            with urllib.request.urlopen(url) as response:
                data = json.loads(response.read().decode('utf-8'))
                models = [m['name'] for m in data.get('models', [])]
                results.append(f"{version}: {', '.join(models)}")
        except Exception as e:
            results.append(f"{version} Error: {str(e)}")
    return " | ".join(results)

def call_gemini_api(prompt, key):
    if not key:
        return {"success": False, "error": "Server configuration error: GEMINI_API_KEY not found."}

    # Added a User-Agent to prevent Google from blocking the "bare" script
    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    data = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    encoded_data = json.dumps(data).encode('utf-8')

    # Discovery matrix - EXPANDED FOR MAXIMUM RESILIENCE (2.5 & Gemma Fallbacks)
    discovery_matrix = [
        ("v1beta", "gemini-2.0-flash-lite"),
        ("v1", "gemini-2.0-flash"),
        ("v1beta", "gemini-flash-latest"),
        ("v1", "gemini-2.5-flash"), 
        ("v1", "gemini-2.5-flash-lite"),
        ("v1beta", "gemini-exp-1206"),
        ("v1beta", "gemma-3-27b-it"),
        ("v1beta", "gemini-pro-latest"),
    ]

    all_logs = []

    for version, model in discovery_matrix:
        url = f'https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent?key={key}'
        req = urllib.request.Request(url, data=encoded_data, headers=headers, method='POST')
        
        # Retry logic for 429 (Rate Limit)
        max_attempts = 2
        for attempt in range(max_attempts):
            try:
                # print(f"🔍 Trying: {model} ({version})...", file=sys.stderr)
                with urllib.request.urlopen(req) as response:
                    result = json.loads(response.read().decode('utf-8'))
                    
                    if not result.get('candidates') or not result['candidates'][0].get('content'):
                         raise Exception("Safety block: No content generated.")
                    
                    print(f"✅ SUCCESS: Connected to {model} ({version})", file=sys.stderr)
                    return {"success": True, "text": result['candidates'][0]['content']['parts'][0]['text']}

            except urllib.error.HTTPError as e:
                error_body = e.read().decode('utf-8')
                msg = f"❌ {model} ({version}) -> HTTP {e.code}"
                
                # Check for rate limit
                if e.code == 429:
                    if attempt < max_attempts - 1:
                        # Short sleep and try again for this model
                        import time
                        wait_sec = 3
                        # print(f"⌛ Rate limited. Waiting {wait_sec}s for {model}...", file=sys.stderr)
                        time.sleep(wait_sec)
                        continue
                    else:
                        # Log it and move to NEXT model in matrix
                        all_logs.append(f"{msg}: {error_body}")
                        break 
                
                if e.code != 404:
                    print(f"⚠️  {msg}: {error_body}", file=sys.stderr)
                all_logs.append(f"{msg}: {error_body}")
                break # Move to next model if not a retryable 429
            except Exception as e:
                all_logs.append(f"⚠️  {model} ({version}) -> {str(e)}")
                break

    # If we get here, everything failed.
    # Return a structured error JSON instead of sys.exit(1)
    # This allows Node.js to see 'success: false' and use its local fallback
    available = list_available_models(key)
    error_msg = f"AI Bridge failed to connect. Logs: {'; '.join(all_logs[:3])}. Available: {available}"
    return {"success": False, "error": error_msg}

def api_mode():
    """
    Reads JSON input from stdin: { "apiKey": "...", "prompt": "..." }
    Writes JSON output to stdout: { "success": true, "text": "..." }
    """
    try:
        # Read all stdin data
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"success": False, "error": "No input received"}))
            return

        try:
            request = json.loads(input_data)
        except json.JSONDecodeError:
             print(json.dumps({"success": False, "error": "Invalid JSON input"}))
             return

        api_key = request.get("apiKey") or API_KEY
        prompt = request.get("prompt")
        
        if not api_key:
            print(json.dumps({"success": False, "error": "Missing API Key. Ensure GEMINI_API_KEY is in .env"}))
            return

        if not prompt:
            print(json.dumps({"success": False, "error": "Missing prompt"}))
            return

        # Call Gemini
        response = call_gemini_api(prompt, api_key)
        
        # Output JSON result and Flush
        print(json.dumps(response))
        sys.stdout.flush()

    except Exception as e:
        # Global catch-all
        print(json.dumps({"success": False, "error": f"Python Script Error: {str(e)}"}))
        sys.stdout.flush()

def interactive_mode():
    print("--------------------------------------------------")
    print("       Gemini AI Terminal Bot (Test Mode)         ")
    print("--------------------------------------------------")
    print("NOTE: This is just for testing. The Website uses API mode automatically.")
    
    current_key = API_KEY
    if not current_key:
        current_key = input("🔑 Please enter your Gemini API Key: ").strip()
    
    if not current_key:
        print("❌ API Key is required.")
        return

    print("\n✅ Ready! Type your prompt below. (Type 'exit' to quit)\n")
    
    while True:
        try:
            user_input = input("You: ")
            if user_input.lower() in ['exit', 'quit']:
                break
            if not user_input.strip():
                continue
                
            print("✨ ...", end="\r")
            response = call_gemini_api(user_input, current_key)
            print(" " * 10, end="\r") 
            
            if response.get("success"):
                print(f"🤖 Bot: {response['text'].strip()}\n")
            else:
                print(f"❌ Error: {response.get('error')}\n")
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
             print(f"\n❌ Error: {str(e)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", action="store_true", help="Run in headless API mode")
    parser.add_argument("--key", type=str, help="Pass API Key")
    
    args = parser.parse_args()
    
    if args.key:
        os.environ["GEMINI_API_KEY"] = args.key
        API_KEY = args.key

    if args.api:
        api_mode()
    else:
        interactive_mode()