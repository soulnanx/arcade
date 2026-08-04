# 🍶 Bottle Color - Jogo de Lógica Mobile

Um jogo de puzzle onde você organiza líquidos coloridos em tubos, misturando cores até que cada tubo tenha apenas uma cor.

## 🎮 Como Jogar

1. **Selecione um tubo** tocando nele (ele sobe um pouco)
2. **Selecione outro tubo** para derramar o líquido
3. **Regras:**
   - Só pode derramar se a cor do topo for igual à do destino
   - Ou se o tubo destino estiver vazio
   - O tubo destino não pode estar cheio
4. **Objetivo:** Organizar todos os tubos para que cada um tenha apenas uma cor (ou fique vazio)

## ⭐ Sistema de Pontuação

Cada fase tem um sistema de **3 estrelas** baseado na eficiência dos seus movimentos:

- ⭐⭐⭐ **Perfeito** - Resolveu na quantidade ótima de movimentos
- ⭐⭐ **Bom** - Até 1.5x os movimentos ótimos
- ⭐ **Aceitável** - Até 2x os movimentos ótimos
- Sem estrela - Mais de 2x (ainda completa a fase)

### Contador de Movimentos
- Mostrado no header: "Movimentos: X"
- Incrementa a cada transferência de líquido
- Decrementa se você usar "Desfazer"
- Zera ao reiniciar a fase

## 💾 Progresso e Persistência

O jogo salva automaticamente:
- ✅ Fases completadas
- ⭐ Estrelas conquistadas (mantém o melhor resultado)
- 📊 Estatísticas globais
- 🏆 Achievements desbloqueados

Os dados são salvos no **LocalStorage** do navegador.

### Achievements
- `first_win` - Primeira vitória
- `10_levels` - 10 fases completadas
- `3_stars` - Total de estrelas múltiplo de 3
- `perfect_run` - 5 fases consecutivas com 3 estrelas

## ⚡ Performance (Mobile-First)

Otimizações implementadas:
- **Lazy loading** de fases (geradas sob demanda)
- **RequestAnimationFrame** para animações suaves (60fps)
- **Debounce** em eventos de clique
- **Precache** da próxima fase em idle time
- **Feedback háptico** (vibração) em dispositivos móveis

### Web App (PWA)
- Funciona **100% offline**
- Instalável no home screen (Add to Home Screen)
- Service Worker com cache inteligente
- Ícones e splash screen customizados

## 🛠️ Estrutura do Projeto

```
bottle-color/
├── index.html          # Estrutura e UI
├── style.css           # Estilos e animações
├── game.js             # Lógica principal do jogo
├── storage.js          # Gerenciamento de progresso (LocalStorage)
├── performance.js      # Otimizações e utilitários
├── sound.js            # Engine de som (Web Audio API)
├── sw.js               # Service Worker (PWA)
├── manifest.json       # Configuração PWA
└── README.md           # Esta documentação
```

## 🚀 Como Executar

### Local (Desenvolvimento)
```bash
# Servir arquivos localmente (necessário para Service Worker)
python3 -m http.server 8000
# Ou
npx serve .
```

Acesse: `http://localhost:8000`

### Testar PWA
1. Abra no Chrome/Safari
2. DevTools > Application > Service Workers
3. Verifique "Offline" funciona
4. Teste "Add to Home Screen"

## 📝 Notas de Desenvolvimento

### Atualizações Recentes (v2.0)
- ✅ Sistema de estrelas e pontuação
- ✅ Persistência de progresso
- ✅ Otimizações de performance
- ✅ Feedback háptico
- ✅ Modal de vitória expandido

### Arquivos de Teste
- `test-scoring.html` - Testa sistema de pontuação

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

## 📱 Compatibilidade

| Recurso | Suporte |
|---------|---------|
| iOS Safari | ✅ Completo |
| Android Chrome | ✅ Completo |
| Desktop | ✅ Completo |
| Offline | ✅ Completo |
| Haptics | ✅ Mobile only |

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Add nova feature'`)
4. Push (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.
