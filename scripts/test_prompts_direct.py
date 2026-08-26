import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.stdout.reconfigure(encoding="utf-8")

from coffee_agent.agent import root_agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

prompts = [
    ("TEST 5", "I don't drink dairy. What can I order?"),
    ("TEST 6", "I have ₹200 and want something cold and sweet."),
    ("TEST 7", "I am customer C001. What should I order?"),
    ("TEST 8", "Do you sell strawberry protein smoothies?")
]

async def run_single(name, prompt_text):
    print(f"\n==================================================", flush=True)
    print(f"{name}: {prompt_text}", flush=True)
    print(f"==================================================", flush=True)
    runner = Runner(agent=root_agent, app_name="coffee_agent", session_service=InMemorySessionService())
    sess = await runner.session_service.create_session(app_name="coffee_agent", user_id="user_1")
    msg = types.Content(role="user", parts=[types.Part.from_text(text=prompt_text)])
    
    parts = []
    async for event in runner.run_async(user_id="user_1", session_id=sess.id, new_message=msg):
        if event.content and event.content.parts:
            for p in event.content.parts:
                if p.text:
                    parts.append(p.text)
    print("RESPONSE:\n" + "\n".join(parts), flush=True)

async def main():
    for name, p in prompts:
        try:
            await run_single(name, p)
        except Exception as e:
            print(f"ERROR on {name}: {e}", flush=True)
        await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())
