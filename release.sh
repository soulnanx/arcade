#!/usr/bin/env bash
#
# release.sh - Automatiza o versionamento do Bottle Color
#
# Uso:
#   ./release.sh 1.5.0 "Mensagem do release"
#   ./release.sh minor        # auto-incrementa MINOR (1.4.0 -> 1.5.0)
#   ./release.sh patch        # auto-incrementa PATCH (1.4.0 -> 1.4.1)
#   ./release.sh major        # auto-incrementa MAJOR (1.4.0 -> 2.0.0)
#
# O que faz:
#   1. Atualiza GAME_VERSION em version.js
#   2. Faz commit ("chore: bump version to X.Y.Z")
#   3. Cria tag anotada vX.Y.Z
#   4. Push do commit + tag para origin/main
#
set -euo pipefail

VERSION_FILE="version.js"
REMOTE="origin"
BRANCH="main"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[release]${NC} $1"; }
warn()  { echo -e "${YELLOW}[release]${NC} $1"; }
die()   { echo -e "${RED}[erro]${NC} $1" >&2; exit 1; }

# Verifica estar num repo git limpo o suficiente
[ -f "$VERSION_FILE" ] || die "Arquivo $VERSION_FILE nao encontrado. Rode no root do projeto."

# Lê versão atual
CURRENT=$(grep -oE "GAME_VERSION = '[0-9]+\.[0-9]+\.[0-9]+'" "$VERSION_FILE" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")
[ -n "$CURRENT" ] || die "Nao consegui ler GAME_VERSION de $VERSION_FILE"

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

# Decide nova versão
if [ $# -ge 1 ]; then
  ARG="$1"
  if [[ "$ARG" == "major" ]]; then
    MAJOR=$((MAJOR+1)); MINOR=0; PATCH=0
  elif [[ "$ARG" == "minor" ]]; then
    MINOR=$((MINOR+1)); PATCH=0
  elif [[ "$ARG" == "patch" ]]; then
    PATCH=$((PATCH+1))
  elif [[ "$ARG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    IFS='.' read -r MAJOR MINOR PATCH <<< "$ARG"
  else
    die "Argumento invalido: '$ARG'. Use X.Y.Z, major, minor ou patch."
  fi
else
  die "Uso: ./release.sh <X.Y.Z | major | minor | patch> [\"mensagem\"]"
fi

NEW="$MAJOR.$MINOR.$PATCH"
TAG="v$NEW"

# Mensagem do release
if [ $# -ge 2 ]; then
  MSG="$2"
else
  MSG="Release $TAG"
fi

warn "Versao atual: $CURRENT -> nova: $NEW"

# Confirma
read -r -p "Confirma release $TAG? [s/N] " CONFIRM
if [[ ! "$CONFIRM" =~ ^[sS]$ ]]; then
  die "Cancelado."
fi

# 1) Atualiza version.js
info "Atualizando $VERSION_FILE..."
sed -i.bak -E "s/GAME_VERSION = '[0-9]+\.[0-9]+\.[0-9]+'/GAME_VERSION = '$NEW'/" "$VERSION_FILE"
rm -f "$VERSION_FILE.bak"

# 2) Commit
info "Commit..."
git add "$VERSION_FILE"
git commit -m "chore: bump version to $NEW"

# 3) Tag
info "Criando tag $TAG..."
git tag -a "$TAG" -m "$MSG"

# 4) Push
info "Push commit + tag para $REMOTE/$BRANCH..."
git push "$REMOTE" "$BRANCH"
git push "$REMOTE" "$TAG"

info "✅ Release $TAG concluido!"
info "   Ver no GitHub: tags/releases"
