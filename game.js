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

    this.dom = {
      board: document.getElementById('board'),
      levelDisplay: document.getElementById('level-display'),
      winModal: document.getElementById('win-modal'),
      btnUndo: document.getElementById('btn-undo'),
      btnRestart: document.getElementById('btn-restart'),
      btnNewGame: document.getElementById('btn-new-game'),
      btnNextLevel: document.getElementById('btn-next-level'),
      btnSound: document.getElementById('btn-sound')
    };

    this.bindEvents();
    this.startNewLevel(1);
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
    this.tubes = this.generateLevel(this.level);
    this.initialState = JSON.parse(JSON.stringify(this.tubes));
    this.render();
  }

  restartLevel() {
    this.tubes = JSON.parse(JSON.stringify(this.initialState));
    this.selectedTubeIndex = null;
    this.history = [];
    this.render();
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

    this.sound.pour();
    return true;
  }

  handleTubeClick(index) {
    if (this.selectedTubeIndex === null) {
      if (this.tubes[index].length > 0) {
        this.selectedTubeIndex = index;
        this.sound.click();
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
  }

  undo() {
    if (this.history.length === 0) return;
    this.tubes = this.history.pop();
    this.selectedTubeIndex = null;
    this.sound.click();
    this.render();
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
      setTimeout(() => {
        this.dom.winModal.classList.remove('hidden');
      }, 300);
    }
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
        tubeEl.appendChild(layerEl);
      });

      tubeEl.addEventListener('click', () => this.handleTubeClick(idx));
      this.dom.board.appendChild(tubeEl);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new WaterSortGame();
});
