import urllib.request
import json
import time
import sys

sys.stdout.reconfigure(encoding="utf-8")

API_URL = "http://127.0.0.1:8000/api/chat"

test_prompts = [
    ("TEST 1: Menu List", "What coffees do you have?"),
    ("TEST 2: Cold & Sweet", "I want something cold and sweet."),
    ("TEST 3: Budget ₹200", "I have ₹200. What should I order?"),
    ("TEST 4: Customer C001 Personalization", "I am customer C001. What should I order?"),
    ("TEST 5: Anti-Hallucination", "Do you sell strawberry protein smoothies?")
]

def run_test(title, prompt):
    print(f"\n==================================================")
    print(f"RUNNING: {title}")
    print(f"PROMPT: {prompt}")
    print(f"==================================================")
    
    payload = json.dumps({"message": prompt, "user_id": "test_user_1"}).encode("utf-8")
    req = urllib.request.Request(API_URL, data=payload, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print("RESPONSE TEXT:\n", data.get("response"))
            print("\nRECOMMENDED CARDS RETURNED:", len(data.get("recommendations", [])))
            for rec in data.get("recommendations", []):
                print(f"  - [{rec.get('id')}] {rec.get('name')} | ₹{rec.get('price_inr')} | {rec.get('temperature')} | {rec.get('milk')}")
    except Exception as e:
        print("HTTP ERROR:", e)

if __name__ == "__main__":
    for title, prompt in test_prompts:
        run_test(title, prompt)
        time.sleep(3)
