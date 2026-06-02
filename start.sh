#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== FPS Estimator - Backend + Frontend ===${NC}\n"

# Verificar se está no diretório correto
if [ ! -d "fps_api" ] || [ ! -d "client" ]; then
    echo -e "${RED}❌ Erro: Execute este script do diretório raiz do fps-estimator${NC}"
    exit 1
fi

# Variáveis
BACKEND_PID=""
FRONTEND_PID=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"

# Usar venv do projeto pai (fps-estimator está em /Projetos/fps-estimator e venv está em /Projetos/.venv)
VENV_PYTHON="$PARENT_DIR/.venv/bin/python"

# Se não encontrou, tentar no diretório do projeto
if [ ! -f "$VENV_PYTHON" ]; then
    VENV_PYTHON="$SCRIPT_DIR/venv/bin/python"
fi

# Se ainda não encontrou, usar python do sistema
if [ ! -f "$VENV_PYTHON" ]; then
    VENV_PYTHON="python3"
fi

# Função para limpar processos ao sair
cleanup() {
    echo -e "\n${YELLOW}Encerrando serviços...${NC}"
    if [ -n "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✓ Backend encerrado${NC}"
    fi
    if [ -n "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✓ Frontend encerrado${NC}"
    fi
    # Limpar portas (opcional)
    kill -9 $(lsof -ti:8000) 2>/dev/null
    kill -9 $(lsof -ti:5174) 2>/dev/null
    exit 0
}

# Trap para capturar Ctrl+C
trap cleanup SIGINT SIGTERM EXIT

# Função para aguardar porta ficar disponível
wait_for_port() {
    local port=$1
    local max_attempts=60
    local attempt=0
    
    echo -e "${BLUE}  ⏳ Aguardando porta $port ficar disponível...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if timeout 2 bash -c "echo > /dev/tcp/127.0.0.1/$port" 2>/dev/null; then
            sleep 2  # Aguardar mais um pouco pra ter certeza
            echo -e "${GREEN}  ✓ Porta $port está respondendo!${NC}"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
        if [ $((attempt % 10)) -eq 0 ]; then
            echo -ne "  ⏳ Tentativa $attempt/$max_attempts\r"
        fi
    done
    
    echo -e "\n${RED}  ❌ Timeout aguardando porta $port${NC}"
    return 1
}

# Função para aguardar múltiplas portas
wait_for_frontend() {
    echo -e "${BLUE}  ⏳ Aguardando Frontend (5173-5176)...${NC}"
    local max_attempts=60
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        for port in 5173 5174 5175 5176; do
            if timeout 2 bash -c "echo > /dev/tcp/127.0.0.1/$port" 2>/dev/null; then
                sleep 2  # Aguardar mais um pouco
                echo -e "${GREEN}  ✓ Frontend respondendo na porta $port!${NC}"
                return 0
            fi
        done
        sleep 1
        attempt=$((attempt + 1))
        if [ $((attempt % 10)) -eq 0 ]; then
            echo -ne "  ⏳ Tentativa $attempt/$max_attempts\r"
        fi
    done
    
    echo -e "\n${RED}  ❌ Timeout aguardando Frontend${NC}"
    return 1
}

# Matar processos antigos nas portas
echo -e "${YELLOW}▶ Limpando portas 8000 e 5174...${NC}"
kill -9 $(lsof -ti:8000) 2>/dev/null && echo -e "${GREEN}  ✓ Porta 8000 liberada${NC}"
kill -9 $(lsof -ti:5174) 2>/dev/null && echo -e "${GREEN}  ✓ Porta 5174 liberada${NC}"
sleep 1

# Iniciar Backend
echo -e "\n${YELLOW}▶ Iniciando Backend (FastAPI)...${NC}"
cd "$SCRIPT_DIR"
$VENV_PYTHON -m uvicorn fps_api.app:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}  ✓ Backend iniciado (PID: $BACKEND_PID)${NC}"

# Aguardar backend ficar pronto
if wait_for_port 8000; then
    echo -e "  📍 http://localhost:8000"
    echo -e "  📚 Docs: http://localhost:8000/docs\n"
else
    echo -e "${RED}❌ Backend não respondeu em tempo hábil${NC}"
    echo -e "${BLUE}Veja o log: backend.log${NC}"
    echo -e "${BLUE}Comando manual: python -m uvicorn fps_api.app:app --reload --port 8000${NC}"
    exit 1
fi

# Iniciar Frontend
echo -e "${YELLOW}▶ Iniciando Frontend (Vite)...${NC}"
cd "$SCRIPT_DIR/client"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}  ✓ Frontend iniciado (PID: $FRONTEND_PID)${NC}"

# Aguardar frontend ficar pronto
if wait_for_frontend; then
    echo -e "  📍 http://localhost:5173 ou http://localhost:5174\n"
else
    echo -e "${RED}❌ Frontend não respondeu em tempo hábil${NC}"
    echo -e "${BLUE}Veja o log: client/frontend.log${NC}"
    echo -e "${BLUE}Comando manual: cd client && npm run dev${NC}"
    exit 1
fi

# Sistema pronto
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Sistema pronto!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo -e "📋 Logs disponíveis em:"
echo -e "  ${YELLOW}Backend:${NC}  $SCRIPT_DIR/backend.log"
echo -e "  ${YELLOW}Frontend:${NC} $SCRIPT_DIR/client/frontend.log\n"
echo -e "⏹️  Pressione ${YELLOW}Ctrl+C${NC} para parar tudo.\n"

# Aguardar indefinidamente
wait
