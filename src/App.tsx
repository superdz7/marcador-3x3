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

const INITIAL_GAME_TIME = 600; // 10:00
const INITIAL_SHOT_CLOCK = 12;
const MAX_SCORE = 21;

// --- Components ---

const Digit = ({ value }: { value: string | number }) => (
  <span className="inline-block min-w-[0.6em] text-center font-mono font-bold">
    {value}
  </span>
);

export default function App() {
  // --- State ---
  const [gameTime, setGameTime] = useState(INITIAL_GAME_TIME);
  const [shotClock, setShotClock] = useState(INITIAL_SHOT_CLOCK);
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    const finalScore = `PLACAR FINAL: CASA ${homeScore} x ${visitorScore} VISITANTE`;
    const fullText = `Histórico da Partida 3X3\n\n${text}\n\n${finalScore}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Histórico de Jogo 3X3',
        text: fullText,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(fullText);
      alert('Histórico copiado para a área de transferência!');
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
    if (window.confirm('Deseja reiniciar o placar?')) {
      setGameTime(INITIAL_GAME_TIME);
      setShotClock(INITIAL_SHOT_CLOCK);
      setHomeScore(0);
      setVisitorScore(0);
      setHomeFouls(0);
      setVisitorFouls(0);
      setHomeName('BE CITY');
      setVisitorName('BULLS');
      setIsRunning(false);
      setHistory([]);
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
    saveToHistory(`${team === 'home' ? 'Casa' : 'Visitante'} +${amount} pts`);
    if (team === 'home') {
      setHomeScore(prev => Math.min(MAX_SCORE, prev + amount));
    } else {
      setVisitorScore(prev => Math.min(MAX_SCORE, prev + amount));
    }
    // Reset shot clock on score
    setShotClock(INITIAL_SHOT_CLOCK);
  };

  const updateFouls = (team: Team) => {
    saveToHistory(team === 'home' ? 'Falta da equipe da Casa' : 'Falta da equipe Visitante');
    if (team === 'home') {
      setHomeFouls(prev => prev + 1);
    } else {
      setVisitorFouls(prev => prev + 1);
    }
    // Pause game timer on foul
    setIsRunning(false);
  };

  // --- Effects ---

  useEffect(() => {
    if (isRunning) {
      if (!hasStarted.current) {
        saveToHistory('Início da Partida');
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
            setIsRunning(false); // Pause game on shot clock violation
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
  }, [isRunning]);

  useEffect(() => {
    if (homeScore >= MAX_SCORE || visitorScore >= MAX_SCORE || (gameTime === 0 && hasStarted.current)) {
      if (isRunning || gameTime === 0) {
        saveToHistory(`Fim de Jogo - Placar: ${homeScore} x ${visitorScore}`);
      }
      setIsRunning(false);
      playBuzzer();
    }
  }, [homeScore, visitorScore, gameTime]);

  return (
    <div className="h-screen bg-[#F2F4F7] text-[#1A1C1E] font-sans flex flex-col items-center p-3 select-none overflow-hidden">
      {/* Header - Compact */}
      <header className="w-full max-w-2xl flex items-center gap-2 mb-3 px-2">
        <div className="bg-[#FF6B35] p-1 rounded-full shadow-md">
          <Dribbble className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-xl font-black tracking-tighter text-[#FF6B35]">3X3</h1>
      </header>

      {/* Main Scoreboard Area */}
      <main className="w-full max-w-2xl flex-1 flex flex-col gap-3 min-h-0">
        {activeTab === 'placar' ? (
          <>
            {/* Timer & Shot Clock Row */}
            <div className="flex gap-3 h-32 shrink-0">
              {/* Game Timer */}
              <motion.div 
                className="flex-[3.5] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-y-4 border-[#FF6B35] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer"
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditingTime(true)}
              >
                <span className="text-[9px] font-bold text-[#A0AEC0] uppercase tracking-widest absolute top-2">Tempo de Jogo</span>
                <div className="text-7xl font-bold tracking-tighter text-[#1A1C1E] mt-2 font-display">
                  {formatTime(gameTime)}
                </div>
              </motion.div>

              {/* Shot Clock */}
              <motion.div 
                className="flex-1 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col items-center justify-center relative cursor-pointer"
                whileTap={{ scale: 0.9 }}
                onClick={() => setShotClock(INITIAL_SHOT_CLOCK)}
              >
                <span className="text-[9px] font-bold text-[#FF6B35] uppercase tracking-widest absolute top-2">Posse</span>
                <div className={`text-4xl font-black text-[#FF6B35] mt-2 font-mono ${shotClock <= 3 ? 'animate-pulse' : ''}`}>
                  {shotClock.toString().padStart(2, '0')}
                </div>
              </motion.div>
            </div>

            {/* Teams Row */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <TeamCard 
                label="CASA"
                name={homeName}
                onNameChange={setHomeName}
                score={homeScore}
                onAdd1={() => updateScore('home', 1)}
                onAdd2={() => updateScore('home', 2)}
              />
              <TeamCard 
                label="VISITANTE"
                name={visitorName}
                onNameChange={setVisitorName}
                score={visitorScore}
                onAdd1={() => updateScore('visitor', 1)}
                onAdd2={() => updateScore('visitor', 2)}
              />
            </div>

            {/* Fouls Row - Separated */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <FoulCard 
                label={<>Faltas<br/>da Casa</>}
                fouls={homeFouls}
                onAddFoul={() => updateFouls('home')}
              />
              <FoulCard 
                label={<>Faltas<br/>do Visitante</>}
                fouls={visitorFouls}
                onAddFoul={() => updateFouls('visitor')}
              />
            </div>

            {/* Controls Row */}
            <div className="grid grid-cols-4 gap-3 mt-auto mb-2 shrink-0">
              <ControlButton 
                icon={<Undo2 className="w-5 h-5" />} 
                label="DESFAZER" 
                onClick={handleUndo}
                disabled={history.length === 0}
              />
              
              <motion.button
                className={`col-span-1 h-14 rounded-xl flex items-center justify-center shadow-lg transition-colors ${isRunning ? 'bg-[#1A1C1E] text-white' : 'bg-[#FF6B35] text-white'}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
              </motion.button>

              <ControlButton 
                icon={<Volume2 className="w-5 h-5" />} 
                label="BUZZER" 
                onClick={playBuzzer}
              />

              <ControlButton 
                icon={<RotateCcw className="w-5 h-5" />} 
                label="REINICIAR" 
                onClick={resetGame}
              />
            </div>
          </>
        ) : activeTab === 'historico' ? (
          <div className="flex-1 flex flex-col gap-3 min-h-0 mb-2">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-lg font-black text-[#1A1C1E]">Histórico da Partida</h2>
              <motion.button
                className="p-2 bg-[#FF6B35] text-white rounded-xl shadow-md flex items-center gap-2 text-[10px] font-bold"
                whileTap={{ scale: 0.95 }}
                onClick={shareHistory}
              >
                <Share2 className="w-4 h-4" />
                COMPARTILHAR
              </motion.button>
            </div>
            <div className="flex-1 bg-white rounded-[32px] shadow-lg p-4 overflow-y-auto space-y-3 no-scrollbar">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#A0AEC0] gap-2">
                  <History className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-bold">Nenhuma ação registrada</p>
                </div>
              ) : (
                history.map((action) => (
                  <div key={action.id} className="flex items-start gap-3 border-b border-[#F2F4F7] pb-2">
                    <div className="text-[10px] font-mono text-[#A0AEC0] pt-1">
                      {new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#1A1C1E]">{action.description}</p>
                      <p className="text-[10px] text-[#A0AEC0]">Placar: {action.state.homeScore} x {action.state.visitorScore}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#A0AEC0]">
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
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation - More Compact */}
      <nav className="w-full max-w-2xl bg-white rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] px-4 py-2 flex justify-between items-center shrink-0">
        <NavButton 
          active={activeTab === 'placar'} 
          onClick={() => setActiveTab('placar')}
          icon={<LayoutGrid className="w-5 h-5" />}
          label="PLACAR"
        />
        <NavButton 
          active={activeTab === 'historico'} 
          onClick={() => setActiveTab('historico')}
          icon={<History className="w-5 h-5" />}
          label="HISTÓRICO"
        />
        <NavButton 
          active={activeTab === 'estatisticas'} 
          onClick={() => setActiveTab('estatisticas')}
          icon={<BarChart3 className="w-5 h-5" />}
          label="ESTATÍSTICAS"
        />
        <NavButton 
          active={activeTab === 'opcoes'} 
          onClick={() => setActiveTab('opcoes')}
          icon={<Settings className="w-5 h-5" />}
          label="OPÇÕES"
        />
      </nav>
    </div>
  );
}

// --- Sub-components ---

function TimeEditor({ currentTime, onSave, onClose }: any) {
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
        className="w-full max-w-xs bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-6"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="flex justify-between items-center">
          <h3 className="font-black text-[#1A1C1E] uppercase tracking-widest text-sm">Editar Tempo</h3>
          <button onClick={onClose} className="p-2 text-[#A0AEC0]"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex justify-center items-center gap-4">
          {/* Minutes */}
          <div className="flex flex-col items-center gap-2">
            <button onClick={() => adjustMins(1)} className="p-3 bg-[#F2F4F7] rounded-xl text-[#FF6B35]"><Plus className="w-6 h-6" /></button>
            <div className="text-4xl font-black font-mono w-16 text-center">{mins.toString().padStart(2, '0')}</div>
            <button onClick={() => adjustMins(-1)} className="p-3 bg-[#F2F4F7] rounded-xl text-[#FF6B35]"><Minus className="w-6 h-6" /></button>
            <span className="text-[8px] font-bold text-[#A0AEC0] uppercase">Minutos</span>
          </div>

          <div className="text-4xl font-black text-[#A0AEC0] pb-8">:</div>

          {/* Seconds */}
          <div className="flex flex-col items-center gap-2">
            <button onClick={() => adjustSecs(1)} className="p-3 bg-[#F2F4F7] rounded-xl text-[#FF6B35]"><Plus className="w-6 h-6" /></button>
            <div className="text-4xl font-black font-mono w-16 text-center">{secs.toString().padStart(2, '0')}</div>
            <button onClick={() => adjustSecs(-1)} className="p-3 bg-[#F2F4F7] rounded-xl text-[#FF6B35]"><Minus className="w-6 h-6" /></button>
            <span className="text-[8px] font-bold text-[#A0AEC0] uppercase">Segundos</span>
          </div>
        </div>

        <button 
          className="w-full h-14 bg-[#FF6B35] text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg"
          onClick={() => onSave(mins * 60 + secs)}
        >
          <Check className="w-5 h-5" />
          SALVAR TEMPO
        </button>
      </motion.div>
    </motion.div>
  );
}

function TeamCard({ label, name, onNameChange, score, onAdd1, onAdd2 }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);

  const handleSave = () => {
    onNameChange((tempName || name).toUpperCase());
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-[24px] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col items-center gap-2">
      <div className="text-center w-full">
        <span className="text-[9px] font-bold text-[#FF6B35] uppercase tracking-widest">{label}</span>
        {isEditing ? (
          <div className="flex gap-1 mt-1">
            <input 
              autoFocus
              className="w-full text-center bg-[#F2F4F7] rounded-md text-sm font-black text-[#1A1C1E] py-1 outline-[#FF6B35] uppercase"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        ) : (
          <h2 
            className="text-base font-black text-[#1A1C1E] leading-tight truncate w-full text-center cursor-pointer hover:text-[#FF6B35] transition-colors uppercase"
            onClick={() => setIsEditing(true)}
          >
            {name}
          </h2>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-bold text-[#1A1C1E] font-display">{score}</span>
        <span className="text-[9px] font-bold text-[#A0AEC0]">PTS</span>
      </div>

      <div className="flex gap-2 w-full">
        <motion.button 
          className="flex-1 h-10 rounded-lg bg-[#FFF0EB] text-[#FF6B35] font-black text-lg flex items-center justify-center shadow-sm"
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

function FoulCard({ label, fouls, onAddFoul }: any) {
  const isBonus = fouls >= 7;
  return (
    <div 
      className={`rounded-[24px] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col items-start gap-2 cursor-pointer h-full transition-colors duration-300 ${isBonus ? 'bg-[#FF6B35]' : 'bg-white'}`}
      onClick={onAddFoul}
    >
      <div className="w-full flex justify-between items-center min-h-[2.5rem]">
        <span className={`text-[9px] font-bold uppercase tracking-widest leading-tight text-left ${isBonus ? 'text-white/80' : 'text-[#A0AEC0]'}`}>{label}</span>
        <span className={`text-xl font-black font-mono ${isBonus ? 'text-white' : 'text-[#1A1C1E]'}`}>{fouls.toString().padStart(2, '0')}</span>
      </div>
      <div className="flex gap-1 justify-center w-full">
        {[...Array(7)].map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 h-1.5 rounded-full transition-colors ${i < fouls ? (isBonus ? 'bg-white' : 'bg-[#FF6B35]') : (isBonus ? 'bg-white/20' : 'bg-[#E2E8F0]')}`} 
          />
        ))}
      </div>
      <div className="text-left w-full">
        <span className={`text-[8px] font-bold uppercase tracking-widest ${isBonus ? 'text-white' : 'text-[#A0AEC0]'}`}>
          • Bônus
        </span>
      </div>
    </div>
  );
}

function ControlButton({ icon, label, onClick, disabled }: any) {
  return (
    <motion.button
      className={`flex flex-col items-center justify-center gap-1 h-14 rounded-xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#F2F4F7] ${disabled ? 'opacity-50 grayscale' : ''}`}
      whileHover={disabled ? {} : { scale: 1.05, backgroundColor: '#F8FAFC' }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="text-[#A0AEC0]">{icon}</div>
      <span className="text-[7px] font-bold text-[#A0AEC0] uppercase tracking-widest">{label}</span>
    </motion.button>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      className="flex flex-col items-center gap-0.5 group"
      onClick={onClick}
    >
      <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-[#FFF0EB] text-[#FF6B35]' : 'text-[#A0AEC0] group-hover:text-[#FF6B35]'}`}>
        {icon}
      </div>
      <span className={`text-[8px] font-black tracking-widest ${active ? 'text-[#FF6B35]' : 'text-[#A0AEC0]'}`}>
        {label}
      </span>
    </button>
  );
}
