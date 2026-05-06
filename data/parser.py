import pandas as pd
from sqlalchemy import create_engine
# ... sua conexão aqui
from fps_api.build_db import db
import numpy as np

df_gpu = pd.read_csv("gpu_embedded.csv", index_col=False)
df_cpu = pd.read_csv("cpu_embedded.csv", index_col=False)
df_games = pd.read_csv("gamenames.csv", index_col=False)

df_gpu["embedding"] = df_gpu["embedding"].apply(
    lambda x: np.array(eval(x), dtype=np.float32).tolist() if isinstance(x, str) else x
)

df_cpu["embedding"] = df_cpu["embedding"].apply(
    lambda x: np.array(eval(x), dtype=np.float32).tolist() if isinstance(x, str) else x
)
df_gpu.to_sql("gpus", db, if_exists="append", index=False)
df_cpu.to_sql("cpus", db, if_exists="append", index=False)
df_games.to_sql("games", db, if_exists="append", index=False)
