import Phaser from 'phaser';
import {
  GW, GH, C, GROUND_Y, PLAYER_X, SPAWN_X,
  PLAYER_MAX_HP, PLAYER_GRENADES, QUESTION_TIME, FEEDBACK_TIME,
  WAVES, ENEMY_STATS, EnemyType, BTN_COLORS, BTN_LABELS,
} from '../constants';
import { Question, getRandomQuestion, resetQuestionPool } from '../data/questions';

// =====================================================
// ⚔️ GAME SCENE — Beat-em-up con quiz ICFES
// =====================================================

type AttackType = 'light' | 'heavy' | 'special';

const P_GRAVITY     = 900;
const P_MOVE_SPEED  = 230;
const P_JUMP_VEL    = -460;
const P_DASH_SPEED  = 580;
const P_DASH_MS     = 170;
const P_DASH_CD_MS  = 900;
const E_CHASE_RANGE = 180;
const E_MELEE_RANGE = 65;

// Panel de pregunta: sheet anclado al fondo, full width
const Q_PH = 200;                    // altura del panel
const Q_PY = GH - Q_PH / 2;         // = 380 — centro vertical del panel

// ─────────────────────────────────────────────────────────────────────────
type GameState = 'idle' | 'questioning' | 'feedback' | 'shooting' | 'wave_clear' | 'game_over';

interface ActiveEnemy {
  type:      EnemyType;
  sprite:    Phaser.GameObjects.Sprite;
  hpCurrent: number;
  hpMax:     number;
  hpBg:      Phaser.GameObjects.Rectangle;
  hpFill:    Phaser.GameObjects.Rectangle;
  hpLabel:   Phaser.GameObjects.Text;
  bob:       Phaser.Tweens.Tween;
  spriteH:   number;
}

const REWARD_LABELS: Record<string, string> = {
  bullet:  '→ 🔫 +1 DMG',
  double:  '→ ⚡ +2 DMG',
  grenade: '→ 💣 KILL',
  shield:  '→ 🛡️ BLOCK',
};

// ─────────────────────────────────────────────────────────────────────────────
// 🌍 BIOMAS — 10 mundos con paletas de color únicas
// ─────────────────────────────────────────────────────────────────────────────
interface BiomeConfig {
  name:   string;
  icon:   string;
  bgTint: number;
  sky:    number;
  fog:    number;
  ground: number;
  pts:    number[];
}

const BIOMES: BiomeConfig[] = [
  { name: 'CEMENTERIO', icon: '⚰️',  bgTint: 0xffffff, sky: 0x28006e, fog: 0x1e0048, ground: 0x00ff44, pts: [0x00ff88, 0x44aaff, 0xbb55ff] },
  { name: 'BOSQUE',     icon: '🌲',  bgTint: 0x44ff88, sky: 0x004400, fog: 0x002810, ground: 0x44ff44, pts: [0x44ff44, 0x88ff88, 0x22cc22] },
  { name: 'DESIERTO',   icon: '🌵',  bgTint: 0xffaa44, sky: 0x883300, fog: 0x441800, ground: 0xffaa00, pts: [0xffaa00, 0xff6600, 0xffdd44] },
  { name: 'CASTILLO',   icon: '🏰',  bgTint: 0xbbbbdd, sky: 0x222244, fog: 0x141430, ground: 0x8888ff, pts: [0x9999ff, 0xccccff, 0x6666cc] },
  { name: 'VOLCAN',     icon: '🌋',  bgTint: 0xff4422, sky: 0x440000, fog: 0x2e0000, ground: 0xff4400, pts: [0xff2200, 0xff6600, 0xffaa00] },
  { name: 'TUNDRA',     icon: '❄️',  bgTint: 0x99ddff, sky: 0x002244, fog: 0x001128, ground: 0x44ddff, pts: [0x99ddff, 0xaaeeff, 0x44bbff] },
  { name: 'PANTANO',    icon: '🌿',  bgTint: 0x44aa33, sky: 0x112200, fog: 0x0a1400, ground: 0x66ee33, pts: [0x66ee33, 0xaaff44, 0x44cc22] },
  { name: 'ABISMO',     icon: '🕳️', bgTint: 0x220033, sky: 0x0a0016, fog: 0x080012, ground: 0xaa00ff, pts: [0xaa00ff, 0xff00aa, 0x6600aa] },
  { name: 'COSMOS',     icon: '🌌',  bgTint: 0x3344bb, sky: 0x000033, fog: 0x000028, ground: 0x3366ff, pts: [0x6677ff, 0xaa88ff, 0x3344ff] },
  { name: 'CAOS',       icon: '💀',  bgTint: 0xff0066, sky: 0x330011, fog: 0x280010, ground: 0xff0088, pts: [0xff0066, 0xff6699, 0xcc0044] },
];

export class GameScene extends Phaser.Scene {
  // ── Estado ────────────────────────────────────────────────────────────
  private state:      GameState = 'idle';
  private wave        = 0;
  private enemyQueue: EnemyType[] = [];
  private enemyIdx    = 0;
  private enemy:      ActiveEnemy | null = null;

  // ── Stats ─────────────────────────────────────────────────────────────
  private hp        = PLAYER_MAX_HP;
  private grenades  = PLAYER_GRENADES;
  private score     = 0;
  private combo     = 0;
  private hasShield = false;

  // ── Física del jugador ────────────────────────────────────────────────
  private pX            = PLAYER_X;
  private pY            = GROUND_Y;
  private pVelX         = 0;
  private pVelY         = 0;
  private pOnGround     = true;
  private pFacingRight  = true;
  private pDashing      = false;
  private pDashDir      = 1;
  private pDashTimeLeft = 0;
  private pCanDash      = true;
  private pDashCdLeft   = 0;
  private pIsAttacking  = false;
  private pIsHurt       = false;
  private pSelectedAtk: AttackType = 'light';

  // ── Sprites ───────────────────────────────────────────────────────────
  private playerSprite!: Phaser.GameObjects.Sprite;
  private shieldSprite!: Phaser.GameObjects.Image;
  private muzzleFlash!:  Phaser.GameObjects.Rectangle;

  // ── HUD ───────────────────────────────────────────────────────────────
  private hearts:       Phaser.GameObjects.Image[] = [];
  private scoreText!:   Phaser.GameObjects.Text;
  private waveLabel!:   Phaser.GameObjects.Text;
  private comboText!:   Phaser.GameObjects.Text;
  private grenadeIcon!: Phaser.GameObjects.Text;
  private atkHint!:     Phaser.GameObjects.Text;
  private dashCDIcon!:  Phaser.GameObjects.Text;

  // ── Controles ─────────────────────────────────────────────────────────
  private keys!: {
    k1: Phaser.Input.Keyboard.Key; k2: Phaser.Input.Keyboard.Key;
    k3: Phaser.Input.Keyboard.Key; k4: Phaser.Input.Keyboard.Key;
    g:  Phaser.Input.Keyboard.Key;
  };
  private mk!: {
    left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key;
    up:   Phaser.Input.Keyboard.Key; a:     Phaser.Input.Keyboard.Key;
    d:    Phaser.Input.Keyboard.Key; w:     Phaser.Input.Keyboard.Key;
    space:Phaser.Input.Keyboard.Key; shift: Phaser.Input.Keyboard.Key;
    z:    Phaser.Input.Keyboard.Key; x:     Phaser.Input.Keyboard.Key;
    c:    Phaser.Input.Keyboard.Key;
  };

  // ── Panel de pregunta ─────────────────────────────────────────────────
  private qPanel!:     Phaser.GameObjects.Container;
  private qText!:      Phaser.GameObjects.Text;
  private qTypeBadge!: Phaser.GameObjects.Text;
  private qReward!:    Phaser.GameObjects.Text;
  private qTimerBar!:  Phaser.GameObjects.Rectangle;
  private qBtnBgs:     Phaser.GameObjects.Rectangle[] = [];
  private qBtnLabels:  Phaser.GameObjects.Text[] = [];

  // ── Wave banner ───────────────────────────────────────────────────────
  private waveBanner!: Phaser.GameObjects.Container;

  // ── Timer ─────────────────────────────────────────────────────────────
  private timerEvent:  Phaser.Time.TimerEvent | null = null;
  private timerElapsed = 0;
  private currentQ:    Question | null = null;

  // ── Biomas ────────────────────────────────────────────────────────────
  private biomeIdx          = 0;
  private bgImg!:            Phaser.GameObjects.Image;
  private mtImg!:            Phaser.GameObjects.TileSprite;
  private skyBandRef!:       Phaser.GameObjects.Rectangle;
  private horizGlowRef!:     Phaser.GameObjects.Rectangle;
  private fogRects:          Phaser.GameObjects.Rectangle[] = [];
  private fogAlphas:         number[] = [];
  private poolElls:          Phaser.GameObjects.Ellipse[] = [];
  private gndG1!:            Phaser.GameObjects.Rectangle;
  private gndG2!:            Phaser.GameObjects.Rectangle;
  private gndG3!:            Phaser.GameObjects.Rectangle;
  private ambientEmitter!:   Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() { super('Game'); }

  // ─────────────────────────────────────────────────────────────────────
  create(): void {
    resetQuestionPool();
    this.state     = 'idle';
    this.wave      = 0;
    this.hp        = PLAYER_MAX_HP;
    this.grenades  = PLAYER_GRENADES;
    this.score     = 0;
    this.combo     = 0;
    this.hasShield = false;
    this.pX = PLAYER_X; this.pY = GROUND_Y;
    this.pVelX = 0; this.pVelY = 0;
    this.pOnGround = true; this.pFacingRight = true;
    this.pDashing = false; this.pCanDash = true;
    this.pIsAttacking = false; this.pIsHurt = false;
    this.biomeIdx  = 0;
    this.fogRects  = [];
    this.fogAlphas = [];
    this.poolElls  = [];

    this.buildBackground();
    this.buildPlayer();
    this.buildHUD();
    this.buildQuestionPanel();
    this.buildWaveBanner();
    this.setupKeys();
    this.registerAnimations();

    this.scene.launch('CRT');
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.time.delayedCall(700, () => this.startWave());
  }

  // ─────────────────────────────────────────────────────────────────────
  update(_t: number, delta: number): void {
    if (this.state === 'game_over') return;

    // Timer bar de la pregunta activa
    if (this.state === 'questioning' && this.timerEvent) {
      this.timerElapsed += delta;
      const pct = Math.max(0, 1 - this.timerElapsed / QUESTION_TIME);
      this.qTimerBar.width = Math.max(0, (GW - 8) * pct);
      if      (pct < 0.3) this.qTimerBar.setFillStyle(C.WRONG);
      else if (pct < 0.6) this.qTimerBar.setFillStyle(0xffaa00);
      else                this.qTimerBar.setFillStyle(C.PANEL_BORDER);
    }

    const dt = delta / 1000;
    this.updatePlayer(dt);
    this.updateEnemy(dt);
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🏗️ BUILDERS
  // ════════════════════════════════════════════════════════════════════════

  private buildBackground(): void {
    // ── Imágenes base (refs guardadas para tint en bioma) ─────────────
    this.bgImg = this.add.image(GW / 2, GH / 2, 'bg-graveyard').setDisplaySize(GW, GH).setDepth(0);
    this.mtImg = this.add.tileSprite(GW / 2, GH * 0.38, GW, 260, 'bg-mountains').setAlpha(0.62).setDepth(0);

    // ── Color wash atmosférico del cielo ──────────────────────────────
    this.skyBandRef = this.add.rectangle(GW / 2, 55, GW, 180, 0x28006e, 0.22).setDepth(0.5);
    this.tweens.add({ targets: this.skyBandRef, alpha: { from: 0.22, to: 0.06 }, duration: 4500, yoyo: true, repeat: -1 });

    this.horizGlowRef = this.add.rectangle(GW / 2, 165, GW, 90, 0x003366, 0.17).setDepth(0.5);
    this.tweens.add({ targets: this.horizGlowRef, alpha: { from: 0.17, to: 0.04 }, duration: 3800, yoyo: true, repeat: -1, delay: 700 });

    // ── Luna con halos en capas ───────────────────────────────────────
    const mh1 = this.add.circle(720, 52, 105, 0xeeeebb, 0.025).setDepth(0.6);
    const mh2 = this.add.circle(720, 52,  72, 0xeeeebb, 0.05).setDepth(0.7);
    const mh3 = this.add.circle(720, 52,  44, 0xe8e8c0, 0.09).setDepth(0.8);
    this.tweens.add({ targets: [mh1, mh2, mh3], alpha: { from: 1, to: 0.4 }, duration: 3200, yoyo: true, repeat: -1 });
    this.add.image(720, 52, 'moon').setDepth(1);

    // Rayo de luz de luna
    const moonRay = this.add.rectangle(720, GH / 2 + 20, 22, GH, 0xddeeff, 0.024).setDepth(0.6);
    this.tweens.add({ targets: moonRay, alpha: { from: 0.024, to: 0.007 }, scaleX: { from: 1, to: 1.7 }, duration: 3500, yoyo: true, repeat: -1 });

    // ── Pools de luz ambiental en el suelo ────────────────────────────
    const pools: Array<{ x: number; color: number; rw: number; rh: number }> = [
      { x: 80,       color: 0x6600cc, rw: 210, rh: 65 },
      { x: 290,      color: 0x004488, rw: 190, rh: 56 },
      { x: 510,      color: 0x550099, rw: 200, rh: 60 },
      { x: GW - 75,  color: 0x440077, rw: 190, rh: 58 },
    ];
    pools.forEach(({ x, color, rw, rh }, i) => {
      const p = this.add.ellipse(x, GROUND_Y, rw, rh, color, 0.11).setDepth(1.2);
      this.tweens.add({ targets: p, alpha: { from: 0.11, to: 0.035 }, scaleX: { from: 1, to: 1.2 },
        duration: 2600 + i * 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.poolElls.push(p);
    });

    // ── Niebla ────────────────────────────────────────────────────────
    const fogLayers: Array<{ y: number; h: number; color: number; a: number; dur: number }> = [
      { y: 408, h: 60, color: 0x1e0048, a: 0.62, dur: 7200 },
      { y: 378, h: 48, color: 0x0e0034, a: 0.46, dur: 5900 },
      { y: 350, h: 40, color: 0x070028, a: 0.30, dur: 6800 },
      { y: 320, h: 34, color: 0x040f26, a: 0.20, dur: 5100 },
    ];
    fogLayers.forEach((f, i) => {
      const fog = this.add.rectangle(GW / 2, f.y, GW + 150, f.h, f.color, f.a).setDepth(1.5);
      this.tweens.add({
        targets: fog,
        x:     { from: GW / 2 - 65, to: GW / 2 + 65 },
        alpha: { from: f.a, to: f.a * 0.28 },
        duration: f.dur, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 1100,
      });
      this.fogRects.push(fog);
      this.fogAlphas.push(f.a);
    });

    // ── Pilares con brillo en los extremos ────────────────────────────
    [60, 220, 380, 540, 700].forEach((px, idx) => {
      this.add.image(px, GROUND_Y, 'pillar').setOrigin(0.5, 1).setAlpha(0.22 + idx * 0.03).setDepth(1);
      if (idx === 0 || idx === 4) {
        const pg = this.add.ellipse(px, GROUND_Y - 6, 80, 28, 0x8800ff, 0.14).setDepth(1.3);
        this.tweens.add({ targets: pg, alpha: { from: 0.14, to: 0.04 }, duration: 2100 + idx * 350, yoyo: true, repeat: -1 });
      }
    });

    // ── Suelo ─────────────────────────────────────────────────────────
    this.add.image(GW / 2, GROUND_Y, 'ground').setOrigin(0.5, 1).setDepth(2);
    this.gndG1 = this.add.rectangle(GW / 2, GROUND_Y + 1,  GW,  3, 0x00ff44, 0.52).setDepth(3);
    this.gndG2 = this.add.rectangle(GW / 2, GROUND_Y + 4,  GW,  7, 0x00ff44, 0.14).setDepth(3);
    this.gndG3 = this.add.rectangle(GW / 2, GROUND_Y + 11, GW, 12, 0x00ff44, 0.05).setDepth(3);
    this.tweens.add({ targets: [this.gndG1, this.gndG2, this.gndG3], alpha: { from: 1, to: 0.30 }, duration: 1800, yoyo: true, repeat: -1 });

    // ── Partículas flotantes (ref guardada para bioma) ────────────────
    this.ambientEmitter = this.add.particles(0, 0, 'spark', {
      x:        { min: 30,  max: GW - 30 },
      y:        { min: 95,  max: GROUND_Y - 30 },
      speedY:   { min: -15, max: -55 },
      speedX:   { min: -12, max: 12 },
      scale:    { start: 0.28, end: 0 },
      alpha:    { start: 0.65, end: 0 },
      lifespan: { min: 3000, max: 5500 },
      tint:     [0x00ff88, 0x44aaff, 0xbb55ff, 0xff6622, 0x88ff44],
      frequency: 350,
      gravityY:  -6,
    }).setDepth(2.5);
  }

  private buildPlayer(): void {
    this.playerSprite = this.add.sprite(this.pX, this.pY, 'hero-idle-1')
      .setOrigin(0.5, 1).setDepth(7).setScale(1.4);
    this.playerSprite.play('hero_idle');

    this.shieldSprite = this.add.image(this.pX, this.pY - 50, 'shield')
      .setAlpha(0).setDepth(5).setScale(1.2);

    this.muzzleFlash = this.add.rectangle(this.pX + 68, this.pY - 52, 18, 14, 0xffffaa, 1)
      .setAlpha(0).setDepth(8);
  }

  private buildHUD(): void {
    const hudBg = this.add.rectangle(0, 0, GW, 56, C.HUD_BG, 0.88).setOrigin(0).setDepth(10);
    this.add.rectangle(0, 56, GW, 2, 0x00aa44, 0.7).setOrigin(0).setDepth(10);

    for (let i = 0; i < PLAYER_MAX_HP; i++)
      this.hearts.push(this.add.image(18 + i * 26, 28, 'heart').setDepth(11).setScale(0.85));

    this.waveLabel = this.add.text(GW / 2, 28, 'WAVE 1', {
      fontFamily: 'monospace', fontSize: '18px', color: '#00ff44', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);

    this.scoreText = this.add.text(GW - 20, 15, 'SCORE: 0', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffee33',
    }).setOrigin(1, 0).setDepth(11);

    this.comboText = this.add.text(GW - 20, 35, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ff8800',
    }).setOrigin(1, 0).setDepth(11);

    this.grenadeIcon = this.add.text(20, 45, `💣 ${this.grenades}`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#ff8800',
    }).setOrigin(0, 0.5).setDepth(11);
    this.add.text(60, 45, '[G]', {
      fontFamily: 'monospace', fontSize: '10px', color: '#884400',
    }).setOrigin(0, 0.5).setDepth(11);

    this.add.text(GW / 2, 44, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00ccff',
    }).setOrigin(0.5).setDepth(11).setName('shieldHud');

    this.atkHint = this.add.text(this.pX, this.pY - 112,
      '[Z] Golpe  [X] Combo  [C] Especial', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffee33',
      backgroundColor: '#00000099', padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 1).setDepth(16).setVisible(false);

    this.dashCDIcon = this.add.text(this.pX, this.pY - 96, '⚡ dash listo', {
      fontFamily: 'monospace', fontSize: '9px', color: '#88aaff',
    }).setOrigin(0.5, 1).setDepth(16).setVisible(false);

    void hudBg;
  }

  // ─────────────────────────────────────────────────────────────────────
  // ❓ PANEL DE PREGUNTA — full-width bottom sheet estilo cyber/neon
  // ─────────────────────────────────────────────────────────────────────
  private buildQuestionPanel(): void {
    // Container anclado al centro del panel inferior
    this.qPanel = this.add.container(GW / 2, Q_PY).setDepth(20).setVisible(false);

    // ── Fondo principal ───────────────────────────────────────────────
    const bg = this.add.rectangle(0, 0, GW, Q_PH, 0x020c1a, 0.97);

    // Línea superior neon pulsante
    const topBar = this.add.rectangle(0, -Q_PH / 2 + 2, GW, 4, C.PANEL_BORDER);
    this.tweens.add({ targets: topBar, alpha: { from: 1, to: 0.25 }, duration: 900, yoyo: true, repeat: -1 });

    // ── Barra de tiempo ───────────────────────────────────────────────
    const timerBg = this.add.rectangle(0, -Q_PH / 2 + 12, GW - 8, 7, 0x050f1a);
    timerBg.setStrokeStyle(1, 0x081a2a);
    this.qTimerBar = this.add.rectangle(
      -(GW - 8) / 2, -Q_PH / 2 + 12, GW - 8, 7, C.PANEL_BORDER,
    ).setOrigin(0, 0.5);

    // ── Fila superior: tipo + recompensa ─────────────────────────────
    this.qTypeBadge = this.add.text(-GW / 2 + 12, -Q_PH / 2 + 24, '📖 VOCAB', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00eeff',
      backgroundColor: '#001829', padding: { x: 6, y: 3 },
    }).setOrigin(0, 0);

    this.qReward = this.add.text(GW / 2 - 12, -Q_PH / 2 + 24, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffdd55',
      backgroundColor: '#1a1000', padding: { x: 6, y: 3 },
    }).setOrigin(1, 0);

    // ── Pregunta ──────────────────────────────────────────────────────
    this.qText = this.add.text(0, -Q_PH / 2 + 44, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#cce8ff',
      align: 'center', wordWrap: { width: GW - 24 },
    }).setOrigin(0.5, 0);

    // Línea separadora
    const sep = this.add.rectangle(0, -Q_PH / 2 + 96, GW - 16, 1, 0x0d2040);

    // Añadir al container (bg primero = más atrás)
    this.qPanel.add([bg, topBar, timerBg, this.qTimerBar, this.qTypeBadge, this.qReward, this.qText, sep]);

    // ── Botones 2×2 full-width ────────────────────────────────────────
    // Dos columnas, 2 filas; cada botón ~396px × 42px
    const BW = 396;
    const BH = 42;
    const colX: [number, number] = [-200, 200];
    const rowY: [number, number] = [-Q_PH / 2 + 112 + BH / 2, -Q_PH / 2 + 112 + BH + 6 + BH / 2];
    //   rowY[0] = -100+112+21 = +33
    //   rowY[1] = -100+112+42+6+21 = +81

    const layout: [number, number][] = [
      [colX[0], rowY[0]], [colX[1], rowY[0]],
      [colX[0], rowY[1]], [colX[1], rowY[1]],
    ];

    layout.forEach(([cx, cy], i) => {
      const col = BTN_COLORS[i];

      // Fondo oscuro del botón
      const bbg = this.add.rectangle(cx, cy, BW, BH, 0x010a18, 0.95);
      bbg.setStrokeStyle(1.5, col, 0.6);
      bbg.setInteractive({ useHandCursor: true });
      bbg.on('pointerdown', () => this.onAnswer(i));
      bbg.on('pointerover', () => {
        bbg.setFillStyle(col, 0.22);
        bbg.setStrokeStyle(2, col, 1.0);
      });
      bbg.on('pointerout', () => {
        bbg.setFillStyle(0x010a18, 0.95);
        bbg.setStrokeStyle(1.5, col, 0.6);
      });

      // Barra de color izquierda (5px)
      const accent = this.add.rectangle(cx - BW / 2, cy, 5, BH, col, 1).setOrigin(0, 0.5);

      // Badge de letra
      const badge = this.add.rectangle(cx - BW / 2 + 20, cy, 26, BH - 8, col, 0.85);
      const badgeTxt = this.add.text(cx - BW / 2 + 20, cy, BTN_LABELS[i], {
        fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);

      // Texto de la respuesta
      const bt = this.add.text(cx - BW / 2 + 42, cy, '', {
        fontFamily: 'monospace', fontSize: '13px', color: '#ddeeff',
        wordWrap: { width: BW - 56 },
      }).setOrigin(0, 0.5);

      this.qBtnBgs.push(bbg);
      this.qBtnLabels.push(bt);
      this.qPanel.add([bbg, accent, badge, badgeTxt, bt]);
    });
  }

  private buildWaveBanner(): void {
    this.waveBanner = this.add.container(GW / 2, GH / 2).setDepth(30).setAlpha(0);
    const bg = this.add.rectangle(0, 0, 500, 80, 0x000000, 0.8);
    bg.setStrokeStyle(4, 0x00ff44);
    const txt = this.add.text(0, 0, '', {
      fontFamily: 'monospace', fontSize: '40px', color: '#00ff44', fontStyle: 'bold',
    }).setOrigin(0.5).setName('bannerTxt');
    this.waveBanner.add([bg, txt]);
  }

  private registerAnimations(): void {
    const heroAnims: Array<{ key: string; frames: string[]; rate: number; rep: number }> = [
      { key: 'hero_idle',   frames: [1,2,3,4].map(i    => `hero-idle-${i}`),    rate: 6,  rep: -1 },
      { key: 'hero_run',    frames: [1,2,3,4,5,6].map(i => `hero-run-${i}`),    rate: 10, rep: -1 },
      { key: 'hero_attack', frames: [1,2,3,4,5].map(i  => `hero-attack-${i}`),  rate: 14, rep: 0  },
      { key: 'hero_jump',   frames: [1,2,3,4].map(i    => `hero-jump-${i}`),    rate: 8,  rep: 0  },
      { key: 'hero_hurt',   frames: ['hero-hurt'],                               rate: 1,  rep: 0  },
    ];
    heroAnims.forEach(({ key, frames, rate, rep }) => {
      if (!this.anims.exists(key))
        this.anims.create({ key, frames: frames.map(f => ({ key: f })), frameRate: rate, repeat: rep });
    });

    const enemyDefs: Array<{ key: string; frames: string[]; rate: number }> = [
      { key: 'zombie_walk',   frames: Array.from({length:8}, (_,i) => `skel-${i+1}`),    rate: 9 },
      { key: 'skeleton_walk', frames: Array.from({length:8}, (_,i) => `skelc-${i+1}`),   rate: 9 },
      { key: 'vampire_float', frames: Array.from({length:4}, (_,i) => `ghost-${i+1}`),   rate: 5 },
      { key: 'golem_stomp',   frames: Array.from({length:4}, (_,i) => `hellcat-${i+1}`), rate: 6 },
    ];
    enemyDefs.forEach(({ key, frames, rate }) => {
      if (!this.anims.exists(key))
        this.anims.create({ key, frames: frames.map(f => ({ key: f })), frameRate: rate, repeat: -1 });
    });

    if (!this.anims.exists('boss_fly')) {
      this.anims.create({
        key: 'boss_fly',
        frames: this.anims.generateFrameNumbers('hell-beast', { start: 0, end: 4 }),
        frameRate: 6, repeat: -1,
      });
    }
    if (!this.anims.exists('enemy_die')) {
      this.anims.create({
        key: 'enemy_die',
        frames: [1,2,3,4,5].map(i => ({ key: `edeath-${i}` })),
        frameRate: 14, repeat: 0,
      });
    }
  }

  private setupKeys(): void {
    const kb = this.input.keyboard!;
    this.keys = {
      k1: kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      k2: kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      k3: kb.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      k4: kb.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
      g:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.G),
    };
    this.keys.k1.on('down', () => this.onAnswer(0));
    this.keys.k2.on('down', () => this.onAnswer(1));
    this.keys.k3.on('down', () => this.onAnswer(2));
    this.keys.k4.on('down', () => this.onAnswer(3));
    this.keys.g.on('down', () => this.useGrenade());

    this.mk = {
      left:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      a:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      w:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      shift: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      z:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      x:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      c:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.C),
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🎮 FÍSICA DEL JUGADOR
  // ════════════════════════════════════════════════════════════════════════

  private updatePlayer(dt: number): void {
    const frozen = this.state === 'questioning' || this.state === 'feedback';

    if (!this.pCanDash) {
      this.pDashCdLeft -= dt * 1000;
      if (this.pDashCdLeft <= 0) { this.pCanDash = true; this.dashCDIcon.setVisible(false); }
    }
    if (this.pDashing) {
      this.pDashTimeLeft -= dt * 1000;
      if (this.pDashTimeLeft <= 0) { this.pDashing = false; this.playerSprite.setAlpha(1); }
    }

    if (!frozen && !this.pIsAttacking && !this.pIsHurt) {
      const goLeft  = this.mk.left.isDown  || this.mk.a.isDown;
      const goRight = this.mk.right.isDown || this.mk.d.isDown;

      if (!this.pDashing) {
        if      (goLeft)  { this.pVelX = -P_MOVE_SPEED; this.pFacingRight = false; }
        else if (goRight) { this.pVelX =  P_MOVE_SPEED; this.pFacingRight = true;  }
        else              { this.pVelX *= 0.72; }

        const jump = Phaser.Input.Keyboard.JustDown(this.mk.space)
                  || Phaser.Input.Keyboard.JustDown(this.mk.w)
                  || Phaser.Input.Keyboard.JustDown(this.mk.up);
        if (jump && this.pOnGround) { this.pVelY = P_JUMP_VEL; this.pOnGround = false; }

        if (Phaser.Input.Keyboard.JustDown(this.mk.shift) && this.pCanDash) {
          this.pDashing = true; this.pDashDir = this.pFacingRight ? 1 : -1;
          this.pDashTimeLeft = P_DASH_MS; this.pCanDash = false; this.pDashCdLeft = P_DASH_CD_MS;
          this.pVelX = P_DASH_SPEED * this.pDashDir;
          this.spawnDashAfterimage(); this.dashCDIcon.setVisible(true);
        }
      } else {
        this.pVelX = P_DASH_SPEED * this.pDashDir;
      }

      if (this.state === 'idle' && this.enemy && !this.pDashing) {
        if (Phaser.Input.Keyboard.JustDown(this.mk.z)) this.tryAttack('light');
        if (Phaser.Input.Keyboard.JustDown(this.mk.x)) this.tryAttack('heavy');
        if (Phaser.Input.Keyboard.JustDown(this.mk.c)) this.tryAttack('special');
      }
    }

    if (!this.pOnGround) this.pVelY += P_GRAVITY * dt;
    this.pX += this.pVelX * dt;
    this.pY += this.pVelY * dt;

    if (this.pY >= GROUND_Y) { this.pY = GROUND_Y; this.pVelY = 0; this.pOnGround = true; }
    this.pX = Phaser.Math.Clamp(this.pX, 24, GW - 24);

    if (this.enemy && Math.abs(this.pVelX) < 20 && !this.pIsAttacking)
      this.pFacingRight = this.enemy.sprite.x > this.pX;

    this.playerSprite.setPosition(this.pX, this.pY);
    this.playerSprite.setFlipX(!this.pFacingRight);
    this.shieldSprite.setPosition(this.pX, this.pY - 50);
    this.muzzleFlash.setPosition(this.pX + (this.pFacingRight ? 68 : -68), this.pY - 52);
    this.atkHint.setPosition(this.pX, this.pY - 112);
    this.dashCDIcon.setPosition(this.pX, this.pY - 96);
    this.updatePlayerAnim();
  }

  private updatePlayerAnim(): void {
    if (this.pIsAttacking || this.pIsHurt) return;
    if (!this.pOnGround)                      { this.playerSprite.play('hero_jump', true); return; }
    if (this.pDashing || Math.abs(this.pVelX) > 20) { this.playerSprite.play('hero_run',  true); return; }
    this.playerSprite.play('hero_idle', true);
  }

  private spawnDashAfterimage(): void {
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(i * 35, () => {
        const g = this.add.sprite(this.pX, this.pY, 'hero-run-1')
          .setOrigin(0.5, 1).setScale(1.4).setFlipX(!this.pFacingRight)
          .setAlpha(0.45 - i * 0.08).setTint(0x88aaff).setDepth(6);
        this.tweens.add({ targets: g, alpha: 0, scaleX: 1.5, scaleY: 1.5,
          duration: 220, ease: 'Power2', onComplete: () => g.destroy() });
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 👾 ENEMIGO — CHASE AI
  // ════════════════════════════════════════════════════════════════════════

  private updateEnemy(dt: number): void {
    if (!this.enemy) return;
    const { sprite, hpBg, hpFill, hpLabel, spriteH } = this.enemy;

    const dx    = this.pX - sprite.x;
    const absDx = Math.abs(dx);
    const dir   = dx > 0 ? 1 : -1;

    if (this.state === 'idle' && absDx > E_MELEE_RANGE) {
      sprite.x += dir * ENEMY_STATS[this.enemy.type].speed * dt;
      sprite.setFlipX(dx < 0);
    }

    if (absDx <= E_MELEE_RANGE && this.state === 'idle') {
      this.pSelectedAtk = 'light';
      this.onEnemyArrived(false);
    }

    const barY = sprite.y - spriteH - 10;
    hpBg.setPosition(sprite.x, barY);
    hpLabel.setPosition(sprite.x, barY - 10);
    hpFill.setPosition(sprite.x - 26, barY);

    this.atkHint.setVisible(absDx <= E_CHASE_RANGE && this.state === 'idle');
  }

  // ════════════════════════════════════════════════════════════════════════
  // ⚔️ COMBATE
  // ════════════════════════════════════════════════════════════════════════

  private tryAttack(type: AttackType): void {
    if (!this.enemy || this.pIsAttacking) return;
    if (Math.abs(this.pX - this.enemy.sprite.x) > E_CHASE_RANGE) {
      this.showFloatingText(this.pX, this.pY - 90, '¡Muy lejos!', 0xff8800); return;
    }
    this.pSelectedAtk = type; this.pIsAttacking = true;
    this.playerSprite.play('hero_attack', true); this.muzzleFlash.setAlpha(1);
    this.playerSprite.once('animationcomplete', () => {
      this.pIsAttacking = false; this.muzzleFlash.setAlpha(0);
    });
    this.onEnemyArrived(true);
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🌊 OLAS
  // ════════════════════════════════════════════════════════════════════════

  private startWave(): void {
    const waveData = WAVES[this.wave % WAVES.length];
    this.enemyQueue = [...waveData]; this.enemyIdx = 0;
    const label = this.wave < WAVES.length
      ? (this.wave === 4 || this.wave === 7 ? '⚡ BOSS !' : `WAVE ${this.wave + 1}`)
      : `WAVE ${this.wave + 1}`;
    this.waveLabel.setText(label);
    this.showBanner(label, () => this.spawnNextEnemy());
  }

  private spawnNextEnemy(): void {
    if (this.enemyIdx >= this.enemyQueue.length) { this.waveComplete(); return; }
    const type = this.enemyQueue[this.enemyIdx++];
    const stats = ENEMY_STATS[type];

    const animKey = type === 'boss' ? 'boss_fly' : type === 'vampire' ? 'vampire_float'
                  : type === 'golem' ? 'golem_stomp' : type === 'skeleton' ? 'skeleton_walk' : 'zombie_walk';
    const firstTex = type === 'boss' ? 'hell-beast' : type === 'vampire' ? 'ghost-1'
                   : type === 'golem' ? 'hellcat-1' : type === 'skeleton' ? 'skelc-1' : 'skel-1';
    const spriteH    = type === 'boss' ? 134 : type === 'vampire' ? 65 : type === 'golem' ? 53 : 52;
    const spriteScale = type === 'boss' ? 2.0 : 1.0;

    const sprite = this.add.sprite(SPAWN_X, GROUND_Y, firstTex)
      .setOrigin(0.5, 1).setDepth(8).setFlipX(true).setScale(spriteScale);
    sprite.play(animKey);

    const barY   = GROUND_Y - spriteH - 10;
    const hpBg   = this.add.rectangle(SPAWN_X, barY, 56, 8, 0x333333).setDepth(9);
    const hpFill = this.add.rectangle(SPAWN_X - 26, barY, 52, 6, 0x00ff44).setOrigin(0, 0.5).setDepth(9);
    const hpLabel = this.add.text(SPAWN_X, barY - 10, stats.label, {
      fontFamily: 'monospace', fontSize: '11px', color: '#' + stats.color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5).setDepth(9);

    const bob = this.tweens.add({ targets: sprite, y: GROUND_Y - 5, duration: 380, yoyo: true, repeat: -1 });
    this.enemy = { type, sprite, hpCurrent: stats.hp, hpMax: stats.hp, hpBg, hpFill, hpLabel, bob, spriteH };
    this.state = 'idle';
  }

  // ════════════════════════════════════════════════════════════════════════
  // ❓ PREGUNTAS
  // ════════════════════════════════════════════════════════════════════════

  private onEnemyArrived(playerInitiated = false): void {
    if (this.state === 'game_over') return;
    this.state    = 'questioning';
    this.currentQ = getRandomQuestion(this.enemy?.type === 'boss');

    if (playerInitiated) {
      const rewardMap: Record<AttackType, 'bullet' | 'double' | 'grenade'> = {
        light:   'bullet',
        heavy:   'double',
        special: this.grenades > 0 ? 'grenade' : 'double',
      };
      this.currentQ = { ...this.currentQ, reward: rewardMap[this.pSelectedAtk] };
    }
    this.showQuestion(this.currentQ!);
  }

  private showQuestion(q: Question): void {
    const typeColors: Record<string, string> = { vocab: '#00eeff', grammar: '#ffee33', bonus: '#ff88ff' };
    const typeLbls:  Record<string, string>  = { vocab: '📖 VOCAB', grammar: '✍️ GRAMMAR', bonus: '⚡ BONUS' };

    this.qTypeBadge.setText(typeLbls[q.type] ?? q.type.toUpperCase());
    this.qTypeBadge.setColor(typeColors[q.type] ?? '#ffffff');
    this.qReward.setText(REWARD_LABELS[q.reward] ?? '');
    this.qText.setText(q.text);

    // Solo actualizar el texto de respuesta (sin prefijo "A)" — el badge lo pone buildQuestionPanel)
    q.opts.forEach((opt, i) => {
      this.qBtnLabels[i].setText(opt);
      this.qBtnBgs[i].setFillStyle(0x010a18, 0.95);
      this.qBtnBgs[i].setStrokeStyle(1.5, BTN_COLORS[i], 0.6);
    });

    // Reset timer
    this.timerElapsed = 0;
    this.qTimerBar.width = GW - 8;
    this.qTimerBar.setFillStyle(C.PANEL_BORDER);

    // Slide-up desde debajo de la pantalla
    this.qPanel.setVisible(true).setAlpha(0).setY(GH + Q_PH / 2);
    this.tweens.add({ targets: this.qPanel, alpha: 1, y: Q_PY, duration: 320, ease: 'Back.easeOut' });

    this.timerEvent = this.time.delayedCall(QUESTION_TIME, () => this.onTimeout());
  }

  private hideQuestion(): void {
    this.timerEvent?.remove();
    this.timerEvent = null;
    this.tweens.add({
      targets: this.qPanel, alpha: 0, y: GH + Q_PH / 2, duration: 240, ease: 'Power2.easeIn',
      onComplete: () => this.qPanel.setVisible(false),
    });
  }

  private onAnswer(idx: number): void {
    if (this.state !== 'questioning' || !this.currentQ) return;
    this.state = 'feedback';
    this.timerEvent?.remove(); this.timerEvent = null;

    const correct = idx === this.currentQ.ans;
    this.qBtnBgs.forEach((bg, i) => {
      if (i === this.currentQ!.ans)   { bg.setFillStyle(C.CORRECT, 0.7); bg.setStrokeStyle(2, C.CORRECT, 1); }
      else if (i === idx && !correct) { bg.setFillStyle(C.WRONG,   0.6); bg.setStrokeStyle(2, C.WRONG,   1); }
      else                            { bg.setFillStyle(0x010a18, 0.5); bg.setStrokeStyle(1, 0x334466, 0.4); }
    });

    this.time.delayedCall(FEEDBACK_TIME, () => {
      this.hideQuestion();
      if (correct) this.onCorrectAnswer(this.currentQ!);
      else         this.onWrongAnswer();
    });
  }

  private onTimeout(): void {
    if (this.state !== 'questioning') return;
    this.state = 'feedback';
    this.tweens.add({ targets: this.qPanel, alpha: 0.3, duration: 100, yoyo: true, repeat: 3 });
    this.time.delayedCall(FEEDBACK_TIME, () => { this.hideQuestion(); this.onWrongAnswer(); });
  }

  private onCorrectAnswer(q: Question): void {
    this.combo++;
    const comboBonus = Math.floor(this.combo / 3) * 50;

    if (!this.pIsAttacking) {
      this.pIsAttacking = true;
      this.playerSprite.play('hero_attack', true); this.muzzleFlash.setAlpha(1);
      this.playerSprite.once('animationcomplete', () => {
        this.pIsAttacking = false; this.muzzleFlash.setAlpha(0);
        this.playerSprite.play('hero_idle', true);
      });
    }

    if      (q.reward === 'grenade') { this.fireGrenade(); }
    else if (q.reward === 'shield')  { this.activateShield(); this.addScore(150 + comboBonus); this.time.delayedCall(300, () => this.afterShot()); }
    else {
      const dmg = q.reward === 'double' ? 2 : 1;
      this.fireBullet(q.reward, dmg);
      this.addScore((q.reward === 'double' ? 120 : 80) + comboBonus);
    }

    if (this.combo >= 3) {
      this.comboText.setText(`🔥 COMBO ×${this.combo}`);
      this.tweens.add({ targets: this.comboText, scaleX: 1.3, scaleY: 1.3, duration: 200, yoyo: true });
    } else { this.comboText.setText(''); }
  }

  private onWrongAnswer(): void {
    this.combo = 0; this.comboText.setText('');
    this.playerHit();
    if (this.state !== 'game_over' && this.enemy) {
      const pushDir = this.enemy.sprite.x > this.pX ? 1 : -1;
      this.enemy.sprite.x += pushDir * 90;
      this.state = 'idle';
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 💥 PROYECTILES & EFECTOS
  // ════════════════════════════════════════════════════════════════════════

  private fireBullet(type: string, damage: number): void {
    if (!this.enemy) return;
    this.state = 'shooting';
    const tex = type === 'double' ? 'dbullet' : 'bullet';
    const sx = this.pX + (this.pFacingRight ? 62 : -62), sy = this.pY - 54;
    const tx = this.enemy.sprite.x, ty = this.enemy.sprite.y - 30;
    const ms = Math.max(120, Math.abs(tx - sx) * 0.7);

    const bullet = this.add.image(sx, sy, tex).setDepth(7);
    const trail  = this.add.particles(sx, sy, 'spark', {
      speed: { min:10, max:40 }, angle: { min:160, max:200 },
      scale: { start:0.8, end:0 }, lifespan:110,
      tint: type === 'double' ? 0x33ffcc : 0xffee33, frequency:18,
    }).setDepth(6);

    this.tweens.add({
      targets: bullet, x: tx, y: ty, duration: ms, ease: 'Linear',
      onUpdate: () => trail.setPosition(bullet.x, bullet.y),
      onComplete: () => {
        trail.stop(); this.time.delayedCall(150, () => trail.destroy());
        bullet.destroy();
        this.spawnHitParticles(tx, ty, type === 'double' ? 0x33ffcc : 0xffee33);
        this.dealDamage(damage);
      },
    });
  }

  private fireGrenade(): void {
    if (!this.enemy) return;
    this.state = 'shooting';
    const sx = this.pX + (this.pFacingRight ? 52 : -52), sy = this.pY - 38;
    const tx = this.enemy.sprite.x, ty = this.enemy.sprite.y;

    const gren = this.add.image(sx, sy, 'grenade').setDepth(7);
    this.tweens.add({
      targets: gren, x: tx, y: ty - 20, duration: 350, ease: 'Power1',
      onComplete: () => {
        gren.destroy(); this.spawnExplosion(tx, ty);
        if (this.enemy) { this.enemy.hpCurrent = 0; this.killEnemy(); }
      },
    });
    this.tweens.add({ targets: gren, angle: 360, duration: 300 });
  }

  private activateShield(): void {
    this.hasShield = true; this.shieldSprite.setAlpha(0.8);
    this.tweens.add({ targets: this.shieldSprite, alpha: { from:0.8, to:0.4 }, duration:500, yoyo:true, repeat:-1 });
    this.showFloatingText(this.pX, this.pY - 80, '🛡️ ESCUDO', 0x00ccff);
    (this.children.getByName('shieldHud') as Phaser.GameObjects.Text | null)?.setText('🛡️ SHIELD ACTIVO');
  }

  private useGrenade(): void {
    if (this.grenades <= 0 || !this.enemy || this.state === 'game_over') return;
    this.grenades--; this.grenadeIcon.setText(`💣 ${this.grenades}`);
    if (this.state === 'questioning') { this.hideQuestion(); this.state = 'shooting'; }
    this.fireGrenade();
  }

  private dealDamage(amount: number): void {
    if (!this.enemy) return;
    this.enemy.hpCurrent = Math.max(0, this.enemy.hpCurrent - amount);
    this.tweens.add({ targets: this.enemy.sprite, alpha:0.2, duration:80, yoyo:true, repeat:2 });
    const pct = this.enemy.hpCurrent / this.enemy.hpMax;
    this.tweens.add({ targets: this.enemy.hpFill, width: Math.max(2, 52 * pct), duration: 200 });
    this.enemy.hpFill.setFillStyle(pct > 0.6 ? 0x00ff44 : pct > 0.3 ? 0xffaa00 : 0xff3300);
    if (this.enemy.hpCurrent <= 0) this.killEnemy(); else this.afterShot();
  }

  private afterShot(): void {
    this.time.delayedCall(350, () => { if (this.state !== 'game_over') this.state = 'idle'; });
  }

  private killEnemy(): void {
    if (!this.enemy) return;
    const { sprite, hpBg, hpFill, hpLabel, bob, type } = this.enemy;
    const ex = sprite.x, ey = sprite.y;

    bob.stop(); sprite.stop(); hpBg.destroy(); hpFill.destroy(); hpLabel.destroy();

    const base = ENEMY_STATS[type].score;
    const mult = 1 + Math.floor(this.combo / 3) * 0.25;
    this.addScore(Math.floor(base * mult));

    this.tweens.add({
      targets: sprite, y: GROUND_Y + 10, alpha: 0,
      angle: type === 'boss' ? 90 : 30,
      scaleX: type === 'boss' ? 0.5 : 0.3, scaleY: type === 'boss' ? 0.5 : 0.3,
      duration: type === 'boss' ? 600 : 350, ease: 'Power2',
      onComplete: () => sprite.destroy(),
    });

    this.spawnExplosion(ex, ey - 20);
    this.showFloatingText(ex, ey - 60, `+${Math.floor(base * mult)}`, C.YELLOW);
    this.cameras.main.shake(type === 'boss' ? 400 : 120, type === 'boss' ? 0.02 : 0.007);
    this.atkHint.setVisible(false);
    this.enemy = null;

    this.time.delayedCall(type === 'boss' ? 1200 : 600, () => {
      if (this.state !== 'game_over') this.spawnNextEnemy();
    });
  }

  private playerHit(): void {
    if (this.hasShield) {
      this.hasShield = false; this.shieldSprite.setAlpha(0); this.tweens.killTweensOf(this.shieldSprite);
      this.showFloatingText(this.pX, this.pY - 90, '🛡️ BLOQUEADO', 0x00ccff);
      (this.children.getByName('shieldHud') as Phaser.GameObjects.Text | null)?.setText('');
      return;
    }
    this.hp--; this.updateHearts();
    this.cameras.main.shake(180, 0.015);
    const flash = this.add.rectangle(GW / 2, GH / 2, GW, GH, 0xff0000, 0.35).setDepth(50);
    this.tweens.add({ targets: flash, alpha: 0, duration: 250, onComplete: () => flash.destroy() });

    const knockDir = this.enemy ? (this.pX < this.enemy.sprite.x ? -1 : 1) : -1;
    this.pVelX = knockDir * 260; this.pVelY = -200; this.pOnGround = false;

    this.pIsHurt = true;
    this.playerSprite.play('hero_hurt', true);
    this.time.delayedCall(400, () => {
      this.pIsHurt = false;
      if (this.state !== 'game_over') this.playerSprite.play('hero_idle', true);
    });

    this.showFloatingText(this.pX, this.pY - 80, '💔 -1 HP', C.WRONG);
    if (this.hp <= 0) this.doGameOver();
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🎆 PARTÍCULAS & EFECTOS VISUALES
  // ════════════════════════════════════════════════════════════════════════

  private spawnHitParticles(x: number, y: number, color = 0xffee33): void {
    const sparks = this.add.particles(x, y, 'spark', {
      speed:{min:80,max:260}, angle:{min:0,max:360}, scale:{start:1.2,end:0},
      lifespan:{min:150,max:320}, quantity:14, tint:[color,0xffffff,0xffaa00], gravityY:180,
    }).setDepth(12);
    sparks.explode(14);
    this.time.delayedCall(400, () => sparks.destroy());

    const imp = this.add.circle(x, y, 14, color, 0.9).setDepth(11);
    this.tweens.add({ targets: imp, radius: 28, alpha: 0, duration: 180, ease: 'Power2', onComplete: () => imp.destroy() });
  }

  private spawnExplosion(x: number, y: number): void {
    const exp = this.add.image(x, y, 'explosion').setDepth(10).setScale(0.3);
    this.tweens.add({ targets: exp, scale: 3.0, alpha: 0, duration: 450, ease: 'Power2', onComplete: () => exp.destroy() });

    const fire = this.add.particles(x, y, 'ptfire', {
      speed:{min:60,max:280}, angle:{min:0,max:360}, scale:{start:2,end:0},
      lifespan:{min:250,max:550}, quantity:32, tint:[0xff2200,0xff6600,0xffaa00,0xffff00], gravityY:120,
    }).setDepth(11);
    fire.explode(32);

    const smoke = this.add.particles(x, y, 'ptsmoke', {
      speed:{min:20,max:80}, angle:{min:230,max:310}, scale:{start:1.5,end:0},
      lifespan:{min:400,max:800}, quantity:10, tint:[0x555555,0x888888,0xaaaaaa], gravityY:-30,
    }).setDepth(12);
    smoke.explode(10);

    for (let i = 0; i < 3; i++) {
      const ring = this.add.circle(x, y, 8, 0xff6600, 0.7).setDepth(9);
      this.tweens.add({ targets: ring, radius: 30+i*22, alpha: 0, duration: 280+i*90, delay: i*60, ease: 'Power1', onComplete: () => ring.destroy() });
    }
    this.time.delayedCall(700, () => { fire.destroy(); smoke.destroy(); });
  }

  private showFloatingText(x: number, y: number, msg: string, color: number): void {
    const t = this.add.text(x, y, msg, {
      fontFamily: 'monospace', fontSize: '16px', color: '#' + color.toString(16).padStart(6, '0'),
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 900, ease: 'Power2', onComplete: () => t.destroy() });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 📊 HUD
  // ════════════════════════════════════════════════════════════════════════

  private updateHearts(): void {
    this.hearts.forEach((h, i) => h.setTexture(i < this.hp ? 'heart' : 'heart_empty'));
  }

  private addScore(pts: number): void {
    this.score += pts;
    this.scoreText.setText(`SCORE: ${this.score.toLocaleString()}`);
    try {
      const hi = parseInt(localStorage.getItem('icfes_shooter_hi') || '0', 10);
      if (this.score > hi) localStorage.setItem('icfes_shooter_hi', String(this.score));
    } catch { /* noop */ }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🌊 OLEADAS
  // ════════════════════════════════════════════════════════════════════════

  private waveComplete(): void {
    this.state = 'wave_clear';
    const bonus = this.grenades * 200;
    if (bonus > 0) this.addScore(bonus);
    const isLastBoss = this.wave >= WAVES.length - 1;
    const msg = isLastBoss ? '🏆 ¡GANASTE!' : `✅ WAVE ${this.wave + 1} CLEAR`;
    this.showBanner(msg, () => {
      if (isLastBoss) {
        this.doVictory();
      } else {
        this.wave++;
        this.transitionBiome();
        this.time.delayedCall(700, () => this.startWave());
      }
    }, isLastBoss ? 2500 : 1500);
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🌍 TRANSICIÓN DE BIOMA
  // ════════════════════════════════════════════════════════════════════════

  private transitionBiome(): void {
    this.biomeIdx = (this.biomeIdx + 1) % BIOMES.length;
    const b = BIOMES[this.biomeIdx];

    // Flash blanco de transición
    const flash = this.add.rectangle(GW / 2, GH / 2, GW, GH, 0xffffff, 0.85).setDepth(50);
    this.tweens.add({ targets: flash, alpha: 0, duration: 700, ease: 'Power2', onComplete: () => flash.destroy() });

    // Aplicar paleta del nuevo bioma tras la mitad del flash
    this.time.delayedCall(120, () => {
      // Imágenes de fondo
      this.bgImg.setTint(b.bgTint);
      this.mtImg.setTint(b.bgTint);

      // Cielo
      this.skyBandRef.setFillStyle(b.sky, 0.22);
      this.horizGlowRef.setFillStyle(b.sky, 0.17);

      // Niebla
      this.fogRects.forEach((r, i) => r.setFillStyle(b.fog, this.fogAlphas[i]));

      // Pools de luz
      this.poolElls.forEach(e => e.setFillStyle(b.ground, 0.11));

      // Líneas del suelo
      this.gndG1.setFillStyle(b.ground, 0.52);
      this.gndG2.setFillStyle(b.ground, 0.14);
      this.gndG3.setFillStyle(b.ground, 0.05);

      // Partículas: recrear con nuevos colores
      this.ambientEmitter.destroy();
      this.ambientEmitter = this.add.particles(0, 0, 'spark', {
        x:        { min: 30,  max: GW - 30 },
        y:        { min: 95,  max: GROUND_Y - 30 },
        speedY:   { min: -15, max: -55 },
        speedX:   { min: -12, max: 12 },
        scale:    { start: 0.28, end: 0 },
        alpha:    { start: 0.65, end: 0 },
        lifespan: { min: 3000, max: 5500 },
        tint:     b.pts,
        frequency: 350,
        gravityY:  -6,
      }).setDepth(2.5);

      this.showBiomeLabel(b);
    });
  }

  private showBiomeLabel(b: BiomeConfig): void {
    const colorHex = '#' + b.ground.toString(16).padStart(6, '0');
    const cont = this.add.container(GW / 2, GH / 2 - 30).setDepth(45).setAlpha(0).setScale(0.85);

    const bg = this.add.rectangle(0, 0, 380, 76, 0x000000, 0.84);
    bg.setStrokeStyle(3, b.ground, 1);

    const iconTxt = this.add.text(-130, 0, b.icon, {
      fontFamily: 'monospace', fontSize: '34px',
    }).setOrigin(0.5);

    const nameTxt = this.add.text(30, -14, b.name, {
      fontFamily: 'monospace', fontSize: '22px', color: colorHex, fontStyle: 'bold',
    }).setOrigin(0.5);

    const worldTxt = this.add.text(30, 16, `MUNDO ${this.biomeIdx + 1}  /  ${BIOMES.length}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#99bbdd',
    }).setOrigin(0.5);

    cont.add([bg, iconTxt, nameTxt, worldTxt]);

    // Entrada
    this.tweens.add({
      targets: cont, alpha: 1, scaleX: 1, scaleY: 1, duration: 420, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1700, () => {
          this.tweens.add({
            targets: cont, alpha: 0, y: GH / 2 - 70, duration: 380, ease: 'Power2',
            onComplete: () => cont.destroy(),
          });
        });
      },
    });
  }

  private showBanner(text: string, onDone: () => void, duration = 1200): void {
    const txt = this.waveBanner.getByName('bannerTxt') as Phaser.GameObjects.Text;
    txt.setText(text);
    this.waveBanner.setAlpha(0).setScale(0.8);
    this.tweens.add({
      targets: this.waveBanner, alpha: 1, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(duration, () => {
          this.tweens.add({ targets: this.waveBanner, alpha: 0, scaleX: 1.1, scaleY: 1.1,
            duration: 300, onComplete: onDone });
        });
      },
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🏁 FIN DE JUEGO
  // ════════════════════════════════════════════════════════════════════════

  private doGameOver(): void {
    this.state = 'game_over'; this.timerEvent?.remove(); this.enemy?.bob.stop();
    this.scene.stop('CRT');
    this.cameras.main.shake(500, 0.03);
    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(700, () =>
        this.scene.start('GameOver', { score: this.score, wave: this.wave + 1, win: false }),
      );
    });
  }

  private doVictory(): void {
    this.state = 'game_over'; this.scene.stop('CRT');
    this.cameras.main.fadeOut(800, 255, 255, 200);
    this.time.delayedCall(900, () =>
      this.scene.start('GameOver', { score: this.score, wave: WAVES.length, win: true }),
    );
  }
}
