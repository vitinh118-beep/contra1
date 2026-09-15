import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ContraGameEngine } from '../game/engine';
import { GameMode, GameStatus, GameDifficulty } from '../types';
import { audio } from '../game/audio';
import { vibration } from '../game/vibration';
import { Play, Users, Sparkles, RefreshCw, Trophy, Gauge, ShieldAlert, Phone, Layers } from 'lucide-react';

interface ContraCanvasProps {
  engine: ContraGameEngine;
  showCRT: boolean;
  onStatusChange?: (status: GameStatus) => void;
  onOpenInstructions: () => void;
}

export const ContraCanvas: React.FC<ContraCanvasProps> = ({
  engine,
  showCRT,
  onStatusChange,
  onOpenInstructions,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentStatus, setCurrentStatus] = useState<GameStatus>(engine.status);
  const [menuSelection, setMenuSelection] = useState<GameMode>('1P');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [startWith30Lives, setStartWith30Lives] = useState<boolean>(false);
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
  const [dimensions, setDimensions] = useState({ width: 960, height: 540 });

  // Handle Container Responsive Sizing
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const targetRatio = 16 / 9;
      let w = rect.width;
      let h = rect.width / targetRatio;

      if (h > rect.height) {
        h = rect.height;
        w = rect.height * targetRatio;
      }

      setDimensions({ width: Math.floor(w), height: Math.floor(h) });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Audio unlock on user gesture
      audio.enableAudio();

      // Pass key to Konami detector
      engine.handleKeyDown(e.key);

      // Pause toggle
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (engine.status === 'playing') {
          engine.status = 'paused';
          setCurrentStatus('paused');
          onStatusChange?.('paused');
          audio.stopBGM();
          vibration.stop();
        } else if (engine.status === 'paused') {
          engine.status = 'playing';
          setCurrentStatus('playing');
          onStatusChange?.('playing');
          audio.startBGM();
        }
        return;
      }

      // Player 1 Keys (Arrows / WASD, J/Z Shoot, K/X Jump)
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          engine.p1Input.up = true;
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 'KeyS':
          engine.p1Input.down = true;
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'KeyA':
          engine.p1Input.left = true;
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'KeyD':
          engine.p1Input.right = true;
          e.preventDefault();
          break;
        case 'KeyJ':
        case 'KeyZ':
        case 'Space':
          engine.p1Input.shoot = true;
          e.preventDefault();
          break;
        case 'KeyK':
        case 'KeyX':
          engine.p1Input.jump = true;
          e.preventDefault();
          break;

        // Player 2 Keys (Numpad 8 4 5 6 or IJKL, U shoot, I jump)
        case 'Numpad8':
        case 'KeyI':
          engine.p2Input.up = true;
          e.preventDefault();
          break;
        case 'Numpad5':
        case 'Numpad2':
        case 'KeyK':
          if (engine.mode === '2P') engine.p2Input.down = true;
          break;
        case 'Numpad4':
          engine.p2Input.left = true;
          e.preventDefault();
          break;
        case 'Numpad6':
          engine.p2Input.right = true;
          e.preventDefault();
          break;
        case 'Numpad1':
        case 'KeyU':
          engine.p2Input.shoot = true;
          e.preventDefault();
          break;
        case 'Numpad0':
        case 'KeyO':
          engine.p2Input.jump = true;
          e.preventDefault();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          engine.p1Input.up = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          engine.p1Input.down = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          engine.p1Input.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          engine.p1Input.right = false;
          break;
        case 'KeyJ':
        case 'KeyZ':
        case 'Space':
          engine.p1Input.shoot = false;
          break;
        case 'KeyK':
        case 'KeyX':
          engine.p1Input.jump = false;
          break;

        // Player 2
        case 'Numpad8':
        case 'KeyI':
          engine.p2Input.up = false;
          break;
        case 'Numpad5':
        case 'Numpad2':
          engine.p2Input.down = false;
          break;
        case 'Numpad4':
          engine.p2Input.left = false;
          break;
        case 'Numpad6':
          engine.p2Input.right = false;
          break;
        case 'Numpad1':
        case 'KeyU':
          engine.p2Input.shoot = false;
          break;
        case 'Numpad0':
        case 'KeyO':
          engine.p2Input.jump = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, onStatusChange]);

  // Main 60 FPS Locked Canvas Game Loop + Gamepad Polling
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulator = 0;
    const FIXED_STEP = 1000 / 60; // 16.6667ms per physics tick

    const loop = (currentTime: number) => {
      // Delta time capped to 100ms to avoid spiral of death on tab switch
      const frameDelta = Math.min(currentTime - lastTime, 100);
      lastTime = currentTime;
      accumulator += frameDelta;

      // Poll Web Gamepad API for controller inputs
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      if (gamepads[0]) {
        const gp = gamepads[0];
        // D-Pad or Left Stick
        engine.p1Input.left = gp.axes[0] < -0.4 || gp.buttons[14]?.pressed;
        engine.p1Input.right = gp.axes[0] > 0.4 || gp.buttons[15]?.pressed;
        engine.p1Input.up = gp.axes[1] < -0.4 || gp.buttons[12]?.pressed;
        engine.p1Input.down = gp.axes[1] > 0.4 || gp.buttons[13]?.pressed;
        // A (Jump - Button 0) and X/B (Shoot - Button 2 or 1)
        engine.p1Input.jump = gp.buttons[0]?.pressed || gp.buttons[1]?.pressed;
        engine.p1Input.shoot = gp.buttons[2]?.pressed || gp.buttons[3]?.pressed;
      }

      // Run fixed 60Hz updates
      let updates = 0;
      while (accumulator >= FIXED_STEP && updates < 4) {
        engine.update(FIXED_STEP);
        accumulator -= FIXED_STEP;
        updates++;
      }
      if (updates >= 4) {
        accumulator = 0;
      }

      // Render to internal 480x270 virtual canvas buffer
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, engine.viewWidth, engine.viewHeight);
          engine.render(ctx);
        }
      }

      // Sync status with React state if changed
      if (engine.status !== currentStatus) {
        setCurrentStatus(engine.status);
        onStatusChange?.(engine.status);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [engine, currentStatus, onStatusChange]);

  // Start game handler
  const handleStartGame = useCallback(
    (mode: GameMode, lives: number, diff: GameDifficulty = difficulty, stageIdx: number = selectedStageIndex) => {
      audio.enableAudio();
      engine.start(mode, lives, diff, stageIdx);
      setCurrentStatus('playing');
      onStatusChange?.('playing');
    },
    [engine, difficulty, selectedStageIndex, onStatusChange]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black select-none"
    >
      {/* Game Canvas */}
      <div
        style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
        className="relative shadow-2xl bg-zinc-950 flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          width={engine.viewWidth}
          height={engine.viewHeight}
          className="w-full h-full block"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* CRT Scanline and curvature filter overlay */}
        {showCRT && <div className="absolute inset-0 crt-scanlines crt-flicker pointer-events-none" />}

        {/* In-Game Round Announcement Banner during first 4 seconds of gameplay */}
        {currentStatus === 'playing' && engine.tick < 220 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/90 border-2 border-red-600 px-4 py-2 rounded-lg font-arcade text-center shadow-2xl pointer-events-none animate-pulse z-10">
            <div className="text-red-400 font-bold text-[11px] tracking-widest">
              VÒNG {engine.levelIndex + 1} / {engine.levels.length}
            </div>
            <div className="text-yellow-400 font-bold text-sm tracking-wider">
              {engine.currentLevel.name.toUpperCase()}
            </div>
            <div className="text-[10px] text-zinc-300">
              {engine.currentLevel.subtitle}
            </div>
          </div>
        )}

        {/* 1. TITLE SCREEN OVERLAY */}
        {currentStatus === 'title' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 sm:p-6 text-white font-arcade z-20 overflow-y-auto">
            {/* Title Logo */}
            <div className="text-center mb-4 sm:mb-5">
              <div className="text-4xl sm:text-6xl font-black tracking-widest text-red-600 drop-shadow-[0_4px_16px_rgba(220,38,38,0.8)] animate-pulse">
                CONTRA
              </div>
              <div className="text-xs sm:text-sm tracking-[0.25em] text-yellow-400 mt-1">
                ARCADE 4 VÒNG CHIẾN ĐẤU REMASTERED
              </div>

              {/* Creator Intro Section Requested by User */}
              <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-950/80 via-zinc-900 to-red-950/80 border border-amber-500/80 rounded-full shadow-md text-amber-300 text-xs">
                <Phone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>GIỚI THIỆU BỞI:</span>
                <span className="font-bold text-white tracking-wider">HẢI HOÀNG</span>
                <span className="text-amber-400 font-bold">0918001944</span>
              </div>
            </div>

            {/* Menu Options */}
            <div className="w-full max-w-sm space-y-2.5 mb-4 sm:mb-5 text-xs">
              {/* Player 1 / Player 2 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMenuSelection('1P')}
                  className={`py-2 px-3 rounded border flex items-center justify-center gap-1.5 transition-colors ${
                    menuSelection === '1P'
                      ? 'bg-red-600/90 border-yellow-400 text-white shadow-lg'
                      : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>1 NGƯỜI (BILL)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMenuSelection('2P')}
                  className={`py-2 px-3 rounded border flex items-center justify-center gap-1.5 transition-colors ${
                    menuSelection === '2P'
                      ? 'bg-red-600/90 border-yellow-400 text-white shadow-lg'
                      : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>2 NGƯỜI (CO-OP)</span>
                </button>
              </div>

              {/* Campaign Rounds Selection (4 Vòng Đấu & 4 Trùm Cuối) */}
              <div className="bg-zinc-900/90 border border-zinc-700 p-2.5 rounded-lg">
                <div className="flex items-center justify-between text-[11px] text-zinc-300 mb-1.5 font-bold">
                  <div className="flex items-center gap-1.5 text-sky-400">
                    <Layers className="w-3.5 h-3.5" />
                    <span>CHỌN VÒNG XUẤT PHÁT (4 VÒNG)</span>
                  </div>
                  <span className="text-amber-400 text-[10px]">
                    VÒNG {selectedStageIndex + 1}/4
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                  {engine.levels.map((lvl, idx) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setSelectedStageIndex(idx)}
                      className={`p-1.5 rounded border text-center transition-colors flex flex-col items-center justify-center ${
                        selectedStageIndex === idx
                          ? 'bg-red-600/40 border-yellow-400 text-yellow-300 font-bold'
                          : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="font-bold">VÒNG {idx + 1}</span>
                      <span className="text-[9px] text-zinc-300 truncate max-w-[80px]">
                        {idx === 0 ? 'Đảo Rừng' : idx === 1 ? 'Thác Nước' : idx === 2 ? 'Băng Tuyết' : 'Trùm Java'}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="text-[9px] text-zinc-400 mt-1 text-center truncate">
                  Trùm: {selectedStageIndex === 0 ? 'Pháo Đài Bức Tường Defense Wall' : selectedStageIndex === 1 ? 'Rồng Cơ Khí Bima Dragon' : selectedStageIndex === 2 ? 'Xe Tăng Bọc Thép Armored Tank' : 'Hoàng Đế Ngoài Hành Tinh Java Heart'}
                </div>
              </div>

              {/* 30 Lives Toggle */}
              <button
                type="button"
                onClick={() => setStartWith30Lives(!startWith30Lives)}
                className={`w-full py-1.5 px-3 rounded border flex items-center justify-between transition-colors ${
                  startWith30Lives
                    ? 'bg-amber-950/80 border-yellow-500 text-yellow-400'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>MÃ KONAMI: 30 MẠNG</span>
                </div>
                <span className="text-[10px] font-bold">
                  {startWith30Lives ? '[ĐANG BẬT]' : '[TẮT - 3/5 MẠNG]'}
                </span>
              </button>

              {/* Difficulty Selection */}
              <div className="bg-zinc-900/80 border border-zinc-700 p-2 rounded">
                <div className="flex items-center justify-between text-[11px] text-zinc-300 mb-1 font-bold">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-sky-400" />
                    <span>TỐC ĐỘ & ĐỘ KHÓ</span>
                  </div>
                  <span className={`text-[10px] ${
                    difficulty === 'easy' ? 'text-emerald-400' : difficulty === 'normal' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {difficulty === 'easy' ? 'DỄ (5 MẠNG)' : difficulty === 'normal' ? 'CHUẨN (3 MẠNG)' : 'ARCADE PRO'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setDifficulty('easy')}
                    className={`py-1 px-1 rounded border text-center transition-colors ${
                      difficulty === 'easy'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    DỄ
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficulty('normal')}
                    className={`py-1 px-1 rounded border text-center transition-colors ${
                      difficulty === 'normal'
                        ? 'bg-yellow-950 border-yellow-500 text-yellow-300 font-bold'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    CHUẨN
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficulty('hard')}
                    className={`py-1 px-1 rounded border text-center transition-colors ${
                      difficulty === 'hard'
                        ? 'bg-red-950 border-red-500 text-red-300 font-bold'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    KHÓ
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleStartGame(menuSelection, startWith30Lives ? 30 : (difficulty === 'easy' ? 5 : 3), difficulty, selectedStageIndex)}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-xl shadow-red-600/40 active:scale-95 transition-transform flex items-center gap-2 text-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                VÀO TRẬN (START GAME)
              </button>

              <button
                type="button"
                onClick={onOpenInstructions}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs border border-zinc-700"
              >
                HƯỚNG DẪN & TÁC GIẢ
              </button>
            </div>

            <div className="text-[10px] text-zinc-400 mt-4 tracking-wide text-center">
              CONTRA REMASTERED BY <span className="text-amber-400 font-bold">HẢI HOÀNG (0918001944)</span> • 4 VÒNG ĐẤU 4 TRÙM
            </div>
          </div>
        )}

        {/* 2. PAUSE SCREEN OVERLAY */}
        {currentStatus === 'paused' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-white font-arcade z-20 select-none">
            <div className="text-2xl sm:text-3xl text-yellow-400 font-bold mb-3 animate-pulse tracking-widest">
              PAUSE
            </div>
            <div className="text-[11px] sm:text-xs text-zinc-300 mb-6 text-center max-w-sm px-4">
              Trò chơi đang tạm dừng (Vòng {engine.levelIndex + 1}/4). Chạm TIẾP TỤC hoặc bấm phím P.
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  engine.status = 'playing';
                  setCurrentStatus('playing');
                  onStatusChange?.('playing');
                  audio.startBGM();
                }}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs rounded font-bold shadow-lg active:scale-95 transition-transform"
              >
                TIẾP TỤC
              </button>
              <button
                type="button"
                onClick={() => {
                  engine.status = 'title';
                  setCurrentStatus('title');
                  onStatusChange?.('title');
                  audio.stopBGM();
                  vibration.stop();
                }}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-300 text-xs rounded border border-zinc-700 active:scale-95 transition-transform"
              >
                VỀ MENU CHÍNH
              </button>
            </div>
          </div>
        )}

        {/* 3. GAME OVER OVERLAY */}
        {currentStatus === 'game_over' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-white font-arcade z-20 text-center">
            <div className="text-4xl text-red-600 font-black mb-2 drop-shadow-[0_2px_10px_rgba(220,38,38,0.7)]">
              GAME OVER
            </div>
            <div className="text-sm text-yellow-400 font-bold mb-1">
              BẠN ĐÃ DỪNG LẠI Ở VÒNG {engine.levelIndex + 1} / {engine.levels.length}: {engine.currentLevel.name.toUpperCase()}
            </div>
            <div className="text-xs text-zinc-300 mb-1">
              ĐIỂM SỐ ĐẠT ĐƯỢC: {engine.players[0]?.score || 0}
            </div>
            <div className="text-[11px] text-zinc-400 mb-5">
              KỶ LỤC CAO NHẤT: {engine.highScore}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button
                type="button"
                onClick={() => handleStartGame(engine.mode, difficulty === 'easy' ? 5 : 3, difficulty, engine.levelIndex)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded font-bold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                CHƠI LẠI VÒNG {engine.levelIndex + 1}
              </button>
              <button
                type="button"
                onClick={() => handleStartGame(engine.mode, 30, difficulty, engine.levelIndex)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded font-bold flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                TIẾP TỤC VỚI 30 MẠNG
              </button>
            </div>

            <div className="text-[10px] text-zinc-500">
              Contra Arcade Remastered by <span className="text-amber-400 font-bold">Hải Hoàng - 0918001944</span>
            </div>
          </div>
        )}

        {/* 4. VICTORY OVERLAY */}
        {currentStatus === 'victory' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-white font-arcade z-20 text-center">
            <Trophy className="w-16 h-16 text-yellow-400 mb-3 animate-bounce" />
            <div className="text-2xl sm:text-3xl text-yellow-400 font-bold mb-2">
              CHIẾN THẮNG TOÀN DIỆN!
            </div>
            <div className="text-sm text-zinc-200 mb-2 max-w-md">
              BẠN ĐÃ TIÊU DIỆT TOÀN BỘ 4 ĐẠI TRÙM CUỐI: PHÁO ĐÀI, RỒNG BIMA, XE TĂNG VÀ HOÀNG ĐẾ JAVA!
            </div>
            <div className="text-xs text-emerald-400 mb-4 font-bold">
              HOÀN THÀNH TOÀN BỘ 4 VÒNG CHIẾN ĐẤU CONTRA
            </div>
            <div className="text-sm text-red-400 mb-5 font-bold">
              TỔNG ĐIỂM CHIẾN DỊCH: {engine.players[0]?.score || 0}
            </div>

            <button
              type="button"
              onClick={() => {
                engine.status = 'title';
                setCurrentStatus('title');
              }}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded shadow-lg mb-4"
            >
              VỀ MENU CHÍNH
            </button>

            <div className="text-[10px] text-zinc-400">
              Contra Arcade Remastered by <span className="text-amber-400 font-bold">Hải Hoàng (0918001944)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
