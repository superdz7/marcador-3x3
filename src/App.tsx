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
  Check
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
  const hasStarted = useRef(false);
  const wakeLockRef = useRef<any>(null);

  const t = TRANSLATIONS[language];

  // --- Helpers ---

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveToHistory = useCallback((description: string) => {
    if (!hasStarted.current && !description.includes(t.inicioPartida)) return;
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
  }, [gameTime, shotClock, homeScore, visitorScore, homeFouls, visitorFouls, t.inicioPartida]);

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
  };

  const resetGame = () => {
    if (window.confirm(t.confirmarReiniciar)) {
      setGameTime(MODES[gameMode].gameTime);
      setShotClock(MODES[gameMode].shotClock);
      setHomeScore(0);
      setVisitorScore(0);
      setHomeFouls(0);
      setVisitorFouls(0);
      setHomeName('BE CITY');
      setVisitorName('BULLS');
      setIsRunning(false);
      setHistory([]);
      hasStarted.current = false;
    }
  };

  const playBuzzer = () => {
    console.log('BUZZER!');
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  // --- Actions ---

  const updateScore = (team: Team, amount: number) => {
    if (gameTime === 0 && hasStarted.current) return;
    saveToHistory(`${team === 'home' ? t.casa : t.visitante} +${amount} pts`);
    if (team === 'home') {
      setHomeScore(prev => Math.min(MAX_SCORE, prev + amount));
    } else {
      setVisitorScore(prev => Math.min(MAX_SCORE, prev + amount));
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

  // --- Effects ---

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
          if (prev <= 0) {
            setIsRunning(false);
            playBuzzer();
            return 0;
          }
          return prev - 1;
        });

        setShotClock(prev => {
          if (prev <= 1) {
            playBuzzer();
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

  useEffect(() => {
    const isGameOver = homeScore >= MAX_SCORE || visitorScore >= MAX_SCORE || (gameTime === 0 && hasStarted.current);
    if (isGameOver) {
      if (isRunning || (gameTime === 0 && hasStarted.current && !history.some(h => h.description.includes(t.fimJogo)))) {
        saveToHistory(`${t.fimJogo} - ${homeName} ${homeScore} x ${visitorScore} ${visitorName}`);
      }
      setIsRunning(false);
      if (gameTime === 0 && isRunning) playBuzzer();
    }
  }, [homeScore, visitorScore, gameTime, t.fimJogo, t.placar, isRunning, history, homeName, visitorName]);

  return (
    <div className="h-screen bg-bg-primary text-text-primary font-sans flex flex-col items-center p-3 select-none overflow-hidden transition-colors duration-300">
      {/* Header - Compact */}
      <header className="w-full max-w-2xl flex items-center gap-2 mb-3 px-2">
        <div className="bg-[#FF6B35] p-1 rounded-full shadow-md">
          <Dribbble className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-xl font-black tracking-tighter text-[#FF6B35]">3X3</h1>
        <div className="ml-auto text-[10px] font-bold text-text-secondary uppercase tracking-widest bg-bg-card px-2 py-1 rounded-full shadow-sm">
          {MODES[gameMode].label}
        </div>
      </header>

      {/* Main Scoreboard Area */}
      <main className="w-full max-w-2xl flex-1 flex flex-col gap-3 min-h-0">
        {activeTab === 'placar' ? (
          <>
            {/* Timer & Shot Clock Row */}
            <div className="flex gap-3 h-32 shrink-0">
              {/* Game Timer */}
              <motion.div 
                className="flex-[3.5] bg-bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-y-4 border-[#FF6B35] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer"
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditingTime(true)}
              >
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest absolute top-2">{t.tempoJogo}</span>
                <div className="text-7xl font-bold tracking-tighter text-text-primary mt-2 font-display">
                  {formatTime(gameTime)}
                </div>
              </motion.div>

              {/* Shot Clock */}
              <motion.div 
                className="flex-1 bg-bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col items-center justify-center relative cursor-pointer"
                whileTap={{ scale: 0.9 }}
                onClick={() => setShotClock(MODES[gameMode].shotClock)}
              >
                <span className="text-[9px] font-bold text-[#FF6B35] uppercase tracking-widest absolute top-2">{t.posse}</span>
                <div className={`text-4xl font-black text-[#FF6B35] mt-2 font-mono ${shotClock <= 3 && shotClock > 0 ? 'animate-pulse' : ''}`}>
                  {shotClock.toString().padStart(2, '0')}
                </div>
              </motion.div>
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
                t={t}
              />
              <TeamCard 
                label={t.visitante}
                name={visitorName}
                onNameChange={setVisitorName}
                score={visitorScore}
                onAdd1={() => updateScore('visitor', 1)}
                onAdd2={() => updateScore('visitor', 2)}
                t={t}
              />
            </div>

            {/* Fouls Row - Separated */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <FoulCard 
                label={<>{t.faltas}<br/>{t.casa}</>}
                fouls={homeFouls}
                onAddFoul={() => updateFouls('home')}
                t={t}
              />
              <FoulCard 
                label={<>{t.faltas}<br/>{t.visitante}</>}
                fouls={visitorFouls}
                onAddFoul={() => updateFouls('visitor')}
                t={t}
              />
            </div>

            {/* Controls Row */}
            <div className="grid grid-cols-4 gap-3 mt-auto mb-2 shrink-0">
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
                icon={<Volume2 className="w-5 h-5" />} 
                label={t.buzzer} 
                onClick={playBuzzer}
              />

              <ControlButton 
                icon={<RotateCcw className="w-5 h-5" />} 
                label={t.reiniciar} 
                onClick={resetGame}
              />
            </div>
          </>
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
            <div className="flex-1 bg-bg-card rounded-[32px] shadow-lg p-4 overflow-y-auto space-y-3 no-scrollbar">
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
            
            <div className="bg-bg-card rounded-2xl p-4 shadow-sm space-y-6">
              {/* Language Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                  <Check className="w-3 h-3 text-[#FF6B35]" /> {t.idioma}
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
                  <Check className="w-3 h-3 text-[#FF6B35]" /> {t.tema}
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
                  <Check className="w-3 h-3 text-[#FF6B35]" /> {t.modoJogo}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(MODES) as Array<keyof typeof MODES>).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setGameMode(mode);
                        setGameTime(MODES[mode].gameTime);
                        setShotClock(MODES[mode].shotClock);
                        setIsRunning(false);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${gameMode === mode ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-bg-primary text-text-secondary'}`}
                    >
                      {MODES[mode].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wake Lock Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-border mt-4">
                <span className="text-xs font-bold text-text-primary">{t.telaSempreLigada}</span>
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

      {/* Bottom Navigation - More Compact */}
      <nav className="w-full max-w-2xl bg-bg-card rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] px-4 py-2 flex justify-between items-center shrink-0 transition-colors duration-300">
        <NavButton 
          active={activeTab === 'placar'} 
          onClick={() => setActiveTab('placar')}
          icon={<LayoutGrid className="w-5 h-5" />}
          label={t.placar}
        />
        <NavButton 
          active={activeTab === 'historico'} 
          onClick={() => setActiveTab('historico')}
          icon={<History className="w-5 h-5" />}
          label={t.historico}
        />
        <NavButton 
          active={activeTab === 'estatisticas'} 
          onClick={() => setActiveTab('estatisticas')}
          icon={<BarChart3 className="w-5 h-5" />}
          label={t.estatisticas}
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
        className="w-full max-w-xs bg-bg-card rounded-[32px] p-6 shadow-2xl flex flex-col gap-6"
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
          className="w-full h-14 bg-[#FF6B35] text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg"
          onClick={() => onSave(mins * 60 + secs)}
        >
          <Check className="w-5 h-5" />
          {t.salvarTempo}
        </button>
      </motion.div>
    </motion.div>
  );
}

function TeamCard({ label, name, onNameChange, score, onAdd1, onAdd2, t }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);

  const handleSave = () => {
    onNameChange((tempName || name).toUpperCase());
    setIsEditing(false);
  };

  return (
    <div className="bg-bg-card rounded-[24px] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col items-center gap-2 transition-colors duration-300">
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
    </div>
  );
}

function FoulCard({ label, fouls, onAddFoul, t }: any) {
  const isBonus = fouls >= 7;
  return (
    <div 
      className={`rounded-[24px] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col items-start gap-2 cursor-pointer h-full transition-colors duration-300 ${isBonus ? 'bg-[#FF6B35]' : 'bg-bg-card'}`}
      onClick={onAddFoul}
    >
      <div className="w-full flex justify-between items-center min-h-[2.5rem]">
        <span className={`text-[9px] font-bold uppercase tracking-widest leading-tight text-left ${isBonus ? 'text-white/80' : 'text-text-secondary'}`}>{label}</span>
        <span className={`text-xl font-black font-mono ${isBonus ? 'text-white' : 'text-text-primary'}`}>{fouls.toString().padStart(2, '0')}</span>
      </div>
      <div className="flex gap-1 justify-center w-full">
        {[...Array(7)].map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 h-1.5 rounded-full transition-colors ${i < fouls ? (isBonus ? 'bg-white' : 'bg-[#FF6B35]') : (isBonus ? 'bg-white/20' : 'bg-border')}`} 
          />
        ))}
      </div>
      <div className="text-left w-full">
        <span className={`text-[8px] font-bold uppercase tracking-widest ${isBonus ? 'text-white' : 'text-text-secondary'}`}>
          • {t.bonus}
        </span>
      </div>
    </div>
  );
}

function ControlButton({ icon, label, onClick, disabled }: any) {
  return (
    <motion.button
      className={`flex flex-col items-center justify-center gap-1 h-14 rounded-xl bg-bg-card shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-border transition-colors duration-300 ${disabled ? 'opacity-50 grayscale' : ''}`}
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

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      className="flex flex-col items-center gap-0.5 group"
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
