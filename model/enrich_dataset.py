"""
Dataset Enrichment Script — MODO BATCH (Gemini 2.5 Flash Lite)
=====================================================
Script modificado para processar o dataset inteiro em 
batches sequenciais, ideal para lidar com grandes volumes
de dados sem estourar limites de contexto.

Configurações Atuais:
  - Modelo: gemini-2.5-flash-lite
  - Elementos totais: 4305
  - Tamanho do Batch: 216 (resultando em 20 batches)
  - Filtro: CPUs a partir de 2009 (mantido)
  - Salva o progresso a cada batch processado.

Uso:
    # Rodar o processamento completo
    python enrich_dataset_batch.py

    # Só mostra o primeiro prompt, sem chamar a API
    python enrich_dataset_batch.py --dry-run
"""

import numpy as np
import os
import json
import time
import math
import argparse
import pandas as pd
import google.generativeai as genai
from dotenv import load_dotenv

# ─── Configurações ────────────────────────────────────────────────────────────

load_dotenv()

CPU_INPUT  = "../data/tpu_cpus_enriched.csv"
CPU_OUTPUT = "../data/tpu_cpus_enriched_final.csv"   # Arquivo final em batch

# Atualizado para o modelo requisitado
MODEL = "gemini-2.5-flash-lite"
BATCH_SIZE = 216
MAX_ELEMENTS = 4305

CPU_TARGET_COLS = ["l1_cache", "l2_cache", "l3_cache"]
ALL_FILL_COLS   = ["l1_cache", "l2_cache", "l3_cache"]

CACHE_SANITY = {
    "l1_cache": (16,    8_192),
    "l2_cache": (64,  131_072),
    "l3_cache": (0,   524_288),
}

SEP  = "─" * 70
SEP2 = "═" * 70


# ──────────────────────────────────────────────────────────────────────────────
# Setup
# ──────────────────────────────────────────────────────────────────────────────

def setup_api_key():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GOOGLE_API_KEY não encontrada no .env\n"
            "Adicione: GOOGLE_API_KEY=sua_chave_aqui"
        )
    genai.configure(api_key=api_key)
    print(f"✓ API configurada  |  Modelo: {MODEL}\n")


# ──────────────────────────────────────────────────────────────────────────────
# LLM call com log detalhado
# ──────────────────────────────────────────────────────────────────────────────

def call_llm_debug(prompt: str) -> str:
    print(f"\n{SEP}")
    print(f"📤  PROMPT ENVIADO  ({len(prompt)} chars / {prompt.count(chr(10))} linhas)")
    print(f"{SEP}")
    
    model = genai.GenerativeModel(MODEL)

    try:
        t0 = time.time()
        response = model.generate_content(prompt)
        elapsed = time.time() - t0
        raw = response.text

        print(f"\n RESPOSTA BRUTA  ({len(raw)} chars / {elapsed:.2f}s)")
        print(f"{SEP}")
        
        stripped = raw.strip()
        print(f"\n DIAGNÓSTICO DE FORMATO:")
        print(f"    Começa com '['      : {stripped.startswith('[')}")
        print(f"    Começa com '```'    : {stripped.startswith('```')}")
        print(f"    Primeiros 80 chars  : {repr(stripped[:80])}")

        return raw

    except Exception as e:
        print(f"\n ERRO NA API: {e}")
        return ""


# ──────────────────────────────────────────────────────────────────────────────
# JSON parsing com diagnóstico
# ──────────────────────────────────────────────────────────────────────────────

def safe_parse_json_debug(text: str) -> list | None:
    text = text.strip()

    try:
        result = json.loads(text)
        return result
    except json.JSONDecodeError:
        pass

    if text.startswith("```"):
        lines = text.split("\n")
        inner = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
        try:
            result = json.loads(inner)
            return result
        except json.JSONDecodeError:
            pass

    import re
    match = re.search(r"(\[.*?\])", text, re.DOTALL)
    if match:
        try:
            result = json.loads(match.group(1))
            return result
        except json.JSONDecodeError:
            pass

    print(f"    ✗ Todas as tentativas de parse falharam")
    return None


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def get_missing_fields(data_list, names, required_fields):
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


def build_cpu_prompt(missing_fields_data: list) -> str:
    fields_desc = {
        "l1_cache": "cache L1 total em KB (ex: 32, 64, 128, 256, 512)",
        "l2_cache": "cache L2 total em KB (ex: 256, 512, 1024, 2048, 4096)",
        "l3_cache": "cache L3 total em KB (ex: 6144, 8192, 16384, 32768)",
    }
    fields_list = "\n".join([
        f"  - {item['name']}: "
        + ", ".join(fields_desc.get(f, f) for f in item["missing_fields"])
        for item in missing_fields_data
    ])
    return f"""Você é um especialista em processadores de computadores.

Para cada CPU abaixo, forneça APENAS os valores de cache (L1, L2, L3) em KB.
Se não souber com certeza, use 0.

CPUs que precisam de cache:
{fields_list}

Responda EXATAMENTE com este formato (JSON array, sem markdown, sem backticks):
[
  {{"name": "nome exato da CPU", "l1_cache": 512, "l2_cache": 4096, "l3_cache": 16384}}
]

Regras obrigatórias:
- Responda APENAS JSON válido, sem explicações
- Use 0 para valores verdadeiramente desconhecidos
- l1_cache, l2_cache, l3_cache SEMPRE em KB (converter MB→KB: ×1024)
- Sem backticks, sem markdown, sem texto extra
"""

# ──────────────────────────────────────────────────────────────────────────────
# Main Batch Processing
# ──────────────────────────────────────────────────────────────────────────────

def run_batch_processing(dry_run: bool):
    print(SEP2)
    print("  MODO BATCH — Enriquecimento de cache de CPU")
    print(f"  Modelo: {MODEL}")
    print(SEP2)

    # ── Carrega dataset ───────────────────────────────────────────────────────
    df = pd.read_csv(CPU_INPUT)
    print(f"\nDataset Original: {len(df):,} linhas  |  Colunas: {list(df.columns)}\n")

    for col in CPU_TARGET_COLS:
        if col not in df.columns:
            df[col] = 0.0

    # Filtragem
    df = df[~df["name"].str.contains("No CPUs found", na=False)].copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df[df["date"] >= "2009-01-01"].copy()
    df = df.reset_index(drop=True)

    # Identifica linhas com zeros
    needs = df[
        (df["l1_cache"] == 0) | (df["l2_cache"] == 0) | (df["l3_cache"] == 0)
    ].index.tolist()

    # Limita ao total de elementos configurados (4305)
    batch_idx_all = needs[:MAX_ELEMENTS]

    if not batch_idx_all:
        print("✗  Nenhuma CPU pendente encontrada (ou todos preenchidos).")
        return

    total_batches = math.ceil(len(batch_idx_all) / BATCH_SIZE)
    print(f"Linhas selecionadas para processamento: {len(batch_idx_all):,}")
    print(f"Tamanho do Batch: {BATCH_SIZE} | Total de Batches: {total_batches}\n")

    total_rows_changed = 0

    # ── Loop de Batches ───────────────────────────────────────────────────────
    for batch_num, i in enumerate(range(0, len(batch_idx_all), BATCH_SIZE), 1):
        batch_idx = batch_idx_all[i : i + BATCH_SIZE]
        
        print(f"\n{SEP2}")
        print(f" INICIANDO BATCH {batch_num} / {total_batches} ({len(batch_idx)} elementos)")
        print(f"{SEP2}")

        batch_data  = [df.loc[idx].to_dict() for idx in batch_idx]
        batch_names = [d["name"] for d in batch_data]
        missing_fields_data = get_missing_fields(batch_data, batch_names, CPU_TARGET_COLS)

        if not missing_fields_data:
            print("✓  Todos os campos já preenchidos nesse batch. Pulando...")
            continue

        prompt = build_cpu_prompt(missing_fields_data)

        if dry_run:
            print(f"\n{SEP}")
            print("  DRY-RUN — Primeiro prompt que seria enviado:")
            print(f"{SEP}")
            print(prompt)
            print("\n(Execução interrompida devido ao --dry-run)")
            return

        # Chama a API
        raw = call_llm_debug(prompt)

        if not raw:
            print(f"\n Batch {batch_num} falhou (Resposta vazia). Pulando para o próximo...")
            continue

        # Parse JSON
        results = safe_parse_json_debug(raw)

        if not isinstance(results, list):
            print(f"\n Parse falhou no Batch {batch_num} — resultado não é uma lista.")
            continue

        print(f"✓  {len(results)} itens parseados com sucesso no Batch {batch_num}")

        # Atualiza DataFrame
        results_map = {r.get("name", ""): r for r in results if isinstance(r, dict)}
        batch_rows_changed = 0

        for idx in batch_idx:
            cpu_name = df.at[idx, "name"]
            result   = results_map.get(cpu_name)

            if result:
                for col in ALL_FILL_COLS:
                    current_val = df.at[idx, col]
                    result_val  = result.get(col)
                    
                    try:
                        result_val = int(result_val) if result_val is not None else 0
                    except (ValueError, TypeError):
                        result_val = 0

                    is_empty = (current_val == 0) or pd.isna(current_val)
                    if is_empty and result_val > 0:
                        df.at[idx, col] = result_val
                        batch_rows_changed += 1

        total_rows_changed += batch_rows_changed
        print(f"💾  Campos efetivamente atualizados neste batch: {batch_rows_changed}")

        # Salva o progresso no final do Batch
        df.to_csv(CPU_OUTPUT, index=False)
        print(f"✓  Progresso salvo em: {CPU_OUTPUT}")

        # Rate Limit Delay (evita sobrecarga na API)
        if batch_num < total_batches:
            print(f"⏳  Aguardando 3 segundos antes do próximo batch...")
            time.sleep(3)

    # ── Resumo Final ──────────────────────────────────────────────────────────
    print(f"\n{SEP2}")
    print(" 🎉 PROCESSAMENTO CONCLUÍDO")
    print(SEP2)
    print(f"  Elementos totais analisados : {len(batch_idx_all)}")
    print(f"  Batches processados         : {total_batches}")
    print(f"  Campos totais atualizados   : {total_rows_changed}")
    print(f"  Dataset final salvo em      : {CPU_OUTPUT}\n")


# ──────────────────────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Processamento em Batch do cache de CPU usando Gemini 2.5 Flash Lite"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Apenas mostra o primeiro prompt gerado sem chamar a API",
    )
    args = parser.parse_args()

    if not args.dry_run:
        setup_api_key()

    run_batch_processing(dry_run=args.dry_run)


if __name__ == "__main__":
    main()