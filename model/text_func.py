import pandas as pd
import numpy as np

gpu_features = [
    # Compute
    "Render Config__Shading Units",
    "Clock Speeds__Boost Clock",
    "Clock Speeds__Game Clock",
    "Clock Speeds__GPU Clock",
    "Theoretical Performance__FP32 (float)",

    # Memória
    "Memory__Bandwidth",
    "Memory__Memory Size",
    "Memory__Memory Type",
    "Memory__Memory Bus",

    # Rasterização
    "Render Config__ROPs",
    "Render Config__TMUs",
    "Theoretical Performance__Pixel Rate",
    "Theoretical Performance__Texture Rate",

    # Arquitetura / Geração
    "Graphics Processor__Architecture",
    "Graphics Processor__Process Size",
    "Normalized_Release_Date",
    "Board Design__TDP",

    # Condicionais (RT / DLSS / API)
    "Render Config__RT Cores",
    "Render Config__Tensor Cores",
    "Graphics Features__DirectX",
    "Graphics Features__Vulkan",
    "Graphics Features__CUDA",
    "Theoretical Performance__FP16 (half)",
    "Graphics Processor__Transistors",
]

KEY_ALIASES = {
    "Render Config__Shading Units": "shading_units",
    "Clock Speeds__Boost Clock": "boost_clock",
    "Clock Speeds__Game Clock": "game_clock",
    "Clock Speeds__GPU Clock": "gpu_clock",
    "Theoretical Performance__FP32 (float)": "fp32",
    "Memory__Bandwidth": "mem_bandwidth",
    "Memory__Memory Size": "vram",
    "Memory__Memory Type": "mem_type",
    "Memory__Memory Bus": "mem_bus",
    "Render Config__ROPs": "rops",
    "Render Config__TMUs": "tmus",
    "Theoretical Performance__Pixel Rate": "pixel_rate",
    "Theoretical Performance__Texture Rate": "texture_rate",
    "Graphics Processor__Architecture": "architecture",
    "Graphics Processor__Process Size": "process",
    "Board Design__TDP": "tdp",
    "Render Config__RT Cores": "rt_cores",
    "Render Config__Tensor Cores": "tensor_cores",
    "Graphics Features__DirectX": "dx",
    "Graphics Features__Vulkan": "vulkan",
    "Graphics Features__CUDA": "cuda",
    "Theoretical Performance__FP16 (half)": "fp16",
    "Graphics Processor__Transistors": "transistors",
}

def format_gpu_features(row: pd.Series) -> str:
    parts = []
    for full_key, alias in KEY_ALIASES.items():
        val = row.get(full_key, None)
        if pd.isna(val) or val == "" or val is None:
            continue
        parts.append(f"{alias}={val}")
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
    "cores",
    "logicals",
    "speed",
    "turbo",
    "tdp",
    "date",
    "category",
    "rank",
]

CPU_KEY_ALIASES = {
    "cores":    "cores",
    "logicals": "threads",
    "speed":    "base_clock",
    "turbo":    "boost_clock",
    "tdp":      "tdp",
    "category": "category",
    "rank":     "benchmark_rank",
}

def format_cpu_features(row: pd.Series) -> str:
    parts = []
    for key, alias in CPU_KEY_ALIASES.items():
        val = row.get(key, None)
        if pd.isna(val) or val == "" or val is None:
            continue
        parts.append(f"{alias}={val}")
    return " | ".join(parts)

def retrieval_cpu_feat(cpu_name: str, cpu_df: pd.DataFrame) -> str:
    cpu_name = cpu_name.lower()
    col = cpu_df['name'].str.lower()  # coluna 'name' minúscula nessa base

    mask = col == cpu_name
    if not mask.any():
        mask = col.str.contains(cpu_name, regex=False)
    if not mask.any():
        raise ValueError(f"CPU '{cpu_name}' não encontrada na base.")

    row = cpu_df.loc[mask, cpu_features].iloc[0]
    return format_cpu_features(row)
