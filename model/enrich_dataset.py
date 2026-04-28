"""
Dataset Enrichment Script usando Google Gemini API
===================================================
Preenche valores nulos no dataset de CPU e adiciona campos L1/L2 cache.

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

# Carrega variáveis do arquivo .env
load_dotenv()

CPU_INPUT  = "../data/tpu_cpus_enriched.csv"
CPU_OUTPUT = "../data/tpu_cpus_enriched-final.csv"
CHECKPOINT_FILE = "../data/enrichment_checkpoint.json"

MODEL = "gemini-2.5-flash-lite"

DELAY_BETWEEN_CALLS = 120  # 2 minutos entre requisições

BATCH_SIZE = 216

# ─── CPU: colunas que queremos preencher ─────────────────────────────────────
# Colunas com valores 0 são consideradas faltantes
CPU_TARGET_COLS = [
    "tdp",      # TDP em watts
    "price",    # Preço
    "speed",   # Velocidade base em MHz (pode ser 0 se não disponível)
    "turbo",    # Velocidade turbo em MHz
    "cpuCount", # Número de núcleos físicos
    "cores",    # Número de threads
    "l1_cache", # Cache L1 em KB
    "l2_cache", # Cache L2 em KB
    "l3_cache", # Cache L3 em MB
]


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

def call_llm(prompt: str, retries: int = 5) -> str:
    """Chama a API Gemini com retry inteligente para rate limit.
    Detecta erro 429 e respeita o tempo de retry sugerido pela API.
    """
    import re

    model = genai.GenerativeModel(MODEL)

    for attempt in range(retries):
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            error_str = str(e)

            # Detectar erro 429 (rate limit) e extrair tempo de espera
            if "429" in error_str:
                # Tentar extrair tempo de retry da mensagem de erro
                retry_match = re.search(r"Please retry in ([0-9.]+)s", error_str)
                if retry_match:
                    wait_time = float(retry_match.group(1)) + 5  # Adicionar buffer de 5s
                else:
                    wait_time = 60 * (attempt + 1)  # Fallback: 60s, 120s, 180s...

                print(f"  Rate limit atingido (tentativa {attempt+1}/{retries})")
                print(f"    Aguardando {wait_time:.1f}s conforme API solicitou...")
                time.sleep(wait_time)
            elif attempt < retries - 1:
                # Outros erros: retry com backoff exponencial
                wait = (2 ** attempt) * 5  # 5s, 10s, 20s, 40s, 80s
                print(f"  ⚠ Erro na API (tentativa {attempt+1}/{retries}): {str(e)[:100]}")
                print(f"    Aguardando {wait}s...")
                time.sleep(wait)
            else:
                print(f"  ✗ Falha definitiva após {retries} tentativas")
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
    """Retorna apenas nomes e campos faltantes para otimizar tokens.
    Considera 0 como valor faltante para campos numéricos."""
    prompt_data = []
    for i, name in enumerate(names):
        data = data_list[i] if i < len(data_list) else {}
        # Campo está faltando se for None ou 0 (para campos numéricos)
        missing = [f for f in required_fields if f not in data or data[f] is None or data[f] == 0]

        if missing:
            prompt_data.append({
                "name": name,
                "missing_fields": missing
            })
    return prompt_data


# ──────────────────────────────────────────────────────────────────────────────
# Checkpoint Management
# ──────────────────────────────────────────────────────────────────────────────

def load_checkpoint() -> dict:
    """Carrega estado anterior se existir."""
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, 'r') as f:
                checkpoint = json.load(f)
                # Converter list de volta para set
                checkpoint["processed_batches"] = set(checkpoint.get("processed_batches", []))
                return checkpoint
        except (json.JSONDecodeError, IOError) as e:
            print(f"⚠️  Erro ao carregar checkpoint: {e}")
    return {"processed_batches": set(), "filled": 0, "skipped": 0}

def save_checkpoint(checkpoint: dict):
    """Salva estado de progresso."""
    checkpoint_copy = checkpoint.copy()
    checkpoint_copy["processed_batches"] = list(checkpoint["processed_batches"])
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(checkpoint_copy, f, indent=2)


# ──────────────────────────────────────────────────────────────────────────────
# CPU Enrichment
# ──────────────────────────────────────────────────────────────────────────────

def build_cpu_prompt(missing_fields_data: list) -> str:
    """Constrói prompt dinâmico com apenas os campos faltantes."""
    fields_desc = {
        "tdp": "consumo de potência em watts (ex: 65, 105, 140) ou 0 se desconhecido",
        "price": "preço em USD (ex: 199, 389, 499) ou 0 se desconhecido",
        "speed": "velocidade base em MHz (ex: 3200, 3600, 4000) ou 0 se desconhecido",
        "turbo": "frequência turbo em MHz (ex: 4000, 4500, 5000) ou 0 se desconhecido",
        "cpuCount": "número de núcleos físicos (ex: 4, 6, 8) ou 0 se desconhecido",
        "cores": "número de threads (ex: 8, 12, 16) ou 0 se desconhecido",
        "l1_cache": "cache L1 em KB (ex: 32, 64, 128) ou 0 se desconhecido",
        "l2_cache": "cache L2 em KB (ex: 256, 512, 1024) ou 0 se desconhecido",
        "l3_cache": "cache L3 em MB (ex: 8, 16, 32) ou 0 se desconhecido",
    }

    # Construir lista de campos dinâmicos
    fields_list = "\n".join([
        f"  - {item['name']}: {', '.join([fields_desc.get(f, f) for f in item['missing_fields']])}"
        for item in missing_fields_data
    ])

    return f"""Você é um especialista em processadores de computadores.

Para cada CPU abaixo, forneça APENAS os campos faltantes listados. Se não souber um valor, use 0.
CPUs com campos faltantes:
{fields_list}

Responda APENAS com um JSON array (sem markdown, sem texto extra):
[
  {{
    "name": "nome exato da CPU como fornecido",
    <preenchido com apenas os campos solicitados>
  }}
]

Regras importantes:
- Use 0 para valores desconhecidos (não null)
- Valores devem ser números inteiros
- Responda APENAS com JSON válido
"""

def enrich_cpus(batch_size: int = BATCH_SIZE, delay: float = DELAY_BETWEEN_CALLS):
    print("\n" + "="*60)
    print("  ENRIQUECENDO DATASET DE CPUs")
    print("="*60)
    print(f"  Batch size: {batch_size} | Delay: {delay}s entre requisições")

    df = pd.read_csv(CPU_INPUT)

    df['l1_cache'] = np.zeros(len(df))
    df['l2_cache'] = np.zeros(len(df))
    df['l3_cache'] = np.zeros(len(df))

    print(f"Dataset carregado: {len(df)} linhas")

    # Garante que todas as colunas alvo existem
    for col in CPU_TARGET_COLS:
        if col not in df.columns:
            df[col] = 0

    before = len(df)
    df = df[~df['name'].str.contains("No CPUs found", na=False)].copy()
    print(f"Removidas {before - len(df)} linhas de 'No CPUs found'")

    # Filtrar por data >= 2009
    before = len(df)
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df = df[df['date'] >= '2009-01-01'].copy()
    print(f"Removidas {before - len(df)} linhas com data anterior a 2009")

    # Identifica linhas que precisam de enriquecimento
    needs_enrichment = df[
        (df['tdp'] == 0) | (df['price'] == 0) | (df['turbo'] == 0) | (df['speed'] == 0) | (df['cpuCount'] == 0) | (df['cores'] == 0) | (df['l1_cache'] == 0) | (df['l2_cache'] == 0) | (df['l3_cache'] == 0)
    ].index.tolist()

    all_indices = needs_enrichment
    print(f"Linhas para enriquecimento: {len(all_indices)}")

    if not all_indices:
        print("✓ Nenhum dado para preencher!")
        df.to_csv(CPU_OUTPUT, index=False)
        return

    # Processa em batches
    batches = [all_indices[i:i+batch_size] for i in range(0, len(all_indices), batch_size)]
    num_batches = len(batches)
    total_time_minutes = (num_batches * delay) / 60

    print(f"Batches: {num_batches} | Tempo estimado: ~{total_time_minutes:.1f} minutos")

    # Carregar checkpoint de execução anterior
    checkpoint = load_checkpoint()
    processed_batches = checkpoint.get("processed_batches", set())
    filled = checkpoint.get("filled", 0)
    skipped = checkpoint.get("skipped", 0)

    if processed_batches:
        print(f"\n⏮️  Retomando de checkpoint:")
        print(f"   Batches já processados: {len(processed_batches)}")
        print(f"   Progresso anterior: {filled} preenchidas, {skipped} skipped")
        print(f"   Próximo batch: {max(processed_batches) + 2 if processed_batches else 1}\n")

    for batch_num, batch_idx in enumerate(tqdm(batches, desc="Processando batches")):
        # Pular batches já processados
        if batch_num in processed_batches:
            continue

        # Preparar dados com campos faltantes
        batch_data = [df.loc[idx].to_dict() for idx in batch_idx]
        batch_names = [d['name'] for d in batch_data]
        missing_fields_data = get_missing_fields(batch_data, batch_names, CPU_TARGET_COLS)

        batch_filled = 0
        batch_skipped = 0
        batch_details = []
        batch_status = ""

        if not missing_fields_data:
            # Todos os itens do batch já têm dados completos
            batch_status = "SKIP - Dados já completos"
        else:
            prompt = build_cpu_prompt(missing_fields_data)
            raw = call_llm(prompt)

            if not raw:
                # API falhou - pular este batch completamente
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
                    # Indexa resultados pelo nome
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
                        for col in ['tdp', 'price', 'turbo', 'speed', 'cpuCount', 'cores', 'l1_cache', 'l2_cache', 'l3_cache']:
                            current_val = df.at[idx, col]
                            result_val = result.get(col)

                            try:
                                result_val = int(result_val) if result_val is not None else None
                            except (ValueError, TypeError):
                                result_val = None

                            # Verifica se o campo está vazio (0, NaN, None)
                            is_empty = current_val == 0 or pd.isna(current_val)

                            # Preenche se o campo atual está vazio e o LLM forneceu um valor válido
                            if is_empty and result_val is not None and result_val != 0:
                                df.at[idx, col] = result_val
                                filled_fields[col] = result_val

                        batch_details.append({
                            'cpu': cpu_name,
                            'filled': filled_fields,
                            'result': result
                        })

                    batch_status = "OK"

        # Print de debug ao fim do batch
        print(f"\n Batch {batch_num+1}/{num_batches} [{batch_status}]:")
        print(f"   ✓ Preenchidas: {batch_filled} | ✗ Skipped: {batch_skipped}")
        if batch_details and len(batch_details) <= 5:
            print(f"   Detalhes:")
            for item in batch_details[:5]:
                if item['filled']:
                    fields_str = ", ".join([f"{k}={v}" for k, v in item['filled'].items()])
                    print(f"       {item['cpu']}: {fields_str}")

        # ✅ SALVAR APÓS CADA BATCH
        processed_batches.add(batch_num)
        df.to_csv(CPU_OUTPUT, index=False)
        save_checkpoint({"processed_batches": processed_batches, "filled": filled, "skipped": skipped})
        print(f"   💾 Progresso salvo: {filled} preenchidas, {skipped} skipped")

        time.sleep(delay)

    # Salva resultado
    df.to_csv(CPU_OUTPUT, index=False)

    print(f"\n✓ Concluído!")
    print(f"  Total preenchidas: {filled}")
    print(f"  Total skipped: {skipped}")
    print(f"  Arquivo salvo: {CPU_OUTPUT}")

    # Relatório de dados faltantes
    print("\nValores faltantes (zeros) restantes nas colunas principais:")
    for col in ['tdp', 'price', 'turbo', 'speed', 'cpuCount', 'cores', 'l1_cache', 'l2_cache', 'l3_cache']:
        n = (df[col] == 0).sum()
        print(f"  {col}: {n}")

    # Limpar checkpoint após conclusão
    if os.path.exists(CHECKPOINT_FILE):
        os.remove(CHECKPOINT_FILE)
        print(f"\n✓ Checkpoint removido (execução concluída)")

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

    # Atualizar variáveis locais com argumentos de linha de comando
    batch_size = args.batch_size
    delay_between_calls = args.delay

    setup_api_key()
    print(f"Chave da API Google configurada. Modelo: {MODEL}")
    print(f"Batch size: {batch_size} | Delay: {delay_between_calls}s\n")

    enrich_cpus(batch_size, delay_between_calls)

    print("\n✓ Enriquecimento concluído!")


if __name__ == "__main__":
    main()
