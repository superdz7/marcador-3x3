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
  MessageCircle,
  Copy,
  Send,
  Languages,
  Palette,
  MonitorSmartphone,
  Users,
  Menu,
  Calendar,
  User as UserIcon,
  Shield,
  Medal,
  List
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
  type: 'action' | 'separator';
}

interface Player {
  id: string;
  name: string;
  number: string;
  stats: {
    ft: { made: number; missed: number };
    pts2: { made: number; missed: number };
    pts3: { made: number; missed: number };
    assists: number;
    rebounds: number;
    steals: number;
    blocks: number;
  };
}

interface TournamentTeam {
  id: string;
  name: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  points: number; // Classification points
  group: 'A' | 'B' | null;
}

interface TournamentMatch {
  id: string;
  homeTeamId: string | null;
  visitorTeamId: string | null;
  homeScore: number;
  visitorScore: number;
  status: 'pending' | 'finished';
  round: 'group' | 'semis' | 'final' | 'third';
  matchNumber: number;
}

interface TournamentSettings {
  name: string;
  organizer: string;
  date: string;
}

// --- Constants ---

const MODES = {
  '3x3': { gameTime: 600, shotClock: 12, label: '3x3' },
  'fiba': { gameTime: 600, shotClock: 24, label: 'FIBA' },
  'nba': { gameTime: 720, shotClock: 24, label: 'NBA' },
};

const TRANSLATIONS: any = {
  pt: {
    placar: 'Placar',
    historico: 'Histórico',
    estatisticas: 'Estatísticas',
    opcoes: 'Opções',
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
    confirmarReiniciarCampeonato: 'Deseja reiniciar o campeonato? Todos os times e jogos serão apagados.',
    iniciar: 'Iniciar',
    pausar: 'Pausar',
    inicioPartida: 'Início da Partida',
    fimJogo: 'Fim de Jogo',
    faltaCasa: 'Falta da equipe da Casa',
    faltaVisitante: 'Falta da equipe Visitante',
    copiado: 'Histórico copiado para a área de transferência!',
    compartilharVia: 'Compartilhar via:',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    copiar: 'Copiar Texto',
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
    asst: 'Assistências',
    reb: 'Rebotes',
    stl: 'Roubos',
    blk: 'Tocos',
    sorteio: 'SORTEIO',
    equipes: 'Equipes',
    compartilharEquipes: 'Compartilhar Equipes',
    equipe: 'Equipe',
    jogadoresInsuficientes: 'Jogadores insuficientes!',
    fechar: 'Fechar',
    limparSorteio: 'Limpar Sorteio',
    tempoNaoEditavel: 'O tempo só pode ser alterado antes do início do jogo.',
    campeonato: 'Campeonato',
    nomeCampeonato: 'Nome do Campeonato',
    organizador: 'Organizador',
    data: 'Data',
    times: 'Times',
    adicionarTime: 'Adicionar Time',
    classificacao: 'Classificação',
    jogos: 'Jogos',
    pontos: 'PTS',
    vitorias: 'V',
    derrotas: 'D',
    saldo: 'Saldo',
    sortear: 'Sortear',
    iniciarJogoNoPlacar: 'Iniciar no Placar',
    p: 'P',
    pj: 'PJ',
    quartas: 'Quartas de Final',
    semifinais: 'Semifinais',
    final: 'Final',
    terceiroLugar: '3º Lugar',
    vencedor: 'Vencedor',
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
    confirmarReiniciarCampeonato: 'Restart tournament? All teams and matches will be deleted.',
    iniciar: 'Start',
    pausar: 'Pause',
    inicioPartida: 'Game Started',
    fimJogo: 'Game Over',
    faltaCasa: 'Home Team Foul',
    faltaVisitante: 'Away Team Foul',
    copiado: 'History copied to clipboard!',
    compartilharVia: 'Share via:',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    copiar: 'Copy Text',
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
    asst: 'Assists',
    reb: 'Rebounds',
    stl: 'Steals',
    blk: 'Blocks',
    sorteio: 'DRAFT',
    equipes: 'Teams',
    compartilharEquipes: 'Share Teams',
    equipe: 'Team',
    jogadoresInsuficientes: 'Insufficient players!',
    fechar: 'Close',
    limparSorteio: 'Clear Draft',
    tempoNaoEditavel: 'Time can only be changed before the game starts.',
    campeonato: 'Tournament',
    nomeCampeonato: 'Tournament Name',
    organizador: 'Organizer',
    data: 'Date',
    times: 'Teams',
    adicionarTime: 'Add Team',
    classificacao: 'Standings',
    jogos: 'Matches',
    pontos: 'PTS',
    vitorias: 'W',
    derrotas: 'L',
    saldo: 'Diff',
    sortear: 'Draw',
    iniciarJogoNoPlacar: 'Start on Scoreboard',
    p: 'P',
    pj: 'GP',
    quartas: 'Quarter-finals',
    semifinais: 'Semi-finals',
    final: 'Final',
    terceiroLugar: '3rd Place',
    vencedor: 'Winner',
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
    confirmarReiniciarCampeonato: '¿Reiniciar campeonato? Se borrarán todos los equipos y juegos.',
    iniciar: 'Iniciar',
    pausar: 'Pausar',
    inicioPartida: 'Inicio del Partido',
    fimJogo: 'Fin del Juego',
    faltaCasa: 'Falta del equipo Local',
    faltaVisitante: 'Falta del equipo Visitante',
    copiado: '¡Historial copiado al portapapeles!',
    compartilharVia: 'Compartir vía:',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    copiar: 'Copiar Texto',
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
    asst: 'Asistencias',
    reb: 'Rebotes',
    stl: 'Robos',
    blk: 'Tapones',
    sorteio: 'SORTEO',
    equipes: 'Equipos',
    compartilharEquipes: 'Compartir Equipos',
    equipe: 'Equipo',
    jogadoresInsuficientes: '¡Jugadores insuficientes!',
    fechar: 'Cerrar',
    limparSorteio: 'Limpiar Sorteo',
    tempoNaoEditavel: 'El tiempo solo se puede cambiar antes de que comience el juego.',
    campeonato: 'CAMPEONATO',
    nomeCampeonato: 'Nombre del Campeonato',
    organizador: 'Organizador',
    data: 'Fecha',
    times: 'Equipos',
    adicionarTime: 'Añadir Equipo',
    classificacao: 'Clasificación',
    jogos: 'Partidos',
    pontos: 'PTS',
    vitorias: 'V',
    derrotas: 'D',
    saldo: 'Dif',
    sortear: 'Sortear',
    iniciarJogoNoPlacar: 'Iniciar en Marcador',
    p: 'P',
    pj: 'PJ',
    quartas: 'Cuartos de Final',
    semifinais: 'Semifinales',
    final: 'Final',
    terceiroLugar: '3º Lugar',
    vencedor: 'Ganador',
  }
};

const MAX_SCORE = 21;

// --- Components ---

const Digit = ({ value }: { value: string | number }) => (
  <span className="inline-block min-w-[0.6em] text-center font-display font-bold">
    {value}
  </span>
);

export default function App() {
  // --- State ---
  const [language, setLanguage] = useState<'pt' | 'en' | 'es'>(() => (localStorage.getItem('bt_language') as any) || 'pt');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [gameMode, setGameMode] = useState<keyof typeof MODES>(() => (localStorage.getItem('bt_gameMode') as any) || '3x3');
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const [gameEndSoundEnabled, setGameEndSoundEnabled] = useState(true);
  const [shotClockSoundEnabled, setShotClockSoundEnabled] = useState(true);
  
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('bt_players');
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [homeScore, setHomeScore] = useState(() => {
    const s = localStorage.getItem('bt_homeScore');
    return s !== null ? Number(s) : 0;
  });
  const [visitorScore, setVisitorScore] = useState(() => {
    const s = localStorage.getItem('bt_visitorScore');
    return s !== null ? Number(s) : 0;
  });
  const [homeFouls, setHomeFouls] = useState(() => {
    const s = localStorage.getItem('bt_homeFouls');
    return s !== null ? Number(s) : 0;
  });
  const [visitorFouls, setVisitorFouls] = useState(() => {
    const s = localStorage.getItem('bt_visitorFouls');
    return s !== null ? Number(s) : 0;
  });
  const [gameTime, setGameTime] = useState(() => {
    const s = localStorage.getItem('bt_gameTime');
    return s !== null ? Number(s) : MODES[gameMode].gameTime;
  });
  const [shotClock, setShotClock] = useState(() => {
    const s = localStorage.getItem('bt_shotClock');
    return s !== null ? Number(s) : MODES[gameMode].shotClock;
  });
  const [homeName, setHomeName] = useState(() => localStorage.getItem('bt_homeName') || 'BE CITY');
  const [visitorName, setVisitorName] = useState(() => localStorage.getItem('bt_visitorName') || 'BULLS');
  
  const [isRunning, setIsRunning] = useState(false);
  const [showTournamentResetConfirm, setShowTournamentResetConfirm] = useState(false);
  
  // Tournament State
  const [tournamentTeams, setTournamentTeams] = useState<TournamentTeam[]>(() => {
    const saved = localStorage.getItem('bt_tournamentTeams');
    return saved ? JSON.parse(saved) : [];
  });
  const [tournamentMatches, setTournamentMatches] = useState<TournamentMatch[]>(() => {
    const saved = localStorage.getItem('bt_tournamentMatches');
    return saved ? JSON.parse(saved) : [];
  });
  const [tournamentSettings, setTournamentSettings] = useState<TournamentSettings>(() => {
    const saved = localStorage.getItem('bt_tournamentSettings');
    return saved ? JSON.parse(saved) : { name: '', organizer: '', date: '' };
  });

  const [activeTab, setActiveTab] = useState<'placar' | 'estatisticas' | 'historico' | 'opcoes' | 'campeonato'>(() => {
    return (localStorage.getItem('bt_activeTab') as any) || 'placar';
  });
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [drawnTeams, setDrawnTeams] = useState<Player[][]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasStarted = useRef(localStorage.getItem('bt_hasStarted') === 'true');
  const buzzerPlayedRef = useRef(false);
  const [shotClockBuzzerPlayed, setShotClockBuzzerPlayed] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<any>(null);
  const lastTickRef = useRef<number>(0);

  // Persistence triggers
  useEffect(() => {
    try {
      localStorage.setItem('bt_players', JSON.stringify(players));
      localStorage.setItem('bt_history', JSON.stringify(history));
      localStorage.setItem('bt_homeScore', homeScore.toString());
      localStorage.setItem('bt_visitorScore', visitorScore.toString());
      localStorage.setItem('bt_homeFouls', homeFouls.toString());
      localStorage.setItem('bt_visitorFouls', visitorFouls.toString());
      localStorage.setItem('bt_gameTime', gameTime.toString());
      localStorage.setItem('bt_shotClock', shotClock.toString());
      localStorage.setItem('bt_homeName', homeName);
      localStorage.setItem('bt_visitorName', visitorName);
      localStorage.setItem('bt_hasStarted', hasStarted.current.toString());
      localStorage.setItem('bt_language', language);
      localStorage.setItem('bt_gameMode', gameMode);
      localStorage.setItem('bt_activeTab', activeTab);
      localStorage.setItem('bt_tournamentTeams', JSON.stringify(tournamentTeams));
      localStorage.setItem('bt_tournamentMatches', JSON.stringify(tournamentMatches));
      localStorage.setItem('bt_tournamentSettings', JSON.stringify(tournamentSettings));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }, [players, history, homeScore, visitorScore, homeFouls, visitorFouls, gameTime, shotClock, homeName, visitorName, language, gameMode, activeTab, tournamentTeams, tournamentMatches, tournamentSettings]);

  const t = TRANSLATIONS[language];

  // --- Helpers ---

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveToHistory = useCallback((description: string) => {
    // Truncate description for safety
    const safeDescription = description.substring(0, 100);
    const newAction: HistoryAction = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type: 'action',
      state: {
        gameTime,
        shotClock,
        homeScore,
        visitorScore,
        homeFouls,
        visitorFouls,
      },
      description: safeDescription,
    };
    setHistory(prev => [newAction, ...prev].slice(0, 1000));
  }, [gameTime, shotClock, homeScore, visitorScore, homeFouls, visitorFouls]);

  const shareHistory = () => {
    const text = history.map(h => `[${new Date(h.timestamp).toLocaleTimeString()}] ${h.description}`).join('\n');
    const finalScore = `${t.placar} FINAL: ${t.casa} ${homeScore} x ${visitorScore} ${t.visitante}`;
    const fullText = `${t.historicoPartida} ${MODES[gameMode].label}\n\n${text}\n\n${finalScore}`;
    
    handleShare(fullText, `${t.historicoPartida} ${MODES[gameMode].label}`);
  };

  const handleShare = (text: string, title: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setToast({ message: t.copiado, type: 'success' });
    }).catch(() => {
      // Fallback if clipboard fails
      if (navigator.share) {
        navigator.share({ title, text }).catch(() => {
          setToast({ message: 'Erro ao compartilhar', type: 'error' });
        });
      } else {
        setToast({ message: 'Erro ao copiar', type: 'error' });
      }
    });
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
    // Add separator to history if there's already some history
    if (history.length > 0) {
        const separatorAction: HistoryAction = {
            id: `sep-${Date.now()}`,
            timestamp: Date.now(),
            type: 'separator',
            state: { gameTime, shotClock, homeScore, visitorScore, homeFouls, visitorFouls },
            description: `--- ${homeName} ${homeScore} x ${visitorScore} ${visitorName} ---`
        };
        setHistory(prev => [separatorAction, ...prev].slice(0, 1000));
    }

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
    // Reset player stats instead of clearing the list
    setPlayers(prev => prev.map(p => ({
      ...p,
      stats: {
        pts2: { made: 0, missed: 0 },
        pts3: { made: 0, missed: 0 },
        ft: { made: 0, missed: 0 },
        assists: 0,
        rebounds: 0,
        steals: 0,
        blocks: 0,
      }
    })));
    hasStarted.current = false;
    setShowResetConfirm(false);
    localStorage.clear(); // Reset persistence on new game
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

  const addTournamentTeam = (name: string) => {
    if (tournamentTeams.length >= 8) {
      setToast({ message: language === 'pt' ? 'Máximo de 8 times atingido' : 'Max 8 teams reached', type: 'error' });
      return;
    }
    if (!name.trim()) return;
    
    const newTeam: TournamentTeam = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.toUpperCase(),
      played: 0,
      won: 0,
      draw: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      points: 0,
      group: null
    };
    setTournamentTeams(prev => [...prev, newTeam]);
  };

  const removeTournamentTeam = (id: string) => {
    setTournamentTeams(prev => prev.filter(t => t.id !== id));
    setTournamentMatches(prev => prev.filter(m => m.homeTeamId !== id && m.visitorTeamId !== id));
  };

  const drawTournamentMatches = () => {
    if (tournamentTeams.length < 8) {
        setToast({ message: language === 'pt' ? 'É necessário adicionar 8 times' : 'Need 8 teams to start', type: 'error' });
        return;
    }
    
    const shuffledTeams = [...tournamentTeams].sort(() => Math.random() - 0.5);
    const groupA = shuffledTeams.slice(0, 4);
    const groupB = shuffledTeams.slice(4, 8);

    setTournamentTeams(prev => prev.map(t => {
        if (groupA.find(ga => ga.id === t.id)) return { ...t, group: 'A' };
        if (groupB.find(gb => gb.id === t.id)) return { ...t, group: 'B' };
        return t;
    }));

    const matches: TournamentMatch[] = [];
    
    // Group A Matches
    for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
            matches.push({
                id: `GA-${i}${j}`,
                homeTeamId: groupA[i].id,
                visitorTeamId: groupA[j].id,
                homeScore: 0,
                visitorScore: 0,
                status: 'pending',
                round: 'group',
                matchNumber: matches.length + 1
            });
        }
    }

    // Group B Matches
    for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
            matches.push({
                id: `GB-${i}${j}`,
                homeTeamId: groupB[i].id,
                visitorTeamId: groupB[j].id,
                homeScore: 0,
                visitorScore: 0,
                status: 'pending',
                round: 'group',
                matchNumber: matches.length + 1
            });
        }
    }
    
    // Semis (placeholders)
    matches.push({ id: 'S1', homeTeamId: null, visitorTeamId: null, homeScore: 0, visitorScore: 0, status: 'pending', round: 'semis', matchNumber: 1 });
    matches.push({ id: 'S2', homeTeamId: null, visitorTeamId: null, homeScore: 0, visitorScore: 0, status: 'pending', round: 'semis', matchNumber: 2 });
    
    // Final (placeholder)
    matches.push({ id: 'F1', homeTeamId: null, visitorTeamId: null, homeScore: 0, visitorScore: 0, status: 'pending', round: 'final', matchNumber: 1 });
    
    // 3rd Place (placeholder)
    matches.push({ id: 'T1', homeTeamId: null, visitorTeamId: null, homeScore: 0, visitorScore: 0, status: 'pending', round: 'third', matchNumber: 1 });

    setTournamentMatches(matches);
  };

  const updateMatchResult = (matchId: string, homeScore: number, visitorScore: number) => {
    let updatedMatches = tournamentMatches.map(m => {
        if (m.id === matchId) {
            return { ...m, homeScore, visitorScore, status: 'finished' };
        }
        return m;
    });

    const finishedMatch = updatedMatches.find(m => m.id === matchId)!;

    // Logic for Group Advancement
    if (finishedMatch.round === 'group') {
        const groupAMatches = updatedMatches.filter(m => m.id.startsWith('GA-'));
        const groupBMatches = updatedMatches.filter(m => m.id.startsWith('GB-'));
        
        const allGroupADone = groupAMatches.every(m => m.status === 'finished');
        const allGroupBDone = groupBMatches.every(m => m.status === 'finished');

        if (allGroupADone || allGroupBDone) {
            // Recalculate standings for groups to fill Semi-Finals
            const teamsA = calculateGroupStandings('A', updatedMatches);
            const teamsB = calculateGroupStandings('B', updatedMatches);

            if (allGroupADone && allGroupBDone) {
                updatedMatches = updatedMatches.map(m => {
                    if (m.id === 'S1') return { ...m, homeTeamId: teamsA[0].id, visitorTeamId: teamsB[1].id };
                    if (m.id === 'S2') return { ...m, homeTeamId: teamsB[0].id, visitorTeamId: teamsA[1].id };
                    return m;
                });
            }
        }
    } else if (finishedMatch.round === 'semis') {
        const winnerId = finishedMatch.homeScore > finishedMatch.visitorScore ? finishedMatch.homeTeamId : finishedMatch.visitorTeamId;
        const loserId = finishedMatch.homeScore > finishedMatch.visitorScore ? finishedMatch.visitorTeamId : finishedMatch.homeTeamId;

        const finalMatch = updatedMatches.find(m => m.id === 'F1')!;
        const thirdMatch = updatedMatches.find(m => m.id === 'T1')!;
        
        if (finishedMatch.matchNumber === 1) {
            finalMatch.homeTeamId = winnerId;
            thirdMatch.homeTeamId = loserId;
        } else {
            finalMatch.visitorTeamId = winnerId;
            thirdMatch.visitorTeamId = loserId;
        }
    }

    setTournamentMatches([...updatedMatches]);
  };

  const calculateGroupStandings = (group: 'A' | 'B', matches: TournamentMatch[]) => {
    const groupTeams = tournamentTeams.filter(t => t.group === group);
    const stats = groupTeams.map(team => {
        const s = { ...team, played: 0, won: 0, draw: 0, lost: 0, pointsFor: 0, pointsAgainst: 0, points: 0 };
        matches.filter(m => m.round === 'group' && m.status === 'finished' && (m.homeTeamId === team.id || m.visitorTeamId === team.id)).forEach(m => {
            s.played++;
            const isHome = m.homeTeamId === team.id;
            const teamScore = isHome ? m.homeScore : m.visitorScore;
            const oppScore = isHome ? m.visitorScore : m.homeScore;
            
            s.pointsFor += teamScore;
            s.pointsAgainst += oppScore;
            
            if (teamScore > oppScore) {
                s.won++;
                s.points += 2;
            } else if (teamScore === oppScore) {
                s.draw++;
                s.points += 1;
            } else {
                s.lost++;
            }
        });
        return s;
    });

    return stats.sort((a, b) => b.points - a.points || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst));
  };

  const resetTournament = () => {
    setTournamentTeams([]);
    setTournamentMatches([]);
    setTournamentSettings({ name: '', organizer: '', date: '' });
    setShowTournamentResetConfirm(false);
    setToast({ message: language === 'pt' ? 'Campeonato reiniciado' : 'Tournament reset', type: 'info' });
  };

  const transferToScoreboard = (match: TournamentMatch) => {
    if (!match.homeTeamId || !match.visitorTeamId) {
        setToast({ message: language === 'pt' ? 'Os times ainda não foram definidos para este jogo' : 'Teams are not yet defined for this match', type: 'error' });
        return;
    }
    const home = tournamentTeams.find(t => t.id === match.homeTeamId);
    const visitor = tournamentTeams.find(t => t.id === match.visitorTeamId);
    
    if (home && visitor) {
        // Add separator to history
        const separatorAction: HistoryAction = {
            id: `sep-${Date.now()}`,
            timestamp: Date.now(),
            type: 'separator',
            state: { gameTime, shotClock, homeScore, visitorScore, homeFouls, visitorFouls },
            description: `--- ${home.name} x ${visitor.name} ---`
        };
        setHistory(prev => [separatorAction, ...prev].slice(0, 1000));

        setHomeName(home.name);
        setVisitorName(visitor.name);
        setHomeScore(match.homeScore);
        setVisitorScore(match.visitorScore);
        setHomeFouls(0);
        setVisitorFouls(0);
        setGameTime(MODES[gameMode].gameTime);
        setShotClock(MODES[gameMode].shotClock);
        setIsRunning(false);
        setActiveTab('placar');
        setToast({ 
            message: language === 'pt' ? `Jogo carregado: ${home.name} x ${visitor.name}` : `Game loaded: ${home.name} x ${visitor.name}`, 
            type: 'success' 
        });
    }
  };

  const shareTeams = () => {
    const text = drawnTeams.map((team, idx) => {
      const teamLetter = String.fromCharCode(65 + idx);
      return `${t.equipe} ${teamLetter}:\n${team.map(p => `- ${p.name} (#${p.number})`).join('\n')}`;
    }).join('\n\n');

    handleShare(text, t.equipes);
  };

  const getTournamentStandings = () => {
    return tournamentTeams;
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
    setShotClock(gameMode === '3x3' ? 12 : 24);
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

  const updatePlayerStat = (playerId: string, category: keyof Player['stats'], typeOrValue: 'made' | 'missed' | number, amount?: number) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const stats = { ...p.stats };
        if (typeof stats[category] === 'object' && typeof typeOrValue === 'string' && amount !== undefined) {
          // It's a made/missed stat
          const cat = category as 'ft' | 'pts2' | 'pts3';
          stats[cat] = {
            ...stats[cat],
            [typeOrValue]: Math.max(0, stats[cat][typeOrValue] + amount)
          };
        } else if (typeof stats[category] === 'number' && typeof typeOrValue === 'number') {
          // It's a flat counter
          const cat = category as 'assists' | 'rebounds' | 'steals' | 'blocks';
          stats[cat] = Math.max(0, stats[cat] + typeOrValue);
        }
        return { ...p, stats };
      }
      return p;
    }));
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    
    let name = '';
    let number = '';
    
    if (newPlayerName.includes(',')) {
      const parts = newPlayerName.split(',').map(p => p.trim());
      // Identify which part is the number
      if (!isNaN(Number(parts[0])) && parts[0] !== '') {
        number = parts[0];
        name = parts[1] || '';
      } else if (!isNaN(Number(parts[1])) && parts[1] !== '') {
        number = parts[1];
        name = parts[0];
      } else {
        name = parts[0];
        number = parts[1] || '';
      }
    } else {
      name = newPlayerName;
    }

    if (!name.trim()) return;

    const player: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.substring(0, 20).toUpperCase(),
      number: number.substring(0, 3),
      stats: {
        pts2: { made: 0, missed: 0 },
        pts3: { made: 0, missed: 0 },
        ft: { made: 0, missed: 0 },
        assists: 0,
        rebounds: 0,
        steals: 0,
        blocks: 0,
      }
    };
    setPlayers(prev => [...prev, player]);
    setDrawnTeams([]);
    setNewPlayerName('');
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
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && wakeLockEnabled) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock active');
          setToast({ message: language === 'pt' ? 'Tela sempre ligada ativa' : (language === 'es' ? 'Pantalla siempre encendida activa' : 'Stay awake active'), type: 'success' });
        } catch (err: any) {
          console.error(`Wake Lock error: ${err.message}`);
          setWakeLockEnabled(false);
          setToast({ message: language === 'pt' ? 'Erro ao manter tela ligada' : 'Error keeping screen on', type: 'error' });
        }
      }
    };

    const handleVisibilityChange = async () => {
      if (wakeLockEnabled && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
      
      // Sincronizar tempo se estiver rodando ao voltar para o app
      if (document.visibilityState === 'visible' && isRunning && lastTickRef.current > 0) {
        const now = Date.now();
        const delta = Math.floor((now - lastTickRef.current) / 1000);
        if (delta >= 1) {
          lastTickRef.current = now - ((now - lastTickRef.current) % 1000);
          setGameTime(prev => Math.max(0, prev - delta));
          setShotClock(prev => Math.max(0, prev - delta));
        }
      }
    };

    if (wakeLockEnabled) {
      if (!('wakeLock' in navigator)) {
        setToast({ message: language === 'pt' ? 'Navegador não suporta esta função' : 'Wake lock not supported', type: 'error' });
        setWakeLockEnabled(false);
      } else {
        requestWakeLock();
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
    }

    return () => {
      if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [wakeLockEnabled, language]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      if (!hasStarted.current) {
        saveToHistory(t.inicioPartida);
        hasStarted.current = true;
      }
      lastTickRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastTickRef.current) / 1000);
        
        if (delta >= 1) {
          lastTickRef.current = now - ((now - lastTickRef.current) % 1000); // Compensate exactly
          
          setGameTime(prev => {
            if (prev <= delta) return 0;
            return prev - delta;
          });

          setShotClock(prev => {
            if (prev <= delta) return 0;
            return prev - delta;
          });
        }
      }, 100); // Check more frequently but only subtract when delta >= 1
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
    <div className="min-h-screen bg-linear-to-b from-bg-deep to-black text-text-primary font-sans flex flex-col items-center select-none transition-colors duration-300 overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 24, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed left-1/2 z-[100] px-5 py-2.5 rounded-none glass-card font-semibold text-xs flex items-center gap-2"
          >
            {toast.type === 'error' ? <X className="w-4 h-4 text-red-500" /> : <Check className="w-4 h-4 text-green-500" />}
            <span className="text-text-primary">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Glassmorphism */}
      <header className="w-full sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-border/10 bg-bg-primary/50 backdrop-blur-xl relative">
        <div className="flex flex-col items-start">
          <h1 className="text-2xl font-display font-bold tracking-[0.1em] text-text-primary leading-tight uppercase">Basquete</h1>
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-bold text-accent-blue uppercase tracking-[0.3em] mt-0.5 opacity-70"
          >
            {activeTab === 'placar' ? t.placar : 
             activeTab === 'estatisticas' ? t.estatisticas : 
             activeTab === 'historico' ? t.historico : 
             t.configuracoes}
          </motion.div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-accent-blue bg-accent-blue/20 border border-accent-blue/40 px-4 py-2 rounded-none uppercase tracking-widest whitespace-nowrap shadow-glow-blue">
            {MODES[gameMode].label}
          </span>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMenuOpen(true)}
            className="w-10 h-10 hidden lg:flex items-center justify-center rounded-none bg-bg-secondary border border-border text-text-primary active:scale-95 transition-all"
          >
            <Menu className="w-6 h-6" />
          </motion.button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`w-full flex-1 flex flex-col px-4 pt-2 pb-4 transition-all duration-300 mx-auto ${['placar', 'estatisticas', 'campeonato'].includes(activeTab) ? 'max-w-7xl' : 'max-w-2xl'}`}>
        {/* Layout Grid: Desktop 2 Columns / Mobile 1 Column */}
        <div className={`flex-1 flex flex-col lg:grid lg:gap-8 lg:min-h-0 ${['placar', 'estatisticas'].includes(activeTab) ? 'lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px]' : (activeTab === 'campeonato' ? 'w-full' : 'lg:max-w-2xl mx-auto w-full')}`}>
          
          {/* Column 1: Placar (Always visible on lg if activeTab is placar/stats) */}
          <div className={`flex-1 flex flex-col gap-4 lg:pb-12 ${activeTab === 'placar' ? 'flex' : (activeTab === 'estatisticas' ? 'hidden lg:flex' : 'hidden')}`}>
            {/* Timer & Shot Clock Row */}
            <div className="flex gap-4 h-28 sm:h-36 shrink-0">
              {/* Game Timer */}
              <motion.div 
                className={`flex-[3] glass-card flex flex-col items-center justify-center relative overflow-hidden group ${hasStarted.current ? 'cursor-default' : 'cursor-pointer'}`}
                whileTap={hasStarted.current ? {} : { scale: 0.98 }}
                onClick={() => {
                  if (hasStarted.current) {
                    setToast({ message: t.tempoNaoEditavel, type: 'error' });
                  } else {
                    setIsEditingTime(true);
                  }
                }}
              >
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.15em] absolute top-3">{t.tempoJogo}</span>
                <div className="text-6xl sm:text-7xl font-display font-bold text-accent-blue text-glow-blue tracking-normal mt-7 leading-none text-digit">
                  {formatTime(gameTime)}
                </div>
              </motion.div>

              {/* Shot Clock */}
              <div className="flex-[1.2] flex flex-col gap-2">
                <motion.div 
                  className="w-full flex-1 glass-card flex flex-col items-center justify-center relative cursor-pointer active:scale-95 transition-transform overflow-hidden"
                  onClick={() => setShotClock(gameMode === '3x3' ? 12 : 14)}
                >
                  <span className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.15em] absolute top-3 leading-none z-10">{t.posse}</span>
                  <div className={`text-5xl font-display font-bold ${shotClock <= 3 && shotClock > 0 ? 'text-red-500 animate-pulse' : 'text-accent-green text-glow-green'} mt-7 text-digit relative z-10 leading-none`}>
                    {shotClock.toString().padStart(2, '0')}
                  </div>
                </motion.div>
                
                {(gameMode === 'fiba' || gameMode === 'nba') && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShotClock(24)}
                    className="w-full py-1.5 bg-accent/10 border border-accent/20 text-accent text-[9px] font-black uppercase tracking-widest shadow-lg shadow-accent/5"
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
                colorClass="home"
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
                colorClass="visitor"
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
                colorClass="home"
              />
              <FoulCard 
                label={t.faltasDoVisitante}
                fouls={visitorFouls}
                onAddFoul={() => updateFouls('visitor')}
                t={t}
                gameMode={gameMode}
                colorClass="visitor"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-center gap-2 sm:gap-6 mt-10 lg:mt-16 shrink-0 pb-32 lg:pb-0 h-20 px-2 sm:px-4">
              <ControlButton 
                icon={<Undo2 />} 
                label={t.desfazer} 
                onClick={handleUndo}
                disabled={history.length === 0}
              />
              
              <motion.button
                className="text-[10px] sm:text-[11px] font-bold text-accent-blue uppercase tracking-widest bg-accent-blue/10 px-4 sm:px-6 h-12 rounded-none border border-accent-blue/20 active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2.5"
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-blue fill-accent-blue" />
                    <span>{t.pausar}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-blue fill-accent-blue" />
                    <span>{t.iniciar}</span>
                  </>
                )}
              </motion.button>

              <ControlButton 
                icon={<RotateCcw />} 
                label={t.reiniciar} 
                onClick={() => setShowResetConfirm(true)}
              />
            </div>
          </div>

          {/* Column 2: History/Stats (Always visible on lg if activeTab is placar/stats) */}
          <div className={`flex-1 flex flex-col gap-6 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto no-scrollbar pb-32 lg:pb-4 ${activeTab === 'estatisticas' ? 'flex' : (activeTab === 'placar' ? 'hidden lg:flex' : 'hidden')}`}>
            {activeTab === 'placar' ? (
              <div className="flex-1 flex flex-col gap-6 min-h-0">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-[0.2em]">{t.historico}</h3>
                  <motion.button
                    className="p-2 bg-accent/10 text-accent rounded-none shadow-none flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform border border-accent/20"
                    onClick={shareHistory}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {t.copiar}
                  </motion.button>
                </div>
                <div className="flex-1 glass-card p-4 overflow-y-auto no-scrollbar flex flex-col border-dashed">
                  {history.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-secondary gap-4 opacity-40 py-10">
                      <div className="w-12 h-12 bg-bg-secondary rounded-none flex items-center justify-center border border-border">
                        <History className="w-6 h-6 opacity-30 text-accent" />
                      </div>
                      <p className="text-xs font-medium tracking-tight">{t.nenhumaAcao}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((action, idx) => (
                        action.type === 'separator' ? (
                          <div key={action.id} className="flex items-center gap-4 py-4 px-1">
                            <div className="flex-1 h-px bg-white/10"></div>
                            <span className="text-[9px] font-black text-accent uppercase tracking-[0.3em] px-2">{action.description}</span>
                            <div className="flex-1 h-px bg-white/10"></div>
                          </div>
                        ) : (
                        <motion.div 
                          key={action.id} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="flex items-center gap-3 group p-1"
                        >
                          <div className="text-[9px] font-display text-text-secondary w-14 tabular-nums opacity-60">
                            {new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                          <div className="flex-1 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[11px] font-semibold text-text-primary tracking-tight leading-loose">{action.description}</p>
                              <p className="text-[9px] font-bold text-accent mt-0.5 uppercase tracking-widest leading-none">
                                {action.state.homeScore} — {action.state.visitorScore}
                              </p>
                            </div>
                            <div className="w-1 h-1 rounded-none bg-border group-hover:bg-accent transition-colors shrink-0" />
                          </div>
                        </motion.div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center px-1">
                  <div className="flex gap-2 ml-auto">
                    <motion.button 
                      onClick={handleDraft}
                      className="text-[11px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-4 py-2 rounded-none border border-accent/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Users className="w-3.5 h-3.5" />
                      {t.sorteio}
                    </motion.button>
                    {drawnTeams.length > 0 && (
                      <motion.button 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setDrawnTeams([])}
                        className="text-[11px] font-bold text-text-secondary uppercase tracking-widest bg-bg-secondary px-4 py-2 rounded-none border border-border/50 active:scale-95 transition-all"
                      >
                        {t.limparSorteio}
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Add Player Form */}
                <div className="glass-card rounded-none p-4 flex flex-col gap-3 mx-1">
                  <div className="flex gap-2 items-center">
                    <input 
                      type="text"
                      maxLength={30}
                      placeholder={`${t.nomeJogador}, ${t.numeroJogador || 'Nº'}`}
                      className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm font-semibold text-text-primary outline-accent placeholder:text-text-secondary/40"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                    />
                    <motion.button
                      className="w-12 h-12 bg-accent text-white rounded-none shadow-none flex items-center justify-center shrink-0 active:scale-95 transition-transform"
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
                          <div className="h-1 w-4 bg-accent rounded-none" />
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
                <div className="pb-8 overflow-y-visible">
                  {selectedPlayerId && players.find(p => p.id === selectedPlayerId) ? (
                    <PlayerStatCard 
                      player={players.find(p => p.id === selectedPlayerId)} 
                      gameMode={gameMode} 
                      t={t} 
                      updatePlayerStat={updatePlayerStat} 
                      removePlayer={removePlayer} 
                    />
                  ) : players.length > 0 ? (
                    <div className="h-48 glass-card flex flex-col items-center justify-center text-text-secondary text-sm font-medium border-dashed border-white/20 gap-4">
                      <div className="w-12 h-12 bg-bg-secondary rounded-none flex items-center justify-center border border-border">
                        <Dribbble className="w-6 h-6 opacity-30 animate-pulse text-accent" />
                      </div>
                      <p className="tracking-tight">Selecione um jogador acima</p>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>

          {/* Campeonato Tab (Standalone) */}
          {activeTab === 'campeonato' && (
            <div className="flex-1 flex flex-col gap-6 min-h-0 mb-4 pb-20 overflow-y-auto no-scrollbar">
              {/* Header Info */}
              <div className="glass-card p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-1.5 h-6 bg-accent rounded-none" />
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-[0.2em]">{t.campeonato}</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                      <Trophy className="w-3 h-3" /> {t.nomeCampeonato}
                    </label>
                    <input 
                      type="text"
                      maxLength={40}
                      className="bg-white/5 border border-white/10 rounded-none px-3 py-2 text-sm font-semibold text-text-primary outline-accent"
                      value={tournamentSettings.name || ''}
                      onChange={(e) => setTournamentSettings(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                      <UserIcon className="w-3 h-3" /> {t.organizador}
                    </label>
                    <input 
                      type="text"
                      maxLength={30}
                      className="bg-white/5 border border-white/10 rounded-none px-3 py-2 text-sm font-semibold text-text-primary outline-accent"
                      value={tournamentSettings.organizer || ''}
                      onChange={(e) => setTournamentSettings(prev => ({ ...prev, organizer: e.target.value }))}
                      placeholder="..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> {t.data}
                    </label>
                    <input 
                      type="date"
                      className="bg-white/5 border border-white/10 rounded-none px-3 py-2 text-sm font-semibold text-text-primary outline-accent"
                      value={tournamentSettings.date || ''}
                      onChange={(e) => setTournamentSettings(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Teams Section */}
              <div className="glass-card p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-accent" />
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-[0.15em]">{t.times} ({tournamentTeams.length}/8)</h3>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text"
                    maxLength={16}
                    placeholder={t.adicionarTime}
                    className="flex-1 bg-white/5 border border-white/10 rounded-none px-4 py-2 text-xs font-semibold text-text-primary outline-accent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addTournamentTeam((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="' + t.adicionarTime + '"]') as HTMLInputElement;
                      if (input) {
                        addTournamentTeam(input.value);
                        input.value = '';
                      }
                    }}
                    className="w-10 h-10 bg-accent text-white flex items-center justify-center shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {tournamentTeams.map(team => (
                    <div key={team.id} className="bg-white/5 border border-white/5 p-2 flex items-center justify-between group">
                      <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[80px]">{team.name}</span>
                      <button onClick={() => removeTournamentTeam(team.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:bg-red-500/10"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Classification & Matches Grid */}
              <div className="flex flex-col gap-10 pb-12">
                <div className="flex items-center justify-between px-1">
                   <div className="flex items-center gap-3">
                    <Medal className="w-4 h-4 text-accent-green" />
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-[0.15em]">{t.campeonato}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={drawTournamentMatches}
                      className="text-[9px] font-bold text-accent border border-accent/20 bg-accent/5 px-4 py-2 uppercase tracking-widest hover:bg-accent/10 transition-all"
                    >
                      {t.sortear}
                    </button>
                    <button 
                      onClick={() => setShowTournamentResetConfirm(true)}
                      className="text-[9px] font-bold text-red-500 border border-red-500/20 bg-red-500/5 px-4 py-2 uppercase tracking-widest hover:bg-red-500/10 transition-all"
                    >
                      {language === 'pt' ? 'Reiniciar' : 'Reset'}
                    </button>
                  </div>
                </div>

                {tournamentMatches.length > 0 && (
                  <div className="space-y-12">
                    {/* Groups Section */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {['A', 'B'].map(groupName => (
                        <div key={groupName} className="glass-card p-6 flex flex-col gap-6">
                          <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <h4 className="text-xs font-black text-text-primary uppercase tracking-widest">Grupo {groupName}</h4>
                          </div>
                          
                          {/* Group Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-white/10">
                                  <th className="pb-3 text-[9px] font-bold text-text-secondary uppercase tracking-widest">#</th>
                                  <th className="pb-3 text-[9px] font-bold text-text-secondary uppercase tracking-widest">{t.equipe}</th>
                                  <th className="pb-3 text-[9px] font-bold text-text-secondary uppercase tracking-widest text-center">{t.pj}</th>
                                  <th className="pb-3 text-[9px] font-bold text-text-secondary uppercase tracking-widest text-center">{t.vitorias}</th>
                                  <th className="pb-3 text-[9px] font-bold text-text-secondary uppercase tracking-widest text-center">E</th>
                                  <th className="pb-3 text-[9px] font-bold text-accent uppercase tracking-widest text-center">{t.pontos}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {calculateGroupStandings(groupName as 'A' | 'B', tournamentMatches).map((team, idx) => (
                                  <tr key={team.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                    <td className="py-3 text-[10px] font-bold text-text-secondary pr-4">{idx + 1}</td>
                                    <td className="py-3 text-[10px] font-bold text-text-primary uppercase tracking-widest truncate max-w-[100px]">{team.name}</td>
                                    <td className="py-3 text-[10px] font-display font-medium text-center">{team.played}</td>
                                    <td className="py-3 text-[10px] font-display font-medium text-center text-green-500">{team.won}</td>
                                    <td className="py-3 text-[10px] font-display font-medium text-center text-blue-400">{team.draw}</td>
                                    <td className="py-3 text-[10px] font-display font-bold text-center text-accent tabular-nums bg-accent/5">{team.points}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Group Matches */}
                          <div className="space-y-3 mt-2">
                             <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest opacity-50">{t.jogos}</span>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {tournamentMatches.filter(m => m.round === 'group' && m.id.startsWith(`G${groupName}-`)).map(match => (
                                   <BracketMatch 
                                      key={match.id} 
                                      match={match} 
                                      teams={tournamentTeams} 
                                      onUpdateResult={updateMatchResult} 
                                      onTransfer={transferToScoreboard} 
                                      t={t} 
                                      compact
                                   />
                                ))}
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Knockout Bracket Section */}
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-3 px-1 border-b border-white/5 pb-4">
                        <Trophy className="w-4 h-4 text-accent" />
                        <h3 className="text-xs font-bold text-text-primary uppercase tracking-[0.15em]">{language === 'pt' ? 'Fase Eliminatória' : 'Knockout Stage'}</h3>
                      </div>
                      
                      <div className="flex flex-col lg:flex-row gap-8 overflow-x-auto no-scrollbar pb-8 px-1">
                        {/* Semis Column */}
                        <div className="flex flex-col gap-8 min-w-[280px]">
                          <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] text-center mb-2 border-b border-white/5 pb-2">{t.semifinais}</h4>
                          <div className="space-y-8">
                            {tournamentMatches.filter(m => m.round === 'semis').map(match => (
                              <BracketMatch key={match.id} match={match} teams={tournamentTeams} onUpdateResult={updateMatchResult} onTransfer={transferToScoreboard} t={t} />
                            ))}
                          </div>
                        </div>

                        {/* Final Column */}
                        <div className="flex flex-col gap-8 min-w-[280px] lg:mt-24">
                          <h4 className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] text-center mb-2 border-b border-accent/20 pb-2">{t.final}</h4>
                          <div className="space-y-8">
                            {tournamentMatches.filter(m => m.round === 'final').map(match => (
                              <BracketMatch key={match.id} match={match} teams={tournamentTeams} onUpdateResult={updateMatchResult} onTransfer={transferToScoreboard} t={t} isHighlight />
                            ))}
                          </div>
                        </div>

                        {/* 3rd Place Column */}
                        <div className="flex flex-col gap-8 min-w-[280px] lg:mt-24">
                          <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] text-center mb-2 border-b border-white/5 pb-2">{t.terceiroLugar}</h4>
                          <div className="space-y-8">
                            {tournamentMatches.filter(m => m.round === 'third').map(match => (
                              <BracketMatch key={match.id} match={match} teams={tournamentTeams} onUpdateResult={updateMatchResult} onTransfer={transferToScoreboard} t={t} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tournamentMatches.length === 0 && (
                   <div className="glass-card py-32 flex flex-col items-center justify-center opacity-30 text-xs font-medium uppercase tracking-widest gap-6">
                      <div className="w-20 h-20 bg-bg-secondary rounded-none flex items-center justify-center">
                        <Trophy className="w-10 h-10" />
                      </div>
                      {language === 'pt' ? 'Adicione 8 times e sorteie os grupos' : 'Add 8 teams and draw the groups'}
                   </div>
                )}
              </div>
            </div>
          )}

          {/* Historico Tab (Standalone) */}
          {activeTab === 'historico' && (
          <div className="flex-1 flex flex-col gap-6 min-h-0 mb-4 pb-20 lg:max-w-4xl lg:mx-auto lg:w-full">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-display font-bold text-white tracking-[0.2em] uppercase hidden lg:block">{t.historico}</h2>
              <motion.button
                className="p-3 bg-accent text-white rounded-none shadow-none flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-transform ml-auto"
                onClick={shareHistory}
              >
                <History className="w-4 h-4" />
                {t.copiar}
              </motion.button>
            </div>
            <div className="flex-1 glass-card p-6 overflow-y-auto no-scrollbar flex flex-col">
              {history.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-text-secondary gap-4 opacity-40">
                  <div className="w-16 h-16 bg-bg-secondary rounded-none flex items-center justify-center">
                    <History className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium tracking-tight">{t.nenhumaAcao}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((action, idx) => (
                    action.type === 'separator' ? (
                      <div key={action.id} className="flex items-center gap-4 py-6">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em] px-2">{action.description}</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                      </div>
                    ) : (
                    <motion.div 
                      key={action.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-4 group p-1"
                    >
                      <div className="text-[10px] font-display text-text-secondary w-16 tabular-nums">
                        {new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-text-primary tracking-tight leading-none">{action.description}</p>
                          <p className="text-[10px] font-bold text-accent mt-1.5 uppercase tracking-widest leading-none">
                            {action.state.homeScore} — {action.state.visitorScore}
                          </p>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-none bg-border group-hover:bg-accent transition-colors" />
                      </div>
                    </motion.div>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Opcoes Tab (Standalone) */}
          {activeTab === 'opcoes' && (
            <div className="flex-1 flex flex-col gap-8 pb-32 lg:pb-8 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto no-scrollbar">
            
            <div className="flex flex-col gap-4">
              {/* Group 1: General */}
              <div className="glass-card overflow-hidden">
                {/* Language Selection */}
                <div className="p-6 border-b border-white/5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <Languages className="w-3.5 h-3.5 text-accent" /> {t.idioma}
                  </label>
                  <div className="flex gap-2 bg-white/5 p-1 rounded-none border border-white/5">
                    {(['pt', 'en', 'es'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`flex-1 py-2 rounded-none text-xs font-bold transition-all ${language === lang ? 'bg-accent text-white shadow-none' : 'text-text-secondary hover:text-text-primary'}`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Game Mode Selection */}
                <div className="p-6">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <Trophy className="w-3.5 h-3.5 text-accent" /> {t.modoJogo}
                  </label>
                  <div className="flex gap-2 bg-bg-card p-1 rounded-none border border-border">
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
                        className={`flex-1 py-2 rounded-none text-xs font-bold transition-all ${gameMode === mode ? 'bg-accent text-white shadow-none' : 'text-text-secondary hover:text-text-primary'} ${hasStarted.current ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        {MODES[mode].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Group 2: System */}
              <div className="glass-card overflow-hidden">
                {/* Wake Lock */}
                <div className="p-6 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-none flex items-center justify-center">
                      <MonitorSmartphone className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-text-primary tracking-tight">{t.telaSempreLigada}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setWakeLockEnabled(!wakeLockEnabled)}
                    className={`w-12 h-6 rounded-none transition-all duration-300 relative ${wakeLockEnabled ? 'bg-green-500' : 'bg-border'}`}
                  >
                    <motion.div 
                      className="absolute top-1 left-1 w-4 h-4 bg-white rounded-none shadow-none"
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
                          className="w-10 h-10 bg-bg-secondary text-accent rounded-none hover:bg-accent/10 transition-all active:scale-95 shadow-none flex items-center justify-center"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-semibold text-text-primary tracking-tight">{t.somTempoJogo}</span>
                      </div>
                      <button
                        onClick={() => setGameEndSoundEnabled(!gameEndSoundEnabled)}
                        className={`w-12 h-6 rounded-none transition-all duration-300 relative ${gameEndSoundEnabled ? 'bg-green-500' : 'bg-border'}`}
                      >
                        <motion.div 
                          className="absolute top-1 left-1 w-4 h-4 bg-white rounded-none shadow-none"
                          animate={{ x: gameEndSoundEnabled ? 24 : 0 }}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => playBuzzer(false)}
                          className="w-10 h-10 bg-bg-secondary text-accent rounded-none hover:bg-accent/10 transition-all active:scale-95 shadow-none flex items-center justify-center"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-semibold text-text-primary tracking-tight">{t.somTempoPosse}</span>
                      </div>
                      <button
                        onClick={() => setShotClockSoundEnabled(!shotClockSoundEnabled)}
                        className={`w-12 h-6 rounded-none transition-all duration-300 relative ${shotClockSoundEnabled ? 'bg-green-500' : 'bg-border'}`}
                      >
                        <motion.div 
                          className="absolute top-1 left-1 w-4 h-4 bg-white rounded-none shadow-none"
                          animate={{ x: shotClockSoundEnabled ? 24 : 0 }}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 overflow-hidden">
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 text-red-500 font-bold uppercase tracking-widest text-[11px] active:bg-red-500/20 transition-all group"
              >
                <span className="group-active:scale-95 transition-transform">{language === 'pt' ? 'Limpar Todos os Dados' : (language === 'es' ? 'Limpiar Todos los Datos' : 'Reset App Data')}</span>
                <RotateCcw className="w-4 h-4 group-active:rotate-180 transition-all duration-500" />
              </button>
              <p className="px-4 py-2 text-[9px] text-text-secondary uppercase tracking-[0.2em] leading-relaxed mt-2 opacity-60">
                {language === 'pt' 
                  ? 'Isso apagará permanentemente todos os placares, jogadores e o histórico salvo neste dispositivo.' 
                  : (language === 'es' ? 'Esto eliminará permanentemente todos os marcadores, jugadores y el historial guardado en este dispositivo.' : 'This will permanently delete everything saved on this device.')}
              </p>
            </div>

            {/* Credit */}
            <div className="mt-8 pb-4 text-center opacity-30">
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.4em]">desenvolvido por superdz7</p>
            </div>
          </div>
          )}
        </div>
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

      {/* Tournament Reset Confirmation Modal */}
      <AnimatePresence>
        {showTournamentResetConfirm && (
          <ConfirmModal 
            title={t.campeonato}
            message={t.confirmarReiniciarCampeonato}
            onConfirm={resetTournament}
            onCancel={() => setShowTournamentResetConfirm(false)}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Draft Modal */}
      <AnimatePresence>
        {showDraftModal && (
          <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-bg-secondary/80 backdrop-blur-xl border border-white/10 w-full max-w-sm p-8 flex flex-col max-h-[85vh] shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl -z-0" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-text-primary tracking-tight">{t.equipes}</h3>
                <button onClick={() => setShowDraftModal(false)} className="p-2 text-text-secondary hover:bg-bg-primary rounded-none transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar">
                {drawnTeams.map((team, idx) => (
                  <div key={idx} className="bg-bg-secondary/50 rounded-none p-5 border border-border space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-none bg-accent" />
                      <h4 className="text-accent font-bold text-[10px] uppercase tracking-[0.2em] leading-none">
                        {t.equipe} {String.fromCharCode(65 + idx)}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {team.map(player => (
                        <div key={player.id} className="text-sm font-semibold text-text-primary flex justify-between items-center py-2.5 border-b border-border last:border-0">
                          <span className="tracking-tight">{player.name}</span>
                          <span className="text-[11px] font-bold text-text-secondary bg-bg-card/50 px-2.5 py-1 rounded-none border border-border tabular-nums shadow-none">#{player.number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 mt-8">
                <button 
                  onClick={shareTeams}
                  className="w-full h-14 bg-accent text-white rounded-none font-bold flex items-center justify-center gap-2 shadow-none active:scale-95 transition-all"
                >
                  <Copy className="w-5 h-5" />
                  {t.copiar}
                </button>
                <button 
                  onClick={() => setShowDraftModal(false)}
                  className="w-full h-14 bg-bg-secondary text-text-primary rounded-none font-bold active:scale-95 transition-all text-sm"
                >
                  {t.fechar || 'Fechar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Side Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[200]">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Menu Content */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[80%] max-w-[300px] bg-bg-secondary border-l border-white/10 shadow-2xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-10 pt-4 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-8 bg-accent rounded-none" />
                  <h2 className="text-xl font-display font-bold text-white tracking-[0.2em] uppercase leading-none">Menu</h2>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center text-text-secondary hover:bg-white/5 rounded-none transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-3">
                <MenuItem 
                  icon={<Dribbble className="w-5 h-5" />} 
                  label={t.placar} 
                  active={activeTab === 'placar'} 
                  onClick={() => { setActiveTab('placar'); setIsMenuOpen(false); }} 
                />
                <MenuItem 
                  icon={<BarChart3 className="w-5 h-5" />} 
                  label={t.estatisticas} 
                  active={activeTab === 'estatisticas'} 
                  onClick={() => { setActiveTab('estatisticas'); setIsMenuOpen(false); }} 
                />
                <MenuItem 
                  icon={<History className="w-5 h-5" />} 
                  label={t.historico} 
                  active={activeTab === 'historico'} 
                  onClick={() => { setActiveTab('historico'); setIsMenuOpen(false); }} 
                />
                <MenuItem 
                  icon={<Trophy className="w-5 h-5" />} 
                  label={t.campeonato} 
                  active={activeTab === 'campeonato'} 
                  onClick={() => { setActiveTab('campeonato'); setIsMenuOpen(false); }} 
                />
                <MenuItem 
                  icon={<Settings className="w-5 h-5" />} 
                  label={t.configuracoes} 
                  active={activeTab === 'opcoes'} 
                  onClick={() => { setActiveTab('opcoes'); setIsMenuOpen(false); }} 
                />
              </div>

              <div className="mt-auto pb-10 text-center opacity-30">
                  <p className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.4em]">desenvolvido por superdz7</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Bottom Navigation - Fixed at bottom (Mobile/Tablet Only) */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden glass-nav px-4 pb-2 pt-1 flex justify-between items-center z-50">
        <NavButton 
          active={activeTab === 'placar'} 
          onClick={() => { setActiveTab('placar'); setIsMenuOpen(false); }}
          icon={<Dribbble className="w-5 h-5" />}
        />
        <NavButton 
          active={activeTab === 'estatisticas'} 
          onClick={() => { setActiveTab('estatisticas'); setIsMenuOpen(false); }}
          icon={<BarChart3 className="w-5 h-5" />}
        />
        <NavButton 
          active={activeTab === 'historico'} 
          onClick={() => { setActiveTab('historico'); setIsMenuOpen(false); }}
          icon={<History className="w-5 h-5" />}
        />
        <NavButton 
          active={activeTab === 'campeonato'} 
          onClick={() => { setActiveTab('campeonato'); setIsMenuOpen(false); }}
          icon={<Trophy className="w-5 h-5" />}
        />
        <NavButton 
          active={activeTab === 'opcoes'} 
          onClick={() => { setActiveTab('opcoes'); setIsMenuOpen(false); }}
          icon={<Settings className="w-5 h-5" />}
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="w-full max-w-xs bg-bg-secondary/80 backdrop-blur-xl border border-white/10 p-10 flex flex-col gap-10 shadow-3xl relative overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-text-primary tracking-tight">{t.editarTempo}</h3>
          <button onClick={onClose} className="p-2 text-text-secondary hover:bg-bg-primary rounded-none transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex justify-center items-center gap-6">
          {/* Minutes */}
          <div className="flex flex-col items-center gap-3">
            <button onClick={() => adjustMins(1)} className="p-4 bg-bg-secondary rounded-none text-accent active:scale-90 transition-transform"><Plus className="w-6 h-6 font-bold" /></button>
            <div className="text-5xl font-bold font-display text-text-primary tracking-tighter text-digit">{mins.toString().padStart(2, '0')}</div>
            <button onClick={() => adjustMins(-1)} className="p-4 bg-bg-secondary rounded-none text-accent active:scale-90 transition-transform"><Minus className="w-6 h-6 font-bold" /></button>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t.minutos}</span>
          </div>

          <div className="text-4xl font-light text-text-secondary pb-12">:</div>

          {/* Seconds */}
          <div className="flex flex-col items-center gap-3">
            <button onClick={() => adjustSecs(1)} className="p-4 bg-bg-secondary rounded-none text-accent active:scale-90 transition-transform"><Plus className="w-6 h-6 font-bold" /></button>
            <div className="text-5xl font-bold font-display text-text-primary tracking-tighter text-digit">{secs.toString().padStart(2, '0')}</div>
            <button onClick={() => adjustSecs(-1)} className="p-4 bg-bg-secondary rounded-none text-accent active:scale-90 transition-transform"><Minus className="w-6 h-6 font-bold" /></button>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t.segundos}</span>
          </div>
        </div>

        <button 
          className="w-full h-16 bg-accent text-white rounded-none font-bold text-lg flex items-center justify-center gap-2 shadow-none active:scale-[0.98] transition-all"
          onClick={() => onSave(mins * 60 + secs)}
        >
          <Check className="w-6 h-6" />
          {t.salvarTempo}
        </button>
      </motion.div>
    </motion.div>
  );
}

function BracketMatch({ match, teams, onUpdateResult, onTransfer, t, isHighlight, compact }: any) {
  const home = teams.find((t: any) => t.id === match.homeTeamId);
  const visitor = teams.find((t: any) => t.id === match.visitorTeamId);
  
  const isFinished = match.status === 'finished';
  const homeWinner = isFinished && match.homeScore > match.visitorScore;
  const visitorWinner = isFinished && match.visitorScore > match.homeScore;

  return (
    <div className={`relative flex flex-col glass-card border-l-4 transition-all ${isHighlight ? 'border-accent scale-105 z-10' : 'border-white/10 opacity-90'} ${isHighlight ? 'shadow-2xl shadow-accent/20' : ''}`}>
      <div className={`${compact ? 'p-2 space-y-1' : 'p-3 space-y-2'}`}>
        {/* Home Team */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-1 h-4 rounded-full ${homeWinner ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-white/10'}`}></div>
            <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-bold uppercase tracking-widest truncate ${homeWinner ? 'text-text-primary' : 'text-text-secondary opacity-60'}`}>
              {home?.name || 'TBD'}
            </span>
          </div>
          <input 
            type="number"
            className={`${compact ? 'w-8 h-6' : 'w-10'} bg-black/40 border border-white/10 text-center text-xs font-bold p-1 outline-none no-scrollbar ${homeWinner ? 'text-accent' : 'text-text-primary'}`}
            value={match.homeScore ?? 0}
            onChange={(e) => onUpdateResult(match.id, parseInt(e.target.value) || 0, match.visitorScore)}
          />
        </div>

        {/* Visitor Team */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-1 h-4 rounded-full ${visitorWinner ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-white/10'}`}></div>
            <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-bold uppercase tracking-widest truncate ${visitorWinner ? 'text-text-primary' : 'text-text-secondary opacity-60'}`}>
              {visitor?.name || 'TBD'}
            </span>
          </div>
          <input 
            type="number"
            className={`${compact ? 'w-8 h-6' : 'w-10'} bg-black/40 border border-white/10 text-center text-xs font-bold p-1 outline-none no-scrollbar ${visitorWinner ? 'text-accent' : 'text-text-primary'}`}
            value={match.visitorScore ?? 0}
            onChange={(e) => onUpdateResult(match.id, match.homeScore, parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <button 
        onClick={() => onTransfer(match)}
        disabled={!home || !visitor}
        className={`w-full ${compact ? 'py-1' : 'py-1.5'} transition-all text-[8px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 border-t border-white/5 ${(!home || !visitor) ? 'opacity-20 cursor-not-allowed' : 'bg-accent/5 hover:bg-accent/20 text-accent'}`}
      >
        <MonitorSmartphone className="w-3 h-3" />
        {!compact && t.iniciarJogoNoPlacar}
      </button>

      {isFinished && (
         <div className={`absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[7px] font-black px-1 py-0.5 rounded-none uppercase tracking-tighter shadow-lg`}> OK </div>
      )}
    </div>
  );
}

function TeamCard({ label, name, onNameChange, score, onAdd1, onAdd2, onAdd3, t, gameMode, colorClass }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);

  const handleSave = () => {
    onNameChange((tempName || name).toUpperCase());
    setIsEditing(false);
  };

  const isFibaNba = gameMode === 'fiba' || gameMode === 'nba';
  const textColor = colorClass === 'home' ? 'text-accent-blue' : 'text-accent-green';
  const glowClass = colorClass === 'home' ? 'text-glow-blue' : 'text-glow-green';

  const labelColor = colorClass === 'home' ? 'text-accent-blue/80' : 'text-accent-green/80';

  return (
    <div className={`glass-card p-4 flex flex-col items-center gap-3 transition-all duration-300 h-full`}>
      <div className="flex flex-col items-center gap-1.5 w-full">
        <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${labelColor}`}>{label}</span>
        {isEditing ? (
          <div className="flex gap-1 w-full">
            <input 
              autoFocus
              maxLength={16}
              className="w-full text-center bg-white/5 rounded-none text-lg font-display font-black text-text-primary py-2 px-3 outline-none border-b border-white/20 uppercase"
              value={tempName || ''}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        ) : (
          <motion.button 
            className={`w-full px-2 py-0.5 bg-transparent border-none text-lg sm:text-xl font-display font-black tracking-[0.1em] uppercase ${textColor} truncate active:opacity-70 transition-opacity`}
            onClick={() => setIsEditing(true)}
            whileTap={{ scale: 0.95 }}
          >
            {name}
          </motion.button>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center py-1">
        <span className={`text-7xl sm:text-[5rem] font-display font-bold leading-none text-digit ${textColor} ${glowClass}`}>
          {score.toString().padStart(2, '0')}
        </span>
      </div>

      <div className="flex gap-3 w-full">
        <motion.button 
          className="flex-1 h-12 glass-button text-xs font-bold text-text-primary border-slate-800"
          whileTap={{ scale: 0.95 }}
          onClick={onAdd1}
        >
          +1
        </motion.button>
        <motion.button 
          className="flex-1 h-12 glass-button text-xs font-bold text-text-primary border-slate-800"
          whileTap={{ scale: 0.95 }}
          onClick={onAdd2}
        >
          +2
        </motion.button>
        {isFibaNba && (
          <motion.button 
            className="flex-1 h-12 glass-button text-xs font-bold text-text-primary border-slate-800"
            whileTap={{ scale: 0.95 }}
            onClick={onAdd3}
          >
            +3
          </motion.button>
        )}
      </div>
    </div>
  );
}

function FoulCard({ label, fouls, onAddFoul, t, gameMode, colorClass }: any) {
  const bonusThreshold = 7;
  const isCritical = fouls >= 7;
  const dotActiveColor = isCritical ? 'bg-red-500' : (colorClass === 'home' ? 'bg-accent-blue' : 'bg-accent-green');
  const labelColorFull = isCritical ? 'text-red-500/80' : (colorClass === 'home' ? 'text-accent-blue/80' : 'text-accent-green/80');
  
  return (
    <motion.div 
      className={`glass-card p-4 flex items-center justify-between cursor-pointer active:scale-95 transition-all duration-500 h-full ${
        isCritical ? 'bg-red-500/10 border-red-500/30' : ''
      }`}
      onClick={onAddFoul}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex flex-col gap-3">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${labelColorFull} leading-tight whitespace-pre-line transition-colors`}>{label}</span>
        <div className="flex gap-1.5">
          {[...Array(bonusThreshold)].map((_, i) => (
            <div 
              key={i} 
              className={`w-2 h-2 rounded-none transition-all duration-300 ${i < fouls ? `${dotActiveColor} shadow-sm opacity-100 ${isCritical ? 'shadow-red-500/50' : ''}` : 'bg-slate-800 opacity-50'}`} 
            />
          ))}
        </div>
      </div>
      <span className={`text-4xl font-display font-bold transition-colors ${isCritical ? 'text-red-500 text-glow-red' : 'text-text-primary'} text-digit`}>{fouls}</span>
    </motion.div>
  );
}

function ControlButton({ icon, label, onClick, disabled }: any) {
  return (
    <motion.button
      className={`text-[10px] sm:text-[11px] font-bold text-text-secondary uppercase tracking-widest bg-white/5 px-2.5 sm:px-4 h-12 rounded-none border border-white/10 active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2 ${disabled ? 'opacity-20 grayscale cursor-not-allowed' : 'hover:bg-white/10 opacity-70 hover:opacity-100'}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <div className="text-text-secondary">{React.cloneElement(icon as React.ReactElement, { className: 'w-3 sm:w-3.5 h-3 sm:h-3.5' })}</div>
      <span className="leading-none">{label}</span>
    </motion.button>
  );
}

function PlayerBadge({ player, isSelected, onClick }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-2 py-1 rounded-none text-[10px] font-bold transition-all flex items-center gap-2 border shadow-none ${
        isSelected 
          ? 'bg-accent text-white border-accent' 
          : 'bg-white/[0.04] text-text-primary border-white/10 hover:border-accent/40'
      }`}
    >
      <span className={`w-5 h-5 rounded-none flex items-center justify-center text-[9px] font-display font-bold ${isSelected ? 'bg-black/60 text-white' : 'bg-bg-card shadow-none text-accent'}`}>
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

  const totalShots = (player.stats.ft.made + player.stats.ft.missed) +
                    (player.stats.pts2.made + player.stats.pts2.missed) +
                    (player.stats.pts3.made + player.stats.pts3.missed);
  
  const totalMade = player.stats.ft.made + player.stats.pts2.made + player.stats.pts3.made;
  const efficiency = totalShots > 0 ? ((totalMade / totalShots) * 100).toFixed(1) : "0.0";
  
  const StatItem = ({ label, category, value, isPoint = false, step = 1 }: any) => {
    return (
      <div className="flex flex-col gap-1.5 p-2 bg-white/5 rounded-none border border-white/10">
        <span className="text-xs font-display text-text-secondary uppercase tracking-wider text-center">{label}</span>
        
        {isPoint ? (
          <div className="flex flex-col gap-2">
              <div className="text-center font-display font-bold">
                <span className="text-sm font-black text-text-primary">{value.made}</span>
                <span className="text-[10px] text-text-secondary font-medium ml-1">/{value.made + value.missed}</span>
              </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                onClick={() => updatePlayerStat(player.id, category, 'missed', 1)}
                className="h-6 bg-red-500/10 text-red-500 border border-red-500/20 rounded-none text-xs font-black active:scale-95 transition-all flex items-center justify-center order-1"
              >
                -{step}
              </button>
              <button 
                onClick={() => updatePlayerStat(player.id, category, 'made', 1)}
                className="h-6 bg-green-500/10 text-green-500 border border-green-500/20 rounded-none text-xs font-black active:scale-95 transition-all flex items-center justify-center order-2"
              >
                +{step}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="text-center font-display font-bold">
              <span className="text-sm font-black text-text-primary">{value}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                onClick={() => updatePlayerStat(player.id, category, -1)}
                className="h-6 bg-bg-card text-text-secondary border border-border rounded-none text-xs font-black active:scale-95 transition-all flex items-center justify-center order-1"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => updatePlayerStat(player.id, category, 1)}
                className="h-6 bg-accent/10 text-accent border border-accent/20 rounded-none text-xs font-black active:scale-95 transition-all flex items-center justify-center order-2"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-card p-4 space-y-4 shadow-none rounded-none">
      <div className="flex justify-between items-center pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-accent rounded-none flex items-center justify-center text-white font-display font-bold text-xs shrink-0">
            {player.number || '00'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline gap-2">
              <h3 className="font-display text-text-primary tracking-wide text-base uppercase truncate">{player.name}</h3>
              <p className="font-display font-bold text-green-500 text-base shrink-0">
                {efficiency}%
              </p>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[9px] font-display font-bold text-accent uppercase tracking-widest">
                {totalPoints} {t.pts}
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => removePlayer(player.id)} 
          className="p-2 text-text-secondary hover:text-red-500 rounded-none transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Column 1 */}
        <div className="space-y-3">
          <StatItem 
            label="1 Ponto" 
            category="ft" 
            value={player.stats.ft} 
            isPoint={true} 
            step={1} 
          />
          <StatItem 
            label="2 Pontos" 
            category="pts2" 
            value={player.stats.pts2} 
            isPoint={true} 
            step={2} 
          />
          <StatItem 
            label="3 Pontos" 
            category="pts3" 
            value={player.stats.pts3} 
            isPoint={true} 
            step={3} 
          />
          <StatItem 
            label={t.asst} 
            category="assists" 
            value={player.stats.assists} 
          />
        </div>

        {/* Column 2 */}
        <div className="space-y-3">
          <StatItem 
            label={t.reb} 
            category="rebounds" 
            value={player.stats.rebounds} 
          />
          <StatItem 
            label={t.stl} 
            category="steals" 
            value={player.stats.steals} 
          />
          <StatItem 
            label={t.blk} 
            category="blocks" 
            value={player.stats.blocks} 
          />
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, active, onClick }: any) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`group flex items-center gap-4 p-5 rounded-none transition-all border ${
        active 
          ? 'bg-accent/20 border-accent/40 text-accent ring-1 ring-accent/20' 
          : 'bg-white/[0.02] border-white/5 text-text-secondary hover:bg-white/5 hover:text-text-primary'
      }`}
    >
      <div className={`${active ? 'text-accent' : 'text-text-secondary group-hover:text-accent transition-colors'}`}>{icon}</div>
      <span className="text-xs tracking-[0.2em] font-bold uppercase">{label}</span>
      {active && (
        <motion.div 
          layoutId="active-dot"
          className="ml-auto w-1.5 h-1.5 rounded-none bg-accent shadow-none" 
        />
      )}
    </motion.button>
  );
}

function NavButton({ active, onClick, icon }: any) {
  return (
    <button 
      className="flex-1 flex flex-col items-center justify-center gap-0.5 group py-3 relative min-h-[56px]"
      onClick={onClick}
    >
      <div className={`transition-all duration-300 relative z-10 ${active ? 'text-accent scale-125' : 'text-text-secondary group-hover:text-accent/70'}`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
      </div>
      {active && (
        <>
          <motion.div 
            layoutId="nav-line"
            className="absolute top-0 left-0 right-0 h-0.5 bg-accent z-20"
            initial={false}
          />
          <motion.div 
            layoutId="nav-glow"
            className="absolute inset-0 bg-accent/20 rounded-none -z-0"
            initial={false}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        </>
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
        className="w-full max-w-xs bg-bg-secondary/80 backdrop-blur-xl border border-white/10 p-8 flex flex-col gap-10 shadow-none"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold text-text-primary tracking-tight leading-tight">{title}</h3>
          <p className="text-sm font-medium text-text-secondary leading-relaxed">{message}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            className="w-full h-14 bg-accent text-white rounded-none font-bold text-lg shadow-none active:scale-95 transition-all"
            onClick={onConfirm}
          >
            {t.reiniciar}
          </button>
          <button 
            className="w-full h-14 bg-bg-secondary text-text-primary rounded-none font-bold text-lg active:scale-95 transition-all"
            onClick={onCancel}
          >
            {t.fechar || 'Cancelar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
