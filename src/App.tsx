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
    estatisticas: 'ESTATÍSTICAS',
    opcoes: 'OPÇÕES',
    casa: 'CASA',
    visitante: 'VISITANTE',
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
    estatisticas: 'STATS',
    opcoes: 'OPTIONS',
    casa: 'HOME',
    visitante: 'AWAY',
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
    estatisticas: 'ESTADÍSTICAS',
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
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans flex flex-col items-center px-4 py-2 sm:px-6 sm:py-3 pb-24 select-none transition-colors duration-300">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 border ${
              toast.type === 'error' ? 'bg-red-500 text-white border-red-400' : 'bg-[#FF6B35] text-white border-[#FF8B55]'
            }`}
          >
            {toast.type === 'error' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Compact */}
      <header className="w-full max-w-2xl flex items-center gap-2 mb-3 px-2">
        <div className="bg-[#FF6B35] p-1 rounded-full shadow-md">
          <Dribbble className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-xl font-black tracking-tighter text-[#FF6B35]">Basquete</h1>
        <div className="ml-auto text-[10px] font-bold text-text-secondary uppercase tracking-widest bg-bg-card px-2 py-1 rounded-full shadow-sm">
          {MODES[gameMode].label}
        </div>
      </header>

      {/* Main Scoreboard Area */}
      <main className="w-full max-w-2xl flex flex-col gap-3">
        {activeTab === 'placar' ? (
          <>
            {/* Timer & Shot Clock Row */}
            <div className="flex gap-3 h-28 sm:h-36 md:h-44 shrink-0">
              {/* Game Timer */}
              <motion.div 
                className={`flex-[3.5] bg-bg-card rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border-y-4 border-[#FF6B35] flex flex-col items-center justify-center relative overflow-hidden [container-type:inline-size] ${hasStarted.current ? 'cursor-default' : 'cursor-pointer'}`}
                whileTap={hasStarted.current ? {} : { scale: 0.98 }}
                onClick={() => {
                  if (hasStarted.current) {
                    setToast({ message: t.tempoNaoEditavel, type: 'error' });
                  } else {
                    setIsEditingTime(true);
                  }
                }}
              >
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest absolute top-2">{t.tempoJogo}</span>
                <div className="text-[26cqw] font-bold tracking-tighter text-text-primary mt-4 font-display leading-none">
                  {formatTime(gameTime)}
                </div>
              </motion.div>

              {/* Shot Clock */}
              <div className="flex-1 flex flex-col gap-2">
                <motion.div 
                  className="flex-1 bg-bg-card rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] flex flex-col items-center justify-center relative cursor-pointer"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShotClock(12)}
                >
                  <span className="text-[9px] font-bold text-[#FF6B35] uppercase tracking-widest absolute top-2">{t.posse}</span>
                  <div className={`text-4xl font-black text-[#FF6B35] mt-2 font-mono ${shotClock <= 3 && shotClock > 0 ? 'animate-pulse' : ''}`}>
                    {shotClock.toString().padStart(2, '0')}
                  </div>
                </motion.div>
                
                {(gameMode === 'fiba' || gameMode === 'nba') && (
                  <motion.button
                    className="h-10 bg-bg-card rounded-xl shadow-sm border border-border text-[#FF6B35] font-black text-xs flex items-center justify-center"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShotClock(24)}
                  >
                    24s
                  </motion.button>
                )}
              </div>
            </div>

            {/* Teams Row */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
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

            {/* Fouls Row - Separated */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <FoulCard 
                label={<>{t.faltas}<br/>{t.casa}</>}
                fouls={homeFouls}
                onAddFoul={() => updateFouls('home')}
                t={t}
                gameMode={gameMode}
              />
              <FoulCard 
                label={<>{t.faltas}<br/>{t.visitante}</>}
                fouls={visitorFouls}
                onAddFoul={() => updateFouls('visitor')}
                t={t}
                gameMode={gameMode}
              />
            </div>

            {/* Controls Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2 shrink-0">
              <ControlButton 
                icon={<Undo2 className="w-5 h-5" />} 
                label={t.desfazer} 
                onClick={handleUndo}
                disabled={history.length === 0}
              />
              
              <motion.button
                className={`col-span-1 h-14 rounded-xl flex items-center justify-center shadow-lg transition-colors ${isRunning ? 'bg-text-primary text-bg-card' : 'bg-[#FF6B35] text-white'}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
              </motion.button>

              <ControlButton 
                icon={<RotateCcw className="w-5 h-5" />} 
                label={t.reiniciar} 
                onClick={() => setShowResetConfirm(true)}
              />
            </div>
          </>
        ) : activeTab === 'estatisticas' ? (
          <div className="flex-1 flex flex-col gap-4 p-1 sm:p-2 overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-lg font-black text-text-primary">{t.estatisticas}</h2>
              <div className="flex gap-2">
                <motion.button 
                  onClick={handleDraft}
                  className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-widest bg-bg-card px-3 py-1.5 rounded-full border border-border shadow-sm active:scale-95 transition-transform flex items-center gap-1.5"
                >
                  <Users className="w-3 h-3" />
                  {t.sorteio}
                </motion.button>
                {drawnTeams.length > 0 && (
                  <motion.button 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setDrawnTeams([])}
                    className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-widest bg-bg-card px-3 py-1.5 rounded-full border border-border shadow-sm active:scale-95 transition-transform"
                  >
                    {t.limparSorteio}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Add Player Form */}
            <div className="bg-bg-card rounded-xl p-3 sm:p-4 shadow-sm space-y-3">
              <div className="flex gap-2 items-center">
                <input 
                  type="text"
                  placeholder={t.nomeJogador}
                  className="flex-1 min-w-0 bg-bg-primary rounded-xl px-3 sm:px-4 py-2 text-sm font-bold text-text-primary outline-[#FF6B35]"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                />
                <input 
                  type="text"
                  placeholder={t.numeroJogador}
                  className="w-12 sm:w-16 bg-bg-primary rounded-xl px-1 sm:px-2 py-2 text-sm font-bold text-center text-text-primary outline-[#FF6B35]"
                  value={newPlayerNumber}
                  onChange={(e) => setNewPlayerNumber(e.target.value)}
                />
                <motion.button
                  className="p-2 bg-[#FF6B35] text-white rounded-xl shadow-md shrink-0"
                  whileTap={{ scale: 0.95 }}
                  onClick={addPlayer}
                >
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
              </div>
            </div>

            {/* Players Selection Badges */}
            <div className="space-y-4 px-2">
              {drawnTeams.length > 0 ? (
                drawnTeams.map((team, teamIdx) => (
                  <div key={teamIdx} className="space-y-2">
                    <h3 className="text-[9px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]"></div>
                      {t.equipe} {String.fromCharCode(65 + teamIdx)}
                    </h3>
                    <div className="flex flex-wrap gap-2">
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
                <div className="flex flex-wrap gap-2">
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
            <div className="pb-4">
              {selectedPlayerId && players.find(p => p.id === selectedPlayerId) ? (
                <PlayerStatCard 
                  player={players.find(p => p.id === selectedPlayerId)} 
                  gameMode={gameMode} 
                  t={t} 
                  updatePlayerStat={updatePlayerStat} 
                  removePlayer={removePlayer} 
                />
              ) : players.length > 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-text-secondary text-xs font-bold bg-bg-card rounded-2xl border border-dashed border-border gap-2">
                  <Dribbble className="w-8 h-8 opacity-20 animate-bounce" />
                  Selecione um jogador acima
                </div>
              ) : null}
            </div>
          </div>
        ) : activeTab === 'historico' ? (
          <div className="flex-1 flex flex-col gap-3 min-h-0 mb-2">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-lg font-black text-text-primary">{t.historicoPartida}</h2>
              <motion.button
                className="p-2 bg-[#FF6B35] text-white rounded-xl shadow-md flex items-center gap-2 text-[10px] font-bold"
                whileTap={{ scale: 0.95 }}
                onClick={shareHistory}
              >
                <Share2 className="w-4 h-4" />
                {t.compartilhar}
              </motion.button>
            </div>
            <div className="flex-1 bg-bg-card rounded-2xl shadow-lg p-4 overflow-y-auto space-y-3 no-scrollbar">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-secondary gap-2">
                  <History className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-bold">{t.nenhumaAcao}</p>
                </div>
              ) : (
                history.map((action) => (
                  <div key={action.id} className="flex items-start gap-3 border-b border-border pb-2">
                    <div className="text-[10px] font-mono text-text-secondary pt-1">
                      {new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-text-primary">{action.description}</p>
                      <p className="text-[10px] text-text-secondary">{t.placar}: {action.state.homeScore} x {action.state.visitorScore}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === 'opcoes' ? (
          <div className="flex-1 flex flex-col gap-4 p-2 overflow-y-auto no-scrollbar">
            <h2 className="text-lg font-black text-text-primary px-2">{t.configuracoes}</h2>
            
            <div className="bg-bg-card rounded-xl p-4 shadow-sm space-y-6">
              {/* Language Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                  <Languages className="w-3 h-3 text-[#FF6B35]" /> {t.idioma}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pt', 'en', 'es'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${language === lang ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-bg-primary text-text-secondary'}`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                  <Palette className="w-3 h-3 text-[#FF6B35]" /> {t.tema}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${theme === 'light' ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-bg-primary text-text-secondary'}`}
                  >
                    {t.claro}
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${theme === 'dark' ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-bg-primary text-text-secondary'}`}
                  >
                    {t.escuro}
                  </button>
                </div>
              </div>

              {/* Game Mode Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                  <Trophy className="w-3 h-3 text-[#FF6B35]" /> {t.modoJogo}
                </label>
                <div className="grid grid-cols-3 gap-2">
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
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${gameMode === mode ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-bg-primary text-text-secondary'} ${hasStarted.current ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {MODES[mode].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wake Lock Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-border mt-4">
                <div className="flex items-center gap-2">
                  <MonitorSmartphone className="w-3 h-3 text-[#FF6B35]" />
                  <span className="text-xs font-bold text-text-primary">{t.telaSempreLigada}</span>
                </div>
                <button
                  onClick={() => setWakeLockEnabled(!wakeLockEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${wakeLockEnabled ? 'bg-[#FF6B35]' : 'bg-text-secondary'}`}
                >
                  <motion.div 
                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: wakeLockEnabled ? 24 : 0 }}
                  />
                </button>
              </div>

              {/* Sound Settings */}
              <div className="space-y-4 pt-4 border-t border-border">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                  <Volume2 className="w-3 h-3 text-[#FF6B35]" /> {t.sons}
                </label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-primary">{t.somTempoJogo}</span>
                      <button 
                        onClick={() => playBuzzer(true)}
                        className="p-1.5 bg-bg-primary text-[#FF6B35] rounded-lg hover:bg-[#FF6B35]/10 transition-colors"
                        title={t.testarSom}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => setGameEndSoundEnabled(!gameEndSoundEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${gameEndSoundEnabled ? 'bg-[#FF6B35]' : 'bg-text-secondary'}`}
                    >
                      <motion.div 
                        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        animate={{ x: gameEndSoundEnabled ? 24 : 0 }}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-primary">{t.somTempoPosse}</span>
                      <button 
                        onClick={() => playBuzzer(false)}
                        className="p-1.5 bg-bg-primary text-[#FF6B35] rounded-lg hover:bg-[#FF6B35]/10 transition-colors"
                        title={t.testarSom}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => setShotClockSoundEnabled(!shotClockSoundEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${shotClockSoundEnabled ? 'bg-[#FF6B35]' : 'bg-text-secondary'}`}
                    >
                      <motion.div 
                        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        animate={{ x: shotClockSoundEnabled ? 24 : 0 }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 text-right px-2">
              <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest opacity-50">
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-text-primary uppercase tracking-tighter">{t.equipes}</h3>
                <button onClick={() => setShowDraftModal(false)} className="p-2 text-text-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {drawnTeams.map((team, idx) => (
                  <div key={idx} className="bg-bg-primary rounded-2xl p-4 border border-border">
                    <h4 className="text-[#FF6B35] font-black text-[10px] mb-2 uppercase tracking-widest">
                      {t.equipe} {String.fromCharCode(65 + idx)}
                    </h4>
                    <div className="space-y-1">
                      {team.map(player => (
                        <div key={player.id} className="text-xs font-bold text-text-primary flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                          <span>{player.name}</span>
                          <span className="text-text-secondary bg-bg-card px-2 py-0.5 rounded-md text-[10px]">#{player.number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowDraftModal(false)}
                  className="flex-1 py-3 rounded-xl text-xs font-bold bg-bg-primary text-text-secondary"
                >
                  {t.fechar || 'Fechar'}
                </button>
                <button 
                  onClick={shareTeams}
                  className="flex-1 py-3 rounded-xl text-xs font-bold bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/20 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {t.compartilhar}
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
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="w-full max-w-xs bg-bg-card rounded-2xl p-6 shadow-2xl flex flex-col gap-6"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-black text-text-primary uppercase tracking-widest text-sm">{t.editarTempo}</h3>
          <button onClick={onClose} className="p-2 text-text-secondary"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex justify-center items-center gap-4">
          {/* Minutes */}
          <div className="flex flex-col items-center gap-2">
            <button onClick={() => adjustMins(1)} className="p-3 bg-bg-primary rounded-xl text-[#FF6B35]"><Plus className="w-6 h-6" /></button>
            <div className="text-4xl font-black font-mono w-16 text-center text-text-primary">{mins.toString().padStart(2, '0')}</div>
            <button onClick={() => adjustMins(-1)} className="p-3 bg-bg-primary rounded-xl text-[#FF6B35]"><Minus className="w-6 h-6" /></button>
            <span className="text-[8px] font-bold text-text-secondary uppercase">{t.minutos}</span>
          </div>

          <div className="text-4xl font-black text-text-secondary pb-8">:</div>

          {/* Seconds */}
          <div className="flex flex-col items-center gap-2">
            <button onClick={() => adjustSecs(1)} className="p-3 bg-bg-primary rounded-xl text-[#FF6B35]"><Plus className="w-6 h-6" /></button>
            <div className="text-4xl font-black font-mono w-16 text-center text-text-primary">{secs.toString().padStart(2, '0')}</div>
            <button onClick={() => adjustSecs(-1)} className="p-3 bg-bg-primary rounded-xl text-[#FF6B35]"><Minus className="w-6 h-6" /></button>
            <span className="text-[8px] font-bold text-text-secondary uppercase">{t.segundos}</span>
          </div>
        </div>

        <button 
          className="w-full h-14 bg-[#FF6B35] text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg"
          onClick={() => onSave(mins * 60 + secs)}
        >
          <Check className="w-5 h-5" />
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
    <div className="bg-bg-card rounded-xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.12)] flex flex-col items-center justify-between transition-colors duration-300 min-h-[180px] sm:min-h-[220px] md:min-h-[260px]">
      <div className="text-center w-full">
        <span className="text-[9px] font-bold text-[#FF6B35] uppercase tracking-widest">{label}</span>
        {isEditing ? (
          <div className="flex gap-1 mt-1">
            <input 
              autoFocus
              className="w-full text-center bg-bg-primary rounded-md text-sm font-black text-text-primary py-1 outline-[#FF6B35] uppercase"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        ) : (
          <h2 
            className="text-base font-black text-text-primary leading-tight truncate w-full text-center cursor-pointer hover:text-[#FF6B35] transition-colors uppercase"
            onClick={() => setIsEditing(true)}
          >
            {name}
          </h2>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-bold text-text-primary font-display">{score}</span>
        <span className="text-[9px] font-bold text-text-secondary">{t.pts}</span>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {isFibaNba ? (
          <>
            <motion.button 
              className="w-full h-10 rounded-lg bg-[#FF6B35] text-white font-black text-lg flex items-center justify-center shadow-lg"
              whileTap={{ scale: 0.95 }}
              onClick={onAdd2}
            >
              +2
            </motion.button>
            <div className="flex gap-2">
              <motion.button 
                className="flex-1 h-10 rounded-lg bg-[#FFF0EB] dark:bg-[#FF6B35]/10 text-[#FF6B35] font-black text-lg flex items-center justify-center shadow-sm"
                whileTap={{ scale: 0.95 }}
                onClick={onAdd1}
              >
                +1
              </motion.button>
              <motion.button 
                className="flex-1 h-10 rounded-lg bg-[#FFF0EB] dark:bg-[#FF6B35]/10 text-[#FF6B35] font-black text-lg flex items-center justify-center shadow-sm"
                whileTap={{ scale: 0.95 }}
                onClick={onAdd3}
              >
                +3
              </motion.button>
            </div>
          </>
        ) : (
          <div className="flex gap-2 w-full">
            <motion.button 
              className="flex-1 h-10 rounded-lg bg-[#FFF0EB] dark:bg-[#FF6B35]/10 text-[#FF6B35] font-black text-lg flex items-center justify-center shadow-sm"
              whileTap={{ scale: 0.95 }}
              onClick={onAdd1}
            >
              +1
            </motion.button>
            <motion.button 
              className="flex-1 h-10 rounded-lg bg-[#FF6B35] text-white font-black text-lg flex items-center justify-center shadow-lg"
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
    <div 
      className={`rounded-xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.12)] flex flex-col items-start gap-1 cursor-pointer transition-colors duration-300 ${isBonus ? 'bg-[#FF6B35]' : 'bg-bg-card'}`}
      onClick={onAddFoul}
    >
      <div className="w-full flex justify-between items-center min-h-[1.5rem]">
        <span className={`text-[8px] font-bold uppercase tracking-widest leading-tight text-left ${isBonus ? 'text-white/80' : 'text-text-secondary'}`}>{label}</span>
        <span className={`text-lg font-black font-mono ${isBonus ? 'text-white' : 'text-text-primary'}`}>{fouls.toString().padStart(2, '0')}</span>
      </div>
      <div className="flex gap-1.5 justify-start w-full">
        {[...Array(bonusThreshold)].map((_, i) => (
          <div 
            key={i} 
            className={`w-2 h-2 rounded-full transition-colors ${i < fouls ? (isBonus ? 'bg-white' : 'bg-[#FF6B35]') : (isBonus ? 'bg-white/20' : 'bg-border')}`} 
          />
        ))}
      </div>
    </div>
  );
}

function ControlButton({ icon, label, onClick, disabled }: any) {
  return (
    <motion.button
      className={`flex flex-col items-center justify-center gap-1 h-14 rounded-xl bg-bg-card shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-border transition-colors duration-300 ${disabled ? 'opacity-50 grayscale' : ''}`}
      whileHover={disabled ? {} : { scale: 1.05, backgroundColor: 'var(--color-bg-primary)' }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="text-text-secondary">{icon}</div>
      <span className="text-[7px] font-bold text-text-secondary uppercase tracking-widest">{label}</span>
    </motion.button>
  );
}

function PlayerBadge({ player, isSelected, onClick }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 border shadow-sm ${
        isSelected 
          ? 'bg-[#FF6B35] text-white border-[#FF6B35] ring-2 ring-[#FF6B35]/20' 
          : 'bg-bg-card text-text-primary border-border hover:border-[#FF6B35]/50'
      }`}
    >
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] ${isSelected ? 'bg-white text-[#FF6B35]' : 'bg-bg-primary text-text-secondary'}`}>
        {player.number || '00'}
      </span>
      <span className="truncate max-w-[80px]">{player.name}</span>
    </motion.button>
  );
}

function PlayerStatCard({ player, gameMode, t, updatePlayerStat, removePlayer }: any) {
  const totalPoints = (player.stats.pts2.made * (gameMode === '3x3' ? 1 : 2)) + 
                     (player.stats.pts3.made * (gameMode === '3x3' ? 2 : 3)) + 
                     player.stats.ft.made;
  
  return (
    <div className="bg-bg-card rounded-xl p-4 shadow-xl space-y-4 border border-border/30">
      <div className="flex justify-between items-center border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FF6B35] rounded-full flex items-center justify-center text-white font-black text-xs">
            {player.number || '00'}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-text-primary leading-none">{player.name}</span>
            <span className="text-[9px] font-bold text-[#FF6B35] uppercase tracking-widest mt-1">Total: {totalPoints} {t.pts}</span>
          </div>
        </div>
        <button onClick={() => removePlayer(player.id)} className="text-text-secondary hover:text-red-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-[9px] sm:text-[10px] text-left min-w-[280px]">
          <thead>
            <tr className="text-text-secondary uppercase tracking-widest border-b border-border">
              <th className="pb-2 font-black">{t.categoria}</th>
              <th className="pb-2 text-center font-black">{t.acertou}</th>
              <th className="pb-2 text-center font-black">{t.errou}</th>
              <th className="pb-2 text-right font-black">{t.aproveitamento}</th>
            </tr>
          </thead>
          <tbody className="text-text-primary font-bold">
            {[
              { key: 'pts2' as const, label: gameMode === '3x3' ? '1 Ponto' : t.pts2 },
              { key: 'pts3' as const, label: gameMode === '3x3' ? '2 Pontos' : t.pts3 },
              { key: 'ft' as const, label: t.lanceLivre },
            ].map(cat => {
              const total = player.stats[cat.key].made + player.stats[cat.key].missed;
              const perc = total > 0 ? ((player.stats[cat.key].made / total) * 100).toFixed(1) : '0.0';
              return (
                <tr key={cat.key} className="border-b border-border/50">
                  <td className="py-2 sm:py-3">{cat.label}</td>
                  <td className="py-2 sm:py-3">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <button 
                        onClick={() => updatePlayerStat(player.id, cat.key, 'made', -1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-bg-primary rounded-md text-text-secondary active:scale-90 transition-transform"
                      >
                        <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <span className="min-w-[14px] sm:min-w-[16px] text-center text-xs">{player.stats[cat.key].made}</span>
                      <button 
                        onClick={() => updatePlayerStat(player.id, cat.key, 'made', 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#FF6B35] text-white rounded-md active:scale-90 transition-transform shadow-sm"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="py-2 sm:py-3">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <button 
                        onClick={() => updatePlayerStat(player.id, cat.key, 'missed', -1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-bg-primary rounded-md text-text-secondary active:scale-90 transition-transform"
                      >
                        <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <span className="min-w-[14px] sm:min-w-[16px] text-center text-xs">{player.stats[cat.key].missed}</span>
                      <button 
                        onClick={() => updatePlayerStat(player.id, cat.key, 'missed', 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-text-secondary text-white rounded-md active:scale-90 transition-transform shadow-sm"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 text-right font-mono text-[#FF6B35] text-[10px] sm:text-xs">{perc}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      className="flex-1 flex flex-col items-center gap-0.5 group"
      onClick={onClick}
    >
      <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-[#FFF0EB] dark:bg-[#FF6B35]/20 text-[#FF6B35]' : 'text-text-secondary group-hover:text-[#FF6B35]'}`}>
        {icon}
      </div>
      <span className={`text-[8px] font-black tracking-widest ${active ? 'text-[#FF6B35]' : 'text-text-secondary'}`}>
        {label}
      </span>
    </button>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel, t }: any) {
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="w-full max-w-xs bg-bg-card rounded-2xl p-6 shadow-2xl flex flex-col gap-6"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="text-center space-y-2">
          <h3 className="font-black text-text-primary uppercase tracking-widest text-sm">{title}</h3>
          <p className="text-xs font-bold text-text-secondary">{message}</p>
        </div>

        <div className="flex gap-3">
          <button 
            className="flex-1 h-12 bg-bg-primary text-text-secondary rounded-xl font-black text-xs uppercase"
            onClick={onCancel}
          >
            {t.desfazer /* Using Undo label as Cancel if no better one exists, but let's just use a generic one or check translations */}
            {/* Actually, let's just use "Voltar" or similar, but I'll check translations for a better one */}
          </button>
          <button 
            className="flex-1 h-12 bg-[#FF6B35] text-white rounded-xl font-black text-xs uppercase shadow-lg"
            onClick={onConfirm}
          >
            {t.reiniciar}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
