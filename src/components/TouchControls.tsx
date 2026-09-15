import React, { useRef, useCallback } from 'react';
import { InputState } from '../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair, ChevronDown, Pause } from 'lucide-react';

interface TouchControlsProps {
  inputState: InputState;
  onPauseToggle: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ inputState, onPauseToggle }) => {
  const dpadRef = useRef<HTMLDivElement>(null);

  // Handle D-Pad touch positioning for 8-way directional tracking
  const handleTouchDpad = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!dpadRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;

      const rect = dpadRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      const dist = Math.hypot(dx, dy);

      const deadzone = 12;
      if (dist < deadzone) {
        inputState.left = false;
        inputState.right = false;
        inputState.up = false;
        inputState.down = false;
        return;
      }

      const angle = Math.atan2(dy, dx); // radians from -PI to +PI

      // 8-way sector segmentation
      // Right: ~0, Down-Right: PI/4, Down: PI/2, Down-Left: 3PI/4, Left: PI, Up-Left: -3PI/4, Up: -PI/2, Up-Right: -PI/4
      const sector = Math.round((angle / (Math.PI / 4)) + 8) % 8;

      inputState.right = sector === 0 || sector === 1 || sector === 7;
      inputState.left = sector === 3 || sector === 4 || sector === 5;
      inputState.down = sector === 1 || sector === 2 || sector === 3;
      inputState.up = sector === 5 || sector === 6 || sector === 7;
    },
    [inputState]
  );

  const handleTouchEndDpad = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      inputState.left = false;
      inputState.right = false;
      inputState.up = false;
      inputState.down = false;
    },
    [inputState]
  );

  return (
    <div className="relative w-full select-none touch-none pointer-events-none">
      {/* Top Floating Unobtrusive Pause Icon (Tucked safely in top-right corner, not covering center) */}
      <div className="absolute -top-12 right-3 pointer-events-auto z-40">
        <button
          type="button"
          onClick={onPauseToggle}
          title="Tạm dừng"
          aria-label="Tạm dừng trò chơi"
          className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 border border-white/25 text-zinc-300 flex items-center justify-center backdrop-blur-xs active:scale-95 transition-transform shadow-md"
        >
          <Pause className="w-3.5 h-3.5 fill-zinc-300" />
        </button>
      </div>

      {/* Main Gamepad Row: Left D-Pad, Middle Completely Clear, Right Action Buttons */}
      <div className="w-full flex items-end justify-between px-3 pb-3 sm:px-6 sm:pb-5">
        {/* 8-Way D-Pad on Left (Semi-transparent so screen is visible) */}
        <div className="flex flex-col items-center pointer-events-auto">
          <div
            ref={dpadRef}
            onTouchStart={handleTouchDpad}
            onTouchMove={handleTouchDpad}
            onTouchEnd={handleTouchEndDpad}
            onTouchCancel={handleTouchEndDpad}
            className="relative w-28 h-28 sm:w-34 sm:h-34 bg-black/40 border border-white/25 rounded-full shadow-2xl flex items-center justify-center backdrop-blur-xs active:bg-black/60 transition-colors"
          >
            {/* Visual Cross */}
            <div className="absolute w-9 sm:w-11 h-24 sm:h-28 bg-white/10 border border-white/15 rounded-lg flex flex-col justify-between items-center py-1.5 pointer-events-none">
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
              <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
            </div>
            <div className="absolute w-24 sm:w-28 h-9 sm:h-11 bg-white/10 border border-white/15 rounded-lg flex justify-between items-center px-1.5 pointer-events-none">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
            </div>
            {/* Center thumbpad */}
            <div className="w-8 h-8 bg-zinc-800/80 border border-zinc-500/50 rounded-full shadow-inner flex items-center justify-center z-10 pointer-events-none">
              <div className="w-3 h-3 bg-zinc-900 rounded-full" />
            </div>
          </div>
        </div>

        {/* Center Area: COMPLETELY EMPTY & TRANSPARENT (Zero buttons, zero text to never block phone screen!) */}
        <div className="flex-1 pointer-events-none" />

        {/* Action Controls on Right: Quick Drop + B (Shoot) + A (Jump) */}
        <div className="flex items-end gap-2.5 sm:gap-3.5 pointer-events-auto">
          {/* Quick Platform Drop Button (Tucked neatly to the side of action buttons) */}
          <div className="flex flex-col items-center mb-1">
            <button
              type="button"
              onTouchStart={e => {
                e.preventDefault();
                inputState.down = true;
                inputState.jump = true;
              }}
              onTouchEnd={e => {
                e.preventDefault();
                inputState.down = false;
                inputState.jump = false;
              }}
              className="px-2 py-1 bg-black/40 hover:bg-black/60 border border-white/20 rounded-md text-[9px] font-arcade text-zinc-300 flex items-center gap-0.5 backdrop-blur-xs active:bg-zinc-700/60 transition-colors"
            >
              <ChevronDown className="w-3 h-3" />
              <span>DROP</span>
            </button>
          </div>

          {/* Fire Button (B) */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onTouchStart={e => {
                e.preventDefault();
                inputState.shoot = true;
              }}
              onTouchEnd={e => {
                e.preventDefault();
                inputState.shoot = false;
              }}
              className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600/70 hover:bg-red-500/80 active:bg-red-700/90 border-2 border-red-400/80 rounded-full shadow-lg flex items-center justify-center text-white backdrop-blur-xs active:scale-95 transition-transform"
            >
              <Crosshair className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            <span className="text-[9px] sm:text-[10px] font-arcade text-red-400 font-bold mt-1">B (BẮN)</span>
          </div>

          {/* Jump Button (A) */}
          <div className="flex flex-col items-center -mt-4">
            <button
              type="button"
              onTouchStart={e => {
                e.preventDefault();
                inputState.jump = true;
              }}
              onTouchEnd={e => {
                e.preventDefault();
                inputState.jump = false;
              }}
              className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-500/70 hover:bg-amber-400/80 active:bg-amber-600/90 border-2 border-amber-300/80 rounded-full shadow-lg flex items-center justify-center text-black font-arcade text-base sm:text-lg font-black backdrop-blur-xs active:scale-95 transition-transform"
            >
              A
            </button>
            <span className="text-[9px] sm:text-[10px] font-arcade text-amber-400 font-bold mt-1">A (NHẢY)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
