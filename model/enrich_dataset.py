"""
Dataset Enrichment Script usando Anthropic API
===============================================
Preenche valores nulos nos datasets de CPU e GPU e adiciona campos L1/L2 cache nas CPUs.

Uso:
    python enrich_dataset.py --target cpu   # Enriquece o dataset de CPUs
    python enrich_dataset.py --target gpu   # Enriquece o dataset de GPUs
    python enrich_dataset.py --target all   # Enriquece ambos

Requer:
    pip install anthropic pandas tqdm
    export GOOGLE_API_KEY="sk-..."
"""

import os
import json
import time
import argparse
import pandas as pd
from tqdm import tqdm
from google.genai import types

# ─── Configurações ────────────────────────────────────────────────────────────

CPU_INPUT  = "data_cleaned.csv"
GPU_INPUT  = "gpu_1986-2026_normalized_dates.csv"
CPU_OUTPUT = "tpu_cpus_enriched.csv"
GPU_OUTPUT = "gpu_enriched.csv"

MODEL = "models/gemini-2.5-flash-lite"

# Pausa entre chamadas à API para evitar rate limit (segundos)
DELAY_BETWEEN_CALLS = 0.5

# Tamanho do batch: quantas CPUs/GPUs enviar por chamada à API
BATCH_SIZE = 10

# ─── GPU: colunas que queremos preencher (as mais relevantes para FPS) ────────
GPU_TARGET_COLS = [
    "Graphics Processor__Architecture",
    "Board Design__TDP",
    "Clock Speeds__Base Clock",
    "Clock Speeds__Boost Clock",
    "Clock Speeds__GPU Clock",
    "Render Config__Shading Units",
]

# ─── CPU: colunas que queremos preencher ─────────────────────────────────────
CPU_TARGET_COLS = [
    "Codename",
    "Cores",
    "Clock",
    "Socket",
    "Process",
    "L1_Cache",
    "L2_Cache",
    "L3_Cache",
    "TDP",
]


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def make_client() -> genai.Anthropic:
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "Variável de ambiente GOOGLE_API_KEY não definida.\n"
            "Execute: export GOOGLE_API_KEY='sk-ant-...'"
        )
    return genai.Anthropic(api_key=api_key)


def call_llm(client: genai.Anthropic, prompt: str, retries: int = 3) -> str:
    """Chama a API com retry automático em caso de erro."""
    for attempt in range(retries):
        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text
        except Exception as e:
            if attempt < retries - 1:
                wait = 2 ** attempt * 2
                print(f"  ⚠ Erro na API (tentativa {attempt+1}/{retries}): {e}. Aguardando {wait}s...")
                time.sleep(wait)
            else:
                print(f"  ✗ Falha definitiva após {retries} tentativas: {e}")
                return ""
    return ""


def safe_parse_json(text: str) -> dict | list | None:
    """Extrai e parseia JSON de uma resposta do LLM."""
    text = text.strip()
    # Remove possíveis backticks de markdown
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Tenta extrair bloco JSON do meio do texto
        import re
        match = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        return None
    
def get_missing_fields(data_list: list, names: list, required_fields: list) -> list:
    """Retorna apenas nomes e campos faltantes para otimizar tokens."""
    prompt_data = []
    for i, name in enumerate(names):
        data = data_list[i] if i < len(data_list) else {}
        missing = [f for f in required_fields if f not in data or data[f] is None]
        
        if missing:  
            prompt_data.append({
                "Name": name,
                "missing_fields": missing
            })
    return prompt_data


# ──────────────────────────────────────────────────────────────────────────────
# CPU Enrichment
# ──────────────────────────────────────────────────────────────────────────────

def build_cpu_prompt(missing_fields_data: list) -> str:
    """Constrói prompt dinâmico com apenas os campos faltantes."""
    fields_desc = {
        "Codename": "microarquitetura (ex: Zen 3, Alder Lake, Raptor Lake)",
        "Cores": "número de núcleos físicos (inteiro)",
        "Clock": "frequência base (ex: 3.6 GHz)",
        "Socket": "soquete (ex: AM4, LGA1700)",
        "Process": "processo de fabricação (ex: 7 nm, 14 nm)",
        "L1_Cache": "tamanho total da cache L1 (ex: 512 KB, 1 MB)",
        "L2_Cache": "tamanho total da cache L2 (ex: 4 MB, 8 MB)",
        "L3_Cache": "tamanho total da cache L3 (ex: 32 MB, 64 MB) ou null se não tiver",
        "TDP": "consumo de potência (ex: 65W, 105W) ou null",
    }
    
    # Construir lista de campos dinâmicos
    fields_list = "\n".join([
        f"  - {item['Name']}: {', '.join([fields_desc.get(f, f) for f in item['missing_fields']])}"
        for item in missing_fields_data
    ])
    
    return f"""Você é um especialista em hardware de computadores.

Para cada CPU abaixo, forneça APENAS os campos faltantes listados. Se não souber um valor, use null.

CPUs com campos faltantes:
{fields_list}

Responda APENAS com um JSON array (sem markdown, sem texto extra):
[
  {{
    "Name": "nome exato da CPU como fornecido",
    <preenchido com apenas os campos solicitados>
  }}
]

Regras importantes:
- Use null (sem aspas) para valores desconhecidos
- Cores deve ser número inteiro, não string
- Responda APENAS com JSON válido
"""

def enrich_cpus(client: genai.Anthropic):
    print("\n" + "="*60)
    print("  ENRIQUECENDO DATASET DE CPUs")
    print("="*60)

    df = pd.read_csv(CPU_INPUT)
    print(f"Dataset carregado: {len(df)} linhas")

    # Remove linhas de "No CPUs found"
    before = len(df)
    df = df[~df['Name'].str.contains("No CPUs found", na=False)].copy()
    print(f"Removidas {before - len(df)} linhas de 'No CPUs found'")

    # Adiciona colunas L1 e L2 se não existirem
    for col in ["L1_Cache", "L2_Cache"]:
        if col not in df.columns:
            df[col] = None
            print(f"Coluna '{col}' adicionada")

    # Identifica linhas que precisam de enriquecimento
    # Caso 1: dados ausentes (Codename nulo)
    needs_full = df[df['Codename'].isnull()].index.tolist()
    # Caso 2: tem dados mas falta L1/L2/L3
    needs_cache = df[
        df['Codename'].notna() &
        (df['L1_Cache'].isnull() | df['L2_Cache'].isnull() | df['L3_Cache'].isnull())
    ].index.tolist()

    all_indices = list(dict.fromkeys(needs_full + needs_cache))  # dedup mantendo ordem
    print(f"Linhas para enriquecimento total: {len(all_indices)}")
    print(f"  - Dados completos ausentes: {len(needs_full)}")
    print(f"  - Apenas cache ausente: {len(needs_cache)}")

    if not all_indices:
        print("✓ Nenhum dado para preencher!")
        df.to_csv(CPU_OUTPUT, index=False)
        return

    # Processa em batches
    batches = [all_indices[i:i+BATCH_SIZE] for i in range(0, len(all_indices), BATCH_SIZE)]
    filled = 0
    skipped = 0

    for batch_num, batch_idx in enumerate(tqdm(batches, desc="Processando batches")):
        # Preparar dados com campos faltantes (otimizado para tokens)
        batch_data = [df.loc[idx].to_dict() for idx in batch_idx]
        batch_names = [d['Name'] for d in batch_data]
        missing_fields_data = get_missing_fields(batch_data, batch_names, CPU_TARGET_COLS)
        
        if not missing_fields_data:
            # Todos os itens do batch já têm dados completos
            continue
        
        prompt = build_cpu_prompt(missing_fields_data)

        raw = call_llm(client, prompt)
        if not raw:
            skipped += len(missing_fields_data)
            continue

        results = safe_parse_json(raw)
        if not isinstance(results, list):
            print(f"  ⚠ Batch {batch_num+1}: resposta inválida do LLM")
            skipped += len(batch_idx)
            continue

        # Indexa resultados pelo nome
        results_map = {r.get("Name", ""): r for r in results if isinstance(r, dict)}

        for idx in batch_idx:
            cpu_name = df.at[idx, 'Name']
            result = results_map.get(cpu_name)
            if not result:
                skipped += 1
                continue

            filled += 1
            # Preenche campos nulos com os dados do LLM
            for col in ['Codename', 'Cores', 'Clock', 'Socket', 'Process', 'L3_Cache', 'TDP']:
                if pd.isnull(df.at[idx, col]) and result.get(col) is not None:
                    df.at[idx, col] = result[col]

            # Sempre atualiza L1/L2 se o LLM forneceu
            for col in ['L1_Cache', 'L2_Cache']:
                if result.get(col) is not None:
                    df.at[idx, col] = result[col]

        time.sleep(DELAY_BETWEEN_CALLS)

    # Salva resultado
    df.to_csv(CPU_OUTPUT, index=False)

    print(f"\n✓ Concluído!")
    print(f"  Linhas preenchidas: {filled}")
    print(f"  Linhas sem resposta: {skipped}")
    print(f"  Arquivo salvo: {CPU_OUTPUT}")

    # Relatório de nulos restantes
    print("\nNulos restantes nas colunas principais:")
    for col in ['Codename','Cores','Clock','Socket','Process','L1_Cache','L2_Cache','L3_Cache','TDP']:
        n = df[col].isnull().sum()
        print(f"  {col}: {n}")

# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Enriquece datasets de CPU usando a API da Anthropic"
    )
    parser.add_argument(
        "--target",
        choices=["cpu"],
        default="cpu",
        help="Qual dataset enriquecer (padrão: cpu)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=BATCH_SIZE,
        help=f"Tamanho do batch por chamada à API (padrão: {BATCH_SIZE})",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=DELAY_BETWEEN_CALLS,
        help=f"Pausa em segundos entre chamadas (padrão: {DELAY_BETWEEN_CALLS})",
    )
    args = parser.parse_args()

    global BATCH_SIZE, DELAY_BETWEEN_CALLS
    BATCH_SIZE = args.batch_size
    DELAY_BETWEEN_CALLS = args.delay

    client = make_client()
    print(f"Cliente Google inicializado. Modelo: {MODEL}")
    print(f"Batch size: {BATCH_SIZE} | Delay: {DELAY_BETWEEN_CALLS}s\n")

    if args.target in ("cpu", "all"):
        enrich_cpus(client)

    print("\n✓ Enriquecimento concluído!")


if __name__ == "__main__":
    main()