#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$SCRIPT_DIR/client"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
BACKEND_LOG="$SCRIPT_DIR/backend.log"
FRONTEND_LOG="$SCRIPT_DIR/client/frontend.log"

FRONTEND_PID=""
BACKEND_LOG_PID=""
FRONTEND_PORT=""

echo -e "${YELLOW}=== FPS-R - Backend Docker + Frontend Vite ===${NC}\n"

cd "$SCRIPT_DIR" || exit 1

if [ ! -f "$COMPOSE_FILE" ] || [ ! -d "$CLIENT_DIR" ]; then
    echo -e "${RED}❌ Estrutura do projeto não encontrada.${NC}"
    exit 1
fi

if ! command -v docker > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não encontrado.${NC}"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ O Docker não está rodando ou você não tem permissão.${NC}"
    exit 1
fi

if ! command -v npm > /dev/null 2>&1; then
    echo -e "${RED}❌ npm não encontrado.${NC}"
    exit 1
fi

is_port_open() {
    local port="$1"
    if lsof -tiTCP:"$port" -sTCP:LISTEN > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

wait_for_http() {
    local url="$1"
    local label="$2"
    local max_attempts=60
    local attempt=1

    while [ "$attempt" -le "$max_attempts" ]; do
        if curl --silent --fail "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $label disponível em $url${NC}"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done

    echo -e "${RED}❌ Timeout aguardando $label em $url${NC}"
    return 1
}

wait_for_port() {
    local port="$1"
    local label="$2"
    local max_attempts=60
    local attempt=1

    while [ "$attempt" -le "$max_attempts" ]; do
        if is_port_open "$port"; then
            echo -e "${GREEN}✓ $label disponível na porta $port${NC}"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done

    echo -e "${RED}❌ Timeout aguardando $label na porta $port${NC}"
    return 1
}

wait_for_frontend() {
    local max_attempts=60
    local attempt=1
    local port

    while [ "$attempt" -le "$max_attempts" ]; do
        for port in 5173 5174 5175 5176; do
            if is_port_open "$port"; then
                FRONTEND_PORT="$port"
                echo -e "${GREEN}✓ Frontend disponível na porta $FRONTEND_PORT${NC}"
                return 0
            fi
        done
        sleep 1
        attempt=$((attempt + 1))
    done

    echo -e "${RED}❌ Timeout aguardando o frontend${NC}"
    return 1
}

cleanup() {
    local exit_code=$?

    trap - SIGINT SIGTERM EXIT

    echo -e "\n${YELLOW}Encerrando serviços...${NC}"

    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID" 2>/dev/null
        wait "$FRONTEND_PID" 2>/dev/null
        echo -e "${GREEN}✓ Frontend encerrado${NC}"
    fi

    if [ -n "$BACKEND_LOG_PID" ] && kill -0 "$BACKEND_LOG_PID" 2>/dev/null; then
        kill "$BACKEND_LOG_PID" 2>/dev/null
        wait "$BACKEND_LOG_PID" 2>/dev/null
    fi

    docker-compose down > /dev/null 2>&1
    echo -e "${GREEN}✓ Backend Docker encerrado${NC}"

    exit "$exit_code"
}

trap cleanup SIGINT SIGTERM EXIT

if is_port_open 8000; then
    echo -e "${RED}❌ A porta 8000 já está em uso.${NC}"
    echo -e "${BLUE}Libere a porta ou pare o processo atual antes de rodar o script.${NC}"
    exit 1
fi

echo -e "${YELLOW}▶ Preparando backend Docker...${NC}"
docker-compose down > /dev/null 2>&1

echo -e "${YELLOW}▶ Iniciando backend no Docker...${NC}"
if ! docker-compose up --build -d api; then
    echo -e "${RED}❌ Falha ao subir o backend com Docker.${NC}"
    exit 1
fi

: > "$BACKEND_LOG"
docker-compose logs -f api > "$BACKEND_LOG" 2>&1 &
BACKEND_LOG_PID=$!

if ! wait_for_http "http://localhost:8000/health" "Backend"; then
    echo -e "${BLUE}Veja o log em: $BACKEND_LOG${NC}"
    exit 1
fi

echo -e "\n${YELLOW}▶ Iniciando frontend com Vite...${NC}"
cd "$CLIENT_DIR" || exit 1
npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
cd "$SCRIPT_DIR" || exit 1

if ! wait_for_frontend; then
    echo -e "${BLUE}Veja o log em: $FRONTEND_LOG${NC}"
    exit 1
fi

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Sistema pronto!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo -e " 📍 Backend:  http://localhost:8000"
echo -e " 📚 Docs:     http://localhost:8000/docs"
echo -e " 📍 Frontend: http://localhost:$FRONTEND_PORT"
echo
echo -e " 📄 Logs:"
echo -e "    Backend:  $BACKEND_LOG"
echo -e "    Frontend: $FRONTEND_LOG"
echo
echo -e "⏹️  Pressione ${YELLOW}Ctrl+C${NC} para parar tudo.\n"

wait "$FRONTEND_PID"
