/**
 * PERFORMANCE UTILITIES - Otimizações para Mobile
 * Gerencia preloading, debounce e smooth rendering
 */

class PerformanceManager {
  constructor() {
    this.preloadedPhases = {};
    this.preloadQueue = [];
  }

  /**
   * Debounce - limita chamadas de função
   * Útil para eventos de clique/resize
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle - executa função no máximo a cada X ms
   */
  static throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function (...args) {
      if (!lastRan) {
        func.apply(this, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
          if (Date.now() - lastRan >= limit) {
            func.apply(this, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  }

  /**
   * RequestAnimationFrame wrapper para smooth rendering
   */
  static smoothRender(callback) {
    if ('requestAnimationFrame' in window) {
      return requestAnimationFrame(callback);
    }
    return setTimeout(callback, 16); // ~60fps fallback
  }

  /**
   * Cancelar animação
   */
  static cancelRender(id) {
    if ('cancelAnimationFrame' in window) {
      return cancelAnimationFrame(id);
    }
    return clearTimeout(id);
  }

  /**
   * Precarregar próxima fase (gerar estado)
   * Útil para evitar lag ao mudar de fase
   */
  preloadPhase(phaseNum, generator) {
    if (this.preloadedPhases[phaseNum]) {
      return; // Já precarregada
    }

    // Adicionar à fila de preload
    this.preloadQueue.push(() => {
      try {
        const phaseState = generator(phaseNum);
        this.preloadedPhases[phaseNum] = phaseState;
      } catch (e) {
        console.warn(`Erro ao precarregar fase ${phaseNum}:`, e);
      }
    });

    // Executar fila se não estiver rodando
    this.processPreloadQueue();
  }

  /**
   * Processar fila de preload usando idle time
   */
  processPreloadQueue() {
    if (this.preloadQueue.length === 0) return;

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const task = this.preloadQueue.shift();
        if (task) task();
        if (this.preloadQueue.length > 0) {
          this.processPreloadQueue();
        }
      });
    } else {
      // Fallback: usar setTimeout com delay
      setTimeout(() => {
        const task = this.preloadQueue.shift();
        if (task) task();
        if (this.preloadQueue.length > 0) {
          this.processPreloadQueue();
        }
      }, 100);
    }
  }

  /**
   * Obter fase precarregada
   */
  getPreloadedPhase(phaseNum) {
    return this.preloadedPhases[phaseNum];
  }

  /**
   * Limpar cache de preload
   */
  clearPreloadCache() {
    this.preloadedPhases = {};
    this.preloadQueue = [];
  }

  /**
   * Medir performance de uma função
   */
  static measurePerformance(label, func) {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    console.log(`${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  }

  /**
   * Detectar se está em modo debug (para logs)
   */
  static isDebugMode() {
    return localStorage.getItem('bottle-color-debug') === 'true';
  }

  /**
   * Ativar modo debug
   */
  static setDebugMode(enabled) {
    if (enabled) {
      localStorage.setItem('bottle-color-debug', 'true');
    } else {
      localStorage.removeItem('bottle-color-debug');
    }
  }

  /**
   * Verificar capacidades do navegador
   */
  static getCapabilities() {
    return {
      requestAnimationFrame: 'requestAnimationFrame' in window,
      requestIdleCallback: 'requestIdleCallback' in window,
      serviceWorker: 'serviceWorker' in navigator,
      localStorage: typeof localStorage !== 'undefined',
      IndexedDB: 'indexedDB' in window,
      Vibration: 'vibrate' in navigator,
      Haptics: 'vibrate' in navigator || 'webkitVibrate' in navigator
    };
  }

  /**
   * Vibração tátil (feedback haptic)
   */
  static vibrate(pattern = 10) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    } else if ('webkitVibrate' in navigator) {
      navigator.webkitVibrate(pattern);
    }
  }

  /**
   * Vibração customizada (padrões)
   */
  static vibratePattern(pattern = [20, 30, 20]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
}

// Instância global
const performanceManager = new PerformanceManager();
