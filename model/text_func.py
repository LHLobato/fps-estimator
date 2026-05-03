import pandas as pd
import numpy as np

gpu_features = [
    "Brand",
    "Name",
    "shading_units",
    "boost_clock",
    "game_clock",
    "gpu_clock",
    "fp32",
    "mem_bandwidth",
    "vram",
    "mem_type",
    "mem_bus",
    "rops",
    "tmus",
    "pixel_rate",
    "texture_rate",
    "architecture",
    "process",
    "Normalized_Release_Date",
    "tdp",
    "rt_cores",
    "tensor_cores",
    "dx",
    "vulkan",
    "cuda",
    "fp16",
    "transistors",
]

def format_gpu_features(row: pd.Series) -> str:
    parts = []
    for col in gpu_features:
        if col in ("Brand", "Name", "Normalized_Release_Date"):
            continue
        val = row.get(col, None)
        if pd.isna(val) or val == "" or val is None:
            continue
        parts.append(f"{col}={val}")
    return " | ".join(parts)

def retrieval_gpu_feat(gpu_name: str, gpu_df: pd.DataFrame) -> str:
    gpu_name = gpu_name.lower()
    col = gpu_df['Name'].str.lower()

    mask = col == gpu_name
    if not mask.any():
        mask = col.str.contains(gpu_name, regex=False)
    if not mask.any():
        raise ValueError(f"GPU '{gpu_name}' não encontrada na base.")

    row = gpu_df.loc[mask, gpu_features].iloc[0]
    return format_gpu_features(row)


cpu_features = [
    "name",
    "date",
    "socket",
    "category",
    "speed",
    "turbo",
    "cores",
    "threads",
    "l1_cache",
    "l2_cache",
    "l3_cache",
]

def format_cpu_features(row: pd.Series) -> str:
    parts = []
    for col in cpu_features:
        if col == "name":
            continue
        val = row.get(col, None)
        if pd.isna(val) or val == "" or val is None:
            continue
        parts.append(f"{col}={val}")
    return " | ".join(parts)

def retrieval_cpu_feat(cpu_name: str, cpu_df: pd.DataFrame) -> str:
    cpu_name = cpu_name.lower()
    col = cpu_df['name'].str.lower()

    mask = col == cpu_name
    if not mask.any():
        mask = col.str.contains(cpu_name, regex=False)
    if not mask.any():
        raise ValueError(f"CPU '{cpu_name}' não encontrada na base.")

    row = cpu_df.loc[mask, cpu_features].iloc[0]
    return format_cpu_features(row)
