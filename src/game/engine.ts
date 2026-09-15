import { 
  Player, 
  Bullet, 
  Enemy, 
  PowerUpItem, 
  Platform, 
  Particle, 
  LevelData, 
  InputState, 
  GameStatus, 
  GameMode, 
  GameDifficulty,
  WeaponType 
} from '../types';
import { ALL_LEVELS } from './levels';
import { audio } from './audio';
import { vibration } from './vibration';
import { 
  drawPlayer, 
  drawBullet, 
  drawEnemy, 
  drawPowerUp, 
  drawBoss, 
  drawPlatform, 
  drawParticle 
} from './sprites';

export class ContraGameEngine {
  public status: GameStatus = 'title';
  public mode: GameMode = '1P';
  public difficulty: GameDifficulty = 'normal';
  public levelIndex: number = 0;
  public levels: LevelData[] = ALL_LEVELS;
  public currentLevel: LevelData;

  public players: Player[] = [];
  public bullets: Bullet[] = [];
  public enemies: Enemy[] = [];
  public powerUps: PowerUpItem[] = [];
  public particles: Particle[] = [];

  public cameraX: number = 0;
  public cameraY: number = 0;
  public viewWidth: number = 480;
  public viewHeight: number = 270;

  public screenShakeTime: number = 0;
  public screenShakeIntensity: number = 0;

  public highScore: number = 20000;
  public tick: number = 0;
  public konamiProgress: number = 0;
  public konamiActivated: boolean = false;

  private nextBulletId: number = 1;
  private nextEnemyId: number = 1000;
  private nextPowerUpId: number = 1;

  // Konami Code sequence: Up, Up, Down, Down, Left, Right, Left, Right, B, A
  private readonly konamiSequence = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];

  // Input states for P1 and P2
  public p1Input: InputState = { up: false, down: false, left: false, right: false, shoot: false, jump: false };
  public p2Input: InputState = { up: false, down: false, left: false, right: false, shoot: false, jump: false };

  constructor() {
    this.currentLevel = JSON.parse(JSON.stringify(this.levels[0]));
    const savedHighScore = localStorage.getItem('contra_high_score');
    if (savedHighScore) {
      this.highScore = parseInt(savedHighScore, 10) || 20000;
    }
  }

  // Start new game
  public start(mode: GameMode = '1P', startLives: number = 3, difficulty: GameDifficulty = 'normal', startStageIndex: number = 0) {
    this.mode = mode;
    this.difficulty = difficulty;
    const sIndex = Math.max(0, Math.min(startStageIndex, this.levels.length - 1));
    this.levelIndex = sIndex;
    this.currentLevel = JSON.parse(JSON.stringify(this.levels[sIndex]));
    this.cameraX = 0;
    this.bullets = [];
    this.powerUps = [];
    this.enemies = JSON.parse(JSON.stringify(this.currentLevel.initialEnemies));
    this.particles = [];
    this.tick = 0;
    this.screenShakeTime = 0;

    // Initialize players
    this.players = [
      {
        id: 1,
        name: 'BILL',
        color: 'blue',
        x: 40,
        y: 160,
        vx: 0,
        vy: 0,
        width: 24,
        height: 34,
        direction: 1,
        aimDirection: { x: 1, y: 0 },
        state: 'idle',
        isGrounded: false,
        isInWater: false,
        lives: startLives,
        score: 0,
        weapon: 'R',
        invulnerableTime: 2000,
        barrierTime: 0,
        lastShotTime: 0,
        animationFrame: 0,
        somersaultAngle: 0,
        deadTimer: 0,
      }
    ];

    if (mode === '2P') {
      this.players.push({
        id: 2,
        name: 'LANCE',
        color: 'red',
        x: 70,
        y: 160,
        vx: 0,
        vy: 0,
        width: 24,
        height: 34,
        direction: 1,
        aimDirection: { x: 1, y: 0 },
        state: 'idle',
        isGrounded: false,
        isInWater: false,
        lives: startLives,
        score: 0,
        weapon: 'R',
        invulnerableTime: 2000,
        barrierTime: 0,
        lastShotTime: 0,
        animationFrame: 0,
        somersaultAngle: 0,
        deadTimer: 0,
      });
    }

    // Populate initial level enemies
    this.enemies = JSON.parse(JSON.stringify(this.currentLevel.initialEnemies));
    this.status = 'playing';

    vibration.stop();
    audio.startBGM();
  }

  // Activate Konami 30 Lives Cheat
  public activate30Lives() {
    this.konamiActivated = true;
    for (const p of this.players) {
      p.lives = 30;
    }
    audio.playKonamiFanfare();
    this.screenShake(400, 4);
    // Spawn celebratory particles
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: this.cameraX + this.viewWidth / 2,
        y: 100,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.7) * 8,
        color: ['#38bdf8', '#facc15', '#ef4444', '#ffffff'][i % 4],
        size: 3 + Math.random() * 3,
        life: 60,
        maxLife: 60,
      });
    }
  }

  // Handle key inputs for Konami sequence detection
  public handleKeyDown(code: string) {
    const expected = this.konamiSequence[this.konamiProgress];
    if (code.toLowerCase() === expected.toLowerCase() || code === expected) {
      this.konamiProgress++;
      if (this.konamiProgress >= this.konamiSequence.length) {
        this.konamiProgress = 0;
        this.activate30Lives();
      }
    } else {
      this.konamiProgress = 0;
    }
  }

  public screenShake(durationMs: number, intensity: number = 4) {
    this.screenShakeTime = durationMs;
    this.screenShakeIntensity = intensity;
  }

  // Main game update loop
  public update(deltaTime: number) {
    if (this.status !== 'playing') return;

    this.tick++;

    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= deltaTime;
    }

    // 1. Update Players
    this.updatePlayer(this.players[0], this.p1Input, deltaTime);
    if (this.players.length > 1) {
      this.updatePlayer(this.players[1], this.p2Input, deltaTime);
    }

    // Check game over
    const allDead = this.players.every(p => p.lives <= 0 && p.state === 'dead');
    if (allDead) {
      this.status = 'game_over';
      audio.stopBGM();
      audio.playDeath();
      return;
    }

    // 2. Camera tracking
    const activePlayers = this.players.filter(p => p.lives > 0 || p.state !== 'dead');
    if (activePlayers.length > 0) {
      const maxX = Math.max(...activePlayers.map(p => p.x));
      const targetCamX = Math.max(this.cameraX, maxX - this.viewWidth * 0.45);
      
      // Stop camera if at boss area or level boundary
      const maxScroll = this.currentLevel.boss.active 
        ? this.currentLevel.boss.x - this.viewWidth + this.currentLevel.boss.width + 20
        : this.currentLevel.width - this.viewWidth;

      this.cameraX = Math.min(targetCamX, maxScroll);
    }

    // Check boss trigger
    if (!this.currentLevel.boss.active && !this.currentLevel.boss.defeated) {
      if (this.cameraX >= this.currentLevel.boss.x - this.viewWidth + 40) {
        this.currentLevel.boss.active = true;
        this.screenShake(600, 3);
      }
    }

    // 3. Update Level Platforms (Bridge explosion fuses)
    for (const plat of this.currentLevel.platforms) {
      if (plat.isBridge && !plat.exploded) {
        // If a player stands on bridge, ignite fuse
        const playerOn = this.players.some(
          p => p.x + p.width > plat.x && p.x < plat.x + plat.width && Math.abs(p.y + p.height - plat.y) < 6
        );
        if (playerOn && !plat.exploding) {
          plat.exploding = true;
        }

        if (plat.exploding && plat.fuseTimer !== undefined) {
          plat.fuseTimer -= deltaTime;
          if (plat.fuseTimer <= 0) {
            plat.exploded = true;
            audio.playExplosion();
            this.screenShake(300, 5);
            // Spawn bridge explosion particles
            for (let i = 0; i < 20; i++) {
              this.particles.push({
                x: plat.x + Math.random() * plat.width,
                y: plat.y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 5,
                color: '#f97316',
                size: 4 + Math.random() * 4,
                life: 40,
                maxLife: 40,
              });
            }
          }
        }
      }
    }

    // 4. Update Spawners & Flying Capsules
    this.updateSpawners(deltaTime);
    this.updateCapsules();

    // 5. Update Enemies
    this.updateEnemies(deltaTime);

    // 6. Update Boss
    if (this.currentLevel.boss.active && !this.currentLevel.boss.defeated) {
      this.updateBoss(deltaTime);
    }

    // 7. Update Bullets
    this.updateBullets();

    // 8. Update Power-ups
    this.updatePowerUps();

    // 9. Update Particles
    this.updateParticles();
  }

  // Update a single player
  private updatePlayer(player: Player, input: InputState, deltaTime: number) {
    if (player.lives <= 0 && player.state === 'dead') return;

    if (player.state === 'dead') {
      player.deadTimer += deltaTime;
      if (player.deadTimer > 2000 && player.lives > 0) {
        // Respawn player safely on a platform
        player.state = 'spawning';
        const candidatePlats = this.currentLevel.platforms.filter(
          p => !p.exploded && !p.isWater && p.x + p.width > this.cameraX + 20 && p.x < this.cameraX + 200
        );
        let safeX = this.cameraX + 60;
        if (candidatePlats.length > 0) {
          const p = candidatePlats[0];
          safeX = Math.max(p.x + 10, Math.min(p.x + p.width - 20, this.cameraX + 60));
        }
        player.x = safeX;
        player.y = 50;
        player.vx = 0;
        player.vy = 0;
        player.isGrounded = false;
        player.currentPlatform = null;
        player.dropThroughTimer = 0;
        player.prevJumpInput = false;
        player.weapon = 'R'; // Reset to standard rifle on death
        player.invulnerableTime = 3000;
        player.deadTimer = 0;
      }
      return;
    }

    if (player.invulnerableTime > 0) {
      player.invulnerableTime -= deltaTime;
    }
    if (player.barrierTime > 0) {
      player.barrierTime -= deltaTime;
    }
    if (player.dropThroughTimer && player.dropThroughTimer > 0) {
      player.dropThroughTimer -= deltaTime;
      if (player.dropThroughTimer <= 0) {
        player.dropThroughTimer = 0;
      }
    }

    // Gravity - calibrated for authentic NES Contra jump arc
    const gravity = this.difficulty === 'easy' ? 0.32 : this.difficulty === 'normal' ? 0.35 : 0.38;
    player.vy += gravity;
    if (player.vy > 8) player.vy = 8;

    // Water check
    const currentWater = this.currentLevel.platforms.find(
      plat => plat.isWater && 
      player.x + player.width > plat.x && 
      player.x < plat.x + plat.width && 
      player.y + player.height >= plat.y
    );
    player.isInWater = !!currentWater;

    // Movement & Aiming speed calibrated for responsiveness and precision
    const baseSpeed = this.difficulty === 'easy' ? 1.65 : this.difficulty === 'normal' ? 1.75 : 1.9;
    const baseWaterSpeed = this.difficulty === 'easy' ? 1.1 : this.difficulty === 'normal' ? 1.18 : 1.25;
    const speed = player.isInWater ? baseWaterSpeed : baseSpeed;

    if (input.left) {
      player.vx = -speed;
      player.direction = -1;
    } else if (input.right) {
      player.vx = speed;
      player.direction = 1;
    } else {
      player.vx = 0;
    }

    // Determine aim direction
    if (input.up) {
      if (input.left || input.right) {
        player.aimDirection = { x: 1, y: -1 };
      } else {
        player.aimDirection = { x: 0, y: -1 };
      }
    } else if (input.down) {
      if (!player.isGrounded) {
        player.aimDirection = { x: 1, y: 1 };
      } else {
        player.aimDirection = { x: 1, y: 0 };
      }
    } else {
      player.aimDirection = { x: 1, y: 0 };
    }

    // State determination
    if (player.isGrounded) {
      if (input.down && !input.left && !input.right) {
        player.state = player.isInWater ? 'prone' : 'crouch';
        player.vx = 0;
      } else if (Math.abs(player.vx) > 0.1) {
        player.state = 'run';
        player.animationFrame += 0.2;
      } else {
        player.state = 'idle';
        player.animationFrame = 0;
      }
    } else {
      player.state = 'jump';
      player.somersaultAngle += (player.direction === 1 ? 1 : -1) * 0.3;
    }

    // Jump & Platform drop down (with edge-triggered input so holding down/jump never drops through solid ground)
    const jumpJustPressed = !!input.jump && !player.prevJumpInput;
    player.prevJumpInput = !!input.jump;

    if (jumpJustPressed && player.isGrounded) {
      if (input.down) {
        // Drop down through ONE-WAY platforms ONLY!
        // Never allow dropping through solid ground, water, or bridge!
        if (player.currentPlatform && player.currentPlatform.isOneWay) {
          player.dropThroughTimer = 260; // Ignore window for this elevated one-way ledge
          player.y += 4;
          player.vy = 2.5;
          player.isGrounded = false;
          player.currentPlatform = null;
        } else {
          // On solid ground, water, or bridge: stay safely grounded/crouched
        }
      } else {
        const jumpForce = this.difficulty === 'easy' ? -6.8 : -6.5;
        player.vy = jumpForce;
        player.isGrounded = false;
        player.currentPlatform = null;
        audio.playJump();
      }
    }

    // Shooting
    if (input.shoot) {
      this.firePlayerWeapon(player);
    }

    // Apply Velocity
    player.x += player.vx;
    player.y += player.vy;

    // Left screen edge boundary
    if (player.x < this.cameraX) {
      player.x = this.cameraX;
    }

    // Robust Platform collision
    player.isGrounded = false;
    let groundedPlatform: Platform | null = null;

    for (const plat of this.currentLevel.platforms) {
      if (plat.exploded) continue;

      // Horizontal bounds: full width overlap
      const isWithinX = player.x + player.width > plat.x && player.x < plat.x + plat.width;
      if (!isWithinX) continue;

      // 1. Water platforms: safe wading surface (never fall through into void!)
      if (plat.isWater) {
        if (player.vy >= 0 && player.y + player.height >= plat.y + 4) {
          player.y = plat.y + 12 - player.height;
          player.vy = 0;
          player.isGrounded = true;
          groundedPlatform = plat;
        }
        continue;
      }

      // 2. One-Way elevated ledges
      if (plat.isOneWay) {
        // If actively dropping through a one-way ledge, bypass collision
        if (player.dropThroughTimer && player.dropThroughTimer > 0) {
          continue;
        }

        const prevFeetY = player.y - player.vy + player.height;
        const currentFeetY = player.y + player.height;
        const isFalling = player.vy >= 0;

        if (isFalling && prevFeetY <= plat.y + Math.max(8, player.vy + 2) && currentFeetY >= plat.y) {
          player.y = plat.y - player.height;
          player.vy = 0;
          player.isGrounded = true;
          groundedPlatform = plat;
        }
        continue;
      }

      // 3. Solid Ground & Bridges (CANNOT BE DROPPED THROUGH!)
      // Must catch the player reliably without any chance of tunneling or falling through
      const prevFeetY = player.y - player.vy + player.height;
      const currentFeetY = player.y + player.height;
      const isFalling = player.vy >= 0;
      const catchTolerance = Math.max(16, player.vy + 6);

      if (isFalling && prevFeetY <= plat.y + catchTolerance && currentFeetY >= plat.y && currentFeetY <= plat.y + plat.height + 12) {
        player.y = plat.y - player.height;
        player.vy = 0;
        player.isGrounded = true;
        groundedPlatform = plat;
      }
    }

    player.currentPlatform = groundedPlatform;

    // Pit death - only triggered if player has truly fallen below the screen bottom
    if (player.y > this.viewHeight + 40) {
      this.killPlayer(player);
    }
  }

  // Player firing mechanics
  private firePlayerWeapon(player: Player) {
    const now = performance.now();
    const fireIntervals: Record<WeaponType, number> = {
      R: 200,
      M: 90,
      S: 250,
      L: 280,
      F: 220,
    };

    if (now - player.lastShotTime < fireIntervals[player.weapon]) {
      return;
    }
    player.lastShotTime = now;

    // Calculate bullet origin based on player stance
    let originX = player.x + (player.direction === 1 ? player.width + 4 : -4);
    let originY = player.y + 14;

    if (player.state === 'crouch' || player.state === 'prone') {
      originY = player.y + 24;
    } else if (player.state === 'jump') {
      originX = player.x + player.width / 2;
      originY = player.y + player.height / 2;
    }

    // Calculate direction vector
    let dirX: number = player.direction;
    let dirY: number = 0;

    if (player.aimDirection.x === 0 && player.aimDirection.y < 0) {
      // Straight up
      dirX = 0;
      dirY = -1;
      originX = player.x + player.width / 2;
      originY = player.y - 4;
    } else if (player.aimDirection.y < 0) {
      // Diagonal up
      dirX = player.direction * 0.707;
      dirY = -0.707;
    } else if (player.aimDirection.y > 0) {
      // Diagonal down
      dirX = player.direction * 0.707;
      dirY = 0.707;
    }

    // Weapon specific projectiles
    switch (player.weapon) {
      case 'R': {
        audio.playRifle();
        this.bullets.push({
          id: this.nextBulletId++,
          playerId: player.id,
          isEnemy: false,
          x: originX,
          y: originY,
          vx: dirX * 6,
          vy: dirY * 6,
          radius: 3,
          type: 'R',
          damage: 1,
          color: '#ffffff',
          life: 90,
        });
        break;
      }

      case 'M': {
        audio.playMachineGun();
        this.bullets.push({
          id: this.nextBulletId++,
          playerId: player.id,
          isEnemy: false,
          x: originX,
          y: originY,
          vx: dirX * 7.5,
          vy: dirY * 7.5,
          radius: 3.5,
          type: 'M',
          damage: 1.2,
          color: '#facc15',
          life: 90,
        });
        break;
      }

      case 'S': {
        // Iconic 5-way spread fan!
        audio.playSpreadGun();
        const baseAngle = Math.atan2(dirY, dirX);
        const angles = [-0.35, -0.18, 0, 0.18, 0.35];

        for (const offset of angles) {
          const a = baseAngle + offset;
          this.bullets.push({
            id: this.nextBulletId++,
            playerId: player.id,
            isEnemy: false,
            x: originX,
            y: originY,
            vx: Math.cos(a) * 6,
            vy: Math.sin(a) * 6,
            radius: 4.5,
            type: 'S',
            damage: 1.8,
            color: '#ef4444',
            life: 100,
          });
        }
        break;
      }

      case 'L': {
        audio.playLaser();
        const angle = Math.atan2(dirY, dirX);
        for (let i = 0; i < 3; i++) {
          this.bullets.push({
            id: this.nextBulletId++,
            playerId: player.id,
            isEnemy: false,
            x: originX + Math.cos(angle) * (i * 18),
            y: originY + Math.sin(angle) * (i * 18),
            vx: dirX * 9,
            vy: dirY * 9,
            radius: 4,
            type: 'L',
            damage: 3.5,
            color: '#38bdf8',
            life: 80,
            angle,
          });
        }
        break;
      }

      case 'F': {
        audio.playFlame();
        this.bullets.push({
          id: this.nextBulletId++,
          playerId: player.id,
          isEnemy: false,
          x: originX,
          y: originY,
          vx: dirX * 4.5,
          vy: dirY * 4.5,
          radius: 7,
          type: 'F',
          damage: 2.5,
          color: '#f97316',
          life: 110,
        });
        break;
      }
    }
  }

  // Kill a player
  public killPlayer(player: Player) {
    if (player.invulnerableTime > 0 || player.barrierTime > 0 || player.state === 'dead') return;

    player.state = 'dead';
    player.deadTimer = 0;
    player.lives--;
    audio.playDeath();
    vibration.vibratePlayerHit();
    this.screenShake(400, 4);

    // Spawn blood/shockwave particles
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.8) * 6,
        color: '#ef4444',
        size: 3 + Math.random() * 3,
        life: 45,
        maxLife: 45,
      });
    }
  }

  // Update dynamic enemy waves
  private updateSpawners(deltaTime: number) {
    const activeRunners = this.enemies.filter(
      e => e.active && (e.type === 'runner' || e.type === 'alien_crawler')
    ).length;
    const maxRunnersOnScreen = this.difficulty === 'easy' ? 2 : this.difficulty === 'normal' ? 3 : 4;

    for (const spawner of this.currentLevel.enemySpawners) {
      if (
        activeRunners < maxRunnersOnScreen &&
        this.cameraX >= spawner.triggerX && 
        spawner.currentCount < spawner.maxCount &&
        this.cameraX < spawner.triggerX + 600
      ) {
        spawner.lastSpawn += deltaTime;
        const interval = this.difficulty === 'easy' ? spawner.interval * 1.35 : spawner.interval;
        if (spawner.lastSpawn >= interval) {
          spawner.lastSpawn = 0;
          spawner.currentCount++;

          const rSpeed = this.difficulty === 'easy' ? -0.95 : this.difficulty === 'normal' ? -1.15 : -1.45;

          // Spawn new runner/alien
          this.enemies.push({
            id: this.nextEnemyId++,
            type: spawner.type,
            x: this.cameraX + this.viewWidth + 20,
            y: spawner.spawnY,
            vx: rSpeed,
            vy: 0,
            width: 24,
            height: 32,
            health: 1,
            maxHealth: 1,
            direction: -1,
            shootCooldown: 2200 + Math.random() * 1200,
            active: true,
            animFrame: 0,
          });
        }
      }
    }
  }

  // Update flying power-up capsules
  private updateCapsules() {
    for (const cap of this.currentLevel.capsules) {
      if (!cap.spawned && this.cameraX >= cap.triggerX) {
        cap.spawned = true;
        this.enemies.push({
          id: this.nextEnemyId++,
          type: 'capsule',
          x: this.cameraX + this.viewWidth + 20,
          y: 60 + Math.random() * 40,
          vx: -2.0,
          vy: 0,
          width: 24,
          height: 16,
          health: 1,
          maxHealth: 1,
          direction: -1,
          shootCooldown: 999999,
          dropWeapon: cap.weapon,
          active: true,
          animFrame: 0,
        });
      }
    }
  }

  // Update enemies behavior
  private updateEnemies(deltaTime: number) {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      enemy.animFrame += 0.2;

      // Behavior per enemy type
      switch (enemy.type) {
        case 'runner':
        case 'alien_crawler': {
          enemy.x += enemy.vx;

          // Simple gravity
          enemy.vy = (enemy.vy || 0) + 0.35;
          enemy.y += enemy.vy;

          // Ground check
          for (const plat of this.currentLevel.platforms) {
            if (
              !plat.isWater && 
              !plat.exploded &&
              enemy.x + enemy.width > plat.x && 
              enemy.x < plat.x + plat.width &&
              enemy.y + enemy.height >= plat.y && 
              enemy.y + enemy.height <= plat.y + 12
            ) {
              enemy.y = plat.y - enemy.height;
              enemy.vy = 0;
            }
          }

          // Runner periodic shooting
          enemy.shootCooldown -= deltaTime;
          if (enemy.shootCooldown <= 0 && enemy.x < this.cameraX + this.viewWidth - 40 && enemy.x > this.cameraX + 40) {
            enemy.shootCooldown = 2800 + Math.random() * 1200;
            const bSpeed = this.difficulty === 'easy' ? -1.8 : this.difficulty === 'normal' ? -2.1 : -2.6;
            this.bullets.push({
              id: this.nextBulletId++,
              isEnemy: true,
              x: enemy.x,
              y: enemy.y + 14,
              vx: bSpeed,
              vy: 0,
              radius: 3.5,
              type: 'enemy',
              damage: 1,
              color: '#ef4444',
              life: 140,
            });
          }
          break;
        }

        case 'sniper': {
          enemy.shootCooldown -= deltaTime;
          if (enemy.shootCooldown <= 0 && enemy.x > this.cameraX && enemy.x < this.cameraX + this.viewWidth) {
            enemy.shootCooldown = this.difficulty === 'easy' ? 2600 + Math.random() * 800 : 2000 + Math.random() * 600;
            // Aim towards closest player
            const target = this.getClosestPlayer(enemy.x, enemy.y);
            if (target) {
              const dx = (target.x + target.width / 2) - enemy.x;
              const dy = (target.y + target.height / 2) - enemy.y;
              const dist = Math.hypot(dx, dy) || 1;
              const bSpeed = this.difficulty === 'easy' ? 1.85 : this.difficulty === 'normal' ? 2.15 : 2.65;
              this.bullets.push({
                id: this.nextBulletId++,
                isEnemy: true,
                x: enemy.x,
                y: enemy.y + 12,
                vx: (dx / dist) * bSpeed,
                vy: (dy / dist) * bSpeed,
                radius: 3.5,
                type: 'enemy',
                damage: 1,
                color: '#ef4444',
                life: 140,
              });
            }
          }
          break;
        }

        case 'turret': {
          // Track closest player angle
          const target = this.getClosestPlayer(enemy.x + 16, enemy.y + 16);
          if (target) {
            const dx = (target.x + target.width / 2) - (enemy.x + 16);
            const dy = (target.y + target.height / 2) - (enemy.y + 16);
            enemy.turretAngle = Math.atan2(dy, dx);
          }

          enemy.shootCooldown -= deltaTime;
          if (enemy.shootCooldown <= 0 && enemy.x > this.cameraX - 40 && enemy.x < this.cameraX + this.viewWidth + 40) {
            enemy.shootCooldown = this.difficulty === 'easy' ? 2600 + Math.random() * 800 : 2000 + Math.random() * 600;
            const angle = enemy.turretAngle || 0;
            const bSpeed = this.difficulty === 'easy' ? 2.0 : this.difficulty === 'normal' ? 2.4 : 2.9;
            this.bullets.push({
              id: this.nextBulletId++,
              isEnemy: true,
              x: enemy.x + 16 + Math.cos(angle) * 16,
              y: enemy.y + 16 + Math.sin(angle) * 16,
              vx: Math.cos(angle) * bSpeed,
              vy: Math.sin(angle) * bSpeed,
              radius: 4,
              type: 'enemy',
              damage: 1,
              color: '#ef4444',
              life: 140,
            });
          }
          break;
        }

        case 'scuba': {
          if (enemy.submergeTimer !== undefined) {
            enemy.submergeTimer -= deltaTime;
            if (enemy.submergeTimer <= 0) {
              enemy.submerged = !enemy.submerged;
              enemy.submergeTimer = enemy.submerged ? 2400 : 1800;

              // Fire when surfacing
              if (!enemy.submerged) {
                const target = this.getClosestPlayer(enemy.x, enemy.y);
                const dirX = target && target.x > enemy.x ? 1 : -1;
                const bSpeed = this.difficulty === 'easy' ? 1.8 : 2.2;
                this.bullets.push({
                  id: this.nextBulletId++,
                  isEnemy: true,
                  x: enemy.x + 12,
                  y: enemy.y + 10,
                  vx: dirX * bSpeed,
                  vy: -1.6,
                  radius: 3.5,
                  type: 'enemy',
                  damage: 1,
                  color: '#ef4444',
                  life: 120,
                });
              }
            }
          }
          break;
        }

        case 'capsule': {
          // Sine wave flight across sky
          enemy.x += enemy.vx;
          enemy.y += Math.sin(enemy.animFrame * 0.3) * 1.5;
          break;
        }
      }

      // Check collision with players
      if (enemy.type !== 'capsule' && enemy.type !== 'wall_sensor') {
        for (const player of this.players) {
          if (player.lives > 0 && player.state !== 'dead') {
            const pBox = this.getPlayerHitbox(player);
            if (pBox.isSubmerged) continue;
            if (this.checkAABB(pBox, enemy)) {
              if (player.barrierTime > 0) {
                // Shield destroys enemy
                this.damageEnemy(enemy, 10, player);
              } else {
                this.killPlayer(player);
              }
            }
          }
        }
      }

      // Clean up off-screen enemies
      if (enemy.x < this.cameraX - 100) {
        enemy.active = false;
      }
    }

    // Filter dead enemies
    this.enemies = this.enemies.filter(e => e.active);
  }

  // Update Boss behavior
  private updateBoss(deltaTime: number) {
    const boss = this.currentLevel.boss;
    const targetPlayer = this.players.find(p => p.lives > 0 && p.state !== 'dead') || this.players[0];

    for (const part of boss.parts) {
      if (part.destroyed) continue;

      part.shootCooldown -= deltaTime;
      if (part.shootCooldown <= 0) {
        if (boss.type === 'fortress') {
          if (part.id.startsWith('turret')) {
            part.shootCooldown = this.difficulty === 'easy' ? 2400 + Math.random() * 600 : 1800 + Math.random() * 600;
            const bSpeed = this.difficulty === 'easy' ? -2.4 : -3.0;
            this.bullets.push({
              id: this.nextBulletId++,
              isEnemy: true,
              x: part.x - 10,
              y: part.y + part.height / 2,
              vx: bSpeed,
              vy: (Math.random() - 0.5) * 1.0,
              radius: 5,
              type: 'boss_laser',
              damage: 1,
              color: '#ef4444',
              life: 140,
            });
          } else if (part.id === 'radar') {
            part.shootCooldown = this.difficulty === 'easy' ? 3600 : 2800;
            const rSpeed = this.difficulty === 'easy' ? -1.0 : -1.3;
            this.enemies.push({
              id: this.nextEnemyId++,
              type: 'runner',
              x: boss.x - 20,
              y: 196,
              vx: rSpeed,
              vy: 0,
              width: 24,
              height: 32,
              health: 1,
              maxHealth: 1,
              direction: -1,
              shootCooldown: 1600,
              active: true,
              animFrame: 0,
            });
          } else if (part.id === 'core' || part.id === 'alien_core' || part.isCore) {
            part.shootCooldown = this.difficulty === 'easy' ? 2800 : 2200;
            const cSpeed = this.difficulty === 'easy' ? -2.3 : -2.9;
            for (let i = -1; i <= 1; i++) {
              this.bullets.push({
                id: this.nextBulletId++,
                isEnemy: true,
                x: part.x,
                y: part.y + part.height / 2,
                vx: cSpeed,
                vy: i * 1.1,
                radius: 6,
                type: 'boss_energy',
                damage: 1,
                color: '#f59e0b',
                life: 140,
              });
            }
          }
        } else if (boss.type === 'bima_dragon') {
          if (part.id === 'dragon_head') {
            part.shootCooldown = this.difficulty === 'easy' ? 2400 : 1800;
            // Aimed dragon fireball towards player
            const dx = (targetPlayer?.x ?? boss.x - 100) - (part.x - 10);
            const dy = (targetPlayer?.y ?? part.y) - (part.y + part.height / 2);
            const dist = Math.hypot(dx, dy) || 1;
            const speed = this.difficulty === 'easy' ? 2.5 : 3.2;
            this.bullets.push({
              id: this.nextBulletId++,
              isEnemy: true,
              x: part.x - 10,
              y: part.y + part.height / 2,
              vx: (dx / dist) * speed,
              vy: (dy / dist) * speed,
              radius: 6,
              type: 'boss_fireball',
              damage: 1,
              color: '#ef4444',
              life: 160,
            });
          } else if (part.id === 'left_launcher') {
            part.shootCooldown = this.difficulty === 'easy' ? 3000 : 2200;
            // Cluster twin missiles
            const mSpeed = this.difficulty === 'easy' ? -2.2 : -2.8;
            for (const offset of [-8, 8]) {
              this.bullets.push({
                id: this.nextBulletId++,
                isEnemy: true,
                x: part.x - 6,
                y: part.y + part.height / 2 + offset,
                vx: mSpeed,
                vy: offset * 0.05,
                radius: 5,
                type: 'boss_missile',
                damage: 1,
                color: '#f59e0b',
                life: 160,
              });
            }
          } else if (part.id === 'right_launcher') {
            part.shootCooldown = this.difficulty === 'easy' ? 2600 : 1900;
            const lSpeed = this.difficulty === 'easy' ? -3.2 : -4.0;
            this.bullets.push({
              id: this.nextBulletId++,
              isEnemy: true,
              x: part.x - 14,
              y: part.y + part.height / 2,
              vx: lSpeed,
              vy: 0,
              radius: 5,
              type: 'boss_laser',
              damage: 1,
              color: '#06b6d4',
              life: 130,
            });
          } else if (part.isCore || part.id === 'core') {
            part.shootCooldown = this.difficulty === 'easy' ? 2800 : 2100;
            // 4-way rotating dragon pulse
            const baseAngle = (this.tick * 0.1) % (Math.PI * 2);
            for (let i = 0; i < 4; i++) {
              const ang = baseAngle + (i * Math.PI) / 2;
              this.bullets.push({
                id: this.nextBulletId++,
                isEnemy: true,
                x: part.x + part.width / 2,
                y: part.y + part.height / 2,
                vx: Math.cos(ang) * 2.2,
                vy: Math.sin(ang) * 2.2,
                radius: 5,
                type: 'boss_energy',
                damage: 1,
                color: '#38bdf8',
                life: 130,
              });
            }
          }
        } else if (boss.type === 'armored_tank') {
          if (part.id === 'tank_turret') {
            part.shootCooldown = this.difficulty === 'easy' ? 2600 : 1900;
            // Twin heavy howitzer shells
            const hSpeed = this.difficulty === 'easy' ? -2.8 : -3.6;
            for (const offset of [-6, 6]) {
              this.bullets.push({
                id: this.nextBulletId++,
                isEnemy: true,
                x: part.x - 24,
                y: part.y + part.height / 2 + offset,
                vx: hSpeed,
                vy: 0,
                radius: 6,
                type: 'boss_energy',
                damage: 1,
                color: '#f59e0b',
                life: 140,
              });
            }
          } else if (part.id === 'tank_mortar') {
            part.shootCooldown = this.difficulty === 'easy' ? 3200 : 2400;
            // Lobbed mortar shells high into the air that rain down
            this.bullets.push({
              id: this.nextBulletId++,
              isEnemy: true,
              x: part.x - 10,
              y: part.y,
              vx: -2.0 - Math.random() * 1.5,
              vy: -4.2,
              radius: 5,
              type: 'boss_missile',
              damage: 1,
              color: '#ef4444',
              life: 180,
            });
          } else if (part.id === 'tread_guard') {
            part.shootCooldown = this.difficulty === 'easy' ? 3800 : 2800;
            // Spawn snow infantry runner
            this.enemies.push({
              id: this.nextEnemyId++,
              type: 'runner',
              x: boss.x - 10,
              y: 196,
              vx: this.difficulty === 'easy' ? -1.0 : -1.4,
              vy: 0,
              width: 24,
              height: 32,
              health: 2,
              maxHealth: 2,
              direction: -1,
              shootCooldown: 1500,
              active: true,
              animFrame: 0,
            });
          } else if (part.isCore || part.id === 'core') {
            part.shootCooldown = this.difficulty === 'easy' ? 2600 : 2000;
            // Radial flame burst from boiler
            for (let i = -1; i <= 1; i++) {
              this.bullets.push({
                id: this.nextBulletId++,
                isEnemy: true,
                x: part.x,
                y: part.y + part.height / 2,
                vx: -2.6,
                vy: i * 1.2,
                radius: 6,
                type: 'boss_fireball',
                damage: 1,
                color: '#ea580c',
                life: 130,
              });
            }
          }
        } else {
          // Stage 4 Emperor Java & Alien Gowa Heart
          if (part.id === 'java_skull') {
            part.shootCooldown = this.difficulty === 'easy' ? 2500 : 1800;
            // Demonic skull fireballs
            const dx = (targetPlayer?.x ?? boss.x - 100) - (part.x - 10);
            const dy = (targetPlayer?.y ?? part.y) - (part.y + part.height / 2);
            const dist = Math.hypot(dx, dy) || 1;
            const speed = this.difficulty === 'easy' ? 2.6 : 3.4;
            this.bullets.push({
              id: this.nextBulletId++,
              isEnemy: true,
              x: part.x - 12,
              y: part.y + part.height / 2,
              vx: (dx / dist) * speed,
              vy: (dy / dist) * speed,
              radius: 6,
              type: 'boss_fireball',
              damage: 1,
              color: '#be123c',
              life: 160,
            });
          } else if (part.id.includes('tentacle')) {
            part.shootCooldown = this.difficulty === 'easy' ? 2200 : 1600;
            // Toxic bio-laser darts
            this.bullets.push({
              id: this.nextBulletId++,
              isEnemy: true,
              x: part.x - 10,
              y: part.y + part.height / 2,
              vx: this.difficulty === 'easy' ? -2.8 : -3.5,
              vy: (Math.random() - 0.5) * 1.5,
              radius: 5,
              type: 'boss_laser',
              damage: 1,
              color: '#22c55e',
              life: 130,
            });
          } else if (part.isCore || part.id === 'core' || part.id === 'alien_core') {
            part.shootCooldown = this.difficulty === 'easy' ? 2400 : 1800;
            // Heartbeat 5-way shockwave
            for (let i = -2; i <= 2; i++) {
              this.bullets.push({
                id: this.nextBulletId++,
                isEnemy: true,
                x: part.x,
                y: part.y + part.height / 2,
                vx: -2.8,
                vy: i * 0.9,
                radius: 6,
                type: 'boss_energy',
                damage: 1,
                color: '#e11d48',
                life: 140,
              });
            }
          }
        }
      }
    }
  }

  // Damage an enemy
  private damageEnemy(enemy: Enemy, dmg: number, player?: Player) {
    enemy.health -= dmg;
    if (enemy.health <= 0) {
      enemy.active = false;
      audio.playExplosion(enemy.type === 'turret');
      this.screenShake(150, 2);

      // Score points
      const points = enemy.type === 'turret' ? 500 : (enemy.type === 'capsule' ? 100 : 200);
      if (player) {
        player.score += points;
        this.checkHighScore(player.score);
      }

      // Drop weapon power-up
      if (enemy.dropWeapon) {
        this.powerUps.push({
          id: this.nextPowerUpId++,
          type: enemy.dropWeapon,
          x: enemy.x + enemy.width / 2 - 8,
          y: enemy.y,
          vx: 0,
          vy: -2.5,
          width: 16,
          height: 16,
          grounded: false,
          blinkTimer: 0,
        });
      }

      // Explosion particles
      for (let i = 0; i < (enemy.type === 'turret' ? 24 : 10); i++) {
        this.particles.push({
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height / 2,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.7) * 6,
          color: ['#ef4444', '#f97316', '#facc15'][i % 3],
          size: 3 + Math.random() * 3,
          life: 30,
          maxLife: 30,
        });
      }
    }
  }

  // Damage Boss Part
  private damageBossPart(part: any, dmg: number, player?: Player) {
    if (part.destroyed) return;

    part.health -= dmg;
    this.screenShake(100, 2);

    if (part.health <= 0) {
      part.destroyed = true;
      audio.playExplosion(true);
      this.screenShake(400, 6);

      if (player) {
        player.score += 2000;
        this.checkHighScore(player.score);
      }

      // Debris and explosions
      for (let i = 0; i < 30; i++) {
        this.particles.push({
          x: part.x + Math.random() * part.width,
          y: part.y + Math.random() * part.height,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.7) * 8,
          color: ['#ef4444', '#f97316', '#facc15', '#ffffff'][i % 4],
          size: 4 + Math.random() * 4,
          life: 50,
          maxLife: 50,
        });
      }

      // Check if main core is destroyed -> Stage Complete!
      if (part.id === 'core' || part.id === 'alien_core' || part.isCore) {
        this.currentLevel.boss.defeated = true;
        audio.playStageClear();
        vibration.vibrateBossDefeated(3200);

        // Massive chain explosions across the entire boss
        for (let i = 0; i < 60; i++) {
          setTimeout(() => {
            this.particles.push({
              x: this.currentLevel.boss.x + Math.random() * this.currentLevel.boss.width,
              y: this.currentLevel.boss.y + Math.random() * this.currentLevel.boss.height,
              vx: (Math.random() - 0.5) * 9,
              vy: (Math.random() - 0.5) * 9,
              color: ['#ef4444', '#f97316', '#facc15', '#ffffff'][i % 4],
              size: 5 + Math.random() * 5,
              life: 60,
              maxLife: 60,
            });
            audio.playExplosion(true);
          }, i * 40);
        }

        // Wait and advance stage
        setTimeout(() => {
          if (this.levelIndex + 1 < this.levels.length) {
            this.levelIndex++;
            this.currentLevel = JSON.parse(JSON.stringify(this.levels[this.levelIndex]));
            this.cameraX = 0;
            this.bullets = [];
            this.powerUps = [];
            this.enemies = JSON.parse(JSON.stringify(this.currentLevel.initialEnemies));
            for (const p of this.players) {
              p.x = 40;
              p.y = 160;
              p.invulnerableTime = 3000;
            }
            this.status = 'playing';
            audio.startBGM();
          } else {
            this.status = 'victory';
            audio.stopBGM();
            audio.playStageClear();
          }
        }, 3200);
      }
    }
  }

  // Update Bullets
  private updateBullets() {
    for (const b of this.bullets) {
      if (b.type === 'boss_missile') {
        b.vy += 0.08;
      }
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      if (b.isEnemy) {
        // Check collision with players using state-accurate hitbox
        for (const player of this.players) {
          if (player.lives > 0 && player.state !== 'dead') {
            const box = this.getPlayerHitbox(player);
            if (box.isSubmerged) continue;

            if (
              b.x >= box.x &&
              b.x <= box.x + box.width &&
              b.y >= box.y &&
              b.y <= box.y + box.height
            ) {
              b.life = 0;
              if (player.barrierTime > 0) {
                // Reflected or absorbed
                audio.playHit();
                vibration.vibrateLight();
              } else {
                this.killPlayer(player);
              }
            }
          }
        }
      } else {
        // Player bullet: Check collision with enemies
        for (const enemy of this.enemies) {
          if (!enemy.active) continue;
          if (
            b.x >= enemy.x &&
            b.x <= enemy.x + enemy.width &&
            b.y >= enemy.y &&
            b.y <= enemy.y + enemy.height
          ) {
            if (b.type !== 'L') b.life = 0; // Laser pierces through!
            const player = this.players.find(p => p.id === b.playerId);
            this.damageEnemy(enemy, b.damage, player);
          }
        }

        // Check collision with Boss
        if (this.currentLevel.boss.active && !this.currentLevel.boss.defeated) {
          for (const part of this.currentLevel.boss.parts) {
            if (part.destroyed) continue;
            if (
              b.x >= part.x &&
              b.x <= part.x + part.width &&
              b.y >= part.y &&
              b.y <= part.y + part.height
            ) {
              if (b.type !== 'L') b.life = 0;
              const player = this.players.find(p => p.id === b.playerId);
              this.damageBossPart(part, b.damage, player);
            }
          }
        }
      }

      // Check boundary
      if (b.x < this.cameraX - 50 || b.x > this.cameraX + this.viewWidth + 50 || b.y < -50 || b.y > this.viewHeight + 50) {
        b.life = 0;
      }
    }

    this.bullets = this.bullets.filter(b => b.life > 0);
  }

  // Update dropped power-up items
  private updatePowerUps() {
    for (const item of this.powerUps) {
      item.blinkTimer++;

      if (!item.grounded) {
        item.vy += 0.25;
        item.x += item.vx;
        item.y += item.vy;

        // Ground check
        for (const plat of this.currentLevel.platforms) {
          if (
            !plat.isWater &&
            !plat.exploded &&
            item.x + item.width > plat.x &&
            item.x < plat.x + plat.width &&
            item.y + item.height >= plat.y &&
            item.y + item.height <= plat.y + 12
          ) {
            item.y = plat.y - item.height;
            item.vy = 0;
            item.grounded = true;
          }
        }
      }

      // Player pickup check
      for (const player of this.players) {
        if (player.lives > 0 && player.state !== 'dead') {
          if (this.checkAABB(player, item)) {
            // Apply power-up
            audio.playPowerup();
            player.score += 500;
            this.checkHighScore(player.score);

            if (item.type === 'B') {
              // Barrier invincibility for 15s
              player.barrierTime = 15000;
            } else if (item.type === 'BOMB') {
              // Wipe all active screen enemies!
              audio.playExplosion(true);
              this.screenShake(300, 5);
              for (const e of this.enemies) {
                if (e.x > this.cameraX && e.x < this.cameraX + this.viewWidth) {
                  this.damageEnemy(e, 999, player);
                }
              }
            } else {
              // Upgrade weapon
              player.weapon = item.type;
            }

            // Remove item
            item.y = 999999;
          }
        }
      }
    }

    this.powerUps = this.powerUps.filter(item => item.y < this.viewHeight + 50);
  }

  // Update particle system
  private updateParticles() {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  private checkHighScore(score: number) {
    if (score > this.highScore) {
      this.highScore = score;
      localStorage.setItem('contra_high_score', this.highScore.toString());
    }
  }

  private getClosestPlayer(x: number, y: number): Player | null {
    const alive = this.players.filter(p => p.lives > 0 && p.state !== 'dead');
    if (alive.length === 0) return null;
    let closest = alive[0];
    let minDist = Math.hypot(closest.x - x, closest.y - y);

    for (let i = 1; i < alive.length; i++) {
      const dist = Math.hypot(alive[i].x - x, alive[i].y - y);
      if (dist < minDist) {
        minDist = dist;
        closest = alive[i];
      }
    }
    return closest;
  }

  private checkAABB(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // Calculate state-accurate player collision hitbox (prone, crouch, jump, water dodging)
  private getPlayerHitbox(player: Player): { x: number; y: number; width: number; height: number; isSubmerged: boolean } {
    if (player.isInWater && (player.state === 'prone' || player.state === 'crouch')) {
      // Submerged in water: completely safe from above-surface bullets and runner collisions
      return { x: player.x + 4, y: player.y + 24, width: 16, height: 10, isSubmerged: true };
    }
    if (player.state === 'prone') {
      // Flat on ground crawling: low profile, bullets fly overhead
      return { x: player.x, y: player.y + 22, width: player.width, height: 12, isSubmerged: false };
    }
    if (player.state === 'crouch') {
      // Kneeling: lower profile
      return { x: player.x + 2, y: player.y + 14, width: player.width - 4, height: 20, isSubmerged: false };
    }
    if (player.state === 'jump') {
      // Tight somersault spin: compact hitbox
      return { x: player.x + 3, y: player.y + 6, width: 18, height: 22, isSubmerged: false };
    }
    // Normal standing / running
    return { x: player.x + 3, y: player.y + 3, width: player.width - 6, height: player.height - 3, isSubmerged: false };
  }

  // Render the entire game scene to Canvas
  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Apply Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShakeTime > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
    }

    ctx.translate(-this.cameraX + shakeX, shakeY);

    // 1. Background Sky & Jungle Canopy / Alien Hive
    this.renderBackground(ctx);

    // 2. Platforms & Water
    for (const plat of this.currentLevel.platforms) {
      if (plat.x + plat.width >= this.cameraX && plat.x <= this.cameraX + this.viewWidth) {
        drawPlatform(ctx, plat, this.currentLevel.theme);
      }
    }

    // 3. Boss
    drawBoss(ctx, this.currentLevel.boss, this.tick);

    // 4. Power-Up Badges
    for (const p of this.powerUps) {
      drawPowerUp(ctx, p, this.tick);
    }

    // 5. Enemies
    for (const enemy of this.enemies) {
      drawEnemy(ctx, enemy, this.tick);
    }

    // 6. Players
    for (const player of this.players) {
      drawPlayer(ctx, player, this.tick);
    }

    // 7. Bullets
    for (const b of this.bullets) {
      drawBullet(ctx, b);
    }

    // 8. Particles
    for (const p of this.particles) {
      drawParticle(ctx, p);
    }

    ctx.restore();
  }

  // Parallax Retro Background for 4 Distinct Worlds
  private renderBackground(ctx: CanvasRenderingContext2D) {
    const theme = this.currentLevel.theme;

    // 1. Sky Gradient according to theme
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.viewHeight);
    if (theme === 'jungle') {
      skyGrad.addColorStop(0, '#060a17');
      skyGrad.addColorStop(0.35, '#0c1a2e');
      skyGrad.addColorStop(0.7, '#16324a');
      skyGrad.addColorStop(1, '#1b4d66');
    } else if (theme === 'waterfall') {
      skyGrad.addColorStop(0, '#090d16');
      skyGrad.addColorStop(0.4, '#131e33');
      skyGrad.addColorStop(0.75, '#1e293b');
      skyGrad.addColorStop(1, '#334155');
    } else if (theme === 'snow') {
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.4, '#0f172a');
      skyGrad.addColorStop(0.8, '#1e1b4b');
      skyGrad.addColorStop(1, '#1e293b');
    } else if (theme === 'mountain') {
      // Dramatic high-altitude alpine sunset
      skyGrad.addColorStop(0, '#1e1b4b');
      skyGrad.addColorStop(0.4, '#4338ca');
      skyGrad.addColorStop(0.7, '#ea580c');
      skyGrad.addColorStop(1, '#f59e0b');
    } else if (theme === 'bunker') {
      // Deep underground cavern darkness
      skyGrad.addColorStop(0, '#05070c');
      skyGrad.addColorStop(0.4, '#090d16');
      skyGrad.addColorStop(0.8, '#111827');
      skyGrad.addColorStop(1, '#1f2937');
    } else if (theme === 'airplane') {
      // High-altitude flight azure sky
      skyGrad.addColorStop(0, '#082f49');
      skyGrad.addColorStop(0.4, '#0284c7');
      skyGrad.addColorStop(0.75, '#38bdf8');
      skyGrad.addColorStop(1, '#bae6fd');
    } else if (theme === 'factory') {
      // Industrial smog and glowing furnaces
      skyGrad.addColorStop(0, '#180b06');
      skyGrad.addColorStop(0.4, '#431407');
      skyGrad.addColorStop(0.75, '#7c2d12');
      skyGrad.addColorStop(1, '#991b1b');
    } else if (theme === 'desert') {
      // Blazing scorching desert horizon
      skyGrad.addColorStop(0, '#451a03');
      skyGrad.addColorStop(0.35, '#9a3412');
      skyGrad.addColorStop(0.7, '#d97706');
      skyGrad.addColorStop(1, '#fef08a');
    } else if (theme === 'volcano') {
      // Infernal volcanic magma glow
      skyGrad.addColorStop(0, '#1c0303');
      skyGrad.addColorStop(0.4, '#450a0a');
      skyGrad.addColorStop(0.75, '#7f1d1d');
      skyGrad.addColorStop(1, '#dc2626');
    } else if (theme === 'spacestation') {
      // Deep cosmos void
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.4, '#09090b');
      skyGrad.addColorStop(0.8, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
    } else {
      // Alien biological lair
      skyGrad.addColorStop(0, '#10051d');
      skyGrad.addColorStop(0.4, '#2e1065');
      skyGrad.addColorStop(0.8, '#4a044e');
      skyGrad.addColorStop(1, '#2c0427');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(this.cameraX, 0, this.viewWidth, this.viewHeight);

    if (theme === 'jungle') {
      // Twinkling Retro Pixel Stars
      const starSeed = [
        { x: 35, y: 14, s: 1.5, b: 0.8 },
        { x: 85, y: 32, s: 1, b: 0.6 },
        { x: 155, y: 18, s: 2, b: 0.9 },
        { x: 220, y: 40, s: 1, b: 0.5 },
        { x: 300, y: 16, s: 1.5, b: 0.75 },
        { x: 375, y: 28, s: 2, b: 1 },
        { x: 435, y: 12, s: 1, b: 0.6 },
        { x: 115, y: 55, s: 1.5, b: 0.65 },
        { x: 265, y: 50, s: 1, b: 0.7 },
        { x: 415, y: 58, s: 1.5, b: 0.5 },
      ];
      for (let i = 0; i < starSeed.length; i++) {
        const star = starSeed[i];
        const sx = ((star.x - this.cameraX * 0.03) % this.viewWidth + this.viewWidth) % this.viewWidth + this.cameraX;
        const twinkle = 0.5 + Math.sin(this.tick * 0.07 + i) * 0.5;
        ctx.fillStyle = `rgba(254, 240, 138, ${star.b * twinkle})`;
        ctx.fillRect(sx, star.y, star.s, star.s);
      }

      // Distant Misty Mountain Ridges (Parallax 0.15)
      ctx.fillStyle = '#0f2937';
      const mOffsetX = this.cameraX * 0.15;
      for (let i = -1; i < 7; i++) {
        const mx = i * 220 - (mOffsetX % 220) + this.cameraX;
        ctx.beginPath();
        ctx.moveTo(mx - 60, 230);
        ctx.lineTo(mx + 45, 92);
        ctx.lineTo(mx + 80, 115);
        ctx.lineTo(mx + 135, 78);
        ctx.lineTo(mx + 220, 230);
        ctx.fill();

        const mistGrad = ctx.createLinearGradient(0, 180, 0, 230);
        mistGrad.addColorStop(0, 'rgba(15, 41, 55, 0)');
        mistGrad.addColorStop(1, 'rgba(15, 41, 55, 0.75)');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(mx - 60, 180, 280, 50);
        ctx.fillStyle = '#0f2937';
      }

      // Cascading Mountain Waterfalls
      for (let i = 0; i < 3; i++) {
        const wfx = i * 440 + 175 - (mOffsetX % 440) + this.cameraX;
        ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
        ctx.fillRect(wfx, 110, 3, 75);
        const sprayW = 6 + Math.sin(this.tick * 0.2 + i) * 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillRect(wfx - sprayW / 2, 182, sprayW, 4);
      }

      // Mid-Ground Dense Jungle Tree Hills (Parallax 0.35)
      ctx.fillStyle = '#064e3b';
      const jOffsetX = this.cameraX * 0.35;
      for (let i = -1; i < 8; i++) {
        const jx = i * 160 - (jOffsetX % 160) + this.cameraX;
        ctx.beginPath();
        ctx.arc(jx + 40, 190, 55, Math.PI, 0);
        ctx.arc(jx + 110, 180, 65, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(jx - 15, 180, 190, 50);
      }

      // Layered Tropical Coconut Palm Trees (Parallax 0.55)
      const pOffsetX = this.cameraX * 0.55;
      for (let i = -1; i < 8; i++) {
        const px = i * 170 - (pOffsetX % 170) + this.cameraX;
        const trunkH = 120;
        const trunkY = 100;

        ctx.fillStyle = '#451a03';
        ctx.fillRect(px + 38, trunkY, 7, trunkH);
        ctx.fillStyle = '#78350f';
        for (let y = trunkY + 4; y < trunkY + trunkH; y += 8) {
          ctx.fillRect(px + 38, y, 7, 3);
        }

        const fcX = px + 41;
        const fcY = trunkY;

        ctx.fillStyle = '#022c22';
        this.drawFronds(ctx, fcX, fcY, 32, 16);
        ctx.fillStyle = '#047857';
        this.drawFronds(ctx, fcX, fcY, 26, 12);
        ctx.fillStyle = '#10b981';
        this.drawFronds(ctx, fcX, fcY, 18, 9);

        ctx.strokeStyle = '#064e3b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(fcX - 14, fcY + 4);
        ctx.quadraticCurveTo(fcX - 20, fcY + 35, fcX - 16, fcY + 55);
        ctx.moveTo(fcX + 14, fcY + 4);
        ctx.quadraticCurveTo(fcX + 20, fcY + 30, fcX + 16, fcY + 45);
        ctx.stroke();
      }
    } else if (theme === 'waterfall') {
      // Stage 2: Towering canyon waterfall with roaring cascades
      const cOffsetX = this.cameraX * 0.15;
      ctx.fillStyle = '#1e293b';
      for (let i = -1; i < 6; i++) {
        const cx = i * 260 - (cOffsetX % 260) + this.cameraX;
        ctx.beginPath();
        ctx.moveTo(cx - 40, 240);
        ctx.lineTo(cx + 30, 40);
        ctx.lineTo(cx + 120, 60);
        ctx.lineTo(cx + 180, 30);
        ctx.lineTo(cx + 260, 240);
        ctx.fill();
      }

      // Massive Animated Waterfalls (Parallax 0.25)
      const wOffsetX = this.cameraX * 0.25;
      for (let i = 0; i < 4; i++) {
        const wx = i * 220 + 80 - (wOffsetX % 220) + this.cameraX;
        // Water fall stream
        const streamGrad = ctx.createLinearGradient(0, 40, 0, 240);
        streamGrad.addColorStop(0, '#bae6fd');
        streamGrad.addColorStop(0.5, '#38bdf8');
        streamGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = streamGrad;
        ctx.fillRect(wx - 8, 40, 16, 200);

        // Animated rushing lines inside waterfall
        ctx.fillStyle = '#ffffff';
        const streamShift = (this.tick * 6) % 30;
        for (let y = 40 + streamShift; y < 240; y += 30) {
          ctx.fillRect(wx - 5, y, 4, 12);
          ctx.fillRect(wx + 2, (y + 15) % 200 + 40, 4, 10);
        }

        // Mist foam cloud at base
        const mistW = 28 + Math.sin(this.tick * 0.15 + i) * 6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(wx, 225, mistW / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme === 'snow') {
      // Stage 3: Snow Field - Aurora Borealis & Snowy mountain ranges
      // Aurora Borealis curtains
      for (let layer = 0; layer < 2; layer++) {
        ctx.fillStyle = layer === 0 ? 'rgba(52, 211, 153, 0.18)' : 'rgba(56, 189, 248, 0.14)';
        ctx.beginPath();
        const aShift = (this.tick * 0.02 + layer) % (Math.PI * 2);
        ctx.moveTo(this.cameraX, 0);
        for (let x = 0; x <= this.viewWidth; x += 40) {
          const y = 35 + Math.sin(x * 0.015 + aShift) * 20 + Math.cos(x * 0.02 - aShift) * 12;
          ctx.lineTo(this.cameraX + x, y);
        }
        ctx.lineTo(this.cameraX + this.viewWidth, 0);
        ctx.closePath();
        ctx.fill();
      }

      // Distant Snowy Mountain Peaks (Parallax 0.15)
      const sOffsetX = this.cameraX * 0.15;
      for (let i = -1; i < 6; i++) {
        const sx = i * 220 - (sOffsetX % 220) + this.cameraX;
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(sx - 30, 220);
        ctx.lineTo(sx + 50, 80);
        ctx.lineTo(sx + 140, 110);
        ctx.lineTo(sx + 210, 70);
        ctx.lineTo(sx + 260, 220);
        ctx.fill();

        // Snow-capped peak tops
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(sx + 50, 80);
        ctx.lineTo(sx + 35, 110);
        ctx.lineTo(sx + 65, 110);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(sx + 210, 70);
        ctx.lineTo(sx + 195, 95);
        ctx.lineTo(sx + 225, 95);
        ctx.closePath();
        ctx.fill();
      }

      // Military Communication Antenna Towers (Parallax 0.3)
      const aOffsetX = this.cameraX * 0.3;
      for (let i = 0; i < 3; i++) {
        const tx = i * 360 + 120 - (aOffsetX % 360) + this.cameraX;
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx - 12, 200);
        ctx.lineTo(tx, 60);
        ctx.lineTo(tx + 12, 200);
        ctx.moveTo(tx - 8, 120);
        ctx.lineTo(tx + 8, 120);
        ctx.moveTo(tx - 5, 80);
        ctx.lineTo(tx + 5, 80);
        ctx.stroke();

        // Blinking Red Warning Beacon at top
        const beaconOn = Math.floor(this.tick / 30) % 2 === 0;
        if (beaconOn) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(tx, 58, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Drifting gentle snowflakes
      const snowSeed = [
        { x: 30, y: 20, s: 2 },
        { x: 110, y: 70, s: 1.5 },
        { x: 190, y: 40, s: 2.5 },
        { x: 280, y: 90, s: 1 },
        { x: 350, y: 30, s: 2 },
        { x: 420, y: 110, s: 1.5 },
        { x: 80, y: 150, s: 2 },
        { x: 230, y: 170, s: 1 },
        { x: 390, y: 180, s: 2 },
      ];
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let i = 0; i < snowSeed.length; i++) {
        const flake = snowSeed[i];
        const fx = ((flake.x - this.cameraX * 0.4 + this.tick * 0.5) % this.viewWidth + this.viewWidth) % this.viewWidth + this.cameraX;
        const fy = (flake.y + this.tick * 0.8) % (this.viewHeight - 20);
        ctx.fillRect(fx, fy, flake.s, flake.s);
      }
    } else if (theme === 'mountain') {
      // High Mountain Peaks: Alpine summit ridges, drifting clouds, soaring eagles
      // Sun / Alpine moon
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(this.cameraX + this.viewWidth * 0.75, 45, 18, 0, Math.PI * 2);
      ctx.fill();

      // Towering Granite Peak Ridges (Parallax 0.12)
      const mOffsetX = this.cameraX * 0.12;
      ctx.fillStyle = '#1e1b4b';
      for (let i = -1; i < 7; i++) {
        const mx = i * 240 - (mOffsetX % 240) + this.cameraX;
        ctx.beginPath();
        ctx.moveTo(mx - 50, 230);
        ctx.lineTo(mx + 60, 60);
        ctx.lineTo(mx + 110, 100);
        ctx.lineTo(mx + 170, 50);
        ctx.lineTo(mx + 250, 230);
        ctx.fill();

        // Snow-line crags on peaks
        ctx.fillStyle = '#e0e7ff';
        ctx.beginPath();
        ctx.moveTo(mx + 60, 60);
        ctx.lineTo(mx + 45, 90);
        ctx.lineTo(mx + 75, 90);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(mx + 170, 50);
        ctx.lineTo(mx + 155, 80);
        ctx.lineTo(mx + 185, 80);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1e1b4b';
      }

      // Drifting Alpine Fog & Clouds (Parallax 0.25)
      const cOffsetX = (this.cameraX * 0.25 + this.tick * 0.4) % this.viewWidth;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      for (let i = 0; i < 4; i++) {
        const cx = i * 160 - cOffsetX + this.cameraX;
        ctx.beginPath();
        ctx.ellipse(cx, 130 + i * 15, 60, 18, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 35, 125 + i * 15, 45, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Alpine Pine Trees (Parallax 0.45)
      const tOffsetX = this.cameraX * 0.45;
      ctx.fillStyle = '#064e3b';
      for (let i = -1; i < 8; i++) {
        const tx = i * 150 - (tOffsetX % 150) + this.cameraX;
        for (let t = 0; t < 3; t++) {
          const px = tx + t * 45;
          ctx.beginPath();
          ctx.moveTo(px, 140);
          ctx.lineTo(px - 14, 210);
          ctx.lineTo(px + 14, 210);
          ctx.closePath();
          ctx.fill();
        }
      }
    } else if (theme === 'bunker') {
      // Subterranean Military Bunker: Steel trusses, giant spinning ventilation fans, computer racks
      // Ceiling hanging rock & metal beams (Parallax 0.08)
      ctx.fillStyle = '#090d16';
      for (let x = 0; x < this.viewWidth + 60; x += 50) {
        ctx.fillRect(this.cameraX + x, 0, 8, 40);
      }
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(this.cameraX, 36, this.viewWidth, 6);

      // Giant Rotating Industrial Ventilation Fans (Parallax 0.2)
      const fOffsetX = this.cameraX * 0.2;
      for (let i = 0; i < 4; i++) {
        const fx = i * 240 + 70 - (fOffsetX % 240) + this.cameraX;
        const fy = 95;

        // Fan duct casing
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(fx, fy, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Spinning blades
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(this.tick * 0.15 + i);
        ctx.fillStyle = '#52525b';
        for (let b = 0; b < 4; b++) {
          ctx.rotate(Math.PI / 2);
          ctx.fillRect(-5, -28, 10, 26);
        }
        ctx.fillStyle = '#a1a1aa';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Military Server Racks & Conduit Pipes (Parallax 0.35)
      const rOffsetX = this.cameraX * 0.35;
      for (let i = -1; i < 7; i++) {
        const rx = i * 180 + 30 - (rOffsetX % 180) + this.cameraX;
        ctx.fillStyle = '#111827';
        ctx.fillRect(rx, 140, 48, 85);
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(rx + 4, 144, 40, 77);

        // Blinking server LEDs
        for (let row = 0; row < 5; row++) {
          const ledOn = (Math.floor(this.tick / 15) + row + i) % 3 !== 0;
          ctx.fillStyle = ledOn ? (row % 2 === 0 ? '#22c55e' : '#ef4444') : '#374151';
          ctx.fillRect(rx + 8, 150 + row * 14, 4, 4);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(rx + 16, 150 + row * 14, 20, 2);
        }
      }
    } else if (theme === 'airplane') {
      // High-Speed Aircraft Wing / Cargo Plane: Fast streaming clouds beneath, twin jet thrusters
      // Fast Rushing Low-Altitude Clouds (Parallax 0.9 + rapid animation)
      const cloudSpeed = (this.cameraX * 0.8 + this.tick * 4.5) % this.viewWidth;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let i = 0; i < 6; i++) {
        const cx = i * 170 - cloudSpeed + this.cameraX;
        ctx.beginPath();
        ctx.ellipse(cx, 210, 70, 24, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 40, 220, 50, 18, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Giant Jet Engine Pod with Roaring Plasma Flame (Parallax 0.4)
      const eOffsetX = this.cameraX * 0.4;
      for (let i = 0; i < 2; i++) {
        const ex = i * 380 + 100 - (eOffsetX % 380) + this.cameraX;
        const ey = 80;

        // Engine Nacelle
        ctx.fillStyle = '#334155';
        ctx.fillRect(ex, ey, 90, 40);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(ex + 10, ey + 4, 70, 32);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(ex + 85, ey + 20, 18, -Math.PI / 2, Math.PI / 2);
        ctx.fill();

        // Roaring Plasma Afterburner Exhaust Plume
        const flameLen = 40 + Math.sin(this.tick * 0.4 + i) * 12;
        const flameGrad = ctx.createLinearGradient(ex + 85, ey + 20, ex + 85 + flameLen, ey + 20);
        flameGrad.addColorStop(0, '#38bdf8');
        flameGrad.addColorStop(0.5, '#0284c7');
        flameGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(ex + 85, ey + 8);
        ctx.lineTo(ex + 85 + flameLen, ey + 20);
        ctx.lineTo(ex + 85, ey + 32);
        ctx.closePath();
        ctx.fill();
      }

      // Escort Fighter Jet Silhouettes in Distance
      const fX = ((this.tick * 2.2) % (this.viewWidth + 200)) - 100 + this.cameraX;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.beginPath();
      ctx.moveTo(fX, 35);
      ctx.lineTo(fX - 25, 42);
      ctx.lineTo(fX - 8, 45);
      ctx.lineTo(fX - 22, 52);
      ctx.lineTo(fX + 4, 45);
      ctx.closePath();
      ctx.fill();
    } else if (theme === 'factory') {
      // Industrial Cyber Factory: Smokestacks, massive rotating cogs, spark welders
      // Smokestacks with rising smoke plumes (Parallax 0.15)
      const sOffsetX = this.cameraX * 0.15;
      for (let i = 0; i < 4; i++) {
        const sx = i * 260 + 60 - (sOffsetX % 260) + this.cameraX;
        ctx.fillStyle = '#27272a';
        ctx.fillRect(sx, 70, 28, 160);
        ctx.fillStyle = '#52525b';
        ctx.fillRect(sx - 3, 65, 34, 10);

        // Rising smoke puffs
        ctx.fillStyle = 'rgba(113, 113, 122, 0.35)';
        for (let puff = 0; puff < 3; puff++) {
          const py = (60 - ((this.tick * 0.8 + puff * 30) % 70));
          const ps = 10 + (60 - py) * 0.3;
          ctx.beginPath();
          ctx.arc(sx + 14 + Math.sin(this.tick * 0.05 + puff) * 6, py, ps, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Giant Rotating Factory Gears (Parallax 0.3)
      const gOffsetX = this.cameraX * 0.3;
      for (let i = 0; i < 3; i++) {
        const gx = i * 320 + 150 - (gOffsetX % 320) + this.cameraX;
        const gy = 120;
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(this.tick * 0.04 * (i % 2 === 0 ? 1 : -1));

        ctx.fillStyle = '#3f3f46';
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fill();

        // Gear teeth
        ctx.fillStyle = '#71717a';
        for (let t = 0; t < 8; t++) {
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-6, -44, 12, 12);
        }
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Flashing Electrical Welder Sparks
      const sparkActive = Math.floor(this.tick / 8) % 4 === 0;
      if (sparkActive) {
        ctx.fillStyle = '#67e8f9';
        const spkX = (this.cameraX + 220);
        ctx.fillRect(spkX, 165, 4, 4);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.beginPath();
        ctx.arc(spkX, 165, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme === 'desert') {
      // Scorched Desert: Blazing sun, sweeping golden dunes, ancient obelisks
      // Radiant Blazing Sun
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(this.cameraX + 180, 50, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(253, 224, 71, 0.2)';
      ctx.beginPath();
      ctx.arc(this.cameraX + 180, 50, 42, 0, Math.PI * 2);
      ctx.fill();

      // Distant Sweeping Sand Dunes (Parallax 0.16)
      const dOffsetX = this.cameraX * 0.16;
      ctx.fillStyle = '#b45309';
      for (let i = -1; i < 6; i++) {
        const dx = i * 260 - (dOffsetX % 260) + this.cameraX;
        ctx.beginPath();
        ctx.moveTo(dx - 40, 230);
        ctx.quadraticCurveTo(dx + 90, 130, dx + 220, 230);
        ctx.fill();
      }

      // Mid-Ground Dunes & Ancient Obelisks (Parallax 0.32)
      const oOffsetX = this.cameraX * 0.32;
      ctx.fillStyle = '#d97706';
      for (let i = -1; i < 7; i++) {
        const ox = i * 200 - (oOffsetX % 200) + this.cameraX;
        ctx.beginPath();
        ctx.moveTo(ox - 30, 230);
        ctx.quadraticCurveTo(ox + 80, 165, ox + 190, 230);
        ctx.fill();

        // Ancient Carved Obelisk Pillar
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(ox + 50, 180);
        ctx.lineTo(ox + 54, 110);
        ctx.lineTo(ox + 57, 100);
        ctx.lineTo(ox + 60, 110);
        ctx.lineTo(ox + 64, 180);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#d97706';
      }
    } else if (theme === 'volcano') {
      // Molten Volcano: Erupting caldera, cascading lava falls, floating fire embers
      // Distant Erupting Volcano Caldera (Parallax 0.14)
      const vOffsetX = this.cameraX * 0.14;
      ctx.fillStyle = '#450a0a';
      for (let i = -1; i < 5; i++) {
        const vx = i * 300 + 40 - (vOffsetX % 300) + this.cameraX;
        ctx.beginPath();
        ctx.moveTo(vx - 70, 230);
        ctx.lineTo(vx + 40, 80);
        ctx.lineTo(vx + 90, 80);
        ctx.lineTo(vx + 200, 230);
        ctx.fill();

        // Caldera Glowing Lava Crater & Eruption Smoke
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(vx + 45, 80, 40, 6);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(vx + 52, 78, 26, 4);

        // Cascading Molten Lava Stream
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(vx + 60, 84);
        ctx.quadraticCurveTo(vx + 75, 140, vx + 90, 230);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#f59e0b';
        ctx.stroke();
      }

      // Rising Fiery Ash & Embers
      ctx.fillStyle = '#f59e0b';
      for (let i = 0; i < 14; i++) {
        const ex = ((i * 45 + Math.sin(this.tick * 0.05 + i) * 18 - this.cameraX * 0.25) % this.viewWidth + this.viewWidth) % this.viewWidth + this.cameraX;
        const ey = (230 - ((this.tick * 0.9 + i * 20) % 220));
        ctx.fillRect(ex, ey, 2, 2);
      }
    } else if (theme === 'spacestation') {
      // Orbital Space Station: Deep cosmos starfield, Earth curvature, space solar panels
      // Cosmic Starfield (Parallax 0.02)
      for (let i = 0; i < 24; i++) {
        const sx = ((i * 37 + 12 - this.cameraX * 0.02) % this.viewWidth + this.viewWidth) % this.viewWidth + this.cameraX;
        const sy = (i * 19 + 7) % (this.viewHeight - 40);
        const blink = Math.sin(this.tick * 0.08 + i) > 0 ? 0.9 : 0.4;
        ctx.fillStyle = `rgba(255, 255, 255, ${blink})`;
        ctx.fillRect(sx, sy, (i % 5 === 0) ? 2 : 1, (i % 5 === 0) ? 2 : 1);
      }

      // Curvature of Planet Earth at the Bottom
      const earthGrad = ctx.createLinearGradient(0, 150, 0, 250);
      earthGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
      earthGrad.addColorStop(0.3, '#0284c7');
      earthGrad.addColorStop(0.8, '#0369a1');
      earthGrad.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = earthGrad;
      ctx.beginPath();
      ctx.ellipse(this.cameraX + this.viewWidth * 0.5, 340, 360, 180, 0, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric glowing limb
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(this.cameraX + this.viewWidth * 0.5, 340, 360, 180, 0, Math.PI, 0);
      ctx.stroke();

      // Giant Orbital Solar Arrays (Parallax 0.22)
      const sOffsetX = this.cameraX * 0.22;
      for (let i = 0; i < 3; i++) {
        const ax = i * 280 + 90 - (sOffsetX % 280) + this.cameraX;
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(ax, 50, 60, 24);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(ax, 50, 60, 24);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(ax + 28, 40, 4, 44);
      }
    } else {
      // Stage 20 / Alien Hive: Biomechanical Organic Lair
      // Pulsating organic bio-ribs and egg chambers
      const aOffset = this.cameraX * 0.25;
      for (let i = 0; i < 8; i++) {
        const ax = i * 190 - (aOffset % 190) + this.cameraX;

        // Glowing organic bulb
        const pulse = Math.sin(this.tick * 0.08 + i) * 3;
        ctx.fillStyle = '#4a044e';
        ctx.beginPath();
        ctx.ellipse(ax + 50, 90, 36 + pulse, 50, 0, 0, Math.PI * 2);
        ctx.fill();

        // Vein networks
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax + 50, 0);
        ctx.quadraticCurveTo(ax + 30, 45, ax + 50, 90);
        ctx.quadraticCurveTo(ax + 70, 135, ax + 50, 180);
        ctx.stroke();

        // Pulsing core within egg pod
        ctx.fillStyle = '#fda4af';
        ctx.beginPath();
        ctx.arc(ax + 50, 90, 8 + pulse * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Floating bio-spores
      ctx.fillStyle = 'rgba(244, 63, 94, 0.6)';
      for (let i = 0; i < 8; i++) {
        const spx = ((i * 65 + Math.sin(this.tick * 0.03 + i) * 20 - this.cameraX * 0.3) % this.viewWidth + this.viewWidth) % this.viewWidth + this.cameraX;
        const spy = (30 + i * 22 + Math.cos(this.tick * 0.04 + i) * 15) % 200;
        ctx.beginPath();
        ctx.arc(spx, spy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawFronds(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.7, cy - ry * 0.3, rx, ry, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + rx * 0.7, cy - ry * 0.3, rx, ry, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy - ry * 0.8, rx * 0.6, ry * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
