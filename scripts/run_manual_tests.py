import asyncio
import os
import sys
import time
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.stdout.reconfigure(encoding="utf-8")

from coffee_agent.config import validate_environment
from coffee_agent.agent import root_agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

prompts = [
    "What coffees do you have?",
    "What cold drinks do you have?",
    "What is the price of the Iced Vanilla Latte?",
    "What are the ingredients in the Iced Vanilla Latte?",
    "I don't drink dairy. What can I order?",
    "I have \u20b9200 and want something cold and sweet.",
    "I am customer C001. What should I order?",
    "Do you sell strawberry protein smoothies?"
]

async def run_single_prompt(prompt_text: str):
    runner = Runner(agent=root_agent, app_name="coffee_agent", session_service=InMemorySessionService())
    sess = await runner.session_service.create_session(app_name="coffee_agent", user_id="test_user")
    msg = types.Content(role="user", parts=[types.Part.from_text(text=prompt_text)])
    
    responses = []
    async for event in runner.run_async(user_id="test_user", session_id=sess.id, new_message=msg):
        if event.content:
            for part in event.content.parts:
                if part.text:
                    responses.append(part.text)
    return "\n".join(responses)

async def main():
    print("=== STARTING MANUAL PROMPT VERIFICATION (TEST 1 - TEST 8) ===", flush=True)
    for i, p in enumerate(prompts, start=1):
        print(f"\n--------------------------------------------------", flush=True)
        print(f"TEST {i}: {p}", flush=True)
        print(f"--------------------------------------------------", flush=True)
        success = False
        while not success:
            try:
                res = await run_single_prompt(p)
                print(f"RESPONSE:\n{res}", flush=True)
                success = True
            except Exception as e:
                if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e):
                    print("  [Rate limited by Gemini free tier API. Waiting 15s before retry...]", flush=True)
                    await asyncio.sleep(15)
                else:
                    print(f"  [ERROR]: {e}", flush=True)
                    break
        await asyncio.sleep(13)  # Rate limit safety delay between prompts

if __name__ == "__main__":
    asyncio.run(main())
