import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pathlib import Path
from sqlalchemy.orm import Session
from model.schemas import BenchmarkResult
from model.text_func import retrieval_gpu_feat, retrieval_cpu_feat
import pandas as pd

load_dotenv()

DATA_DIR = Path(__file__).parent.parent / "data"
GAME_DF = pd.read_csv(f"{DATA_DIR}/gamenames.csv", index_col=False)

async def send_question(
    components: dict,
    game: str,
    preset: str,
    resolution: str,
    upscaling: str,
    session: Session,
) -> str:
    client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
    config = types.GenerateContentConfig(
        system_instruction=(
                    "You are a PC benchmark specialist. You will receive a hardware configuration "
                    "(GPU, CPU, RAM), the name of a game, and the graphical quality (preset), resolution, and upscaling method if so. "
                    "Your task is to estimate the FPS with the highest technical accuracy possible, based on known real-world tests. "

                    # --- NOVA REGRA ADICIONADA AQUI ---
                    "Crucially, you must analyze the specific engine demands of the requested game. Determine if the game is notoriously CPU-bound (e.g., eSports titles, simulation games) or GPU-bound (e.g., heavy AAA graphical showcases), and let that dictate which component creates the primary bottleneck. "
                    # ----------------------------------

                    "After the hardware components, the most important features are resolution and upscaling method; always give more weight to them in your thinking. "
                    "Pay extremely close attention to the CPU generation and tier. "
                    "Pay extremely close attention to the GPU generation and tier. Flagship GPUs like the RTX 4090 or 5090 should not be bottlenecked by 4K resolution in older games. "
                    "If you don't know the game or hardware specified feel free to search in web. "

                    "STRICT RULE: Return ONLY the raw, validated JSON object. Do not include greetings, "
                    "do not write 'Here is the JSON requested' or any other conversational text, "
                    "and NEVER use markdown code blocks (```json)."
                ),
        temperature=0.1,
        max_output_tokens=1200,
        response_mime_type="application/json",
        response_schema=BenchmarkResult,
    )

    gpu_name = components['gpu']
    cpu_name = components['cpu']
    ram = components['ram']

    gpu_prompted = f"{gpu_name} | {await retrieval_gpu_feat(gpu_name, session)}"
    cpu_prompted = f"{cpu_name} | {await retrieval_cpu_feat(cpu_name, session)}"

    if not upscaling:
        upscaling = "No"

    prompt = (
        f"[Hardware] {gpu_prompted} | {cpu_prompted} | {ram}\n"
        f"[Game] {game}\n"
        f"[Upscaling] {upscaling}\n"
        f"[Resolution] {resolution}\n"
        f"[Preset] {preset}"
    )

    response = client.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=prompt,
        config=config,
    )
    return response.text
