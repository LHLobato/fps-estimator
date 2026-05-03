from sentence_transformers import SentenceTransformer
import pandas as pd
from tqdm import tqdm

cpu = pd.read_csv("cpu_renamed.csv", index_col=False)
games = pd.read_csv("gamenames.csv", index_col=False)
gpu = pd.read_csv("gpu_renamed.csv", index_col=False)

model = SentenceTransformer("all-MiniLM-L6-v2")

print("Gerando embeddings GPU...")
gpu["embedding"] = [
    model.encode(str(name)).tolist()
    for name in tqdm(gpu["Name"])
]
gpu.to_csv("gpu_embedded.csv", index=False)
print(f"✓ gpu_embedded.csv — {len(gpu)} linhas")

print("Gerando embeddings CPU...")
cpu["embedding"] = [
    model.encode(str(name)).tolist()
    for name in tqdm(cpu["name"])
]
cpu.to_csv("cpu_embedded.csv", index=False)
print(f"✓ cpu_embedded.csv — {len(cpu)} linhas")

print("Gerando embeddings Games...")
games["embedding"] = [
    model.encode(str(name)).tolist()
    for name in tqdm(games["name"])
]
games.to_csv("games_embedded.csv", index=False)
print(f"✓ games_embedded.csv — {len(games)} linhas")
