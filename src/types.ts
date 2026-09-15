export type WeaponType = 'R' | 'M' | 'S' | 'L' | 'F';

export interface WeaponInfo {
  type: WeaponType;
  name: string;
  fullName: string;
  color: string;
  fireRate: number; // ms between shots
  speed: number;
  damage: number;
}

export type PlayerState = 
  | 'idle' 
  | 'run' 
  | 'jump' 
  | 'crouch' 
  | 'prone' 
  | 'water' 
  | 'dead' 
  | 'spawning';

export interface Player {
  id: 1 | 2;
  name: string;
  color: string; // 'blue' (Bill) or 'red' (Lance)
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  direction: 1 | -1; // 1 = right, -1 = left
  aimDirection: { x: number; y: number };
  state: PlayerState;
  isGrounded: boolean;
  isInWater: boolean;
  lives: number;
  score: number;
  weapon: WeaponType;
  invulnerableTime: number; // ms remaining
  barrierTime: number; // ms remaining
  lastShotTime: number;
  animationFrame: number;
  somersaultAngle: number;
  deadTimer: number;
  prevJumpInput?: boolean;
  dropThroughTimer?: number;
  currentPlatform?: Platform | null;
}

export interface Bullet {
  id: number;
  playerId?: 1 | 2;
  isEnemy: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: WeaponType | 'enemy' | 'boss_laser' | 'boss_energy' | 'boss_missile' | 'boss_fireball';
  damage: number;
  color: string;
  life: number;
  angle?: number;
  trail?: { x: number; y: number }[];
}

export type EnemyType = 
  | 'runner' 
  | 'sniper' 
  | 'turret' 
  | 'scuba' 
  | 'alien_crawler'
  | 'capsule'
  | 'wall_sensor';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  direction: 1 | -1;
  shootCooldown: number;
  dropWeapon?: WeaponType | 'B' | 'BOMB';
  active: boolean;
  animFrame: number;
  submerged?: boolean;
  submergeTimer?: number;
  angle?: number;
  turretAngle?: number;
}

export interface PowerUpItem {
  id: number;
  type: WeaponType | 'B' | 'BOMB';
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  grounded: boolean;
  blinkTimer: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  isWater?: boolean;
  isOneWay?: boolean;
  isBridge?: boolean;
  exploded?: boolean;
  fuseTimer?: number;
  exploding?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type?: 'spark' | 'smoke' | 'fire' | 'ring';
}

export interface BossPart {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  destroyed: boolean;
  shootCooldown: number;
  isCore?: boolean;
}

export type BossType = 'fortress' | 'bima_dragon' | 'armored_tank' | 'emperor_java' | 'alien_heart';

export interface Boss {
  type: BossType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parts: BossPart[];
  active: boolean;
  defeated: boolean;
  introDone: boolean;
}

export type LevelTheme = 
  | 'jungle' 
  | 'waterfall' 
  | 'snow' 
  | 'mountain' 
  | 'bunker' 
  | 'airplane' 
  | 'factory' 
  | 'desert' 
  | 'volcano' 
  | 'spacestation' 
  | 'alien';

export interface LevelData {
  id: number;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  theme: LevelTheme;
  bgColor: string;
  platforms: Platform[];
  initialEnemies: Enemy[];
  enemySpawners: {
    triggerX: number;
    spawnX: number;
    spawnY: number;
    type: EnemyType;
    interval: number;
    maxCount: number;
    currentCount: number;
    lastSpawn: number;
  }[];
  capsules: {
    triggerX: number;
    weapon: WeaponType | 'B' | 'BOMB';
    spawned: boolean;
  }[];
  boss: Boss;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
  jump: boolean;
}

export type GameMode = '1P' | '2P';
export type GameDifficulty = 'easy' | 'normal' | 'hard';
export type GameStatus = 'title' | 'stage_intro' | 'playing' | 'paused' | 'stage_clear' | 'game_over' | 'victory';
