import numpy as np
import pandas as pd
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel

load_dotenv()

class BenchmarkResult(BaseModel):
    avg_fps: int
    min_fps: int
    max_fps: int

def send_question(components:str, game:str, preset:str, resolution:str) -> str:
    client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

    config = types.GenerateContentConfig(
            system_instruction=(
                "You are a PC benchmark specialist. You will receive a hardware configuration "
                "(GPU, CPU, RAM), the name of a game, and the graphical quality (preset). "
                "Your task is to estimate the FPS with the highest technical accuracy possible, "
                "based on known real-world tests. "
                "STRICT RULE: Return ONLY the raw, validated JSON object. Do not include greetings, "
                "do not write 'Here is the JSON requested' or any other conversational text, "
                "and NEVER use markdown code blocks (```json)."
            ),
        temperature=0.1,
        max_output_tokens=1000,
        response_mime_type="application/json",
        response_schema=BenchmarkResult,
        )

    prompt = (
        f"Hardware: {components} \n"
        f"Game: {game} \n"
        f"Resolution: {resolution}\n"
        f"Preset: {preset}"
    )

    response = client.models.generate_content(
        model="models/gemini-2.5-flash-lite",
        contents=prompt,
        config=config
    )

    return response.text

components = "RTX 5060, Ryzen 7 5700X, 16GB RAM DDR4"
game = "Resident Evil 4 Remake"
preset = "High"
resolution = "1080p (No Ray Tracing)"

print(send_question(components, game, preset, resolution))
