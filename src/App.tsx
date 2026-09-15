/**
 * Contra Arcade Web App
 * Authentic NES style Contra run-and-gun arcade game
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ContraGameEngine } from './game/engine';
import { GameHUD } from './components/GameHUD';
import { ContraCanvas } from './components/ContraCanvas';
import { TouchControls } from './components/TouchControls';
import { InstructionsModal } from './components/InstructionsModal';
import { audio } from './game/audio';
import { vibration } from './game/vibration';
import { 
  Volume2, 
  VolumeX, 
  Tv, 
  HelpCircle, 
  Maximize, 
  Sparkles, 
  Gamepad2, 
  RotateCcw,
  Smartphone,
  Phone,
  Pause,
  Play,
  Vibrate,
  VibrateOff
} from 'lucide-react';

export default function App() {
  const engine = useMemo(() => new ContraGameEngine(), []);
  const [showCRT, setShowCRT] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVibrationEnabled, setIsVibrationEnabled] = useState<boolean>(() => vibration.isVibrationEnabled());
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState(engine.status);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);
  const [hudTick, setHudTick] = useState<number>(0);

  // Detect mobile / touch device
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setShowTouchControls(isTouchDevice);
  }, []);

  // Sync HUD state periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setHudTick(prev => prev + 1);
    }, 150);
    return () => clearInterval(timer);
  }, []);

  // Audio Toggle
  const handleToggleMute = useCallback(() => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  }, []);

  // Vibration / Haptics Toggle
  const handleToggleVibration = useCallback(() => {
    const next = vibration.toggle();
    setIsVibrationEnabled(next);
  }, []);

  // Konami Code Quick Trigger
  const handleTrigger30Lives = useCallback(() => {
    engine.activate30Lives();
  }, [engine]);

  // Fullscreen Toggle
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Pause / Resume Toggle
  const handlePauseToggle = useCallback(() => {
    if (engine.status === 'playing') {
      engine.status = 'paused';
      setGameStatus('paused');
      audio.stopBGM();
      vibration.stop();
    } else if (engine.status === 'paused') {
      engine.status = 'playing';
      setGameStatus('playing');
      audio.startBGM();
    }
  }, [engine]);

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-white select-none overflow-hidden">
      {/* Top Arcade Control Header */}
      <header className="h-12 bg-zinc-900 border-b border-zinc-800 px-3 sm:px-6 flex items-center justify-between shrink-0 z-30">
        {/* Title & Creator Intro */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center font-arcade text-xs font-black shadow-md shadow-red-600/50">
            C
          </div>
          <h1 className="font-arcade text-xs sm:text-sm text-red-500 tracking-wider">
            CONTRA <span className="text-zinc-400 text-[10px] hidden sm:inline">ARCADE</span>
          </h1>

          {/* Author Badge by Hải Hoàng 0918001944 */}
          <a
            href="tel:0918001944"
            title="Liên hệ / Zalo: 0918001944"
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/50 hover:border-amber-400 text-amber-300 text-[10px] font-arcade transition-colors"
          >
            <Phone className="w-3 h-3 text-amber-400" />
            <span>BY HẢI HOÀNG</span>
            <span className="text-zinc-400 hidden md:inline">0918001944</span>
          </a>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick 30 Lives Konami Button */}
          <button
            type="button"
            id="btn-30-lives"
            onClick={handleTrigger30Lives}
            title="Kích hoạt 30 mạng (Mã Konami)"
            className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/80 text-amber-400 rounded text-[11px] font-arcade flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">30 MẠNG</span>
          </button>

          {/* Toggle Touch Controls */}
          <button
            type="button"
            id="btn-touch-toggle"
            onClick={() => setShowTouchControls(prev => !prev)}
            title="Bật/Tắt phím cảm ứng màn hình"
            className={`p-1.5 rounded border text-xs ${
              showTouchControls
                ? 'bg-sky-600/30 border-sky-500 text-sky-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Pause / Resume Button (Always accessible in top header without covering screen) */}
          {(gameStatus === 'playing' || gameStatus === 'paused') && (
            <button
              type="button"
              id="btn-pause-header"
              onClick={handlePauseToggle}
              title={gameStatus === 'paused' ? 'Tiếp tục trò chơi' : 'Tạm dừng trò chơi (P)'}
              className={`p-1.5 rounded border text-xs transition-colors ${
                gameStatus === 'paused'
                  ? 'bg-yellow-600/40 border-yellow-500 text-yellow-300 shadow-md animate-pulse'
                  : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
              }`}
            >
              {gameStatus === 'paused' ? (
                <Play className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </button>
          )}

          {/* CRT Scanline filter toggle */}
          <button
            type="button"
            id="btn-crt-toggle"
            onClick={() => setShowCRT(prev => !prev)}
            title="Bật/Tắt hiệu ứng màn hình cong CRT cổ điển"
            className={`p-1.5 rounded border text-xs ${
              showCRT
                ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Audio Mute/Unmute */}
          <button
            type="button"
            id="btn-audio-toggle"
            onClick={handleToggleMute}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
          </button>

          {/* Vibration Haptic Feedback Toggle */}
          <button
            type="button"
            id="btn-vibration-toggle"
            onClick={handleToggleVibration}
            title={isVibrationEnabled ? 'Tắt rung phản hồi' : 'Bật rung khi bị bắn & diệt trùm'}
            className={`p-1.5 rounded border transition-colors ${
              isVibrationEnabled
                ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-amber-400'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-500'
            }`}
          >
            {isVibrationEnabled ? <Vibrate className="w-4 h-4 text-amber-400" /> : <VibrateOff className="w-4 h-4 text-zinc-500" />}
          </button>

          {/* Instructions Modal */}
          <button
            type="button"
            id="btn-instructions"
            onClick={() => setShowInstructions(true)}
            title="Hướng dẫn chơi & Phím điều khiển"
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            id="btn-fullscreen"
            onClick={handleToggleFullscreen}
            title="Toàn màn hình"
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors hidden sm:block"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Retro Game HUD (Lives, Score, Weapon, Stage Progress) */}
      <GameHUD
        players={engine.players}
        highScore={engine.highScore}
        stageName={engine.currentLevel.name}
        stageSubtitle={engine.currentLevel.subtitle}
        stageNumber={engine.levelIndex + 1}
        totalStages={engine.levels.length}
        konamiActive={engine.konamiActivated}
        difficulty={engine.difficulty}
      />

      {/* Main Canvas Game Area */}
      <main className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
        <ContraCanvas
          engine={engine}
          showCRT={showCRT}
          onStatusChange={setGameStatus}
          onOpenInstructions={() => setShowInstructions(true)}
        />

        {/* Floating Virtual Touch Controls (on mobile or enabled) */}
        {showTouchControls && gameStatus === 'playing' && (
          <div className="absolute inset-x-0 bottom-0 pointer-events-none z-30">
            <TouchControls
              inputState={engine.p1Input}
              onPauseToggle={handlePauseToggle}
            />
          </div>
        )}
      </main>

      {/* Desktop Quick Controls Legend Footer */}
      <footer className="h-8 bg-zinc-950 border-t border-zinc-800/80 px-4 flex items-center justify-between text-[10px] text-zinc-400 font-arcade shrink-0">
        <div className="flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap">
          <span><kbd className="text-zinc-200">WASD / Mũi tên</kbd>: Di chuyển</span>
          <span><kbd className="text-amber-400 font-bold">J / Z</kbd>: Bắn</span>
          <span><kbd className="text-amber-400 font-bold">K / X</kbd>: Nhảy</span>
          <span><kbd className="text-zinc-200">↓ + Nhảy</kbd>: Tụt tầng</span>
          <span><kbd className="text-zinc-200">P</kbd>: Tạm dừng</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-zinc-400">
          <span className="text-amber-400">TÁC GIẢ: HẢI HOÀNG (0918001944)</span>
          <span>•</span>
          <div className="flex items-center gap-1 text-zinc-500">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>GAMEPAD READY</span>
          </div>
        </div>
      </footer>

      {/* Instructions & Help Modal */}
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        onTrigger30Lives={handleTrigger30Lives}
      />
    </div>
  );
}
