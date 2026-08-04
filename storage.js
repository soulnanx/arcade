/**
 * PROGRESS MANAGER - LocalStorage Abstraction Layer
 * Gerencia salvamento e carregamento de progresso do jogador
 */

class ProgressManager {
  constructor() {
    this.storageKey = 'bottle-color-progress';
    this.ensureStorageInitialized();
  }

  /**
   * Inicializa o armazenamento se não existir
   */
  ensureStorageInitialized() {
    if (!this.getStorage()) {
      const initialData = {
        currentLevel: 1,
        levels: {},
        totalStars: 0,
        totalMovements: 0,
        achievements: [],
        lastPlayedAt: null,
        gamesCompleted: 0
      };
      this.setStorage(initialData);
    }
  }

  /**
   * Obter dados completos do armazenamento
   */
  getStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Erro ao ler localStorage:', e);
      return null;
    }
  }

  /**
   * Salvar dados completos do armazenamento
   */
  setStorage(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Erro ao salvar localStorage:', e);
      return false;
    }
  }

  /**
   * Salvar progresso de uma fase
   * @param {number} levelNum - Número da fase
   * @param {number} stars - Estrelas conquistadas (0-3)
   * @param {number} movementCount - Movimentos realizados
   * @param {number} optimalMoves - Movimentos ótimos para a fase
   */
  saveLevelProgress(levelNum, stars, movementCount, optimalMoves) {
    const storage = this.getStorage();
    if (!storage) return false;

    // Determinar se é primeira vez completando ou melhorando
    const wasCompleted = storage.levels[levelNum]?.completed || false;
    const previousStars = storage.levels[levelNum]?.stars || 0;

    // Salvar dados da fase
    storage.levels[levelNum] = {
      completed: true,
      stars: Math.max(stars, previousStars), // Manter melhor resultado
      movementCount,
      optimalMoves,
      timestamp: Date.now(),
      attempts: (storage.levels[levelNum]?.attempts || 0) + 1,
      bestMovements: Math.min(
        movementCount,
        storage.levels[levelNum]?.bestMovements || Infinity
      )
    };

    // Atualizar nível atual
    storage.currentLevel = Math.max(storage.currentLevel, levelNum + 1);

    // Atualizar total de estrelas
    const starsDifference = storage.levels[levelNum].stars - previousStars;
    storage.totalStars += starsDifference;

    // Atualizar estatísticas
    if (!wasCompleted) {
      storage.gamesCompleted += 1;
    }
    storage.lastPlayedAt = Date.now();

    // Verificar achievements
    this.checkAchievements(storage, levelNum);

    return this.setStorage(storage);
  }

  /**
   * Carregar progresso de uma fase
   * @param {number} levelNum - Número da fase
   */
  getLevelProgress(levelNum) {
    const storage = this.getStorage();
    if (!storage || !storage.levels[levelNum]) {
      return {
        completed: false,
        stars: 0,
        movementCount: null,
        optimalMoves: null,
        attempts: 0,
        bestMovements: Infinity
      };
    }
    return storage.levels[levelNum];
  }

  /**
   * Obter progresso geral
   */
  getGlobalStats() {
    const storage = this.getStorage();
    if (!storage) return null;

    const completedLevels = Object.values(storage.levels).filter(l => l.completed).length;
    const totalStars = storage.totalStars;
    const averageStars = completedLevels > 0 ? (totalStars / completedLevels).toFixed(2) : 0;

    return {
      currentLevel: storage.currentLevel,
      completedLevels,
      totalStars,
      averageStars,
      gamesCompleted: storage.gamesCompleted,
      lastPlayedAt: storage.lastPlayedAt,
      achievements: storage.achievements
    };
  }

  /**
   * Obter progresso de todas as fases
   */
  getAllLevelsProgress() {
    const storage = this.getStorage();
    if (!storage) return {};
    return storage.levels;
  }

  /**
   * Resetar progresso (com confirmação)
   */
  resetAllProgress() {
    if (confirm('Tem certeza que deseja resetar todo o progresso? Esta ação não pode ser desfeita.')) {
      this.ensureStorageInitialized();
      return true;
    }
    return false;
  }

  /**
   * Resetar progresso de uma fase específica
   */
  resetLevelProgress(levelNum) {
    const storage = this.getStorage();
    if (!storage || !storage.levels[levelNum]) return false;

    const lostStars = storage.levels[levelNum].stars;
    delete storage.levels[levelNum];

    storage.totalStars = Math.max(0, storage.totalStars - lostStars);
    storage.currentLevel = Math.min(storage.currentLevel, levelNum);

    return this.setStorage(storage);
  }

  /**
   * Verificar e registrar achievements
   */
  checkAchievements(storage, levelNum) {
    const achievements = storage.achievements;

    // Primeira vitória
    if (!achievements.includes('first_win') && storage.gamesCompleted === 1) {
      achievements.push('first_win');
    }

    // Vitória sem undo
    const levelData = storage.levels[levelNum];
    if (levelData && !achievements.includes('no_undo_win')) {
      // Será verificado no game.js se houve undo
      // Este é um placeholder
    }

    // 10 fases completadas
    if (!achievements.includes('10_levels') && storage.gamesCompleted >= 10) {
      achievements.push('10_levels');
    }

    // Todas as 3 estrelas
    if (!achievements.includes('3_stars') && storage.totalStars % 3 === 0) {
      achievements.push('3_stars');
    }

    // Perfect run (3 estrelas em 5 fases consecutivas)
    const recentLevels = Object.keys(storage.levels)
      .sort((a, b) => b - a)
      .slice(0, 5)
      .map(k => storage.levels[k]);

    if (
      !achievements.includes('perfect_run') &&
      recentLevels.length >= 5 &&
      recentLevels.every(l => l.stars === 3)
    ) {
      achievements.push('perfect_run');
    }
  }

  /**
   * Adicionar achievement manualmente (para casos especiais)
   */
  addAchievement(achievementId) {
    const storage = this.getStorage();
    if (!storage) return false;

    if (!storage.achievements.includes(achievementId)) {
      storage.achievements.push(achievementId);
      return this.setStorage(storage);
    }
    return false;
  }

  /**
   * Exportar dados (para backup/debug)
   */
  exportData() {
    return this.getStorage();
  }

  /**
   * Importar dados (para restore/debug)
   */
  importData(data) {
    try {
      this.setStorage(data);
      return true;
    } catch (e) {
      console.error('Erro ao importar dados:', e);
      return false;
    }
  }
}

// Instância global
const progressManager = new ProgressManager();
