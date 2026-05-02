# Filtra dados de CPUs mantendo apenas colunas relevantes
import pandas as pd

input_cpu = "../data/tpu_cpus_enriched-final.csv"
output_cpu = "../data/cpu_filtered.csv"
input_gpu = "../data/gpu_1986-2026_normalized_dates.csv"
output_gpu = "../data/gpu_filtered.csv"

# Colunas a manter no dataset de CPUs e GPUs, respectivamente
collumns_to_keep_cpu = [
    "name",
    "date",
    "socket",
    "category",
    "speed",
    "turbo",
    "cpuCount",
    "cores",
    "logicals",
    "l1_cache",
    "l2_cache",
    "l3_cache",
]

collumns_to_keep_gpu = [
    "Brand",
    "Name",

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

def filter_cpu(input, output):
    """Lê CSV, seleciona colunas e salva resultado de CPUs"""
    df = pd.read_csv(input)
    df_filtered = df[collumns_to_keep_cpu]
    df_filtered.to_csv(output, index=False)

def filter_gpu(input, output):
    """Lê CSV, seleciona colunas e salva resultado de GPUs"""
    df = pd.read_csv(input)
    df_filtered = df[collumns_to_keep_gpu]
    df_filtered.to_csv(output, index=False)

if __name__ == "__main__":
    filter_cpu(input_cpu, output_cpu)
    filter_gpu(input_gpu, output_gpu)
