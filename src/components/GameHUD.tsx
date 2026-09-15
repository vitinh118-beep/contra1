import React from 'react';
import { Player, WeaponType, GameDifficulty } from '../types';
import { Shield, Zap, Sparkles, Gauge } from 'lucide-react';

interface GameHUDProps {
  players: Player[];
  highScore: number;
  stageName: string;
  stageSubtitle: string;
  stageNumber: number;
  totalStages: number;
  konamiActive: boolean;
  difficulty?: GameDifficulty;
}

const WEAPON_NAMES: Record<WeaponType, { name: string; color: string; desc: string }> = {
  R: { name: 'RIFLE', color: 'bg-zinc-700 text-zinc-200 border-zinc-500', desc: 'Standard semi-auto' },
  M: { name: 'MACHINE', color: 'bg-amber-600 text-white border-amber-400', desc: 'Rapid automatic fire' },
  S: { name: 'SPREAD', color: 'bg-red-600 text-white border-red-400 shadow-red-500/50', desc: '5-way fan spread shot' },
  L: { name: 'LASER', color: 'bg-cyan-600 text-white border-cyan-300', desc: 'Piercing high-energy beam' },
  F: { name: 'FLAME', color: 'bg-orange-600 text-white border-orange-400', desc: 'Rotating fireball burst' },
};

export const GameHUD: React.FC<GameHUDProps> = ({
  players,
  highScore,
  stageName,
  stageSubtitle,
  stageNumber,
  totalStages,
  konamiActive,
  difficulty = 'normal',
}) => {
  const p1 = players[0];
  const p2 = players[1];

  return (
    <div className="w-full bg-black/95 border-b-2 border-zinc-800 px-3 sm:px-4 py-1.5 text-white font-arcade select-none">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs sm:text-sm">
        {/* Player 1 Section */}
        {p1 && (
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col">
              <span className="text-sky-400 font-bold tracking-wider text-[11px]">1P BILL</span>
              <span className="text-white text-base tracking-widest leading-tight">
                {p1.score.toString().padStart(6, '0')}
              </span>
            </div>

            {/* Lives badge */}
            <div className="flex items-center gap-1 bg-sky-950/70 border border-sky-600/70 px-2 py-0.5 rounded">
              <span className="text-zinc-400 text-[10px]">MẠNG</span>
              <span className="text-yellow-400 font-bold text-sm">{Math.max(0, p1.lives)}</span>
            </div>

            {/* Active Weapon */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold ${
                WEAPON_NAMES[p1.weapon].color
              }`}
              title={WEAPON_NAMES[p1.weapon].desc}
            >
              <span>[{p1.weapon}]</span>
              <span className="hidden md:inline">{WEAPON_NAMES[p1.weapon].name}</span>
            </div>

            {/* Barrier / Invincibility active */}
            {p1.barrierTime > 0 && (
              <div className="flex items-center gap-1 bg-cyan-500/20 border border-cyan-400 text-cyan-300 px-1.5 py-0.5 rounded animate-pulse text-[10px]">
                <Shield className="w-3 h-3" />
                <span className="hidden sm:inline">BẤT TỬ</span>
              </div>
            )}
          </div>
        )}

        {/* Center High Score & Stage & Round Indicator */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold text-xs">HI</span>
            <span className="text-yellow-400 tracking-widest text-sm">
              {highScore.toString().padStart(6, '0')}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wide ${
                difficulty === 'easy'
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-400'
                  : difficulty === 'normal'
                  ? 'bg-yellow-950/80 border-yellow-500/60 text-yellow-400'
                  : 'bg-red-950/80 border-red-500/60 text-red-400'
              }`}
            >
              {difficulty === 'easy' ? 'DỄ' : difficulty === 'normal' ? 'CHUẨN' : 'KHÓ'}
            </span>
          </div>

          {/* Current Stage Indicator with Total Rounds */}
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 tracking-wide mt-0.5">
            <span className="px-1.5 py-0.2 bg-red-600/30 border border-red-500/60 text-red-400 rounded font-bold">
              VÒNG {stageNumber}/{totalStages}
            </span>
            <span className="text-zinc-400 truncate max-w-[140px] sm:max-w-none">
              {stageName} • {stageSubtitle}
            </span>
          </div>
        </div>

        {/* Author Credit & Player 2 Section or Konami Badge */}
        <div className="flex items-center gap-2.5">
          {p2 ? (
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col text-right">
                <span className="text-red-400 font-bold tracking-wider text-[11px]">2P LANCE</span>
                <span className="text-white text-base tracking-widest leading-tight">
                  {p2.score.toString().padStart(6, '0')}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-red-950/70 border border-red-600/70 px-2 py-0.5 rounded">
                <span className="text-zinc-400 text-[10px]">MẠNG</span>
                <span className="text-yellow-400 font-bold text-sm">{Math.max(0, p2.lives)}</span>
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold ${
                  WEAPON_NAMES[p2.weapon].color
                }`}
              >
                <span>[{p2.weapon}]</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {konamiActive && (
                <div className="flex items-center gap-1 bg-yellow-950/60 border border-yellow-500 text-yellow-400 px-1.5 py-0.5 rounded text-[10px]">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">30 MẠNG</span>
                </div>
              )}
              {/* By Hải Hoàng Tag in HUD */}
              <div className="hidden lg:flex items-center gap-1 bg-zinc-900 border border-zinc-700/80 px-2 py-0.5 rounded text-[10px] text-zinc-400">
                <span className="text-zinc-500">BY</span>
                <span className="text-amber-400 font-bold">HẢI HOÀNG</span>
                <span className="text-zinc-400">0918001944</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
