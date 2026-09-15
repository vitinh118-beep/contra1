import { Player, Bullet, Enemy, PowerUpItem, Platform, Particle, Boss, LevelTheme } from '../types';

/**
 * Enhanced Pixel-Art Sprite Rendering Engine on HTML5 Canvas
 * Faithful to classic 8-bit Contra with modern polish, vibrant retro colors,
 * high visual clarity, and authentic animations.
 */

// Draw Player (Bill Rizer = Blue Pants + Red Headband, Lance Bean = Red Pants + Blue Headband)
export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, tick: number) {
  if (player.state === 'dead') {
    // Dramatic tumbling death animation
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate((player.deadTimer / 500) * Math.PI * (player.direction === 1 ? -1 : 1));
    // Tumbled soldier
    ctx.fillStyle = player.color === 'blue' ? '#2563eb' : '#dc2626';
    ctx.fillRect(-7, -10, 14, 20);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-5, -14, 10, 8);
    // Bill has red headband, Lance has blue headband
    ctx.fillStyle = player.color === 'blue' ? '#ef4444' : '#38bdf8';
    ctx.fillRect(-6, -13, 12, 3);
    ctx.fillStyle = player.color === 'blue' ? '#facc15' : '#18181b';
    ctx.fillRect(-5, -16, 10, 3);
    ctx.restore();
    return;
  }

  // Invulnerability flashing (faster, smoother strobe)
  if (player.invulnerableTime > 0 && Math.floor(tick / 3) % 2 === 0) {
    return;
  }

  ctx.save();
  ctx.translate(player.x, player.y);

  // Flip if facing left
  if (player.direction === -1) {
    ctx.scale(-1, 1);
    ctx.translate(-player.width, 0);
  }

  // Authentic NES Contra Palettes:
  // Bill Rizer (Player 1): Red headband, Blonde hair, Blue pants
  // Lance Bean (Player 2): Blue headband, Dark hair, Red pants
  const isBill = player.color === 'blue';
  const pantsMain = isBill ? '#2563eb' : '#dc2626';
  const pantsShade = isBill ? '#1d4ed8' : '#b91c1c';
  const pantsDark = isBill ? '#1e3a8a' : '#7f1d1d';
  const pantsHighlight = isBill ? '#60a5fa' : '#f87171';
  const headbandColor = isBill ? '#ef4444' : '#38bdf8'; // Bill = Red bandana, Lance = Blue bandana
  const headbandShade = isBill ? '#b91c1c' : '#0284c7';
  const skinColor = '#fed7aa';
  const skinShadow = '#ea580c';
  const skinHighlight = '#ffedd5';
  const hairColor = isBill ? '#facc15' : '#18181b'; // Blonde Bill, Black-haired Lance
  const hairShade = isBill ? '#ca8a04' : '#09090b';
  const wristbandColor = '#ffffff'; // Iconic white commando sweatbands
  const bootColor = '#1e293b';
  const bootSole = '#020617';
  const gunColor = '#94a3b8';
  const gunDark = '#334155';
  const harnessColor = '#14532d'; // Olive drab military chest harness

  // 1. Barrier / Invincibility Shield Effect
  if (player.barrierTime > 0) {
    ctx.save();
    const shieldAngle = (tick * 0.08) % (Math.PI * 2);
    for (let i = 0; i < 3; i++) {
      const a = shieldAngle + (i * Math.PI * 2) / 3;
      const orbX = player.width / 2 + Math.cos(a) * 24;
      const orbY = player.height / 2 + Math.sin(a) * 24;

      // Outer plasma glow
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.arc(orbX, orbY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Core electric orb
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.arc(orbX, orbY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(orbX - 1, orbY - 1, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. Water Wading State
  if (player.isInWater) {
    // If submerged / prone in water
    if (player.state === 'prone' || player.state === 'crouch') {
      // Snorkel & top of headband
      ctx.fillStyle = headbandColor;
      ctx.fillRect(8, 25, 12, 4);
      ctx.fillStyle = hairColor;
      ctx.fillRect(9, 22, 10, 3);
      // Concentric water ripples
      const r = (tick % 20) * 0.8;
      ctx.strokeStyle = `rgba(147, 197, 253, ${Math.max(0, 1 - r / 16)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(player.width / 2, 28, 12 + r, 4 + r * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Torso above water
    // Head & Spiky Hair
    ctx.fillStyle = hairColor;
    ctx.fillRect(8, 2, 12, 5);
    ctx.fillStyle = hairShade;
    ctx.fillRect(7, 3, 2, 4);
    ctx.fillRect(19, 3, 2, 4);
    ctx.fillStyle = skinColor;
    ctx.fillRect(9, 6, 9, 7);

    // Headband with fluttering ribbons
    ctx.fillStyle = headbandColor;
    ctx.fillRect(7, 6, 13, 3);
    const tailY = 7 + Math.sin(tick * 0.3) * 2.5;
    ctx.fillRect(2, tailY, 6, 2);
    ctx.fillStyle = headbandShade;
    ctx.fillRect(0, tailY + 1, 4, 2);

    // Eye / brow
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(15, 8, 2, 2);

    // Bare muscular chest torso
    ctx.fillStyle = skinColor;
    ctx.fillRect(8, 13, 11, 13);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(11, 16, 4, 3);
    ctx.fillStyle = skinHighlight;
    ctx.fillRect(9, 14, 3, 2);
    // Harness bandolier
    ctx.fillStyle = harnessColor;
    ctx.fillRect(10, 13, 2, 13);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(10, 18, 2, 3); // buckle

    // Wristband
    ctx.fillStyle = wristbandColor;
    ctx.fillRect(13, 14, 3, 3);

    // Rifle held dry above waterline
    ctx.fillStyle = gunColor;
    ctx.fillRect(15, 12, 16, 4);
    ctx.fillStyle = gunDark;
    ctx.fillRect(17, 10, 3, 4);
    ctx.fillRect(14, 13, 3, 3);

    // Water ripple wave & foam ring at waist
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 25, 20, 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(2, 27, 24, 3);

    ctx.restore();
    return;
  }

  // 3. Jumping Somersault (Iconic NES Contra Ball Spin)
  if (player.state === 'jump') {
    ctx.save();
    ctx.translate(player.width / 2, player.height / 2);
    ctx.rotate(player.somersaultAngle);

    // Outer spin blur ring
    ctx.fillStyle = pantsDark;
    ctx.beginPath();
    ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
    ctx.fill();

    // Main curled ball body (blue/red pants)
    ctx.fillStyle = pantsMain;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pantsHighlight;
    ctx.beginPath();
    ctx.arc(-2, -2, 7, 0, Math.PI * 2);
    ctx.fill();

    // Curled commando head with spiky hair
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.arc(-3, -3, 6, 0, Math.PI * 2);
    ctx.fill();

    // Red/Blue headband ribbon wrapped around the spin
    ctx.fillStyle = headbandColor;
    ctx.fillRect(-8, -4, 16, 3.5);
    ctx.fillStyle = headbandShade;
    ctx.fillRect(-6, -2, 12, 1.5);

    // White wristband tucked in tuck
    ctx.fillStyle = wristbandColor;
    ctx.fillRect(-1, 3, 3, 3);

    // Gun tucked in spin
    ctx.fillStyle = gunColor;
    ctx.fillRect(2, -9, 4, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(3, -7, 2, 4);

    ctx.restore();
    ctx.restore();
    return;
  }

  // 4. Prone (Lying Down / Crawling)
  if (player.state === 'prone') {
    // Head with spiky hair & headband
    ctx.fillStyle = hairColor;
    ctx.fillRect(17, 19, 10, 5);
    ctx.fillStyle = skinColor;
    ctx.fillRect(20, 22, 7, 7);
    ctx.fillStyle = headbandColor;
    ctx.fillRect(17, 23, 11, 3);
    const hTail = 23 + Math.sin(tick * 0.3) * 1.5;
    ctx.fillRect(13, hTail, 5, 2);

    // Eye
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(25, 24, 2, 2);

    // Muscled back / torso
    ctx.fillStyle = skinColor;
    ctx.fillRect(10, 23, 11, 7);
    ctx.fillStyle = harnessColor;
    ctx.fillRect(13, 23, 2, 7);

    // White wristband
    ctx.fillStyle = wristbandColor;
    ctx.fillRect(23, 26, 3, 3);

    // Camo pants along ground
    ctx.fillStyle = pantsMain;
    ctx.fillRect(0, 24, 12, 6);
    ctx.fillStyle = pantsDark;
    ctx.fillRect(3, 26, 4, 4);
    ctx.fillStyle = pantsHighlight;
    ctx.fillRect(6, 24, 4, 2);
    ctx.fillStyle = bootColor;
    ctx.fillRect(-3, 26, 4, 4);

    // Long rifle pointing flat forward
    ctx.fillStyle = gunColor;
    ctx.fillRect(26, 25, 18, 4);
    ctx.fillStyle = gunDark;
    ctx.fillRect(25, 23, 4, 3);

    // Muzzle flash when shooting
    if (Date.now() - player.lastShotTime < 65) {
      drawMuzzleFlash(ctx, 45, 27, 0);
    }

    ctx.restore();
    return;
  }

  // 5. Crouching (Kneeling down on one knee)
  if (player.state === 'crouch') {
    // Head with spiky bangs
    ctx.fillStyle = hairColor;
    ctx.fillRect(8, 7, 12, 6);
    ctx.fillStyle = hairShade;
    ctx.fillRect(7, 8, 2, 4);
    ctx.fillRect(19, 8, 2, 4);
    ctx.fillStyle = skinColor;
    ctx.fillRect(10, 11, 8, 8);

    // Headband
    ctx.fillStyle = headbandColor;
    ctx.fillRect(7, 12, 13, 3);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(15, 14, 2, 2);

    // Fluttering headband tails
    const hY = 13 + Math.sin(tick * 0.25) * 2;
    ctx.fillStyle = headbandColor;
    ctx.fillRect(2, hY, 6, 2);
    ctx.fillStyle = headbandShade;
    ctx.fillRect(0, hY + 1, 4, 2);

    // Torso & Muscle
    ctx.fillStyle = skinColor;
    ctx.fillRect(9, 18, 9, 9);
    ctx.fillStyle = harnessColor;
    ctx.fillRect(11, 18, 2, 9);

    // Kneeling legs
    ctx.fillStyle = pantsMain;
    ctx.fillRect(5, 26, 14, 5);
    ctx.fillStyle = pantsDark;
    ctx.fillRect(8, 28, 4, 3);
    ctx.fillStyle = bootColor;
    ctx.fillRect(13, 29, 7, 3);
    ctx.fillRect(4, 28, 4, 4);
    ctx.fillStyle = bootSole;
    ctx.fillRect(13, 32, 7, 1.5);

    // White wristband
    ctx.fillStyle = wristbandColor;
    ctx.fillRect(13, 22, 3, 3);

    // Gun aimed horizontally
    ctx.fillStyle = gunColor;
    ctx.fillRect(16, 21, 17, 4);
    ctx.fillStyle = gunDark;
    ctx.fillRect(17, 19, 4, 3);

    if (Date.now() - player.lastShotTime < 65) {
      drawMuzzleFlash(ctx, 34, 23, 0);
    }

    ctx.restore();
    return;
  }

  // 6. Standing or Running (Iconic NES Contra Sprint Cycle)
  const runBob = player.state === 'run' ? Math.abs(Math.sin(player.animationFrame * 0.6)) * 2 : 0;
  const legFrame = Math.floor(player.animationFrame) % 4;

  // Head & 80s Spiky Commando Hair
  ctx.fillStyle = hairColor;
  ctx.fillRect(8, 1 - runBob, 12, 6);
  ctx.fillStyle = hairShade;
  ctx.fillRect(6, 2 - runBob, 3, 4);
  ctx.fillRect(19, 2 - runBob, 2, 4);
  // Front hair spikes
  ctx.fillStyle = hairColor;
  ctx.fillRect(14, -1 - runBob, 3, 3);
  ctx.fillRect(18, 0 - runBob, 2, 2);

  // Face
  ctx.fillStyle = skinColor;
  ctx.fillRect(9, 5 - runBob, 9, 8);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(15, 8 - runBob, 2, 2); // Eye

  // Headband with iconic long flowing ribbons behind him!
  ctx.fillStyle = headbandColor;
  ctx.fillRect(7, 6 - runBob, 13, 3);
  const ribY = 7 - runBob + Math.sin(tick * 0.3) * 2.5;
  ctx.fillStyle = headbandColor;
  ctx.fillRect(2, ribY, 6, 2.5);
  ctx.fillRect(-2, ribY + 1, 5, 2);
  ctx.fillStyle = headbandShade;
  ctx.fillRect(-5, ribY + 2, 4, 1.5);

  // Muscled Torso (Bare chest action hero)
  ctx.fillStyle = skinColor;
  ctx.fillRect(8, 13 - runBob, 10, 9);
  // Chest muscle shade
  ctx.fillStyle = skinShadow;
  ctx.fillRect(11, 16 - runBob, 4, 3);
  ctx.fillStyle = skinHighlight;
  ctx.fillRect(8, 14 - runBob, 3, 2);

  // Military chest webbing / harness
  ctx.fillStyle = harnessColor;
  ctx.fillRect(11, 13 - runBob, 2, 9);
  // Tactical utility belt
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(7, 21 - runBob, 12, 3);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(11, 21 - runBob, 3, 3); // Brass belt buckle

  // White commando wristbands
  ctx.fillStyle = wristbandColor;
  ctx.fillRect(12, 15 - runBob, 3, 3);

  // Running / Standing Legs with Authentic Camo & Boots
  ctx.fillStyle = pantsMain;
  if (player.state === 'run') {
    if (legFrame === 0) {
      // Step forward
      ctx.fillRect(6, 23 - runBob, 6, 8);
      ctx.fillRect(13, 23 - runBob, 6, 8);
      ctx.fillStyle = pantsDark;
      ctx.fillRect(7, 26 - runBob, 3, 3);
      ctx.fillStyle = pantsHighlight;
      ctx.fillRect(14, 25 - runBob, 3, 3);
      ctx.fillStyle = bootColor;
      ctx.fillRect(5, 30 - runBob, 6, 3);
      ctx.fillRect(14, 30 - runBob, 6, 3);
      ctx.fillStyle = bootSole;
      ctx.fillRect(5, 33 - runBob, 7, 1.5);
      ctx.fillRect(14, 33 - runBob, 7, 1.5);
    } else if (legFrame === 1) {
      // Full stride
      ctx.fillRect(4, 23 - runBob, 6, 7);
      ctx.fillRect(14, 22 - runBob, 6, 7);
      ctx.fillStyle = pantsDark;
      ctx.fillRect(5, 25 - runBob, 3, 3);
      ctx.fillStyle = bootColor;
      ctx.fillRect(2, 29 - runBob, 6, 3);
      ctx.fillRect(16, 28 - runBob, 5, 3);
      ctx.fillStyle = bootSole;
      ctx.fillRect(2, 32 - runBob, 6, 1.5);
    } else if (legFrame === 2) {
      // Middle passing
      ctx.fillRect(9, 23 - runBob, 7, 8);
      ctx.fillStyle = pantsDark;
      ctx.fillRect(10, 25 - runBob, 3, 3);
      ctx.fillStyle = bootColor;
      ctx.fillRect(8, 30 - runBob, 8, 3);
      ctx.fillStyle = bootSole;
      ctx.fillRect(8, 33 - runBob, 9, 1.5);
    } else {
      // Back leg extended
      ctx.fillRect(13, 23 - runBob, 6, 7);
      ctx.fillRect(5, 22 - runBob, 6, 7);
      ctx.fillStyle = pantsDark;
      ctx.fillRect(14, 25 - runBob, 3, 3);
      ctx.fillStyle = bootColor;
      ctx.fillRect(15, 29 - runBob, 6, 3);
      ctx.fillRect(3, 28 - runBob, 5, 3);
      ctx.fillStyle = bootSole;
      ctx.fillRect(15, 32 - runBob, 6, 1.5);
    }
  } else {
    // Standing steady
    ctx.fillRect(7, 23, 5, 8);
    ctx.fillRect(13, 23, 5, 8);
    ctx.fillStyle = pantsDark;
    ctx.fillRect(8, 25, 3, 3);
    ctx.fillStyle = pantsHighlight;
    ctx.fillRect(14, 25, 3, 3);
    ctx.fillStyle = bootColor;
    ctx.fillRect(6, 30, 6, 3);
    ctx.fillRect(13, 30, 6, 3);
    ctx.fillStyle = bootSole;
    ctx.fillRect(6, 33, 7, 1.5);
    ctx.fillRect(13, 33, 7, 1.5);
  }

  // Gun & Aiming Orientation (Authentic NES 8-way Aiming)
  ctx.fillStyle = gunColor;
  const aim = player.aimDirection;
  const shooting = Date.now() - player.lastShotTime < 65;

  if (aim.x === 0 && aim.y < 0) {
    // 1. Straight Up (Bill holds rifle vertically with both arms raised)
    ctx.fillRect(12, -8 - runBob, 4, 21);
    ctx.fillStyle = gunDark;
    ctx.fillRect(10, 4 - runBob, 5, 5);
    ctx.fillStyle = skinColor;
    ctx.fillRect(10, 7 - runBob, 6, 5);
    ctx.fillStyle = wristbandColor;
    ctx.fillRect(11, 5 - runBob, 4, 2);
    if (shooting) drawMuzzleFlash(ctx, 14, -9 - runBob, -Math.PI / 2);
  } else if (aim.x > 0 && aim.y < 0) {
    // 2. Diagonal Up-Right (45 degrees up)
    ctx.save();
    ctx.translate(14, 11 - runBob);
    ctx.rotate(-Math.PI / 4);
    ctx.fillRect(0, -2, 19, 4);
    ctx.fillStyle = gunDark;
    ctx.fillRect(2, 0, 4, 4);
    if (shooting) drawMuzzleFlash(ctx, 20, 0, 0);
    ctx.restore();
    ctx.fillStyle = skinColor;
    ctx.fillRect(11, 10 - runBob, 6, 5);
    ctx.fillStyle = wristbandColor;
    ctx.fillRect(12, 12 - runBob, 3, 3);
  } else if (aim.x > 0 && aim.y > 0) {
    // 3. Diagonal Down-Right (45 degrees down)
    ctx.save();
    ctx.translate(14, 15 - runBob);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(0, -2, 19, 4);
    ctx.fillStyle = gunDark;
    ctx.fillRect(2, 0, 4, 4);
    if (shooting) drawMuzzleFlash(ctx, 20, 0, 0);
    ctx.restore();
    ctx.fillStyle = skinColor;
    ctx.fillRect(11, 13 - runBob, 6, 5);
    ctx.fillStyle = wristbandColor;
    ctx.fillRect(12, 15 - runBob, 3, 3);
  } else {
    // 4. Straight Horizontal Forward
    ctx.fillRect(15, 12 - runBob, 18, 4);
    ctx.fillStyle = gunDark;
    ctx.fillRect(18, 10 - runBob, 4, 3); // Scope / sight
    ctx.fillRect(16, 15 - runBob, 3, 4); // Magazine
    ctx.fillStyle = skinColor;
    ctx.fillRect(11, 12 - runBob, 6, 5);
    ctx.fillStyle = wristbandColor;
    ctx.fillRect(12, 14 - runBob, 3, 3);
    if (shooting) drawMuzzleFlash(ctx, 34, 14 - runBob, 0);
  }

  ctx.restore();
}

// Draw crisp 8-bit muzzle flash starburst
function drawMuzzleFlash(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Outer orange flare
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(8, 0);
  ctx.lineTo(0, 5);
  ctx.lineTo(-2, 0);
  ctx.closePath();
  ctx.fill();

  // Inner white/yellow burst
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(2, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(1, -1, 3, 2);

  ctx.restore();
}

// Draw Bullets with vivid high-contrast glows
export function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet) {
  ctx.save();

  if (bullet.isEnemy) {
    if (bullet.type === 'boss_missile') {
      // Guided Boss Missile with rocket fuselage and flame trail
      const angle = bullet.angle ?? Math.atan2(bullet.vy, bullet.vx);
      ctx.translate(bullet.x, bullet.y);
      ctx.rotate(angle);

      // Rocket body
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-10, -3, 16, 6);
      ctx.fillStyle = '#ef4444'; // Red warhead
      ctx.fillRect(6, -2.5, 5, 5);
      // Fins
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-10, -5, 4, 2);
      ctx.fillRect(-10, 3, 4, 2);

      // Jet exhaust flame
      const fl = 4 + (Date.now() % 6);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-10 - fl, -2, fl, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-10 - fl / 2, -1, fl / 2, 2);

      ctx.restore();
      return;
    }

    if (bullet.type === 'boss_fireball') {
      // Swirling Demonic Plasma Fireball
      const t = Date.now() * 0.03;
      ctx.translate(bullet.x, bullet.y);
      ctx.rotate(t);

      // Outer corona
      ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius + 4, 0, Math.PI * 2);
      ctx.fill();

      // Spinning flame tendrils
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-6, -6, 12, 12);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -2, 4, 4);

      ctx.restore();
      return;
    }

    // HIGH-VISIBILITY ENEMY BULLET:
    // Bright neon-red/orange core with a clear dark rim and white highlight
    // Makes dodging incoming fire responsive and fair!
    ctx.fillStyle = '#0f172a'; // dark outer outline for contrast
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius + 2, 0, Math.PI * 2);
    ctx.fill();

    // Vibrant red ring
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius + 1, 0, Math.PI * 2);
    ctx.fill();

    // Hot orange/yellow center
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius - 0.5, 0, Math.PI * 2);
    ctx.fill();

    // White specular dot
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bullet.x - 1, bullet.y - 1, 2, 2);

    ctx.restore();
    return;
  }

  switch (bullet.type) {
    case 'S': {
      // Spread Gun: Glowing energetic fireball orbs with spark trail
      const r = bullet.radius;
      // Outer fiery corona
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, r + 3, 0, Math.PI * 2);
      ctx.fill();

      // Main red body
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, r + 1, 0, Math.PI * 2);
      ctx.fill();

      // Hot golden core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, r - 1, 0, Math.PI * 2);
      ctx.fill();

      // Pure white center
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bullet.x - 1, bullet.y - 1, 2, 2);
      break;
    }

    case 'L': {
      // Laser Gun: Intense neon cyan-white energy bolt
      const len = 24;
      const angle = bullet.angle ?? Math.atan2(bullet.vy, bullet.vx);
      ctx.translate(bullet.x, bullet.y);
      ctx.rotate(angle);

      // Cyan outer glow
      ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.fillRect(-len / 2 - 2, -4, len + 4, 8);

      // High-intensity beam
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-len / 2, -2.5, len, 5);

      // White core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-len / 2 + 3, -1, len - 6, 2);
      break;
    }

    case 'F': {
      // Flame Gun: Roaring swirling fireball that rotates
      const t = Date.now() * 0.02;
      ctx.translate(bullet.x, bullet.y);
      ctx.rotate(t);

      // Fire aura
      ctx.fillStyle = 'rgba(249, 115, 22, 0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius + 3, 0, Math.PI * 2);
      ctx.fill();

      // Swirling flame petals
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-5, -5, 10, 10);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-3, -3, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1.5, -1.5, 3, 3);
      break;
    }

    case 'M': {
      // Machine Gun: Streamlined high-velocity amber tracer
      const angle = bullet.angle ?? Math.atan2(bullet.vy, bullet.vx);
      ctx.translate(bullet.x, bullet.y);
      ctx.rotate(angle);

      // Yellow tracer glow
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-6, -2, 12, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-4, -1, 8, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -0.5, 4, 1);
      break;
    }

    default: {
      // Normal Rifle (R): Crisp bright yellow round pellet
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

// Draw Enemies with authentic retro pixel military details
export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, tick: number) {
  if (!enemy.active) return;

  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  if (enemy.direction === 1 && enemy.type !== 'turret') {
    ctx.scale(-1, 1);
    ctx.translate(-enemy.width, 0);
  }

  switch (enemy.type) {
    case 'runner': {
      // Classic Red Falcon infantry soldier
      const frame = Math.floor(enemy.animFrame) % 4;

      // Combat helmet with visor
      ctx.fillStyle = '#991b1b'; // Dark red helmet
      ctx.fillRect(8, 2, 10, 5);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(9, 1, 8, 2);
      ctx.fillStyle = '#fed7aa'; // Face
      ctx.fillRect(9, 6, 8, 6);
      ctx.fillStyle = '#1e293b'; // Visor / Eye
      ctx.fillRect(14, 7, 2, 2);

      // Red military uniform & harness
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(7, 12, 11, 10);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(9, 12, 2, 10); // belt strap
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(7, 21, 11, 2); // Belt

      // Running legs
      ctx.fillStyle = '#1e293b';
      if (frame === 0 || frame === 2) {
        ctx.fillRect(6, 23, 5, 8);
        ctx.fillRect(13, 23, 5, 8);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(5, 29, 6, 3);
        ctx.fillRect(13, 29, 6, 3);
      } else {
        ctx.fillRect(4, 22, 6, 8);
        ctx.fillRect(14, 22, 5, 7);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(2, 28, 6, 3);
        ctx.fillRect(15, 27, 5, 3);
      }

      // Assault rifle
      ctx.fillStyle = '#475569';
      ctx.fillRect(2, 14, 13, 4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(5, 17, 3, 3); // magazine clip
      break;
    }

    case 'sniper': {
      // Camouflaged prone/crouched sniper
      // Green camo helmet with foliage texture
      ctx.fillStyle = '#14532d';
      ctx.fillRect(6, 1, 12, 5);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(7, 0, 4, 3);
      ctx.fillRect(13, 2, 3, 2);

      // Face
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(8, 5, 8, 6);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(13, 6, 2, 2);

      // Camouflage uniform
      ctx.fillStyle = '#15803d';
      ctx.fillRect(6, 10, 12, 12);
      ctx.fillStyle = '#166534';
      ctx.fillRect(8, 12, 4, 4);
      ctx.fillRect(12, 16, 4, 4);

      // Long sniper barrel pointing towards player
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-10, 12, 18, 3);
      ctx.fillStyle = '#475569';
      ctx.fillRect(-2, 10, 6, 3); // Scope

      // TELEGRAPH LASER / FLASH:
      // When sniper is about to shoot (< 600ms), show a telegraphing sight!
      if (enemy.shootCooldown < 600) {
        const blink = Math.floor(tick / 2) % 2 === 0;
        if (blink) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.fillRect(-40, 13, 30, 1); // Laser sight line
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(-11, 13.5, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'turret': {
      // Beveled Armored Heavy Pillbox Turret
      const tAngle = enemy.turretAngle ?? 0;

      // Heavy steel hemisphere bunker base
      const baseGrad = ctx.createLinearGradient(0, 8, 0, 32);
      baseGrad.addColorStop(0, '#64748b');
      baseGrad.addColorStop(0.5, '#475569');
      baseGrad.addColorStop(1, '#1e293b');

      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.arc(16, 24, 16, Math.PI, Math.PI * 2);
      ctx.fill();

      // Steel rim and bolts
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 24, 32, 8);
      ctx.fillStyle = '#cbd5e1';
      for (let bx = 3; bx < 30; bx += 7) {
        ctx.fillRect(bx, 26, 2, 2); // Rivets
      }

      // Swiveling dual heavy cannons
      ctx.save();
      ctx.translate(16, 20);
      ctx.rotate(tAngle);

      // Cannon housing
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4, -6, 12, 12);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-2, -5, 8, 10);

      // Twin long barrels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, -4, 16, 3);
      ctx.fillRect(4, 1, 16, 3);
      ctx.fillStyle = '#475569';
      ctx.fillRect(5, -3.5, 14, 2);
      ctx.fillRect(5, 1.5, 14, 2);

      // Muzzle tips
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(19, -4, 2, 3);
      ctx.fillRect(19, 1, 2, 3);

      ctx.restore();

      // Flashing optical targeting sensor
      const sensorBlink = Math.floor(tick / 6) % 2 === 0;
      ctx.fillStyle = sensorBlink ? '#ef4444' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(16, 14, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'scuba': {
      // Diver emerging from water
      if (enemy.submerged) {
        // Under surface: air bubbles & periscope
        ctx.fillStyle = '#38bdf8';
        const bubbleY = 20 - (tick % 16);
        ctx.fillRect(12, bubbleY, 3, 3);
        ctx.fillRect(16, bubbleY + 6, 2, 2);
        // Water ripples
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(14, 26, 12, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Surfaced diver
        ctx.fillStyle = '#1e293b'; // Wetsuit
        ctx.fillRect(8, 8, 11, 16);
        // Scuba diving mask & goggles
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(12, 8, 6, 4);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(8, 6, 11, 3); // Red diver hood

        // Harpoon gun / rifle
        ctx.fillStyle = '#64748b';
        ctx.fillRect(2, 12, 14, 4);

        // Water splash droplets around base
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(3, 24, 4, 3);
        ctx.fillRect(20, 24, 4, 3);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(0, 26, 26, 4);
      }
      break;
    }

    case 'alien_crawler': {
      // Menacing alien spider/insect
      const wobble = Math.sin(tick * 0.3) * 3;
      ctx.fillStyle = '#7e22ce';
      ctx.beginPath();
      ctx.arc(12, 10, 8, 0, Math.PI * 2);
      ctx.fill();

      // Glowing multi-eyes
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(6, 8, 3, 3);
      ctx.fillRect(11, 7, 3, 3);
      ctx.fillRect(16, 8, 3, 3);

      // Twitching segmented legs
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, 10);
      ctx.lineTo(1, 16 + wobble);
      ctx.moveTo(18, 10);
      ctx.lineTo(23, 16 - wobble);
      ctx.moveTo(12, 14);
      ctx.lineTo(12, 20);
      ctx.stroke();
      break;
    }

    case 'capsule': {
      // Flying Red Falcon winged power-up drone
      const wingFlap = Math.sin(tick * 0.25) * 4;

      // Red Falcon wings
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(1, 8 - wingFlap);
      ctx.lineTo(12, 3);
      ctx.lineTo(23, 8 - wingFlap);
      ctx.lineTo(12, 13);
      ctx.closePath();
      ctx.fill();

      // Metallic wing trim
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(3, 7 - wingFlap * 0.5, 4, 2);
      ctx.fillRect(17, 7 - wingFlap * 0.5, 4, 2);

      // Glowing central capsule orb
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(12, 8, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(12, 8, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'wall_sensor': {
      // Defense hub sensor terminal
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 20, 24);
      ctx.fillStyle = '#475569';
      ctx.fillRect(2, 2, 16, 20);

      // Pulsing red sensor eye
      const blink = Math.floor(tick / 6) % 2 === 0;
      ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(10, 12, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(9, 10, 2, 2);
      break;
    }
  }

  ctx.restore();
}

// Draw Dropped Falcon Power-Up Badge ([S], [M], [L], [F], [B], [!])
export function drawPowerUp(ctx: CanvasRenderingContext2D, item: PowerUpItem, tick: number) {
  ctx.save();
  ctx.translate(item.x, item.y);

  // Outer glowing pulse
  const pulse = Math.sin(tick * 0.2) * 1.5;
  ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
  ctx.beginPath();
  ctx.arc(8, 8, 10 + pulse, 0, Math.PI * 2);
  ctx.fill();

  // Red/Gold Falcon badge
  const bgGrad = ctx.createRadialGradient(8, 8, 1, 8, 8, 9);
  bgGrad.addColorStop(0, '#ffffff');
  bgGrad.addColorStop(0.35, '#ef4444');
  bgGrad.addColorStop(1, '#991b1b');

  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(8, 8, 8.5, 0, Math.PI * 2);
  ctx.fill();

  // Golden border ring
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Badge Letter
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const label = item.type === 'BOMB' ? '!' : item.type;
  ctx.fillText(label, 8, 9);

  ctx.restore();
}

// Draw Boss (Fortress Gate, Cyber Dragon Bima, Heavy Siege Tank, Emperor Java & Alien Heart)
export function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss, tick: number) {
  if (!boss.active && !boss.defeated) return;

  ctx.save();
  ctx.translate(boss.x, boss.y);

  if (boss.type === 'fortress') {
    // Stage 1 Boss: Gomeramos Steel Fortress Gate
    // 1. Reinforced blast-shield background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, boss.width, boss.height);

    // 2. Beveled industrial armor panels
    for (let y = 0; y < boss.height; y += 32) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(2, y + 2, boss.width - 4, 28);
      ctx.fillStyle = '#475569';
      ctx.fillRect(4, y + 4, boss.width - 8, 2);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, y + 27, boss.width - 8, 2);

      // Steel bolt rivets
      ctx.fillStyle = '#94a3b8';
      for (let bx = 8; bx < boss.width - 10; bx += 24) {
        ctx.fillRect(bx, y + 8, 2, 2);
        ctx.fillRect(bx, y + 22, 2, 2);
      }
    }

    // 3. Diagonal hazard caution yellow-black stripes at base
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, boss.height - 14, boss.width, 14);
    ctx.fillStyle = '#0f172a';
    for (let x = 0; x < boss.width + 20; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, boss.height);
      ctx.lineTo(x + 8, boss.height - 14);
      ctx.lineTo(x + 14, boss.height - 14);
      ctx.lineTo(x + 6, boss.height);
      ctx.fill();
    }

    // 4. Boss Parts (Radar, Turrets, Core)
    for (const part of boss.parts) {
      const px = part.x - boss.x;
      const py = part.y - boss.y;

      if (part.destroyed) {
        // Scorched blown-out crater
        ctx.fillStyle = '#020617';
        ctx.fillRect(px, py, part.width, part.height);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + 2, py + 2, part.width - 4, part.height - 4);
        if (Math.floor(tick / 8) % 2 === 0) {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(px + Math.random() * part.width, py - 4, 4, 4);
        }
        continue;
      }

      if (part.id === 'radar') {
        // Rotating Parabolic Radar Dish
        ctx.save();
        ctx.translate(px + part.width / 2, py + part.height / 2);
        const dishAngle = Math.sin(tick * 0.06) * 0.5;
        ctx.rotate(dishAngle);

        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dipole antenna & sweeping red sensor beam
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-2, -8, 4, 8);
        ctx.beginPath();
        ctx.arc(0, -8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (part.id.startsWith('turret')) {
        // Dual Heavy Cannon Turret
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px, py, part.width, part.height);
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 2, py + 2, part.width - 4, part.height - 4);

        // Long heavy dual cannon barrels pointing left towards player
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px - 16, py + 4, 18, 5);
        ctx.fillRect(px - 16, py + 15, 18, 5);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px - 14, py + 5, 14, 3);
        ctx.fillRect(px - 14, py + 16, 14, 3);

        // Muzzle rings
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px - 16, py + 4, 3, 5);
        ctx.fillRect(px - 16, py + 15, 3, 5);

        // Health bar
        const hpRatio = part.health / part.maxHealth;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, py - 6, part.width, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px, py - 6, part.width * hpRatio, 4);
      } else if (part.id === 'core') {
        // CENTRAL VULNERABLE BIO-MECHANICAL ENERGY CORE
        const corePulse = Math.sin(tick * 0.15);
        ctx.fillStyle = '#020617';
        ctx.fillRect(px, py, part.width, part.height);

        // Multi-stage glowing plasma reactor
        const coreGrad = ctx.createRadialGradient(
          px + part.width / 2,
          py + part.height / 2,
          2,
          px + part.width / 2,
          py + part.height / 2,
          20 + corePulse * 3
        );
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.3, '#facc15');
        coreGrad.addColorStop(0.6, '#ef4444');
        coreGrad.addColorStop(1, '#7f1d1d');

        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(px + part.width / 2, py + part.height / 2, 14 + corePulse * 2, 0, Math.PI * 2);
        ctx.fill();

        // Energy containment ring
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Boss Health Gauge
        const hpRatio = Math.max(0, part.health / part.maxHealth);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px - 20, py - 18, part.width + 40, 10);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px - 18, py - 16, (part.width + 36) * hpRatio, 6);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(px - 20, py - 18, part.width + 40, 10);
      }
    }
  } else if (boss.type === 'bima_dragon') {
    // Stage 2 Boss: Bima Cyber Dragon Guardian
    // 1. Biomechanical dragon spine wall frame
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, boss.width, boss.height);

    // Cyber dragon scales and energy conduits
    for (let y = 8; y < boss.height; y += 22) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(10, y, boss.width - 20, 18);
      ctx.fillStyle = '#334155';
      ctx.fillRect(14, y + 2, boss.width - 28, 6);

      // Glowing cyan cyber bus lines
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(16, y + 10, boss.width - 32, 2);
    }

    // Spine spikes protruding along the back
    ctx.fillStyle = '#0284c7';
    for (let y = 14; y < boss.height - 20; y += 28) {
      ctx.beginPath();
      ctx.moveTo(boss.width, y);
      ctx.lineTo(boss.width + 12, y + 7);
      ctx.lineTo(boss.width, y + 14);
      ctx.fill();
    }

    // 2. Boss Parts (Dragon Head, Missile Pod, Laser Cannon, Heart Core)
    for (const part of boss.parts) {
      const px = part.x - boss.x;
      const py = part.y - boss.y;

      if (part.destroyed) {
        ctx.fillStyle = '#020617';
        ctx.fillRect(px, py, part.width, part.height);
        if (Math.floor(tick / 6) % 2 === 0) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(px + Math.random() * part.width, py + Math.random() * part.height, 4, 4);
        }
        continue;
      }

      if (part.id === 'dragon_head') {
        // Menacing Cyber Dragon Head
        ctx.save();
        ctx.translate(px, py);

        // Head skull armored crest
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(part.width, 0);
        ctx.lineTo(0, part.height * 0.4);
        ctx.lineTo(10, part.height * 0.6);
        ctx.lineTo(part.width, part.height);
        ctx.fill();

        // Upper snout & sharp teeth
        ctx.fillStyle = '#334155';
        ctx.fillRect(4, part.height * 0.3, part.width - 8, 8);
        ctx.fillStyle = '#e2e8f0';
        for (let tx = 6; tx < part.width - 12; tx += 6) {
          ctx.beginPath();
          ctx.moveTo(tx, part.height * 0.38);
          ctx.lineTo(tx + 3, part.height * 0.52);
          ctx.lineTo(tx + 6, part.height * 0.38);
          ctx.fill();
        }

        // Glowing dragon horn crest
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(part.width - 6, 0);
        ctx.lineTo(part.width + 16, -14);
        ctx.lineTo(part.width + 4, 8);
        ctx.fill();

        // Pulsing emerald dragon eye
        const eyeGlow = Math.sin(tick * 0.2) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(34, 197, 94, ${eyeGlow})`;
        ctx.fillRect(16, 6, 8, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(18, 7, 3, 3);

        ctx.restore();

        // Health bar
        const hpRatio = part.health / part.maxHealth;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, py - 6, part.width, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(px, py - 6, part.width * hpRatio, 4);
      } else if (part.id === 'left_launcher') {
        // Quad Flak Missile Pod
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px, py, part.width, part.height);
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + 2, py + 2, part.width - 4, part.height - 4);

        // 4 missile launch tube ports with armed warheads
        for (let mx = px + 4; mx < px + part.width - 6; mx += 10) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(mx, py + 4, 7, 7);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(mx + 1.5, py + 5.5, 4, 4);
        }

        // Health bar
        const hpRatio = part.health / part.maxHealth;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, py - 6, part.width, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px, py - 6, part.width * hpRatio, 4);
      } else if (part.id === 'right_launcher') {
        // Heavy Plasma Arc Cannon
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px, py, part.width, part.height);
        // Heavy emitter barrel extending left
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px - 14, py + 5, 16, 8);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(px - 12, py + 7, 12, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - 14, py + 8, 3, 2);

        // Health bar
        const hpRatio = part.health / part.maxHealth;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, py - 6, part.width, 4);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(px, py - 6, part.width * hpRatio, 4);
      } else if (part.id === 'core') {
        // Dragon Heart Reactor Core
        const pulse = Math.sin(tick * 0.16);
        ctx.fillStyle = '#020617';
        ctx.fillRect(px, py, part.width, part.height);

        // Rotating draconic energy sphere
        const grad = ctx.createRadialGradient(
          px + part.width / 2,
          py + part.height / 2,
          2,
          px + part.width / 2,
          py + part.height / 2,
          18 + pulse * 3
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#38bdf8');
        grad.addColorStop(0.7, '#0284c7');
        grad.addColorStop(1, '#082f49');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px + part.width / 2, py + part.height / 2, 14 + pulse * 2, 0, Math.PI * 2);
        ctx.fill();

        // Health Gauge
        const hpRatio = Math.max(0, part.health / part.maxHealth);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px - 20, py - 18, part.width + 40, 10);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(px - 18, py - 16, (part.width + 36) * hpRatio, 6);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(px - 20, py - 18, part.width + 40, 10);
      }
    }
  } else if (boss.type === 'armored_tank') {
    // Stage 3 Boss: Big Fuzz D-34 Heavy Siege Tank
    // 1. Heavy Tank Chassis and Sloped Armor Body
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, boss.width, boss.height - 20);

    // Armor plating rivets and winter camouflage streaks
    for (let y = 10; y < boss.height - 25; y += 26) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, y, boss.width - 12, 22);
      ctx.fillStyle = '#e2e8f0'; // Winter white camo streak
      ctx.fillRect(20, y + 4, 35, 4);
      ctx.fillRect(75, y + 12, 25, 3);
    }

    // Twin Exhaust Smoke Stacks at top rear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(boss.width - 24, -14, 8, 16);
    ctx.fillRect(boss.width - 12, -14, 8, 16);
    // Smoke puffs
    if (Math.floor(tick / 5) % 2 === 0) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.beginPath();
      ctx.arc(boss.width - 20, -18, 5, 0, Math.PI * 2);
      ctx.arc(boss.width - 8, -20, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Boss Parts (Howitzer Turret, Mortar, Caterpillar Treads, Boiler Core)
    for (const part of boss.parts) {
      const px = part.x - boss.x;
      const py = part.y - boss.y;

      if (part.destroyed) {
        ctx.fillStyle = '#020617';
        ctx.fillRect(px, py, part.width, part.height);
        if (Math.floor(tick / 8) % 2 === 0) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(px + Math.random() * part.width, py, 5, 5);
        }
        continue;
      }

      if (part.id === 'tank_turret') {
        // Massive Dual Howitzer Cannon
        ctx.fillStyle = '#334155';
        ctx.fillRect(px, py, part.width, part.height);
        // Heavy twin cannon barrels pointing left
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px - 26, py + 4, 28, 6);
        ctx.fillRect(px - 26, py + 16, 28, 6);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px - 24, py + 5, 24, 4);
        ctx.fillRect(px - 24, py + 17, 24, 4);
        // Muzzle brakes
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px - 28, py + 3, 4, 8);
        ctx.fillRect(px - 28, py + 15, 4, 8);

        // Health bar
        const hpRatio = part.health / part.maxHealth;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, py - 6, part.width, 4);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px, py - 6, part.width * hpRatio, 4);
      } else if (part.id === 'tank_mortar') {
        // Heavy Flak Mortar Tube
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px, py, part.width, part.height);
        // Angled mortar tube pointing up-left
        ctx.save();
        ctx.translate(px + part.width / 2, py + part.height / 2);
        ctx.rotate(-0.6);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-6, -18, 12, 22);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-4, -16, 8, 18);
        ctx.restore();

        // Health bar
        const hpRatio = part.health / part.maxHealth;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, py - 6, part.width, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px, py - 6, part.width * hpRatio, 4);
      } else if (part.id === 'tread_guard') {
        // Caterpillar Tracks with animated road wheels
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, py, part.width, part.height);

        // Heavy track link belt
        ctx.fillStyle = '#334155';
        ctx.fillRect(px, py + 2, part.width, part.height - 4);

        // Animated rotating road wheels
        const wheelRot = (tick * 0.1) % (Math.PI * 2);
        for (let wx = px + 12; wx < px + part.width - 10; wx += 22) {
          ctx.save();
          ctx.translate(wx, py + part.height / 2);
          ctx.rotate(wheelRot);
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#64748b';
          ctx.fillRect(-7, -2, 14, 4);
          ctx.fillRect(-2, -7, 4, 14);
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Health bar
        const hpRatio = part.health / part.maxHealth;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, py - 6, part.width, 4);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px, py - 6, part.width * hpRatio, 4);
      } else if (part.id === 'core') {
        // Overheated Diesel Boiler Reactor Core
        const corePulse = Math.sin(tick * 0.18);
        ctx.fillStyle = '#020617';
        ctx.fillRect(px, py, part.width, part.height);

        // Fiery boiler glow
        const grad = ctx.createRadialGradient(
          px + part.width / 2,
          py + part.height / 2,
          2,
          px + part.width / 2,
          py + part.height / 2,
          18 + corePulse * 3
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#ea580c');
        grad.addColorStop(0.8, '#b91c1c');
        grad.addColorStop(1, '#450a0a');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px + part.width / 2, py + part.height / 2, 15 + corePulse * 2, 0, Math.PI * 2);
        ctx.fill();

        // Boiler iron cage grate
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Large Health Gauge
        const hpRatio = Math.max(0, part.health / part.maxHealth);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px - 20, py - 18, part.width + 40, 10);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(px - 18, py - 16, (part.width + 36) * hpRatio, 6);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(px - 20, py - 18, part.width + 40, 10);
      }
    }
  } else {
    // Stage 4 Boss: Shadow Beast Emperor Java & Alien Gowa Heart (boss.type === 'emperor_java' or 'alien_heart')
    // 1. Alien Carapace Wall Frame
    ctx.fillStyle = '#2e1065';
    ctx.fillRect(0, 0, boss.width, boss.height);

    // Living sinew and organic tentacles
    for (let y = 10; y < boss.height; y += 28) {
      ctx.fillStyle = '#581c87';
      ctx.fillRect(4, y, boss.width - 8, 22);
      ctx.fillStyle = '#7e22ce';
      ctx.beginPath();
      ctx.arc(boss.width * 0.4, y + 11, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Boss Parts (Java Skull, Tentacles, Beating Gowa Heart)
    for (const part of boss.parts) {
      const px = part.x - boss.x;
      const py = part.y - boss.y;

      if (part.destroyed) {
        ctx.fillStyle = '#020617';
        ctx.fillRect(px, py, part.width, part.height);
        if (Math.floor(tick / 6) % 2 === 0) {
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(px + Math.random() * part.width, py, 4, 4);
        }
        continue;
      }

      if (part.id === 'java_skull') {
        // Demonic Horned Alien Emperor Skull
        ctx.save();
        ctx.translate(px, py);

        // Huge Horned Skull
        ctx.fillStyle = '#4c0519';
        ctx.beginPath();
        ctx.moveTo(part.width * 0.5, 0);
        ctx.lineTo(part.width, part.height * 0.3);
        ctx.lineTo(part.width * 0.8, part.height * 0.85);
        ctx.lineTo(part.width * 0.2, part.height * 0.85);
        ctx.lineTo(0, part.height * 0.3);
        ctx.fill();

        // Demon Horns
        ctx.fillStyle = '#881337';
        ctx.beginPath();
        ctx.moveTo(10, 8);
        ctx.quadraticCurveTo(-14, -14, -8, -24);
        ctx.quadraticCurveTo(8, -12, 18, 4);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(part.width - 10, 8);
        ctx.quadraticCurveTo(part.width + 14, -14, part.width + 8, -24);
        ctx.quadraticCurveTo(part.width - 8, -12, part.width - 18, 4);
        ctx.fill();

        // Snapping Mandible Jaws
        const jawOpen = Math.sin(tick * 0.15) * 4;
        ctx.fillStyle = '#9f1239';
        ctx.fillRect(10, part.height * 0.65 + jawOpen, part.width - 20, 10);
        // Razor fangs
        ctx.fillStyle = '#fecdd3';
        for (let fx = 12; fx < part.width - 16; fx += 8) {
          ctx.beginPath();
          ctx.moveTo(fx, part.height * 0.65 + jawOpen);
          ctx.lineTo(fx + 3, part.height * 0.65 + jawOpen + 6);
          ctx.lineTo(fx + 6, part.height * 0.65 + jawOpen);
          ctx.fill();
        }

        // Blazing Compound Demon Eyes
        const eyePulse = Math.sin(tick * 0.25) * 0.4 + 0.6;
        ctx.fillStyle = `rgba(239, 68, 68, ${eyePulse})`;
        ctx.beginPath();
        ctx.arc(part.width * 0.3, part.height * 0.4, 7, 0, Math.PI * 2);
        ctx.arc(part.width * 0.7, part.height * 0.4, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(part.width * 0.3 - 2, part.height * 0.4 - 2, 4, 4);
        ctx.fillRect(part.width * 0.7 - 2, part.height * 0.4 - 2, 4, 4);

        ctx.restore();

        // Health bar
        const hpRatio = part.health / part.maxHealth;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, py - 6, part.width, 4);
        ctx.fillStyle = '#be123c';
        ctx.fillRect(px, py - 6, part.width * hpRatio, 4);
      } else if (part.id.includes('tentacle')) {
        // Sinuous Bio-Tentacle
        const wave = Math.sin(tick * 0.12 + (part.id.includes('left') ? 0 : Math.PI)) * 8;
        ctx.fillStyle = '#701a75';
        ctx.beginPath();
        ctx.ellipse(px + part.width / 2 + wave, py + part.height / 2, part.width / 2, part.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Suction cups / glowing poison blisters
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(px + part.width / 2 + wave, py + part.height / 2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const hpRatio = part.health / part.maxHealth;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, py - 6, part.width, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(px, py - 6, part.width * hpRatio, 4);
      } else if (part.id === 'core' || part.id === 'alien_core') {
        // COLOSSAL BEATING XENOMORPH GOWA HEART
        const heartBeat = Math.sin(tick * 0.22) * 4;
        ctx.fillStyle = '#020617';
        ctx.fillRect(px, py, part.width, part.height);

        // Pulsing systolic heart body
        ctx.fillStyle = '#4c0519';
        ctx.beginPath();
        ctx.arc(px + part.width / 2, py + part.height / 2, 22 + heartBeat, 0, Math.PI * 2);
        ctx.fill();

        // Arterial blood chambers
        ctx.fillStyle = '#be123c';
        ctx.beginPath();
        ctx.arc(px + part.width / 2 - 10, py + part.height / 2 - 6, 12 + heartBeat * 0.5, 0, Math.PI * 2);
        ctx.arc(px + part.width / 2 + 10, py + part.height / 2 - 6, 12 + heartBeat * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Glowing alien eye nucleus
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(px + part.width / 2, py + part.height / 2, 8 + heartBeat * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + part.width / 2 - 1.5, py + part.height / 2 - 3, 3, 6);

        // Huge Final Boss Health Gauge
        const hpRatio = Math.max(0, part.health / part.maxHealth);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px - 24, py - 20, part.width + 48, 12);
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(px - 22, py - 18, (part.width + 44) * hpRatio, 8);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px - 24, py - 20, part.width + 48, 12);
      }
    }
  }

  ctx.restore();
}

// Draw Platform and Terrain with rich, theme-specific retro pixel textures
export function drawPlatform(ctx: CanvasRenderingContext2D, plat: Platform, theme: LevelTheme) {
  if (plat.exploded) return;

  ctx.save();

  // 1. Water platforms
  if (plat.isWater) {
    const grad = ctx.createLinearGradient(0, plat.y, 0, plat.y + plat.height);
    grad.addColorStop(0, '#0369a1');
    grad.addColorStop(0.3, '#0284c7');
    grad.addColorStop(1, '#0c4a6e');

    ctx.fillStyle = grad;
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

    // Animated shimmering wave crests
    ctx.fillStyle = '#e0f2fe';
    for (let x = plat.x; x < plat.x + plat.width; x += 18) {
      ctx.fillRect(x, plat.y, 10, 2);
    }
    ctx.fillStyle = '#38bdf8';
    for (let x = plat.x + 8; x < plat.x + plat.width; x += 18) {
      ctx.fillRect(x, plat.y + 2, 8, 2);
    }
    ctx.restore();
    return;
  }

  // 2. Bridges
  if (plat.isBridge) {
    ctx.fillStyle = '#451a03';
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

    // Wooden planks with gap lines
    ctx.fillStyle = '#78350f';
    for (let x = plat.x; x < plat.x + plat.width; x += 14) {
      ctx.fillRect(x + 1, plat.y + 1, 12, plat.height - 2);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x + 2, plat.y + 2, 10, 3);
      ctx.fillStyle = '#78350f';
    }

    // Steel support cables
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(plat.x, plat.y);
    ctx.lineTo(plat.x + plat.width / 2, plat.y - 14);
    ctx.lineTo(plat.x + plat.width, plat.y);
    ctx.stroke();

    // Bridge explosive warning LEDs
    if (plat.exploding) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(plat.x + plat.width / 2, plat.y + 4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(plat.x + plat.width / 2 - 2, plat.y + 2, 4, 4);
    }

    ctx.restore();
    return;
  }

  // 3. Theme-Specific Platforms
  if (theme === 'jungle') {
    // Jungle Island: Iconic NES Contra Stage 1 emerald grass canopy with hanging blades & warm striated earth rock
    // Top Grass layer
    ctx.fillStyle = '#15803d'; // Rich forest green
    ctx.fillRect(plat.x, plat.y, plat.width, 6);

    // Bright lime grass highlights & tufts
    ctx.fillStyle = '#4ade80';
    for (let x = plat.x; x < plat.x + plat.width; x += 6) {
      ctx.fillRect(x, plat.y, 4, 3);
      // Hanging grass blades / tufts
      if (x % 12 === 0) {
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x + 1, plat.y + 6, 3, 4);
        ctx.fillRect(x + 2, plat.y + 10, 2, 2);
        ctx.fillStyle = '#4ade80';
      }
    }

    const bodyHeight = Math.max(0, plat.height - 6);
    if (bodyHeight > 0) {
      // Authentic Contra Stage 1 warm brown earthy rock strata
      ctx.fillStyle = '#5c3210';
      ctx.fillRect(plat.x, plat.y + 6, plat.width, bodyHeight);

      // Horizontal rock strata bands
      ctx.fillStyle = '#78350f';
      for (let y = plat.y + 10; y < plat.y + plat.height; y += 12) {
        ctx.fillRect(plat.x, y, plat.width, 3);
      }

      // Dark crevice mortar & boulder block segments
      ctx.fillStyle = '#361c06';
      for (let x = plat.x; x < plat.x + plat.width; x += 16) {
        ctx.fillRect(x, plat.y + 6, 2, bodyHeight);
        ctx.fillRect(x + 4, plat.y + 9, 8, 4);
      }

      // Warm tan stone highlights
      ctx.fillStyle = '#9a5818';
      for (let x = plat.x + 4; x < plat.x + plat.width - 8; x += 16) {
        ctx.fillRect(x + 1, plat.y + 7, 7, 2);
      }

      // Hanging moss roots
      ctx.fillStyle = '#14532d';
      for (let x = plat.x + 8; x < plat.x + plat.width; x += 24) {
        ctx.fillRect(x, plat.y + 6, 2, 6);
        ctx.fillRect(x + 1, plat.y + 12, 1, 3);
      }
    }
  } else if (theme === 'waterfall') {
    // Waterfall Canyon: Dark wet river slate with lush teal river moss and glistening water drops
    ctx.fillStyle = '#0f766e'; // River moss
    ctx.fillRect(plat.x, plat.y, plat.width, 6);

    ctx.fillStyle = '#14b8a6';
    for (let x = plat.x; x < plat.x + plat.width; x += 7) {
      ctx.fillRect(x, plat.y, 4, 3);
    }

    // Wet glistening drops
    ctx.fillStyle = '#38bdf8';
    for (let x = plat.x + 4; x < plat.x + plat.width; x += 18) {
      ctx.fillRect(x, plat.y + 6, 2, 4);
    }

    const bodyHeight = Math.max(0, plat.height - 6);
    if (bodyHeight > 0) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(plat.x, plat.y + 6, plat.width, bodyHeight);

      ctx.fillStyle = '#0f172a';
      for (let x = plat.x + 6; x < plat.x + plat.width - 8; x += 22) {
        for (let y = plat.y + 10; y < plat.y + plat.height - 6; y += 14) {
          ctx.fillRect(x, y, 14, 8);
        }
      }
    }
  } else if (theme === 'snow') {
    // Snow Base: Crisp white snow mantle with hanging icicles & steel military bunker body
    ctx.fillStyle = '#f8fafc'; // Pure white snow
    ctx.fillRect(plat.x, plat.y, plat.width, 6);

    ctx.fillStyle = '#cbd5e1'; // Soft blue shadow
    ctx.fillRect(plat.x, plat.y + 5, plat.width, 2);

    // Hanging icicles
    ctx.fillStyle = '#bae6fd';
    for (let x = plat.x + 6; x < plat.x + plat.width - 6; x += 12) {
      const iLen = (x % 3 === 0) ? 6 : 4;
      ctx.beginPath();
      ctx.moveTo(x, plat.y + 7);
      ctx.lineTo(x + 2, plat.y + 7 + iLen);
      ctx.lineTo(x + 4, plat.y + 7);
      ctx.fill();
    }

    const bodyHeight = Math.max(0, plat.height - 7);
    if (bodyHeight > 0) {
      // Cold industrial bunker steel
      ctx.fillStyle = '#334155';
      ctx.fillRect(plat.x, plat.y + 7, plat.width, bodyHeight);

      // Steel bolts and girders
      ctx.fillStyle = '#475569';
      for (let x = plat.x + 8; x < plat.x + plat.width - 10; x += 20) {
        ctx.fillRect(x, plat.y + 10, 2, 2);
      }
    }
  } else if (theme === 'mountain') {
    // Mountain Peaks: Weathered alpine granite ridge with lichen tufts and striated rock face
    ctx.fillStyle = '#64748b'; // Cold granite ledge
    ctx.fillRect(plat.x, plat.y, plat.width, 5);

    // Alpine moss & pine lichen
    ctx.fillStyle = '#84cc16';
    for (let x = plat.x; x < plat.x + plat.width; x += 8) {
      ctx.fillRect(x, plat.y, 4, 2);
      if (x % 16 === 0) {
        ctx.fillStyle = '#4d7c0f';
        ctx.fillRect(x + 1, plat.y + 5, 2, 3);
        ctx.fillStyle = '#84cc16';
      }
    }

    const bodyHeight = Math.max(0, plat.height - 5);
    if (bodyHeight > 0) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(plat.x, plat.y + 5, plat.width, bodyHeight);

      // Craggy fault lines & stone cracks
      ctx.fillStyle = '#0f172a';
      for (let x = plat.x + 6; x < plat.x + plat.width - 8; x += 18) {
        ctx.fillRect(x, plat.y + 5, 2, bodyHeight);
        ctx.fillRect(x + 2, plat.y + 8, 5, 3);
      }
      ctx.fillStyle = '#475569';
      for (let x = plat.x + 2; x < plat.x + plat.width - 4; x += 24) {
        ctx.fillRect(x + 2, plat.y + 6, 6, 2);
      }
    }
  } else if (theme === 'bunker') {
    // Subterranean Military Bunker: Steel mesh floor, caution hazard chevron stripes, heavy rivets
    ctx.fillStyle = '#475569';
    ctx.fillRect(plat.x, plat.y, plat.width, 4);

    // Yellow and black warning stripes along top ledge
    const stripeW = 10;
    for (let x = plat.x; x < plat.x + plat.width; x += stripeW * 2) {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x, plat.y, stripeW, 3);
      ctx.fillStyle = '#09090b';
      ctx.fillRect(x + stripeW, plat.y, stripeW, 3);
    }

    const bodyHeight = Math.max(0, plat.height - 4);
    if (bodyHeight > 0) {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(plat.x, plat.y + 4, plat.width, bodyHeight);

      // Steel reinforcement plating & rivets
      ctx.fillStyle = '#27272a';
      for (let x = plat.x + 4; x < plat.x + plat.width - 8; x += 20) {
        ctx.fillRect(x, plat.y + 6, 14, bodyHeight - 4);
        ctx.fillStyle = '#a1a1aa';
        ctx.fillRect(x + 2, plat.y + 7, 2, 2);
        ctx.fillRect(x + 10, plat.y + 7, 2, 2);
        ctx.fillStyle = '#27272a';
      }
    }
  } else if (theme === 'airplane') {
    // Cargo Plane / Aircraft Wing: Sleek aeronautic aluminum skin with rivets and blinking strobe lights
    ctx.fillStyle = '#e2e8f0'; // Clean aircraft metal
    ctx.fillRect(plat.x, plat.y, plat.width, 5);

    ctx.fillStyle = '#94a3b8'; // Metal panel seams
    for (let x = plat.x; x < plat.x + plat.width; x += 24) {
      ctx.fillRect(x, plat.y, 2, 5);
      // Fasteners
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x + 4, plat.y + 2, 2, 2);
      ctx.fillRect(x + 12, plat.y + 2, 2, 2);
      ctx.fillStyle = '#94a3b8';
    }

    // Wing navigation strobe LED
    const strobeActive = Math.floor(Date.now() / 300) % 2 === 0;
    ctx.fillStyle = strobeActive ? '#ef4444' : '#10b981';
    ctx.fillRect(plat.x + 4, plat.y + 1, 4, 3);

    const bodyHeight = Math.max(0, plat.height - 5);
    if (bodyHeight > 0) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(plat.x, plat.y + 5, plat.width, bodyHeight);
      ctx.fillStyle = '#1e293b';
      for (let y = plat.y + 8; y < plat.y + plat.height; y += 10) {
        ctx.fillRect(plat.x, y, plat.width, 2);
      }
    }
  } else if (theme === 'factory') {
    // Industrial Cyber Factory: Steel diamond plate, yellow safety edge, copper conduit pipes
    ctx.fillStyle = '#ca8a04'; // Caution edge
    ctx.fillRect(plat.x, plat.y, plat.width, 3);
    ctx.fillStyle = '#52525b';
    ctx.fillRect(plat.x, plat.y + 3, plat.width, 3);

    const bodyHeight = Math.max(0, plat.height - 6);
    if (bodyHeight > 0) {
      ctx.fillStyle = '#27272a';
      ctx.fillRect(plat.x, plat.y + 6, plat.width, bodyHeight);

      // Steam copper conduits
      ctx.fillStyle = '#b45309';
      for (let y = plat.y + 8; y < plat.y + plat.height; y += 12) {
        ctx.fillRect(plat.x, y, plat.width, 3);
      }
      ctx.fillStyle = '#71717a';
      for (let x = plat.x + 8; x < plat.x + plat.width - 10; x += 18) {
        ctx.fillRect(x, plat.y + 6, 3, bodyHeight);
      }
    }
  } else if (theme === 'desert') {
    // Scorched Desert: Golden sandstone rim, sand dunes, ancient stone relief
    ctx.fillStyle = '#fde047'; // Sand highlight
    ctx.fillRect(plat.x, plat.y, plat.width, 4);

    ctx.fillStyle = '#d97706';
    for (let x = plat.x; x < plat.x + plat.width; x += 8) {
      ctx.fillRect(x, plat.y + 3, 5, 2);
    }

    const bodyHeight = Math.max(0, plat.height - 5);
    if (bodyHeight > 0) {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(plat.x, plat.y + 5, plat.width, bodyHeight);

      ctx.fillStyle = '#78350f';
      for (let x = plat.x + 8; x < plat.x + plat.width - 8; x += 22) {
        ctx.fillRect(x, plat.y + 5, 2, bodyHeight);
        ctx.fillRect(x + 4, plat.y + 8, 8, 4);
      }
    }
  } else if (theme === 'volcano') {
    // Volcano Magma Crater: Pitch black basalt rock with glowing cracked molten lava veins
    ctx.fillStyle = '#18181b'; // Obsidian basalt
    ctx.fillRect(plat.x, plat.y, plat.width, 5);

    // Glowing magma fissure lines
    ctx.fillStyle = '#ef4444';
    for (let x = plat.x + 4; x < plat.x + plat.width - 4; x += 12) {
      ctx.fillRect(x, plat.y + 1, 6, 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x + 1, plat.y + 2, 4, 1);
      ctx.fillStyle = '#ef4444';
    }

    const bodyHeight = Math.max(0, plat.height - 5);
    if (bodyHeight > 0) {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(plat.x, plat.y + 5, plat.width, bodyHeight);

      // Molten cracks through rock
      ctx.fillStyle = '#dc2626';
      for (let x = plat.x + 6; x < plat.x + plat.width - 8; x += 16) {
        ctx.fillRect(x, plat.y + 5, 2, bodyHeight);
        ctx.fillRect(x + 2, plat.y + 8, 4, 2);
      }
    }
  } else if (theme === 'spacestation') {
    // Orbital Space Station: High-tech ceramic white deck, glowing cyan energy conduits
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(plat.x, plat.y, plat.width, 4);

    // Glowing cyan photonic line
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(plat.x, plat.y + 3, plat.width, 2);

    const bodyHeight = Math.max(0, plat.height - 5);
    if (bodyHeight > 0) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(plat.x, plat.y + 5, plat.width, bodyHeight);

      // High-tech circuit nodes
      ctx.fillStyle = '#38bdf8';
      for (let x = plat.x + 10; x < plat.x + plat.width - 10; x += 26) {
        ctx.fillRect(x, plat.y + 7, 4, 4);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 4, plat.y + 8, 12, 2);
        ctx.fillStyle = '#38bdf8';
      }
    }
  } else {
    // Alien Hive: Biomechanical sinew with pulsing veins and glowing spore blisters
    ctx.fillStyle = '#701a75';
    ctx.fillRect(plat.x, plat.y, plat.width, 6);

    ctx.fillStyle = '#d946ef';
    for (let x = plat.x; x < plat.x + plat.width; x += 6) {
      ctx.fillRect(x, plat.y, 4, 3);
    }

    // Glowing green spore blisters
    ctx.fillStyle = '#22c55e';
    for (let x = plat.x + 10; x < plat.x + plat.width - 10; x += 24) {
      ctx.beginPath();
      ctx.arc(x, plat.y + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const bodyHeight = Math.max(0, plat.height - 6);
    if (bodyHeight > 0) {
      ctx.fillStyle = '#2e1065';
      ctx.fillRect(plat.x, plat.y + 6, plat.width, bodyHeight);

      ctx.fillStyle = '#4c1d95';
      for (let x = plat.x + 4; x < plat.x + plat.width - 8; x += 18) {
        for (let y = plat.y + 10; y < plat.y + plat.height - 6; y += 14) {
          ctx.fillRect(x, y, 10, 8);
        }
      }
    }
  }

  ctx.restore();
}

// Draw Particles (Explosions, embers, sparks)
export function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  const alpha = Math.max(0, p.life / p.maxLife);
  ctx.globalAlpha = alpha;

  if (p.type === 'ring') {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1 - alpha) * 3, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }

  ctx.restore();
}
