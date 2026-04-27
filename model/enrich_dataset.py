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

MODEL = "gemini-2.5-flash"

# Pausa entre chamadas à API para evitar rate limit (segundos)
# Com limite de 20 req/dia, usar batch grande e delay longo
DELAY_BETWEEN_CALLS = 120  # 2 minutos entre requisições

# Tamanho do batch: quantas CPUs enviar por chamada à API
# Aumentado para reduzir número total de requisições
# Com 2852 CPUs e batch=150, teremos ~19 requisições (dentro do limite de 20/dia)
BATCH_SIZE = 150

# ─── CPU: colunas que queremos preencher ─────────────────────────────────────
# Colunas com valores 0 são consideradas faltantes
CPU_TARGET_COLS = [
    "cache_l1",
    "cache_l2",
    "cache_l3",
]


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def setup_client():
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

    for attempt in range(retries):
        try:
            model = genai.GenerativeModel(MODEL)
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

                print(f"  ⚠ Rate limit atingido (tentativa {attempt+1}/{retries})")
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
# CPU Enrichment
# ──────────────────────────────────────────────────────────────────────────────

def build_cpu_prompt(missing_fields_data: list) -> str:
    """Constrói prompt dinâmico com apenas os campos faltantes."""
    fields_desc = {
        "cache_l1":"quantidade de memória cache l1 em MB",
        "cache_l2":"quantidade de memória cache l2 em MB",
        "cache_l3":"quantidade de memória cache l3 em MB"

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
    print(f"\n⚠ Aviso: API gratuita tem limite de ~20 req/dia")
    print(f"  Batch size: {batch_size} | Delay: {delay}s entre requisições")
    print(f"  Processamento será LENTO mas respeitará os limites da API\n")

    df = pd.read_csv(CPU_INPUT)

    df['cache_l1'] = np.zeros(len(df))
    df['cache_l2'] = np.zeros(len(df))
    df['cache_l3'] = np.zeros(len(df))

    print(f"Dataset carregado: {len(df)} linhas")

    # Remove linhas de "No CPUs found"
    before = len(df)
    df = df[~df['name'].str.contains("No CPUs found", na=False)].copy()
    print(f"Removidas {before - len(df)} linhas de 'No CPUs found'")

    # Identifica linhas que precisam de enriquecimento
    # Uma linha precisa de enriquecimento se alguma coluna-alvo tiver valor 0
    needs_enrichment = df[
        (df['cache_l1'] == 0) | (df['cache_l2'] == 0) | (df['cache_l3'] == 0)
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
    print(f"(API gratuita permite apenas ~20 requisições por dia)\n")

    filled = 0
    skipped = 0

    for batch_num, batch_idx in enumerate(tqdm(batches, desc="Processando batches")):
        # Preparar dados com campos faltantes (otimizado para tokens)
        batch_data = [df.loc[idx].to_dict() for idx in batch_idx]
        batch_names = [d['name'] for d in batch_data]
        missing_fields_data = get_missing_fields(batch_data, batch_names, CPU_TARGET_COLS)

        if not missing_fields_data:
            # Todos os itens do batch já têm dados completos
            continue

        prompt = build_cpu_prompt(missing_fields_data)

        raw = call_llm(prompt)
        if not raw:
            skipped += len(missing_fields_data)
            continue

        results = safe_parse_json(raw)
        print(results)
        if not isinstance(results, list):
            print(f"  ⚠ Batch {batch_num+1}: resposta inválida do LLM")
            skipped += len(batch_idx)
            continue

        # Indexa resultados pelo nome
        results_map = {r.get("name", ""): r for r in results if isinstance(r, dict)}

        for idx in batch_idx:
            cpu_name = df.at[idx, 'name']
            result = results_map.get(cpu_name)
            if not result:
                skipped += 1
                continue

            filled += 1
            # Preenche campos com valor 0 (faltantes) com os dados do LLM
            for col in ['cache_l1', 'cache_l2', 'cache_l3']:
                current_val = df.at[idx, col]
                result_val = result.get(col)
                # Preenche se o campo atual é 0 e o LLM forneceu um valor não-zero
                if current_val == 0 and result_val is not None and result_val != 0:
                    df.at[idx, col] = result_val

        time.sleep(delay)

    # Salva resultado
    df.to_csv(CPU_OUTPUT, index=False)

    print(f"\n✓ Concluído!")
    print(f"  Linhas preenchidas: {filled}")
    print(f"  Linhas sem resposta: {skipped}")
    print(f"  Arquivo salvo: {CPU_OUTPUT}")

    # Relatório de zeros restantes (dados faltantes)
    print("\nValores faltantes (zeros) restantes nas colunas principais:")
    for col in ['cache_l1', 'cache_l2', 'cache_l3']:
        n = (df[col] == 0).sum()
        print(f"  {col}: {n}")

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

    setup_client()
    print(f"Cliente Google Generative AI inicializado. Modelo: {MODEL}")
    print(f"Batch size: {batch_size} | Delay: {delay_between_calls}s\n")

    enrich_cpus(batch_size, delay_between_calls)

    print("\n✓ Enriquecimento concluído!")


if __name__ == "__main__":
    main()
