import numpy as np
import pandas as pd
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pathlib import Path
import sys
from model.schemas import BenchmarkResult
from model.text_func import retrieval_gpu_feat, retrieval_cpu_feat

load_dotenv()
DATA_DIR = Path(__file__).parent.parent / "data"
GPU_DF = pd.read_csv(f"{DATA_DIR}/gpu_1986-2026_normalized_dates.csv", index_col=False)
CPU_DF = pd.read_csv(f"{DATA_DIR}/data_cleaned.csv", index_col=False)
GAME_DF = pd.read_csv(f"{DATA_DIR}/gamenames.csv", index_col=False)


def send_question(components:list, game:str, preset:str, resolution:str, upscaling:str) -> str:
    """
    Function that connects application with the GOOGLE API, receiving the related to build
    the LLM prompt.

    *components: list with the user's hardaware components
    *game: the game name that will be estimated
    *preset: graphics quality
    *resolution: image resolution that user's want to run the game

    return -> JSON formated to string, with avg, min and max fps.
    """



    client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

    config = types.GenerateContentConfig(
            system_instruction=(
                "You are a PC benchmark specialist. You will receive a hardware configuration "
                "(GPU, CPU, RAM), the name of a game, and the graphical quality (preset), resolution and upscaling method if so. "
                "After the Hardware components, the most important features are resolution and upscaling method, always give more weight for them in your thinking."
                "Your task is to estimate the FPS with the highest technical accuracy possible, "
                "based on known real-world tests. If you don't know the game or hardware specified feel free to search in web."
                "STRICT RULE: Return ONLY the raw, validated JSON object. Do not include greetings, "
                "do not write 'Here is the JSON requested' or any other conversational text, "
                "and NEVER use markdown code blocks (```json)."
            ),
        temperature=0.1,
        max_output_tokens=1000,
        response_mime_type="application/json",
        response_schema=BenchmarkResult,
        )

    gpu_name = components[0]
    cpu_name = components[1]
    ram = components[2]

    gpu_prompted = f"{gpu_name} | {retrieval_gpu_feat(gpu_name, GPU_DF)}"

    cpu_prompted = f"{cpu_name} | {retrieval_cpu_feat(cpu_name, CPU_DF)}"

    if not upscaling:
        upscaling = "No"
    print(upscaling)
    prompt = (
        f"[Hardware] {gpu_prompted} | {cpu_prompted} | {ram}\n"
        f"[Game] {game} \n"
        f"[Upscaling] {upscaling}\n"
        f"[Resolution] {resolution}\n"
        f"[Preset] {preset}"
    )

    response = client.models.generate_content(
        model="models/gemini-2.5-flash-lite",
        contents=prompt,
        config=config
    )

    return response.text
#print(send_question(components, game, preset, resolution))
#print(retrieval_cpu_feat("i3-10100F", pd.read_csv("../data/data_cleaned.csv")))
