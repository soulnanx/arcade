/**
 * WATER SORT PUZZLE - ENGINE & UI
 * Arquitetura focada em estado (Stack) e acessibilidade de PWA.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
  }

  playTone(freq, type = 'sine', duration = 0.1, gainValue = 0.1) {
    if (!this.enabled) return;
    this.init();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(gainValue, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  click() {
    this.playTone(320, 'triangle', 0.05, 0.08);
  }

  pour() {
    this.playTone(480, 'sine', 0.15, 0.1);
    setTimeout(() => this.playTone(600, 'sine', 0.12, 0.08), 80);
  }

  win() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Acorde Dó Maior
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.3, 0.12), idx * 100);
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

class WaterSortGame {
  constructor() {
    this.capacity = 4;
    this.tubes = [];
    this.selectedTubeIndex = null;
    this.history = [];
    this.level = 1;
    this.sound = new SoundEngine();
    this.movementCount = 0;
    this.optimalMoves = null;
    this.hasUndone = false;
    this.maxLevelDisplay = 50; // Máximo de fases no grid

    this.dom = {
      board: document.getElementById('board'),
      levelDisplay: document.getElementById('level-display'),
      winModal: document.getElementById('win-modal'),
      btnUndo: document.getElementById('btn-undo'),
      btnRestart: document.getElementById('btn-restart'),
      btnNewGame: document.getElementById('btn-new-game'),
      btnNextLevel: document.getElementById('btn-next-level'),
      btnSound: document.getElementById('btn-sound'),
      movementCounter: document.getElementById('movement-counter'),
      btnBackMenu: document.getElementById('btn-back-menu'),
      splashScreen: document.getElementById('splash-screen'),
      mainMenu: document.getElementById('main-menu'),
      gameScreen: document.getElementById('game-screen'),
      levelGrid: document.getElementById('level-grid'),
      btnContinue: document.getElementById('btn-continue'),
      continueLevel: document.getElementById('continue-level'),
      menuTotalStars: document.getElementById('menu-total-stars'),
      menuCompleted: document.getElementById('menu-completed'),
      menuVersion: document.getElementById('menu-version'),
      btnTheme: document.getElementById('btn-theme'),
      btnCb: document.getElementById('btn-cb'),
      progressFill: document.getElementById('progress-fill')
    };

    this.loadPreferences();
    this.bindEvents();
    this.initApp();
  }

  /**
   * Inicializar aplicação (mostrar splash, depois menu)
   */
  initApp() {
    // Esconder splash após 1.5s
    setTimeout(() => {
      this.hideSplash();
      this.showMainMenu();
    }, 1500);
  }

  /**
   * Esconder splash screen
   */
  hideSplash() {
    if (this.dom.splashScreen) {
      this.dom.splashScreen.classList.add('hidden');
    }
  }

  /**
   * Mostrar menu principal
   */
  showMainMenu() {
    this.dom.mainMenu.classList.remove('hidden');
    this.dom.gameScreen.classList.add('hidden');
    this.renderMenuStats();
    this.renderLevelGrid();
  }

  /**
   * Mostrar tela do jogo
   */
  showGameScreen() {
    this.dom.gameScreen.classList.remove('hidden');
    this.dom.mainMenu.classList.add('hidden');
  }

  /**
   * Renderizar estatísticas do menu
   */
  renderMenuStats() {
    const stats = progressManager.getGlobalStats();
    if (stats) {
      this.dom.menuTotalStars.textContent = stats.totalStars;
      this.dom.menuCompleted.textContent = stats.completedLevels;
      this.dom.continueLevel.textContent = stats.currentLevel;

      // Versão do jogo
      if (this.dom.menuVersion && typeof GAME_VERSION_LABEL !== 'undefined') {
        this.dom.menuVersion.textContent = GAME_VERSION_LABEL;
      }

      // Se não há fases completadas, esconder botão continuar
      if (stats.completedLevels === 0) {
        this.dom.btnContinue.classList.add('hidden');
      } else {
        this.dom.btnContinue.classList.remove('hidden');
      }
    }
  }

  /**
   * Renderizar grid de fases
   */
  renderLevelGrid() {
    const grid = this.dom.levelGrid;
    if (!grid) return;

    grid.innerHTML = '';

    for (let level = 1; level <= this.maxLevelDisplay; level++) {
      const levelProgress = progressManager.getLevelProgress(level);
      const isCompleted = levelProgress.completed;
      const stars = levelProgress.stars || 0;
      const isLocked = level > progressManager.getGlobalStats().currentLevel;

      const levelCard = document.createElement('button');
      levelCard.className = `level-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`;
      levelCard.setAttribute('data-level', level);
      levelCard.setAttribute('aria-label', `Fase ${level}${isLocked ? ' (Bloqueada)' : ''}`);

      // Stars HTML
      let starsHtml = '';
      for (let i = 0; i < 3; i++) {
        starsHtml += `<span class="level-star ${i < stars ? 'earned' : 'empty'}">★</span>`;
      }

      levelCard.innerHTML = `
        <div class="level-number">${isLocked ? '🔒' : level}</div>
        <div class="level-stars">${starsHtml}</div>
      `;

      if (!isLocked) {
        levelCard.addEventListener('click', () => {
          this.sound.click();
          this.showGameScreen();
          this.startNewLevel(level);
        });
      } else {
        levelCard.disabled = true;
      }

      grid.appendChild(levelCard);
    }
  }

  bindEvents() {
    this.dom.btnUndo.addEventListener('click', () => this.undo());
    this.dom.btnRestart.addEventListener('click', () => this.restartLevel());
    this.dom.btnNewGame.addEventListener('click', () => this.startNewLevel(this.level));
    this.dom.btnNextLevel.addEventListener('click', () => {
      this.dom.winModal.classList.add('hidden');
      this.startNewLevel(this.level + 1);
    });
    this.dom.btnSound.addEventListener('click', () => {
      const isEnabled = this.sound.toggle();
      this.dom.btnSound.textContent = isEnabled ? '🔊' : '🔇';
    });

    if (this.dom.btnTheme) {
      this.dom.btnTheme.addEventListener('click', () => {
        this.sound.click();
        this.toggleTheme();
      });
    }

    if (this.dom.btnCb) {
      this.dom.btnCb.addEventListener('click', () => {
        this.sound.click();
        this.toggleColorBlind();
      });
    }

    // Botão voltar ao menu
    if (this.dom.btnBackMenu) {
      this.dom.btnBackMenu.addEventListener('click', () => {
        this.sound.click();
        this.showMainMenu();
      });
    }

    // Botão continuar (menu)
    if (this.dom.btnContinue) {
      this.dom.btnContinue.addEventListener('click', () => {
        this.sound.click();
        this.showGameScreen();
        const currentLevel = progressManager.getGlobalStats().currentLevel;
        this.startNewLevel(currentLevel);
      });
    }
  }

  /**
   * GERADOR DE FASES - ALGORITMO REVERSO
   * Parte de um estado resolvido e executa movimentos inversos válidos
   * garantindo que a fase final seja sempre solucionável.
   */
  generateLevel(levelNum) {
    const numColors = Math.min(3 + Math.floor((levelNum - 1) / 2), 7);
    const numEmpty = 2;
    const totalTubes = numColors + numEmpty;

    // 1. Estado Resolvido inicial
    const state = [];
    for (let i = 0; i < numColors; i++) {
      state.push(Array(this.capacity).fill(i));
    }
    for (let i = 0; i < numEmpty; i++) {
      state.push([]);
    }

    // 2. Embaralhamento Reverso
    const totalMoves = numColors * 15;
    let lastSource = -1;

    for (let m = 0; m < totalMoves; m++) {
      const validReverseMoves = [];

      for (let from = 0; from < totalTubes; from++) {
        if (state[from].length === 0 || from === lastSource) continue;
        const colorToMove = state[from][state[from].length - 1];

        for (let to = 0; to < totalTubes; to++) {
          if (from === to) continue;
          // O destino precisa ter espaço
          if (state[to].length >= this.capacity) continue;
          
          // Regra reversa de validade: após mover para 'to', se o jogador fosse
          // jogar normalmente ('to' -> 'from'), o movimento precisaria ser válido.
          // Logo, 'from' sem a cor superior deve estar vazio OU ter o topo igual a 'colorToMove'.
          const fromAfterPop = state[from].slice(0, -1);
          const topAfterPop = fromAfterPop.length > 0 ? fromAfterPop[fromAfterPop.length - 1] : null;

          if (topAfterPop === null || topAfterPop === colorToMove) {
            validReverseMoves.push({ from, to });
          }
        }
      }

      if (validReverseMoves.length > 0) {
        const move = validReverseMoves[Math.floor(Math.random() * validReverseMoves.length)];
        const color = state[move.from].pop();
        state[move.to].push(color);
        lastSource = move.to;
      }
    }

    return state;
  }

  startNewLevel(levelNum) {
    this.level = levelNum;
    this.dom.levelDisplay.textContent = this.level;
    this.selectedTubeIndex = null;
    this.history = [];
    this.movementCount = 0;
    this.hasUndone = false;
    this.tubes = this.generateLevel(this.level);
    this.initialState = JSON.parse(JSON.stringify(this.tubes));
    
    // Calcular movimentos ótimos (aproximação)
    this.optimalMoves = this.estimateOptimalMoves();
    
    // Transição de fase (fade-out/in)
    const board = this.dom.board;
    board.classList.remove('board-enter');
    board.classList.add('board-exit');
    setTimeout(() => {
      this.render();
      board.classList.remove('board-exit');
      board.classList.add('board-enter');
    }, 180);
    this.updateMovementCounter();
    this.updateProgress();
  }

  /**
   * Estimar movimentos ótimos para a fase
   * Baseado no número de cores e complexidade
   */
  estimateOptimalMoves() {
    const numColors = this.tubes.filter(tube => tube.length > 0).length;
    // Fórmula heurística: cores * 2 (aproximação)
    return Math.max(numColors - 1, 1);
  }

  restartLevel() {
    this.tubes = JSON.parse(JSON.stringify(this.initialState));
    this.selectedTubeIndex = null;
    this.history = [];
    this.movementCount = 0;
    this.hasUndone = false;
    this.render();
    this.updateMovementCounter();
  }

  /**
   * VERIFICAÇÃO DE REGRA
   * Valida se a origem pode derramar no destino
   */
  canPour(origemIndex, destinoIndex) {
    if (origemIndex === destinoIndex) return false;
    const origem = this.tubes[origemIndex];
    const destino = this.tubes[destinoIndex];

    if (origem.length === 0) return false;
    if (destino.length === this.capacity) return false;

    if (destino.length === 0) return true;

    const topOrigem = origem[origem.length - 1];
    const topDestino = destino[destino.length - 1];

    return topOrigem === topDestino;
  }

  /**
   * EXECUÇÃO DE TRANSFERÊNCIA (Múltiplas camadas se houver espaço)
   */
  pour(origemIndex, destinoIndex) {
    if (!this.canPour(origemIndex, destinoIndex)) return false;

    // Salva estado para o Undo
    this.history.push(JSON.parse(JSON.stringify(this.tubes)));

    const origem = this.tubes[origemIndex];
    const destino = this.tubes[destinoIndex];
    const corTransferida = origem[origem.length - 1];

    // Calcula camadas da mesma cor no topo e espaço disponível
    let count = 0;
    for (let i = origem.length - 1; i >= 0; i--) {
      if (origem[i] === corTransferida) count++;
      else break;
    }

    const espacoDisponivel = this.capacity - destino.length;
    const quantidadeTransferida = Math.min(count, espacoDisponivel);

    for (let i = 0; i < quantidadeTransferida; i++) {
      origem.pop();
      destino.push(corTransferida);
    }

    // Incrementar contador de movimentos
    this.movementCount++;
    this.updateMovementCounter();
    this.sound.pour();
    // Vibração leve ao derramar
    if (typeof PerformanceManager !== 'undefined') {
      PerformanceManager.vibrate(15);
    }
    // Guarda o destino para animar apos o render do handleTubeClick
    this._lastPouredDest = destinoIndex;
    return true;
  }

  handleTubeClick(index) {
    if (this.selectedTubeIndex === null) {
      if (this.tubes[index].length > 0) {
        this.selectedTubeIndex = index;
        this.sound.click();
        if (typeof PerformanceManager !== 'undefined') {
          PerformanceManager.vibrate(12);
        }
      }
    } else {
      if (this.selectedTubeIndex === index) {
        // Deseleciona
        this.selectedTubeIndex = null;
        this.sound.click();
      } else if (this.canPour(this.selectedTubeIndex, index)) {
        this.pour(this.selectedTubeIndex, index);
        this.selectedTubeIndex = null;
        this.checkWinCondition();
      } else {
        // Movimento inválido: shake no tubo de destino + vibração
        if (typeof PerformanceManager !== 'undefined') {
          PerformanceManager.vibrate([20, 30, 20]);
        }
        const board = this.dom.board;
        const tubeEl = board.children[index];
        if (tubeEl) {
          tubeEl.classList.remove('invalid-select');
          void tubeEl.offsetWidth; // reflow para reiniciar animação
          tubeEl.classList.add('invalid-select');
        }
        // Altera seleção se o novo tubo não for vazio
        if (this.tubes[index].length > 0) {
          this.selectedTubeIndex = index;
          this.sound.click();
        } else {
          this.selectedTubeIndex = null;
        }
      }
    }
    this.render();
    // Animação 'splash' na camada superior do tubo que recebeu líquido
    if (typeof this._lastPouredDest === 'number') {
      const destEl = this.dom.board.children[this._lastPouredDest];
      if (destEl) {
        const layers = destEl.querySelectorAll('.liquid-layer');
        const top = layers[layers.length - 1];
        if (top) top.classList.add('pour-in');
      }
      this._lastPouredDest = null;
    }
  }

  undo() {
    if (this.history.length === 0) return;
    this.tubes = this.history.pop();
    this.selectedTubeIndex = null;
    this.movementCount = Math.max(0, this.movementCount - 1);
    this.hasUndone = true;
    this.sound.click();
    this.render();
    this.updateMovementCounter();
  }

  /**
   * Calcular número de estrelas baseado em movimentos
   */
  calculateStars() {
    if (!this.optimalMoves) return 0;

    const ratio = this.movementCount / this.optimalMoves;

    if (ratio <= 1) return 3; // Perfeito
    if (ratio <= 1.5) return 2; // Bom
    if (ratio <= 2) return 1; // Aceitável
    return 0; // Muitos movimentos
  }

  /**
   * Atualizar contador de movimentos na UI
   */
  updateMovementCounter() {
    if (this.dom.movementCounter) {
      this.dom.movementCounter.textContent = this.movementCount;
      // Opcional: adicionar animação
      this.dom.movementCounter.classList.add('updated');
      setTimeout(() => this.dom.movementCounter.classList.remove('updated'), 200);
    }
  }

  checkWinCondition() {
    const isWon = this.tubes.every(tube => {
      if (tube.length === 0) return true;
      if (tube.length !== this.capacity) return false;
      const firstColor = tube[0];
      return tube.every(color => color === firstColor);
    });

    if (isWon) {
      this.sound.win();
      
      // Vibração de vitória (padrão celebratório)
      if (typeof PerformanceManager !== 'undefined') {
        PerformanceManager.vibratePattern([30, 50, 30, 50, 60]);
      }
      
      // Calcular stars
      const stars = this.calculateStars();
      
      // Salvar progresso
      progressManager.saveLevelProgress(
        this.level,
        stars,
        this.movementCount,
        this.optimalMoves
      );

      // Confete (CSS puro)
      this.launchConfetti(stars);

      setTimeout(() => {
        this.showWinModal(stars);
      }, 300);
    }
  }

  /**
   * Lançar confete em CSS puro (sem libs)
   * @param {number} stars - quantidade de estrelas (afeta intensidade)
   */
  launchConfetti(stars) {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#FFD700'];
    const count = 40 + (stars || 0) * 20;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      const duration = 2.2 + Math.random() * 1.8;
      piece.style.animationDuration = duration + 's';
      piece.style.animationDelay = (Math.random() * 0.4) + 's';
      const scale = 0.7 + Math.random() * 0.8;
      piece.style.transform = 'scale(' + scale + ')';
      fragment.appendChild(piece);
    }
    document.body.appendChild(fragment);
    setTimeout(() => {
      document.querySelectorAll('.confetti').forEach(el => el.remove());
    }, 4800);
  }

  /**
   * Mostrar modal de vitória com stars
   */
  showWinModal(stars) {
    const modal = this.dom.winModal;
    
    // Atualizar stars no modal
    const starsContainer = modal.querySelector('.stars-container');
    if (starsContainer) {
      starsContainer.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const star = document.createElement('span');
        star.className = 'star ' + (i < stars ? 'earned' : 'empty');
        star.textContent = '★';
        starsContainer.appendChild(star);
      }
    }

    // Atualizar informações
    const statsDiv = modal.querySelector('.win-stats');
    if (statsDiv) {
      const versionLabel = (typeof GAME_VERSION_LABEL !== 'undefined') ? GAME_VERSION_LABEL : '';
      statsDiv.innerHTML = `
        <p><strong>Movimentos:</strong> ${this.movementCount} / ${this.optimalMoves}</p>
        <p><strong>Eficiência:</strong> ${((this.optimalMoves / this.movementCount) * 100).toFixed(0)}%</p>
        <p class="win-version">${versionLabel}</p>
      `;
    }

    modal.classList.remove('hidden');
  }

  render() {
    this.dom.board.innerHTML = '';
    this.tubes.forEach((tubeData, idx) => {
      const tubeEl = document.createElement('div');
      tubeEl.className = `tube ${this.selectedTubeIndex === idx ? 'selected' : ''}`;
      tubeEl.setAttribute('role', 'button');
      tubeEl.setAttribute('aria-label', `Tubo ${idx + 1}`);

      tubeData.forEach(colorId => {
        const layerEl = document.createElement('div');
        layerEl.className = `liquid-layer color-${colorId}`;
        if (tubeData.length === this.capacity && tubeData.every(cc => cc === tubeData[0])) {
          tubeEl.classList.add('completed');
        }
        tubeEl.appendChild(layerEl);
      });

      tubeEl.addEventListener('click', () => this.handleTubeClick(idx));
      this.dom.board.appendChild(tubeEl);
    });
  }

  loadPreferences() {
    const theme = localStorage.getItem('bottle-color-theme');
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      if (this.dom.btnTheme) this.dom.btnTheme.textContent = '🌙';
    }
    const cb = localStorage.getItem('bottle-color-cb');
    if (cb === '1') {
      document.body.classList.add('cb-mode');
      if (this.dom.btnCb) this.dom.btnCb.textContent = '✅';
    }
  }

  toggleTheme() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('bottle-color-theme', 'dark');
      if (this.dom.btnTheme) this.dom.btnTheme.textContent = '🌙';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('bottle-color-theme', 'light');
      if (this.dom.btnTheme) this.dom.btnTheme.textContent = '☀️';
    }
  }

  toggleColorBlind() {
    const active = document.body.classList.toggle('cb-mode');
    localStorage.setItem('bottle-color-cb', active ? '1' : '0');
    if (this.dom.btnCb) this.dom.btnCb.textContent = active ? '✅' : '👁️';
  }

  updateProgress() {
    if (!this.dom.progressFill) return;
    const total = this.tubes.length;
    let completed = 0;
    for (const tube of this.tubes) {
      if (tube.length === 0) { completed++; continue; }
      if (tube.length === this.capacity && tube.every(cc => cc === tube[0])) completed++;
    }
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    this.dom.progressFill.style.width = pct + '%';
  }

}

window.addEventListener('DOMContentLoaded', () => {
  new WaterSortGame();
});
