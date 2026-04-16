/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RotateCcw, 
  Play, 
  Pause, 
  Volume2, 
  History, 
  BarChart3, 
  Settings, 
  LayoutGrid,
  Undo2,
  Trophy,
  Dribbble,
  Share2,
  X,
  Plus,
  Minus,
  Check,
  Languages,
  Palette,
  MonitorSmartphone,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type Team = 'home' | 'visitor';

interface GameState {
  gameTime: number; // in seconds
  shotClock: number; // in seconds
  homeScore: number;
  visitorScore: number;
  homeFouls: number;
  visitorFouls: number;
  isRunning: boolean;
}

interface HistoryAction {
  id: string;
  timestamp: number;
  state: Omit<GameState, 'isRunning'>;
  description: string;
}

interface Player {
  id: string;
  name: string;
  number: string;
  stats: {
    pts2: { made: number; missed: number };
    pts3: { made: number; missed: number };
    ft: { made: number; missed: number };
  };
}

// --- Constants ---

const MODES = {
  '3x3': { gameTime: 600, shotClock: 12, label: '3x3' },
  'fiba': { gameTime: 600, shotClock: 24, label: 'FIBA' },
  'nba': { gameTime: 720, shotClock: 12, label: 'NBA' }, // User requested 12s for NBA
};

const TRANSLATIONS: any = {
  pt: {
    placar: 'PLACAR',
    historico: 'HISTÓRICO',
    estatisticas: 'Estatísticas',
    opcoes: 'OPÇÕES',
    casa: 'CASA',
    visitante: 'VISITANTE',
    faltasDaCasa: 'Faltas da\nCasa',
    faltasDoVisitante: 'Faltas do\nVisitante',
    pts: 'PTS',
    faltas: 'Faltas',
    bonus: 'Bônus',
    desfazer: 'DESFAZER',
    buzzer: 'BUZZER',
    reiniciar: 'REINICIAR',
    posse: 'Posse',
    tempoJogo: 'Tempo de Jogo',
    compartilhar: 'COMPARTILHAR',
    nenhumaAcao: 'Nenhuma ação registrada',
    historicoPartida: 'Histórico da Partida',
    editarTempo: 'Editar Tempo',
    minutos: 'Minutos',
    segundos: 'Segundos',
    salvarTempo: 'SALVAR TEMPO',
    configuracoes: 'Configurações',
    idioma: 'Idioma',
    tema: 'Tema',
    claro: 'Claro',
    escuro: 'Escuro',
    modoJogo: 'Modo de Jogo',
    telaSempreLigada: 'Manter tela ligada',
    confirmarReiniciar: 'Deseja reiniciar o placar?',
    inicioPartida: 'Início da Partida',
    fimJogo: 'Fim de Jogo',
    faltaCasa: 'Falta da equipe da Casa',
    faltaVisitante: 'Falta da equipe Visitante',
    copiado: 'Histórico copiado para a área de transferência!',
    sons: 'Sons',
    somTempoJogo: 'Som de fim de jogo',
    somTempoPosse: 'Som de fim de posse',
    testarSom: 'Testar Som',
    adicionarJogador: 'Adicionar Jogador',
    nomeJogador: 'Nome',
    numeroJogador: 'Nº',
    categoria: 'Categoria',
    acertou: 'Acertou',
    errou: 'Errou',
    aproveitamento: 'Aprov.',
    pts2: '2 Pontos',
    pts3: '3 Pontos',
    lanceLivre: 'Lance Livre',
    remover: 'Remover',
    sorteio: 'SORTEIO',
    equipes: 'Equipes',
    compartilharEquipes: 'Compartilhar Equipes',
    equipe: 'Equipe',
    jogadoresInsuficientes: 'Jogadores insuficientes. Cadastre-os na aba de estatísticas.',
    fechar: 'Fechar',
    limparSorteio: 'Limpar Sorteio',
    tempoNaoEditavel: 'O tempo só pode ser alterado antes do início do jogo.',
  },
  en: {
    placar: 'SCOREBOARD',
    historico: 'HISTORY',
    estatisticas: 'Stats',
    opcoes: 'OPTIONS',
    casa: 'HOME',
    visitante: 'AWAY',
    faltasDaCasa: 'Home\nFouls',
    faltasDoVisitante: 'Away\nFouls',
    pts: 'PTS',
    faltas: 'Fouls',
    bonus: 'Bonus',
    desfazer: 'UNDO',
    buzzer: 'BUZZER',
    reiniciar: 'RESET',
    posse: 'Shot Clock',
    tempoJogo: 'Game Time',
    compartilhar: 'SHARE',
    nenhumaAcao: 'No actions recorded',
    historicoPartida: 'Game History',
    editarTempo: 'Edit Time',
    minutos: 'Minutes',
    segundos: 'Seconds',
    salvarTempo: 'SAVE TIME',
    configuracoes: 'Settings',
    idioma: 'Language',
    tema: 'Theme',
    claro: 'Light',
    escuro: 'Dark',
    modoJogo: 'Game Mode',
    telaSempreLigada: 'Keep screen on',
    confirmarReiniciar: 'Do you want to reset the scoreboard?',
    inicioPartida: 'Game Started',
    fimJogo: 'Game Over',
    faltaCasa: 'Home Team Foul',
    faltaVisitante: 'Away Team Foul',
    copiado: 'History copied to clipboard!',
    sons: 'Sounds',
    somTempoJogo: 'Game end sound',
    somTempoPosse: 'Shot clock sound',
    testarSom: 'Test Sound',
    adicionarJogador: 'Add Player',
    nomeJogador: 'Name',
    numeroJogador: 'Nº',
    categoria: 'Category',
    acertou: 'Made',
    errou: 'Missed',
    aproveitamento: 'Eff.',
    pts2: '2 Points',
    pts3: '3 Points',
    lanceLivre: 'Free Throw',
    remover: 'Remove',
    sorteio: 'DRAFT',
    equipes: 'Teams',
    compartilharEquipes: 'Share Teams',
    equipe: 'Team',
    jogadoresInsuficientes: 'Insufficient players. Register them in the stats tab.',
    fechar: 'Close',
    limparSorteio: 'Clear Draft',
    tempoNaoEditavel: 'Time can only be changed before the game starts.',
  },
  es: {
    placar: 'MARCADOR',
    historico: 'HISTORIAL',
    estatisticas: 'Estadísticas',
    opcoes: 'OPCIONES',
    casa: 'LOCAL',
    visitante: 'VISITANTE',
    pts: 'PTS',
    faltas: 'Faltas',
    bonus: 'Bono',
    desfazer: 'DESHACER',
    buzzer: 'BOCINA',
    reiniciar: 'REINICIAR',
    posse: 'Posesión',
    tempoJogo: 'Tiempo de Juego',
    compartilhar: 'COMPARTIR',
    nenhumaAcao: 'No hay acciones registradas',
    historicoPartida: 'Historial del Partido',
    editarTempo: 'Editar Tiempo',
    minutos: 'Minutos',
    segundos: 'Segundos',
    salvarTempo: 'GUARDAR TIEMPO',
    configuracoes: 'Configuraciones',
    idioma: 'Idioma',
    tema: 'Tema',
    claro: 'Claro',
    escuro: 'Oscuro',
    modoJogo: 'Modo de Juego',
    telaSempreLigada: 'Mantener pantalla encendida',
    confirmarReiniciar: '¿Desea reiniciar el marcador?',
    inicioPartida: 'Inicio del Partido',
    fimJogo: 'Fin del Juego',
    faltaCasa: 'Falta del equipo Local',
    faltaVisitante: 'Falta del equipo Visitante',
    copiado: '¡Historial copiado al portapapeles!',
    sons: 'Sonidos',
    somTempoJogo: 'Sonido de fin de juego',
    somTempoPosse: 'Sonido de fin de posesión',
    testarSom: 'Probar Sonido',
    adicionarJogador: 'Añadir Jugador',
    nomeJogador: 'Nombre',
    numeroJogador: 'Nº',
    categoria: 'Categoría',
    acertou: 'Acierto',
    errou: 'Fallo',
    aproveitamento: 'Ef.',
    pts2: '2 Puntos',
    pts3: '3 Puntos',
    lanceLivre: 'Tiro Libre',
    remover: 'Eliminar',
    sorteio: 'SORTEO',
    equipes: 'Equipos',
    compartilharEquipes: 'Compartir Equipos',
    equipe: 'Equipo',
    jogadoresInsuficientes: 'Jugadores insuficientes. Regístrelos en la pestaña de estadísticas.',
    fechar: 'Cerrar',
    limparSorteio: 'Limpiar Sorteo',
    tempoNaoEditavel: 'El tiempo solo se puede cambiar antes de que comience el juego.',
  }
};

const MAX_SCORE = 21;

// --- Components ---

const Digit = ({ value }: { value: string | number }) => (
  <span className="inline-block min-w-[0.6em] text-center font-mono font-bold">
    {value}
  </span>
);

export default function App() {
  // --- State ---
  const [language, setLanguage] = useState<'pt' | 'en' | 'es'>('pt');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [gameMode, setGameMode] = useState<keyof typeof MODES>('3x3');
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const [gameEndSoundEnabled, setGameEndSoundEnabled] = useState(true);
  const [shotClockSoundEnabled, setShotClockSoundEnabled] = useState(true);
  
  const [gameTime, setGameTime] = useState(MODES[gameMode].gameTime);
  const [shotClock, setShotClock] = useState(MODES[gameMode].shotClock);
  const [homeScore, setHomeScore] = useState(0);
  const [visitorScore, setVisitorScore] = useState(0);
  const [homeFouls, setHomeFouls] = useState(0);
  const [visitorFouls, setVisitorFouls] = useState(0);
  const [homeName, setHomeName] = useState('BE CITY');
  const [visitorName, setVisitorName] = useState('BULLS');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('placar');
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [drawnTeams, setDrawnTeams] = useState<Player[][]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const hasStarted = useRef(false);
  const buzzerPlayedRef = useRef(false);
  const [shotClockBuzzerPlayed, setShotClockBuzzerPlayed] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<any>(null);

  const t = TRANSLATIONS[language];

  // --- Helpers ---

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveToHistory = useCallback((description: string) => {
    const newAction: HistoryAction = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      state: {
        gameTime,
        shotClock,
        homeScore,
        visitorScore,
        homeFouls,
        visitorFouls,
      },
      description,
    };
    setHistory(prev => [newAction, ...prev].slice(0, 100));
  }, [gameTime, shotClock, homeScore, visitorScore, homeFouls, visitorFouls]);

  const shareHistory = () => {
    const text = history.map(h => `[${new Date(h.timestamp).toLocaleTimeString()}] ${h.description}`).join('\n');
    const finalScore = `${t.placar} FINAL: ${t.casa} ${homeScore} x ${visitorScore} ${t.visitante}`;
    const fullText = `${t.historicoPartida} ${MODES[gameMode].label}\n\n${text}\n\n${finalScore}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${t.historicoPartida} ${MODES[gameMode].label}`,
        text: fullText,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(fullText);
      alert(t.copiado);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastAction = history[0];
    const { state } = lastAction;
    
    setGameTime(state.gameTime);
    setShotClock(state.shotClock);
    setHomeScore(state.homeScore);
    setVisitorScore(state.visitorScore);
    setHomeFouls(state.homeFouls);
    setVisitorFouls(state.visitorFouls);
    
    setHistory(prev => prev.slice(1));
    // If we undid the "Game Started" action, reset the flag
    if (lastAction.description === t.inicioPartida) {
      hasStarted.current = false;
    }
  };

  const resetGame = () => {
    const mode = MODES[gameMode];
    setGameTime(mode.gameTime);
    setShotClock(mode.shotClock);
    setHomeScore(0);
    setVisitorScore(0);
    setHomeFouls(0);
    setVisitorFouls(0);
    setHomeName('BE CITY');
    setVisitorName('BULLS');
    setIsRunning(false);
    setHistory([]);
    // Reset player stats instead of clearing the list
    setPlayers(prev => prev.map(p => ({
      ...p,
      stats: {
        pts2: { made: 0, missed: 0 },
        pts3: { made: 0, missed: 0 },
        ft: { made: 0, missed: 0 },
      }
    })));
    hasStarted.current = false;
    setShowResetConfirm(false);
  };

  const playBuzzer = async (isGameEnd = false) => {
    console.log('BUZZER!', isGameEnd ? 'Game End' : 'Shot Clock');
    
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioCtxRef.current;
    
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const masterGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    if (isGameEnd) {
      const duration = 1.5;
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);
      
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.05);
      masterGain.gain.setValueAtTime(0.6, ctx.currentTime + duration - 0.1);
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
      
      masterGain.connect(filter);
      filter.connect(ctx.destination);

      const baseFreq = 220; 
      [1, 1.2, 1.5, 2, 2.5, 3, 4].forEach(harmonic => {
        const osc = ctx.createOscillator();
        osc.type = harmonic % 2 === 0 ? 'square' : 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq * harmonic, ctx.currentTime);
        osc.detune.setValueAtTime(Math.random() * 30 - 15, ctx.currentTime);
        osc.connect(masterGain);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      });
    } else {
      // Shot clock buzzer - HD & Louder
      const duration = 0.8;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, ctx.currentTime);

      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.02);
      masterGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      masterGain.connect(filter);
      filter.connect(ctx.destination);

      // Richer sound with multiple frequencies
      [660, 880, 1320].forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.connect(masterGain);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      });
    }
  };

  const handleDraft = () => {
    if (players.length < (gameMode === '3x3' ? 3 : 5)) {
      setToast({ message: t.jogadoresInsuficientes, type: 'error' });
      return;
    }

    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const teamSize = gameMode === '3x3' ? 3 : 5;
    const teams: Player[][] = [];
    
    for (let i = 0; i < shuffled.length; i += teamSize) {
      const team = shuffled.slice(i, i + teamSize);
      if (team.length > 0) {
        teams.push(team);
      }
    }
    
    setDrawnTeams(teams);
    setShowDraftModal(true);
  };

  const shareTeams = () => {
    const text = drawnTeams.map((team, idx) => {
      const teamLetter = String.fromCharCode(65 + idx);
      return `${t.equipe} ${teamLetter}:\n${team.map(p => `- ${p.name} (#${p.number})`).join('\n')}`;
    }).join('\n\n');

    if (navigator.share) {
      navigator.share({
        title: t.equipes,
        text: text
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      setToast({ message: t.copiado, type: 'success' });
    }
  };

  const updateScore = (team: Team, amount: number) => {
    if (gameTime === 0 && hasStarted.current) return;
    saveToHistory(`${team === 'home' ? t.casa : t.visitante} +${amount} pts`);
    const limit = gameMode === '3x3' ? MAX_SCORE : 999;
    if (team === 'home') {
      setHomeScore(prev => Math.min(limit, prev + amount));
    } else {
      setVisitorScore(prev => Math.min(limit, prev + amount));
    }
    // Reset shot clock on score
    setShotClock(MODES[gameMode].shotClock);
  };

  const updateFouls = (team: Team) => {
    if (gameTime === 0 && hasStarted.current) return;
    saveToHistory(team === 'home' ? t.faltaCasa : t.faltaVisitante);
    if (team === 'home') {
      setHomeFouls(prev => prev + 1);
    } else {
      setVisitorFouls(prev => prev + 1);
    }
    // Pause game timer on foul
    setIsRunning(false);
  };

  const updatePlayerStat = (playerId: string, category: keyof Player['stats'], type: 'made' | 'missed', amount: number) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          stats: {
            ...p.stats,
            [category]: {
              ...p.stats[category],
              [type]: Math.max(0, p.stats[category][type] + amount)
            }
          }
        };
      }
      return p;
    }));
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const player: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPlayerName.toUpperCase(),
      number: newPlayerNumber,
      stats: {
        pts2: { made: 0, missed: 0 },
        pts3: { made: 0, missed: 0 },
        ft: { made: 0, missed: 0 },
      }
    };
    setPlayers(prev => [...prev, player]);
    setDrawnTeams([]);
    setNewPlayerName('');
    setNewPlayerNumber('');
  };

  const removePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setDrawnTeams([]);
  };

  // --- Effects ---

  // Toast effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync selected player
  useEffect(() => {
    if (players.length > 0) {
      if (!selectedPlayerId || !players.find(p => p.id === selectedPlayerId)) {
        setSelectedPlayerId(players[0].id);
      }
    } else {
      setSelectedPlayerId(null);
    }
  }, [players, selectedPlayerId]);

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Wake Lock effect
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && wakeLockEnabled) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.error(`${err.name}, ${err.message}`);
        }
      } else if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, [wakeLockEnabled]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      if (!hasStarted.current) {
        saveToHistory(t.inicioPartida);
        hasStarted.current = true;
      }
      timerRef.current = setInterval(() => {
        setGameTime(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });

        setShotClock(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, t.inicioPartida]);

  // Game End and Buzzer Logic
  useEffect(() => {
    const is3x3 = gameMode === '3x3';
    const scoreLimitReached = is3x3 && (homeScore >= MAX_SCORE || visitorScore >= MAX_SCORE);
    const timeEnded = gameTime === 0 && hasStarted.current;
    const isGameOver = scoreLimitReached || timeEnded;
    
    if (isGameOver) {
      if (isRunning || (timeEnded && !history.some(h => h.description.includes(t.fimJogo)))) {
        saveToHistory(`${t.fimJogo} - ${homeName} ${homeScore} x ${visitorScore} ${visitorName}`);
      }
      setIsRunning(false);
      
      if (timeEnded && !buzzerPlayedRef.current) {
        if (gameEndSoundEnabled) playBuzzer(true);
        buzzerPlayedRef.current = true;
      }
    }

    if (gameTime > 0) {
      buzzerPlayedRef.current = false;
    }
  }, [homeScore, visitorScore, gameTime, t.fimJogo, t.placar, isRunning, history, homeName, visitorName, gameMode, gameEndSoundEnabled]);

  // Shot Clock Buzzer Logic
  useEffect(() => {
    if (shotClock === 0 && isRunning && !shotClockBuzzerPlayed) {
      if (shotClockSoundEnabled) {
        playBuzzer(false);
      }
      setShotClockBuzzerPlayed(true);
    }
    if (shotClock > 0) {
      setShotClockBuzzerPlayed(false);
    }
  }, [shotClock, isRunning, shotClockSoundEnabled, shotClockBuzzerPlayed]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans flex flex-col items-center select-none transition-colors duration-500 overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 24, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed left-1/2 z-[100] px-5 py-2.5 rounded-full glass-card shadow-2xl font-semibold text-xs flex items-center gap-2 border border-white/20"
          >
            {toast.type === 'error' ? <X className="w-4 h-4 text-red-500" /> : <Check className="w-4 h-4 text-green-500" />}
            <span className="text-text-primary">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Glassmorphism */}
      <header className="w-full sticky top-0 z-40 glass px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center shadow-lg overflow-hidden border border-accent/20">
            <img 
              src="https://img.icons8.com/color/96/basketball.png" 
              alt="Basketball"
              className="w-7 h-7 object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden">
              <Dribbble className="w-6 h-6 text-accent" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-text-primary leading-tight">Basquete</h1>
          </div>
        </div>
        
        <div className="text-[10px] font-bold text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20 uppercase tracking-widest shadow-sm">
          {MODES[gameMode].label}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-2xl flex-1 flex flex-col gap-4 p-4 pb-32">
        {activeTab === 'placar' ? (
          <>
            {/* Timer & Shot Clock Row */}
            <div className="flex gap-4 h-32 sm:h-40 md:h-48 shrink-0">
              {/* Game Timer */}
              <motion.div 
                className={`flex-[3] glass-card rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group ${hasStarted.current ? 'cursor-default' : 'cursor-pointer'}`}
                whileTap={hasStarted.current ? {} : { scale: 0.98 }}
                onClick={() => {
                  if (hasStarted.current) {
                    setToast({ message: t.tempoNaoEditavel, type: 'error' });
                  } else {
                    setIsEditingTime(true);
                  }
                }}
              >
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest absolute top-4">{t.tempoJogo}</span>
                <div className="text-[22cqw] font-bold tracking-tighter text-text-primary mt-2 font-display leading-none text-digit">
                  {formatTime(gameTime)}
                </div>
              </motion.div>

              {/* Shot Clock */}
              <div className="flex-1 flex flex-col gap-3">
                <motion.div 
                  className="flex-1 glass-card rounded-3xl flex flex-col items-center justify-center relative cursor-pointer active:scale-95 transition-transform"
                  onClick={() => setShotClock(12)}
                >
                  <span className="text-[9px] font-bold text-accent uppercase tracking-widest absolute top-3 leading-none">{t.posse}</span>
                  <div className={`text-4xl font-black text-accent mt-2 font-mono text-digit ${shotClock <= 3 && shotClock > 0 ? 'animate-pulse' : ''}`}>
                    {shotClock.toString().padStart(2, '0')}
                  </div>
                </motion.div>
                
                {(gameMode === 'fiba' || gameMode === 'nba') && (
                  <motion.button
                    className="h-12 glass-card rounded-2xl text-accent font-black text-xs flex items-center justify-center active:scale-95 transition-transform"
                    onClick={() => setShotClock(24)}
                  >
                    24s
                  </motion.button>
                )}
              </div>
            </div>

            {/* Teams Row */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
              <TeamCard 
                label={t.casa}
                name={homeName}
                onNameChange={setHomeName}
                score={homeScore}
                onAdd1={() => updateScore('home', 1)}
                onAdd2={() => updateScore('home', 2)}
                onAdd3={() => updateScore('home', 3)}
                t={t}
                gameMode={gameMode}
              />
              <TeamCard 
                label={t.visitante}
                name={visitorName}
                onNameChange={setVisitorName}
                score={visitorScore}
                onAdd1={() => updateScore('visitor', 1)}
                onAdd2={() => updateScore('visitor', 2)}
                onAdd3={() => updateScore('visitor', 3)}
                t={t}
                gameMode={gameMode}
              />
            </div>

            {/* Fouls Row */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
              <FoulCard 
                label={t.faltasDaCasa}
                fouls={homeFouls}
                onAddFoul={() => updateFouls('home')}
                t={t}
                gameMode={gameMode}
              />
              <FoulCard 
                label={t.faltasDoVisitante}
                fouls={visitorFouls}
                onAddFoul={() => updateFouls('visitor')}
                t={t}
                gameMode={gameMode}
              />
            </div>

            {/* Controls Row */}
            <div className="grid grid-cols-3 gap-4 mt-2 shrink-0">
              <ControlButton 
                icon={<Undo2 className="w-5 h-5" />} 
                label={t.desfazer} 
                onClick={handleUndo}
                disabled={history.length === 0}
              />
              
              <motion.button
                className={`h-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-300 ${isRunning ? 'bg-text-primary text-bg-primary scale-[1.02]' : 'bg-accent text-white shadow-accent/30'}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
              </motion.button>

              <ControlButton 
                icon={<RotateCcw className="w-5 h-5" />} 
                label={t.reiniciar} 
                onClick={() => setShowResetConfirm(true)}
              />
            </div>
          </>
        ) : activeTab === 'estatisticas' ? (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-10">
            <div className="flex items-center px-2">
              <h2 className="text-lg font-bold text-text-primary tracking-tight">{t.estatisticas}</h2>
              <div className="flex gap-2 ml-auto">
                <motion.button 
                  onClick={handleDraft}
                  className="text-[11px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-4 py-2 rounded-full border border-accent/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Users className="w-3.5 h-3.5" />
                  {t.sorteio}
                </motion.button>
                {drawnTeams.length > 0 && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setDrawnTeams([])}
                    className="text-[11px] font-bold text-text-secondary uppercase tracking-widest bg-bg-secondary px-4 py-2 rounded-full border border-border/50 active:scale-95 transition-all"
                  >
                    {t.limparSorteio}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Add Player Form */}
            <div className="glass-card rounded-3xl p-4 flex flex-col gap-4">
              <div className="flex gap-3 items-center">
                <div className="flex-1 flex gap-2">
                  <input 
                    type="text"
                    placeholder={t.nomeJogador}
                    className="flex-1 min-w-0 bg-bg-secondary rounded-2xl px-4 py-3 text-sm font-semibold text-text-primary outline-accent placeholder:text-text-secondary/50"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                  />
                  <input 
                    type="text"
                    placeholder={t.numeroJogador}
                    className="w-16 bg-bg-secondary rounded-2xl px-2 py-3 text-sm font-bold text-center text-text-primary outline-accent placeholder:text-text-secondary/50"
                    value={newPlayerNumber}
                    onChange={(e) => setNewPlayerNumber(e.target.value)}
                  />
                </div>
                <motion.button
                  className="w-12 h-12 bg-accent text-white rounded-2xl shadow-lg shadow-accent/20 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                  onClick={addPlayer}
                >
                  <Plus className="w-6 h-6" />
                </motion.button>
              </div>
            </div>

            {/* Players Selection Badges */}
            <div className="space-y-6 px-1">
              {drawnTeams.length > 0 ? (
                drawnTeams.map((team, teamIdx) => (
                  <div key={teamIdx} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-4 bg-accent rounded-full" />
                      <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">
                        {t.equipe} {String.fromCharCode(65 + teamIdx)}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {team.map(player => (
                        <PlayerBadge 
                          key={player.id}
                          player={player}
                          isSelected={selectedPlayerId === player.id}
                          onClick={() => setSelectedPlayerId(player.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {players.map(player => (
                    <PlayerBadge 
                      key={player.id}
                      player={player}
                      isSelected={selectedPlayerId === player.id}
                      onClick={() => setSelectedPlayerId(player.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Selected Player Card */}
            <div className="pb-8">
              {selectedPlayerId && players.find(p => p.id === selectedPlayerId) ? (
                <PlayerStatCard 
                  player={players.find(p => p.id === selectedPlayerId)} 
                  gameMode={gameMode} 
                  t={t} 
                  updatePlayerStat={updatePlayerStat} 
                  removePlayer={removePlayer} 
                />
              ) : players.length > 0 ? (
                <div className="h-48 glass-card rounded-[2.5rem] flex flex-col items-center justify-center text-text-secondary text-sm font-medium border border-dashed border-border/50 gap-4">
                  <div className="w-12 h-12 bg-bg-secondary rounded-full flex items-center justify-center">
                    <Dribbble className="w-6 h-6 opacity-30 animate-pulse text-accent" />
                  </div>
                  <p className="tracking-tight">Selecione um jogador acima</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : activeTab === 'historico' ? (
          <div className="flex-1 flex flex-col gap-6 min-h-0 mb-4 pb-20">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-lg font-bold text-text-primary tracking-tight">{t.historicoPartida}</h2>
              <motion.button
                className="p-3 bg-accent text-white rounded-2xl shadow-xl shadow-accent/20 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-transform"
                onClick={shareHistory}
              >
                <Share2 className="w-4 h-4" />
                {t.compartilhar}
              </motion.button>
            </div>
            <div className="flex-1 glass-card rounded-[2.5rem] p-6 overflow-y-auto no-scrollbar flex flex-col">
              {history.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-text-secondary gap-4 opacity-40">
                  <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center">
                    <History className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium tracking-tight">{t.nenhumaAcao}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((action, idx) => (
                    <motion.div 
                      key={action.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-4 group p-1"
                    >
                      <div className="text-[10px] font-mono text-text-secondary w-16 tabular-nums">
                        {new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-text-primary tracking-tight leading-none">{action.description}</p>
                          <p className="text-[10px] font-bold text-accent mt-1.5 uppercase tracking-widest leading-none">
                            {action.state.homeScore} — {action.state.visitorScore}
                          </p>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-accent transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'opcoes' ? (
          <div className="flex-1 flex flex-col gap-8 pb-32 overflow-y-auto no-scrollbar">
            <h2 className="text-lg font-bold text-text-primary px-2 tracking-tight">{t.configuracoes}</h2>
            
            <div className="flex flex-col gap-4">
              {/* Group 1: General */}
              <div className="glass-card rounded-[2rem] overflow-hidden">
                {/* Language Selection */}
                <div className="p-5 border-b border-border/40">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <Languages className="w-3.5 h-3.5 text-accent" /> {t.idioma}
                  </label>
                  <div className="flex gap-2 bg-bg-secondary p-1 rounded-2xl">
                    {(['pt', 'en', 'es'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${language === lang ? 'bg-bg-card shadow-sm text-accent' : 'text-text-secondary hover:text-text-primary'}`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Selection */}
                <div className="p-5 border-b border-border/40">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <Palette className="w-3.5 h-3.5 text-accent" /> {t.tema}
                  </label>
                  <div className="flex gap-2 bg-bg-secondary p-1 rounded-2xl">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${theme === 'light' ? 'bg-bg-card shadow-sm text-accent' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                      {t.claro}
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${theme === 'dark' ? 'bg-bg-card shadow-sm text-accent' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                      {t.escuro}
                    </button>
                  </div>
                </div>

                {/* Game Mode Selection */}
                <div className="p-5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <Trophy className="w-3.5 h-3.5 text-accent" /> {t.modoJogo}
                  </label>
                  <div className="flex gap-2 bg-bg-secondary p-1 rounded-2xl">
                    {(Object.keys(MODES) as Array<keyof typeof MODES>).map((mode) => (
                      <button
                        key={mode}
                        disabled={hasStarted.current}
                        onClick={() => {
                          setGameMode(mode);
                          setGameTime(MODES[mode].gameTime);
                          setShotClock(MODES[mode].shotClock);
                          setIsRunning(false);
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${gameMode === mode ? 'bg-bg-card shadow-sm text-accent' : 'text-text-secondary hover:text-text-primary'} ${hasStarted.current ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        {MODES[mode].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Group 2: System */}
              <div className="glass-card rounded-[2rem] overflow-hidden">
                {/* Wake Lock */}
                <div className="p-5 flex items-center justify-between border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <MonitorSmartphone className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-text-primary tracking-tight">{t.telaSempreLigada}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setWakeLockEnabled(!wakeLockEnabled)}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${wakeLockEnabled ? 'bg-green-500' : 'bg-border'}`}
                  >
                    <motion.div 
                      className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                      animate={{ x: wakeLockEnabled ? 24 : 0 }}
                    />
                  </button>
                </div>

                {/* Sounds Section Header */}
                <div className="p-5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2 mb-5">
                    <Volume2 className="w-3.5 h-3.5 text-accent" /> {t.sons}
                  </label>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => playBuzzer(true)}
                          className="w-10 h-10 bg-bg-secondary text-accent rounded-xl hover:bg-accent/10 transition-all active:scale-95 shadow-sm flex items-center justify-center"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-semibold text-text-primary tracking-tight">{t.somTempoJogo}</span>
                      </div>
                      <button
                        onClick={() => setGameEndSoundEnabled(!gameEndSoundEnabled)}
                        className={`w-12 h-6 rounded-full transition-all duration-300 relative ${gameEndSoundEnabled ? 'bg-green-500' : 'bg-border'}`}
                      >
                        <motion.div 
                          className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                          animate={{ x: gameEndSoundEnabled ? 24 : 0 }}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => playBuzzer(false)}
                          className="w-10 h-10 bg-bg-secondary text-accent rounded-xl hover:bg-accent/10 transition-all active:scale-95 shadow-sm flex items-center justify-center"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-semibold text-text-primary tracking-tight">{t.somTempoPosse}</span>
                      </div>
                      <button
                        onClick={() => setShotClockSoundEnabled(!shotClockSoundEnabled)}
                        className={`w-12 h-6 rounded-full transition-all duration-300 relative ${shotClockSoundEnabled ? 'bg-green-500' : 'bg-border'}`}
                      >
                        <motion.div 
                          className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                          animate={{ x: shotClockSoundEnabled ? 24 : 0 }}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 text-right pb-8 opacity-40">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">
                desenvolvido por superdz7
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            <p className="font-bold">Em breve...</p>
          </div>
        )}
      </main>

      {/* Time Editor Modal */}
      <AnimatePresence>
        {isEditingTime && (
          <TimeEditor 
            currentTime={gameTime} 
            onSave={(newTime: number) => {
              setGameTime(newTime);
              setIsEditingTime(false);
            }}
            onClose={() => setIsEditingTime(false)}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <ConfirmModal 
            title={t.reiniciar}
            message={t.confirmarReiniciar}
            onConfirm={resetGame}
            onCancel={() => setShowResetConfirm(false)}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Draft Modal */}
      <AnimatePresence>
        {showDraftModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-sm rounded-[2.5rem] p-8 flex flex-col max-h-[85vh] shadow-[0_32px_64px_rgba(0,0,0,0.3)]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-text-primary tracking-tight">{t.equipes}</h3>
                <button onClick={() => setShowDraftModal(false)} className="p-2 text-text-secondary hover:bg-bg-primary rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar">
                {drawnTeams.map((team, idx) => (
                  <div key={idx} className="bg-bg-secondary/50 rounded-3xl p-5 border border-white/5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <h4 className="text-accent font-bold text-[10px] uppercase tracking-[0.2em] leading-none">
                        {t.equipe} {String.fromCharCode(65 + idx)}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {team.map(player => (
                        <div key={player.id} className="text-sm font-semibold text-text-primary flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                          <span className="tracking-tight">{player.name}</span>
                          <span className="text-[11px] font-bold text-text-secondary bg-bg-card/50 px-2.5 py-1 rounded-lg border border-white/5 tabular-nums shadow-sm">#{player.number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 mt-8">
                <button 
                  onClick={shareTeams}
                  className="w-full h-14 bg-accent text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-accent/20 active:scale-95 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                  {t.compartilhar}
                </button>
                <button 
                  onClick={() => setShowDraftModal(false)}
                  className="w-full h-14 bg-bg-secondary text-text-primary rounded-2xl font-bold active:scale-95 transition-all text-sm"
                >
                  {t.fechar || 'Fechar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Fixed at bottom */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-bg-card rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] px-4 py-2 flex justify-between items-center z-50 transition-colors duration-300">
        <NavButton 
          active={activeTab === 'placar'} 
          onClick={() => setActiveTab('placar')}
          icon={<LayoutGrid className="w-5 h-5" />}
          label={t.placar}
        />
        <NavButton 
          active={activeTab === 'estatisticas'} 
          onClick={() => setActiveTab('estatisticas')}
          icon={<BarChart3 className="w-5 h-5" />}
          label={t.estatisticas}
        />
        <NavButton 
          active={activeTab === 'historico'} 
          onClick={() => setActiveTab('historico')}
          icon={<History className="w-5 h-5" />}
          label={t.historico}
        />
        <NavButton 
          active={activeTab === 'opcoes'} 
          onClick={() => setActiveTab('opcoes')}
          icon={<Settings className="w-5 h-5" />}
          label={t.opcoes}
        />
      </nav>
    </div>
  );
}

// --- Sub-components ---

function TimeEditor({ currentTime, onSave, onClose, t }: any) {
  const [mins, setMins] = useState(Math.floor(currentTime / 60));
  const [secs, setSecs] = useState(currentTime % 60);

  const adjustMins = (val: number) => setMins(prev => Math.max(0, Math.min(99, prev + val)));
  const adjustSecs = (val: number) => setSecs(prev => Math.max(0, Math.min(59, prev + val)));

  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="w-full max-w-xs glass-card rounded-[2.5rem] p-8 flex flex-col gap-8 shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-text-primary tracking-tight">{t.editarTempo}</h3>
          <button onClick={onClose} className="p-2 text-text-secondary hover:bg-bg-primary rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex justify-center items-center gap-6">
          {/* Minutes */}
          <div className="flex flex-col items-center gap-3">
            <button onClick={() => adjustMins(1)} className="p-4 bg-bg-secondary rounded-2xl text-accent active:scale-90 transition-transform"><Plus className="w-6 h-6 font-bold" /></button>
            <div className="text-5xl font-bold font-mono text-text-primary tracking-tighter text-digit">{mins.toString().padStart(2, '0')}</div>
            <button onClick={() => adjustMins(-1)} className="p-4 bg-bg-secondary rounded-2xl text-accent active:scale-90 transition-transform"><Minus className="w-6 h-6 font-bold" /></button>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t.minutos}</span>
          </div>

          <div className="text-4xl font-light text-text-secondary pb-12">:</div>

          {/* Seconds */}
          <div className="flex flex-col items-center gap-3">
            <button onClick={() => adjustSecs(1)} className="p-4 bg-bg-secondary rounded-2xl text-accent active:scale-90 transition-transform"><Plus className="w-6 h-6 font-bold" /></button>
            <div className="text-5xl font-bold font-mono text-text-primary tracking-tighter text-digit">{secs.toString().padStart(2, '0')}</div>
            <button onClick={() => adjustSecs(-1)} className="p-4 bg-bg-secondary rounded-2xl text-accent active:scale-90 transition-transform"><Minus className="w-6 h-6 font-bold" /></button>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t.segundos}</span>
          </div>
        </div>

        <button 
          className="w-full h-16 bg-accent text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-accent/20 active:scale-[0.98] transition-all"
          onClick={() => onSave(mins * 60 + secs)}
        >
          <Check className="w-6 h-6" />
          {t.salvarTempo}
        </button>
      </motion.div>
    </motion.div>
  );
}

function TeamCard({ label, name, onNameChange, score, onAdd1, onAdd2, onAdd3, t, gameMode }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);

  const handleSave = () => {
    onNameChange((tempName || name).toUpperCase());
    setIsEditing(false);
  };

  const isFibaNba = gameMode === 'fiba' || gameMode === 'nba';

  return (
    <div className="glass-card rounded-[2rem] p-5 flex flex-col items-center justify-between transition-all duration-300 min-h-[260px] sm:min-h-[300px] md:min-h-[340px] group relative overflow-hidden">
      <div className="absolute inset-0 bg-accent/3 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="text-center w-full relative">
        <span className="text-[10px] font-bold text-accent uppercase tracking-widest leading-none">{label}</span>
        {isEditing ? (
          <div className="flex gap-1 mt-2">
            <input 
              autoFocus
              className="w-full text-center bg-bg-primary rounded-xl text-sm font-bold text-text-primary py-2 px-3 outline-accent uppercase"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        ) : (
          <h2 
            className="text-lg font-bold text-text-primary leading-tight truncate w-full mt-1 text-center cursor-pointer hover:text-accent transition-colors uppercase tracking-tight"
            onClick={() => setIsEditing(true)}
          >
            {name}
          </h2>
        )}
      </div>

      <div className="flex items-baseline gap-1 relative">
        <span className="text-6xl font-bold text-text-primary font-display tracking-tighter text-digit">{score}</span>
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t.pts}</span>
      </div>

      <div className="flex flex-col gap-3 w-full relative">
        {isFibaNba ? (
          <>
            <motion.button 
              className="w-full h-9 rounded-xl bg-accent text-white font-bold text-sm flex items-center justify-center shadow-lg shadow-accent/20"
              whileTap={{ scale: 0.95 }}
              onClick={onAdd2}
            >
              +2
            </motion.button>
            <div className="flex gap-2">
              <motion.button 
                className="flex-1 h-10 rounded-xl bg-bg-secondary text-accent font-bold text-sm flex items-center justify-center border border-accent/10 active:bg-accent/10"
                whileTap={{ scale: 0.95 }}
                onClick={onAdd1}
              >
                +1
              </motion.button>
              <motion.button 
                className="flex-1 h-10 rounded-xl bg-bg-secondary text-accent font-bold text-sm flex items-center justify-center border border-accent/10 active:bg-accent/10"
                whileTap={{ scale: 0.95 }}
                onClick={onAdd3}
              >
                +3
              </motion.button>
            </div>
          </>
        ) : (
          <div className="flex gap-3 w-full">
            <motion.button 
              className="flex-1 h-14 rounded-2xl bg-bg-secondary text-accent font-bold text-lg flex items-center justify-center border border-accent/10 active:bg-accent/10"
              whileTap={{ scale: 0.95 }}
              onClick={onAdd1}
            >
              +1
            </motion.button>
            <motion.button 
              className="flex-1 h-14 rounded-2xl bg-accent text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-accent/20"
              whileTap={{ scale: 0.95 }}
              onClick={onAdd2}
            >
              +2
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}

function FoulCard({ label, fouls, onAddFoul, t, gameMode }: any) {
  const isFibaNba = gameMode === 'fiba' || gameMode === 'nba';
  const bonusThreshold = isFibaNba ? 5 : 7;
  const isBonus = fouls >= bonusThreshold;
  
  return (
    <motion.div 
      className={`rounded-3xl p-4 flex flex-col items-start gap-2 cursor-pointer transition-all duration-300 min-h-[82px] group overflow-hidden relative ${isBonus ? 'bg-accent shadow-lg shadow-accent/20 text-white border-transparent' : 'glass-card border border-white/10 hover:scale-[1.02]'}`}
      onClick={onAddFoul}
      whileTap={{ scale: 0.98 }}
    >
      {!isBonus && <div className="absolute inset-0 bg-accent/3 opacity-0 group-hover:opacity-100 transition-opacity" />}
      
      <div className="w-full flex justify-between items-start relative gap-2">
        <span className={`text-[11px] font-black uppercase tracking-tight leading-[1.1] whitespace-pre-line ${isBonus ? 'text-white' : 'text-text-primary'}`}>{label}</span>
        <span className="text-3xl font-black font-mono text-digit leading-none pt-1">{fouls.toString().padStart(2, '0')}</span>
      </div>
      <div className="flex gap-2 justify-start w-full relative mt-auto">
        {[...Array(bonusThreshold)].map((_, i) => (
          <div 
            key={i} 
            className={`w-2 h-2 rounded-full transition-all duration-300 ${i < fouls ? (isBonus ? 'bg-white scale-110 shadow-sm' : 'bg-accent scale-110 shadow-sm shadow-accent/20') : (isBonus ? 'bg-white/20' : 'bg-bg-secondary')}`} 
          />
        ))}
      </div>
    </motion.div>
  );
}

function ControlButton({ icon, label, onClick, disabled }: any) {
  return (
    <motion.button
      className={`flex flex-col items-center justify-center gap-2 h-20 rounded-[2rem] glass-card border border-white/10 transition-all duration-300 ${disabled ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/5'}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <div className="text-accent">{React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}</div>
      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{label}</span>
    </motion.button>
  );
}

function PlayerBadge({ player, isSelected, onClick }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-2xl text-[11px] font-bold transition-all flex items-center gap-3 border shadow-sm ${
        isSelected 
          ? 'bg-accent text-white border-accent shadow-accent/20' 
          : 'bg-bg-secondary text-text-primary border-transparent hover:border-accent/30'
      }`}
    >
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-bg-card shadow-sm text-accent'}`}>
        {player.number || '00'}
      </span>
      <span className="tracking-tight">{player.name}</span>
    </motion.button>
  );
}

function PlayerStatCard({ player, gameMode, t, updatePlayerStat, removePlayer }: any) {
  const totalPoints = (player.stats.pts2.made * (gameMode === '3x3' ? 1 : 2)) + 
                     (player.stats.pts3.made * (gameMode === '3x3' ? 2 : 3)) + 
                     player.stats.ft.made;
  
  return (
    <div className="glass-card rounded-[2.5rem] p-6 space-y-6 shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
      <div className="flex justify-between items-center border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-accent/20">
            {player.number || '00'}
          </div>
          <div>
            <h3 className="font-bold text-text-primary tracking-tight leading-none text-lg uppercase">{player.name}</h3>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-accent" /> Total: {totalPoints} {t.pts}
            </p>
          </div>
        </div>
        <button 
          onClick={() => removePlayer(player.id)} 
          className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-red-500 bg-bg-secondary rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {[
          { key: 'pts2' as const, label: gameMode === '3x3' ? '1 Ponto' : t.pts2 },
          { key: 'pts3' as const, label: gameMode === '3x3' ? '2 Pontos' : t.pts3 },
          { key: 'ft' as const, label: t.lanceLivre },
        ].map(cat => {
          const total = player.stats[cat.key].made + player.stats[cat.key].missed;
          const perc = total > 0 ? ((player.stats[cat.key].made / total) * 100).toFixed(1) : '0.0';
          return (
            <div key={cat.key} className="bg-bg-secondary/40 rounded-3xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-text-primary tracking-tight">{cat.label}</span>
                <span className="text-[10px] font-bold text-accent font-mono">{perc}%</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest px-1">{t.acertou}</span>
                  <div className="flex items-center justify-between bg-bg-secondary rounded-2xl p-1 shadow-inner">
                    <button 
                      onClick={() => updatePlayerStat(player.id, cat.key, 'made', -1)}
                      className="w-8 h-8 flex items-center justify-center text-text-secondary active:scale-90 transition-transform"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-sm tabular-nums">{player.stats[cat.key].made}</span>
                    <button 
                      onClick={() => updatePlayerStat(player.id, cat.key, 'made', 1)}
                      className="w-8 h-8 flex items-center justify-center text-accent active:scale-90 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest px-1">{t.errou}</span>
                  <div className="flex items-center justify-between bg-bg-secondary rounded-2xl p-1 shadow-inner">
                    <button 
                      onClick={() => updatePlayerStat(player.id, cat.key, 'missed', -1)}
                      className="w-8 h-8 flex items-center justify-center text-text-secondary active:scale-90 transition-transform"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-sm tabular-nums">{player.stats[cat.key].missed}</span>
                    <button 
                      onClick={() => updatePlayerStat(player.id, cat.key, 'missed', 1)}
                      className="w-8 h-8 flex items-center justify-center text-text-secondary active:scale-90 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      className="flex-1 flex flex-col items-center gap-1 group py-3 relative"
      onClick={onClick}
    >
      <div className={`p-2 rounded-2xl transition-all duration-300 relative z-10 ${active ? 'text-accent scale-110' : 'text-text-secondary group-hover:text-accent/70'}`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
      </div>
      <span className={`text-[10px] font-bold tracking-tight z-10 ${active ? 'text-text-primary' : 'text-text-secondary'}`}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="nav-glow"
          className="absolute inset-x-2 inset-y-1 bg-accent/10 rounded-[1.5rem] -z-0"
          initial={false}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel, t }: any) {
  return (
    <motion.div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="w-full max-w-xs glass-card rounded-[2.5rem] p-8 flex flex-col gap-8 shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold text-text-primary tracking-tight leading-tight">{title}</h3>
          <p className="text-sm font-medium text-text-secondary leading-relaxed">{message}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            className="w-full h-14 bg-accent text-white rounded-2xl font-bold text-lg shadow-xl shadow-accent/20 active:scale-95 transition-all"
            onClick={onConfirm}
          >
            {t.reiniciar}
          </button>
          <button 
            className="w-full h-14 bg-bg-secondary text-text-primary rounded-2xl font-bold text-lg active:scale-95 transition-all"
            onClick={onCancel}
          >
            {t.fechar || 'Cancelar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
