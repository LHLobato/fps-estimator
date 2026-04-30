"""
Dataset Enrichment Script usando Google Gemini API
===================================================
Preenche valores nulos no dataset de CPU e adiciona campos L1/L2/L3 cache.

Uso:
    python enrich_dataset.py

Requer:
    pip install python-dotenv google-generativeai pandas tqdm
    Arquivo .env com variável GOOGLE_API_KEY
"""
import numpy as np
import os
import json
import time
import argparse
import pandas as pd
from tqdm import tqdm
import google.generativeai as genai
from dotenv import load_dotenv

# ─── Configurações ────────────────────────────────────────────────────────────

load_dotenv()

CPU_INPUT  = "../data/tpu_cpus_enriched.csv"
CPU_OUTPUT = "../data/tpu_cpus_enriched-final.csv"
CHECKPOINT_FILE = "../data/enrichment_checkpoint.json"

MODEL = "gemini-2.5-flash-lite"

DELAY_BETWEEN_CALLS = 5

BATCH_SIZE = 287

# ─── CPU: colunas que queremos preencher ─────────────────────────────────────
# APENAS CACHE - colunas com valores 0 são consideradas faltantes
CPU_TARGET_COLS = [
    "l1_cache", # Cache L1 em KB
    "l2_cache", # Cache L2 em KB
    "l3_cache", # Cache L3 em KB
]

# Todas as colunas numéricas que o loop de preenchimento deve tocar
ALL_FILL_COLS = ['l1_cache', 'l2_cache', 'l3_cache']


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def setup_api_key():
    """Configura o cliente Google Generative AI com chave do .env"""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "Variável GOOGLE_API_KEY não encontrada no arquivo .env\n"
            "Adicione: GOOGLE_API_KEY=sua_chave_aqui"
        )
    genai.configure(api_key=api_key)

def call_llm(prompt: str, retries: int = 5, debug: bool = False) -> str:
    """Chama a API Gemini com retry inteligente para rate limit."""
    import re

    model = genai.GenerativeModel(MODEL)

    for attempt in range(retries):
        try:
            if debug:
                print(f"[DEBUG] Tentativa {attempt+1}: Enviando prompt para API...")
            response = model.generate_content(prompt)
            if debug:
                print(f"[DEBUG] Resposta recebida: type={type(response)}")
                print(f"[DEBUG] Resposta da API (primeiros 500 chars):\n{response.text[:500]}\n")
            return response.text
        except Exception as e:
            error_str = str(e)

            if "429" in error_str:
                retry_match = re.search(r"Please retry in ([0-9.]+)s", error_str)
                if retry_match:
                    wait_time = float(retry_match.group(1)) + 5
                else:
                    wait_time = 60 * (attempt + 1)

                print(f" Rate limit atingido (tentativa {attempt+1}/{retries})")
                print(f" Aguardando {wait_time:.1f}s conforme API solicitou...")
                time.sleep(wait_time)
            elif attempt < retries - 1:
                wait = (2 ** attempt) * 5
                print(f" Erro na API (tentativa {attempt+1}/{retries}): {str(e)[:100]}")
                print(f" Aguardando {wait}s...")
                time.sleep(wait)
            else:
                print(f"  ✗ Falha definitiva após {retries} tentativas")
                return ""
    return ""


def safe_parse_json(text: str) -> dict | list | None:
    """Extrai e parseia JSON de uma resposta do LLM."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        import re
        match = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        return None

def get_missing_fields(data_list: list, names: list, required_fields: list) -> list:
    """Retorna apenas nomes e campos faltantes para otimizar tokens.
    Considera 0 e NaN como valores faltantes."""
    prompt_data = []
    for i, name in enumerate(names):
        data = data_list[i] if i < len(data_list) else {}
        missing = [
            f for f in required_fields
            if f not in data
            or data[f] is None
            or data[f] == 0
            or (isinstance(data[f], float) and np.isnan(data[f]))
        ]
        if missing:
            prompt_data.append({"name": name, "missing_fields": missing})
    return prompt_data


# ──────────────────────────────────────────────────────────────────────────────
# Checkpoint Management
# ──────────────────────────────────────────────────────────────────────────────

def load_checkpoint() -> dict:
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, 'r') as f:
                checkpoint = json.load(f)
                checkpoint["processed_batches"] = set(checkpoint.get("processed_batches", []))
                return checkpoint
        except (json.JSONDecodeError, IOError) as e:
            print(f"Erro ao carregar checkpoint: {e}")
    return {"processed_batches": set(), "filled": 0, "skipped": 0}

def save_checkpoint(checkpoint: dict):
    checkpoint_copy = checkpoint.copy()
    checkpoint_copy["processed_batches"] = list(checkpoint["processed_batches"])
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(checkpoint_copy, f, indent=2)


# ──────────────────────────────────────────────────────────────────────────────
# CPU Enrichment
# ──────────────────────────────────────────────────────────────────────────────

def build_cpu_prompt(missing_fields_data: list) -> str:
    """Constrói prompt para preencher APENAS cache."""
    fields_desc = {
        "l1_cache": "cache L1 total em KB (ex: 32, 64, 128, 256, 512) ou 0 se desconhecido",
        "l2_cache": "cache L2 total em KB (ex: 256, 512, 1024, 2048, 4096) ou 0 se desconhecido",
        "l3_cache": "cache L3 total em KB (ex: 6144, 8192, 16384, 32768) ou 0 se desconhecido",
    }

    fields_list = "\n".join([
        f"  - {item['name']}: {', '.join([fields_desc.get(f, f) for f in item['missing_fields']])}"
        for item in missing_fields_data
    ])

    return f"""Você é um especialista em processadores de computadores.

Para cada CPU abaixo, forneça APENAS os valores de cache (L1, L2, L3) em KB. Se não souber, use 0.

CPUs que precisam de cache:
{fields_list}

Responda EXATAMENTE com este formato (JSON array, sem markdown, sem backticks):
[
  {{"name": "nome exato da CPU", "l1_cache": 512, "l2_cache": 4096, "l3_cache": 16384}},
  {{"name": "nome exato da CPU2", "l1_cache": 256, "l2_cache": 2048, "l3_cache": 8192}}
]

Regras obrigatórias:
- Responda APENAS JSON válido, sem explicações
- Use 0 para valores verdadeiramente desconhecidos
- l1_cache, l2_cache, l3_cache em KB (converter MB para KB multiplicando por 1024)
- Sem backticks, sem markdown, sem texto extra
"""

def enrich_cpus(batch_size: int = BATCH_SIZE, delay: float = DELAY_BETWEEN_CALLS):
    print("\n" + "="*60)
    print("  ENRIQUECENDO DATASET DE CPUs")
    print("="*60)
    print(f"  Batch size: {batch_size} | Delay: {delay}s entre requisições")

    df = pd.read_csv(CPU_INPUT)
    print(f"Dataset carregado: {len(df)} linhas")

    # Garante que todas as colunas alvo existem (sem resetar valores existentes)
    for col in CPU_TARGET_COLS:
        if col not in df.columns:
            df[col] = 0.0

    before = len(df)
    df = df[~df['name'].str.contains("No CPUs found", na=False)].copy()
    print(f"Removidas {before - len(df)} linhas de 'No CPUs found'")

    before = len(df)
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df = df[df['date'] >= '2009-01-01'].copy()
    print(f"Removidas {before - len(df)} linhas com data anterior a 2009")

    # Identifica linhas que precisam de enriquecimento - APENAS CACHE
    needs_enrichment = df[
        (df['l1_cache'] == 0) | (df['l2_cache'] == 0) | (df['l3_cache'] == 0)
    ].index.tolist()

    all_indices = needs_enrichment
    print(f"Linhas para enriquecimento: {len(all_indices)}")

    if not all_indices:
        print("✓ Nenhum dado para preencher!")
        df.to_csv(CPU_OUTPUT, index=False)
        return

    batches = [all_indices[i:i+batch_size] for i in range(0, len(all_indices), batch_size)]
    num_batches = len(batches)
    total_time_minutes = (num_batches * delay) / 60
    print(f"Batches: {num_batches} | Tempo estimado: ~{total_time_minutes:.1f} minutos")

    filled = 0
    skipped = 0

    for batch_num, batch_idx in enumerate(tqdm(batches, desc="Processando batches")):

        batch_data = [df.loc[idx].to_dict() for idx in batch_idx]
        batch_names = [d['name'] for d in batch_data]
        missing_fields_data = get_missing_fields(batch_data, batch_names, CPU_TARGET_COLS)

        batch_filled = 0
        batch_skipped = 0
        batch_details = []
        batch_status = ""

        if not missing_fields_data:
            batch_status = "SKIP - Dados já completos"
        else:
            prompt = build_cpu_prompt(missing_fields_data)
            debug_mode = batch_num == 0
            raw = call_llm(prompt, debug=debug_mode)

            if not raw:
                batch_skipped = len(batch_idx)
                skipped += batch_skipped
                batch_status = f"ERRO - Sem resposta da API (pulando {len(batch_idx)} elementos)"
            else:
                results = safe_parse_json(raw)
                if not isinstance(results, list):
                    batch_skipped = len(batch_idx)
                    skipped += batch_skipped
                    batch_status = f"ERRO - Resposta inválida do LLM (pulando {len(batch_idx)} elementos)"
                else:
                    results_map = {r.get("name", ""): r for r in results if isinstance(r, dict)}

                    for idx in batch_idx:
                        cpu_name = df.at[idx, 'name']
                        result = results_map.get(cpu_name)
                        if not result:
                            batch_skipped += 1
                            skipped += 1
                            continue

                        batch_filled += 1
                        filled += 1

                        filled_fields = {}
                        for col in ALL_FILL_COLS:  # ← usa a lista completa com cache
                            current_val = df.at[idx, col]
                            result_val = result.get(col)

                            try:
                                result_val = int(result_val) if result_val is not None else 0
                            except (ValueError, TypeError):
                                result_val = 0

                            is_empty = current_val == 0 or pd.isna(current_val)

                            if is_empty and result_val:  # result_val > 0
                                df.at[idx, col] = result_val
                                filled_fields[col] = result_val

                        batch_details.append({
                            'cpu': cpu_name,
                            'filled': filled_fields,
                            'result': result
                        })

                    batch_status = "OK"

        print(f"\n Batch {batch_num+1}/{num_batches} [{batch_status}]:")
        print(f"   ✓ Preenchidas: {batch_filled} | ✗ Skipped: {batch_skipped}")
        if batch_details and len(batch_details) <= 5:
            print(f"   Detalhes:")
            for item in batch_details[:5]:
                if item['filled']:
                    fields_str = ", ".join([f"{k}={v}" for k, v in item['filled'].items()])
                    print(f"       {item['cpu']}: {fields_str}")

        df.to_csv(CPU_OUTPUT, index=False)
        print(f"   💾 Progresso salvo: {filled} preenchidas, {skipped} skipped")

        time.sleep(delay)

    df.to_csv(CPU_OUTPUT, index=False)

    print(f"\n✓ Concluído!")
    print(f"  Total preenchidas: {filled}")
    print(f"  Total skipped: {skipped}")
    print(f"  Arquivo salvo: {CPU_OUTPUT}")

    print("\nValores faltantes (zeros) restantes:")
    for col in ALL_FILL_COLS:
        n = (df[col] == 0).sum()
        print(f"  {col}: {n}")

    print(f"\n✓ Enriquecimento concluído!")


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Enriquece dataset de CPU usando a API Google Gemini"
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

    setup_api_key()
    print(f"Chave da API Google configurada. Modelo: {MODEL}")
    print(f"Batch size: {args.batch_size} | Delay: {args.delay}s")
    print(f"Modo: APENAS CACHE (L1, L2, L3)\n")

    enrich_cpus(args.batch_size, args.delay)

    print("\n✓ Enriquecimento concluído!")


if __name__ == "__main__":
    main()