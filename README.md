# 🍶 Bottle Color - Water Sort Puzzle (Mobile PWA)

Um jogo de puzzle onde você organiza líquidos coloridos em tubos, derramando de um para outro até que cada tubo tenha apenas uma cor. Focado em **mobile-first**, **100% offline** e **instalável** (PWA).

**Versão atual:** `v1.4.0` — veja a tag no GitHub Releases.

---

## 🎮 Como Jogar

1. **Selecione um tubo** tocando nele (ele sobe e pulsa)
2. **Selecione outro tubo** para derramar o líquido
3. **Regras:**
   - Só pode derramar se a cor do topo for igual à do destino
   - Ou se o tubo destino estiver vazio
   - O tubo destino não pode estar cheio
4. **Objetivo:** Organizar todos os tubos para que cada um tenha apenas uma cor (ou fique vazio)

---

## ✨ Funcionalidades

### ⭐ Sistema de Pontuação
Cada fase tem **3 estrelas** baseadas na eficiência dos movimentos:
- ⭐⭐⭐ **Perfeito** — resolveu na quantidade ótima de movimentos
- ⭐⭐ **Bom** — até 1.5× os movimentos ótimos
- ⭐ **Aceitável** — até 2× os movimentos ótimos
- Sem estrela — mais de 2× (ainda completa a fase)

**Contador de Movimentos** (no header): incrementa ao derramar, decrementa ao desfazer, zera ao reiniciar.

### 🏠 Menu Principal & Navegação
- **Splash screen** animada ao abrir
- **Grid de 50 fases** com stars e travas (locked)
- **Botão "Continuar"** pula para a última fase jogada
- **Voltar ao menu** a qualquer momento (botão `←`)
- **Barra de progresso** no header mostra % de tubos resolvidos na fase

### 💾 Progresso e Persistência
Salvo automaticamente no **LocalStorage**:
- ✅ Fases completadas
- ⭐ Estrelas (mantém o melhor resultado)
- 📊 Estatísticas globais (total de stars, fases, etc.)
- 🏆 Achievements

**Achievements:**
- `first_win` — primeira vitória
- `10_levels` — 10 fases completadas
- `3_stars` — total de estrelas múltiplo de 3
- `perfect_run` — 5 fases consecutivas com 3 estrelas

### 🎨 Temas e Acessibilidade
- **Tema claro/escuro** (toggle 🌙/☀️, persistido)
- **Modo daltonismo** (👁️) — padrões distintos por cor (listras/pontilhado)
- **Fundo animado** — gradiente sutil em movimento (respeita o tema)
- **Feedback háptico** (vibração) em selecionar, derramar, inválido e vitória

### 🎬 Animações
- Tubo selecionado sobe + **pulse** de brilho
- **Shake** no tubo de destino em movimento inválido
- **Splash** do líquido ao derramar (cai de cima com bounce)
- **Confete** em CSS puro ao vencer (proporcional às estrelas)
- **Fade** de fase (board entra/sai ao trocar nível)
- **Glow + pulse** quando um tubo fica 100% de uma cor

### ⚡ Performance (Mobile-First)
- **Lazy loading** de fases (geradas sob demanda)
- **RequestAnimationFrame** para animações suaves (60fps)
- **Debounce** em eventos de clique
- **Precache** da próxima fase em idle time
- **Feedback háptico** via `navigator.vibrate`

### 📱 PWA (Instalável & Offline)
- Funciona **100% offline** (Service Worker com cache inteligente)
- **Instalável** no home screen (Add to Home Screen / Install Prompt customizado)
- Ícones SVG (192/512) + **screenshots** para app stores
- **Shortcuts** (Continuar, Nova Fase)
- Meta tags para iOS (`apple-mobile-web-app-capable`, safe-area)
- **Splash screen** + theme-color dinâmico

### 🏷️ Versionamento
- `version.js` expõe `GAME_VERSION` (semver)
- Versão visível no **menu** e no **modal de vitória**
- Tag Git `vX.Y.Z` sincronizada com o código
- Script `release.sh` automatiza bump + tag + push

---

## 🛠️ Estrutura do Projeto

```
bottle-color/
├── index.html          # Estrutura, UI, telas (splash/menu/jogo)
├── style.css           # Estilos, glassmorphism, animações, temas
├── game.js             # Lógica principal + UI/navegação
├── storage.js          # ProgressManager (LocalStorage)
├── performance.js      # Otimizações, haptics, utilitários
├── sound.js            # Engine de som (Web Audio API)
├── version.js          # Constante GAME_VERSION
├── sw.js               # Service Worker (PWA, cache v2)
├── manifest.json       # Configuração PWA
├── icon-192.svg        # Ícone 192x192
├── icon-512.svg        # Ícone 512x512
├── screenshot-menu.svg # Mockup do menu
├── screenshot-game.svg # Mockup do jogo
├── test-scoring.html   # Teste automatizado do sistema de pontuação
├── release.sh          # Automatiza versionamento + tag + push
└── README.md           # Esta documentação
```

---

## 🚀 Como Executar

### Local (Desenvolvimento)
```bash
# Servir arquivos localmente (necessário para Service Worker)
python3 -m http.server 8000
# Ou
npx serve .
```

Acesse: `http://localhost:8000`

### No Celular (mesma rede WiFi)
1. Descubra o IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. No celular abra: `http://SEU_IP:8000/index.html`

### Testar PWA
1. Abra no Chrome/Safari
2. DevTools → Application → Service Workers (status: "Activated")
3. Marque "Offline" e recarregue — funciona ✅
4. "Add to Home Screen" / Install Prompt

---

## 🏷️ Release (versionamento)

Use o `release.sh` para manter código e tag sincronizados:

```bash
./release.sh 1.5.0 "Nova feature X"   # versão explícita
./release.sh minor                     # 1.4.0 -> 1.5.0
./release.sh patch                     # 1.4.0 -> 1.4.1
./release.sh major                     # 1.4.0 -> 2.0.0
```

O script:
1. Atualiza `GAME_VERSION` em `version.js`
2. Faz commit (`chore: bump version to X.Y.Z`)
3. Cria tag anotada `vX.Y.Z`
4. Push do commit **e** da tag para `origin/main`

> Sempre atualize a versão antes de um release para que o menu e o modal reflitam a build correta.

---

## 📝 Notas de Desenvolvimento

### Changelog
- **v1.4.0** — Versionador no menu/modal + release.sh; tema claro/escuro; modo daltonismo; fundo animado; barra de progresso; glow de tubo completo
- **v1.3.0** — Menu principal (grid 50 fases), splash screen, navegação entre telas
- **v1.2.0** — PWA (manifest, service worker, install prompt, ícones SVG)
- **v1.1.0** — Sistema de estrelas + pontuação; persistência (storage.js); performance (performance.js)
- **v1.0.0** — Jogo base (tubos, derramar, regras, sons)

### Arquivos de Teste
- `test-scoring.html` — valida ProgressManager (salvar, stars, stats, reset, achievements)

---

## 🔧 Configuração

### Modo Debug
```javascript
// Ativar logs de performance
PerformanceManager.setDebugMode(true);
```

### Resetar Progresso
```javascript
// No console do navegador
progressManager.resetAllProgress();
```

### Preferências (tema/daltonismo)
Salvas em `localStorage` (`bottle-color-theme`, `bottle-color-cb`) e restauradas ao abrir.

---

## 📱 Compatibilidade

| Recurso | Suporte |
|---------|---------|
| iOS Safari | ✅ Completo |
| Android Chrome | ✅ Completo |
| Desktop | ✅ Completo |
| Offline | ✅ Completo |
| Haptics | ✅ Mobile only |
| Install Prompt | ✅ Chrome/Edge; iOS via Safari "Add to Home Screen" |

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Add nova feature'`)
4. Use `./release.sh` para versionar
5. Push (`git push origin feature/nova-feature`)
6. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT.
