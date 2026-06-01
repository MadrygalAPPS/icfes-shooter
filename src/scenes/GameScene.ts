import Phaser from 'phaser';
import {
  GW, GH, C, GROUND_Y, PLAYER_X, SPAWN_X,
  PLAYER_MAX_HP, PLAYER_GRENADES, QUESTION_TIME, FEEDBACK_TIME,
  WAVES, ENEMY_STATS, EnemyType, BTN_COLORS, BTN_LABELS,
} from '../constants';
import { Question, getRandomQuestion, resetQuestionPool } from '../data/questions';

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️  GAME SCENE — Beat-em-up quiz ICFES  v5.0
//     + Status effects · Guilt · Scrolls · Penitencia · Star Move · Platforms
//     + Clases · Meta-progresión · Enemy behaviors · Path selector · Elite questions
// ═══════════════════════════════════════════════════════════════════════════════

type AttackType    = 'light' | 'heavy' | 'special';
type PlayerClass   = 'grammatico' | 'vocabulista' | 'lector' | 'bilingue';
type EnemyBehavior = 'normal' | 'shielded' | 'turbo' | 'duplicator' | 'silent' | 'elite';
type EnemyStatus   = 'none' | 'stunned' | 'burning' | 'slowed';
type PathChoice    = 'dangerous' | 'normal' | 'safe';
type GameState     = 'idle' | 'questioning' | 'feedback' | 'shooting'
                   | 'wave_clear' | 'game_over' | 'relic_pick'
                   | 'class_select' | 'path_select';

// ── Plataformas ───────────────────────────────────────────────────────────────
interface PlatformDef { x:number; y:number; w:number; }
const GAME_PLATFORMS: PlatformDef[] = [
  { x:165, y:GROUND_Y-120, w:210 },
  { x:555, y:GROUND_Y-120, w:210 },
];

// ── Obstáculos ambientales ────────────────────────────────────────────────────
type ObstacleType = 'spikes' | 'acid';
interface ObstacleDef { x:number; w:number; type:ObstacleType; }
const GAME_OBSTACLES: ObstacleDef[] = [
  { x:310, w:52,  type:'spikes' },   // centro-izquierda
  { x:510, w:44,  type:'spikes' },   // centro-derecha
  { x:420, w:70,  type:'acid'   },   // charco centro
];

// ── Física ────────────────────────────────────────────────────────────────────
const P_GRAVITY      = 900;
const P_MOVE_SPEED   = 230;
const P_JUMP_VEL     = -460;
const P_DASH_SPEED   = 580;
const P_DASH_MS      = 170;
const P_DASH_CD_MS   = 900;
const P_DODGE_SPEED  = 310;
const P_DODGE_MS     = 260;
const P_DODGE_CD_MS  = 1100;
const P_IFRAME_MS    = 380;          // ms de invencibilidad en dodge

// ── Enemigos ──────────────────────────────────────────────────────────────────
const E_CHASE_RANGE  = 180;
const E_MELEE_RANGE  = 65;
const E_WARN_RANGE   = 115;          // telegrafía antes de melee
const SHIELD_FAST_MS   = 4000;       // ventana para romper escudo del shielded enemy
const STAR_MOVE_CD_MS  = 12000;      // cooldown Star Move (Streets of Rage)
const STAR_MOVE_DMG    = 5;          // daño base del Star Move

// ── Pregunta ──────────────────────────────────────────────────────────────────
const Q_PH = 200;
const Q_PY = GH - Q_PH / 2;

// ── Alma ──────────────────────────────────────────────────────────────────────
const SOUL_MAX      = 100;
const SOUL_CHARGE   = 22;
const SOUL_DRAIN    = 40;

// ─────────────────────────────────────────────────────────────────────────────
interface ActiveEnemy {
  type:         EnemyType;
  sprite:       Phaser.GameObjects.Sprite;
  hpCurrent:    number;
  hpMax:        number;
  hpBg:         Phaser.GameObjects.Rectangle;
  hpFill:       Phaser.GameObjects.Rectangle;
  hpLabel:      Phaser.GameObjects.Text;
  bob:          Phaser.Tweens.Tween;
  spriteH:      number;
  warned:       boolean;
  behavior:     EnemyBehavior;
  isDuplicate:  boolean;
  behaviorGlow: Phaser.GameObjects.Ellipse | null;
  status:       EnemyStatus;
  statusLeft:   number;          // ms restantes del status
  burnTicks:    number;          // ticks de fuego restantes
  statusIcon:   Phaser.GameObjects.Text | null;
}

// ── Proyectiles enemigos ──────────────────────────────────────────────────────
interface EnemyProjectile {
  x: number; y: number; velX: number;
  visual: Phaser.GameObjects.Ellipse;
  trail: Phaser.GameObjects.Text;   // emoji del proyectil
  dmg: number;
}

// ── Pickups de plataforma ─────────────────────────────────────────────────────
type PickupType = 'hp' | 'soul' | 'essence' | 'grenade';
interface PlatformPickup {
  type: PickupType;
  x: number; y: number;
  visual: Phaser.GameObjects.Text;
  glow: Phaser.GameObjects.Ellipse;
  bobTween: Phaser.Tweens.Tween;
  collected: boolean;
}

// ── Biomas ────────────────────────────────────────────────────────────────────
interface BiomeConfig {
  name: string; icon: string; bgTint: number;
  sky: number; fog: number; ground: number; pts: number[];
}
const BIOMES: BiomeConfig[] = [
  { name:'CEMENTERIO', icon:'⚰️',  bgTint:0xffffff, sky:0x28006e, fog:0x1e0048, ground:0x00ff44, pts:[0x00ff88,0x44aaff,0xbb55ff] },
  { name:'BOSQUE',     icon:'🌲',  bgTint:0x44ff88, sky:0x004400, fog:0x002810, ground:0x44ff44, pts:[0x44ff44,0x88ff88,0x22cc22] },
  { name:'DESIERTO',   icon:'🌵',  bgTint:0xffaa44, sky:0x883300, fog:0x441800, ground:0xffaa00, pts:[0xffaa00,0xff6600,0xffdd44] },
  { name:'CASTILLO',   icon:'🏰',  bgTint:0xbbbbdd, sky:0x222244, fog:0x141430, ground:0x8888ff, pts:[0x9999ff,0xccccff,0x6666cc] },
  { name:'VOLCAN',     icon:'🌋',  bgTint:0xff4422, sky:0x440000, fog:0x2e0000, ground:0xff4400, pts:[0xff2200,0xff6600,0xffaa00] },
  { name:'TUNDRA',     icon:'❄️',  bgTint:0x99ddff, sky:0x002244, fog:0x001128, ground:0x44ddff, pts:[0x99ddff,0xaaeeff,0x44bbff] },
  { name:'PANTANO',    icon:'🌿',  bgTint:0x44aa33, sky:0x112200, fog:0x0a1400, ground:0x66ee33, pts:[0x66ee33,0xaaff44,0x44cc22] },
  { name:'ABISMO',     icon:'🕳️', bgTint:0x220033, sky:0x0a0016, fog:0x080012, ground:0xaa00ff, pts:[0xaa00ff,0xff00aa,0x6600aa] },
  { name:'COSMOS',     icon:'🌌',  bgTint:0x3344bb, sky:0x000033, fog:0x000028, ground:0x3366ff, pts:[0x6677ff,0xaa88ff,0x3344ff] },
  { name:'CAOS',       icon:'💀',  bgTint:0xff0066, sky:0x330011, fog:0x280010, ground:0xff0088, pts:[0xff0066,0xff6699,0xcc0044] },
];

// ── Reliquias ─────────────────────────────────────────────────────────────────
// notchCost: peso de ranura (Hollow Knight charms system)
interface RelicConfig { id:string; name:string; icon:string; desc:string; notchCost:number; }
const RELICS: RelicConfig[] = [
  { id:'grammar_dmg',  name:'Pluma Arcana',      icon:'✒️',  desc:'+1 DMG en Grammar',         notchCost:2 },
  { id:'vocab_soul',   name:'Lengua de Fuego',   icon:'🔥',  desc:'Vocab rápido: +20 Alma',    notchCost:2 },
  { id:'stone_heart',  name:'Corazón de Piedra', icon:'🪨',  desc:'+1 HP máximo',               notchCost:3 },
  { id:'soul_boost',   name:'Cáliz del Alma',    icon:'🏺',  desc:'Especial al 70% de Alma',   notchCost:3 },
  { id:'combo_shield', name:'Escudo de Racha',   icon:'⚔️',  desc:'Fallo no rompe combo (1×)', notchCost:1 },
  { id:'twin_shot',    name:'Bala Gemela',        icon:'⚡',  desc:'Golpe [Z] siempre doble',   notchCost:2 },
  { id:'iron_dodge',   name:'Manto de Sombra',   icon:'👁️', desc:'Dodge +200 ms invencible',  notchCost:1 },
  { id:'boss_breaker', name:'Filo de Caos',       icon:'💀',  desc:'+2 DMG vs Bosses',           notchCost:2 },
  { id:'hp_regen',     name:'Lágrima Divina',     icon:'💧',  desc:'Cada 5 kills: +1 HP',        notchCost:2 },
  { id:'soul_leech',   name:'Maldición Vieja',   icon:'🌑',  desc:'Errores drenan 15 Alma',    notchCost:1 },
];
const BASE_NOTCHES = 6;  // ranuras totales base

// ── Meta-progresión ───────────────────────────────────────────────────────────
const ESSENCE_KEY   = 'icfes_essence';
const META_UPG_KEY  = 'icfes_meta_upg';
const GUILT_KEY     = 'icfes_guilt';
const CHECKPOINT_KEY = 'icfes_best_wave';  // Hollow Knight bench — best wave reached

// ── Armas in-run (Dead Cells) ─────────────────────────────────────────────────
type WeaponId = 'sword'|'bow'|'hammer'|'dagger';
interface WeaponDrop { id:WeaponId; name:string; icon:string; desc:string; color:string; }
const WEAPON_DROPS: WeaponDrop[] = [
  { id:'sword',  name:'Espada Arcana',  icon:'⚔️',  desc:'+2 DMG en golpe Z',           color:'#ff8844' },
  { id:'bow',    name:'Arco del Viento',icon:'🏹',  desc:'Z ignora escudo del enemigo', color:'#44ffaa' },
  { id:'hammer', name:'Martillo Rúnico',icon:'🔨',  desc:'Z stun 2s automático',        color:'#88aaff' },
  { id:'dagger', name:'Daga Sombría',   icon:'🗡️',  desc:'Z siempre golpe doble',       color:'#ffdd55' },
];

// ── Scrolls in-run ────────────────────────────────────────────────────────────
interface ScrollDrop { id:string; name:string; icon:string; desc:string; }
const SCROLL_DROPS: ScrollDrop[] = [
  { id:'atk',   name:'Tomo de Fuerza', icon:'⚔️',  desc:'+1 DMG esta run' },
  { id:'hp',    name:'Tomo de Vida',   icon:'💗',  desc:'+1 HP máx esta run' },
  { id:'soul',  name:'Tomo de Alma',   icon:'🔷',  desc:'+20 Alma máx esta run' },
  { id:'speed', name:'Tomo de Viento', icon:'💨',  desc:'+25% velocidad esta run' },
];

interface MetaUpgrade { id:string; name:string; icon:string; desc:string; cost:number; maxLevel:number; }
const META_UPGRADES: MetaUpgrade[] = [
  { id:'hp_up',      name:'Corazón Forjado',  icon:'❤️',  desc:'+1 HP inicial por nivel',    cost:30, maxLevel:3 },
  { id:'grenade_up', name:'Arsenal',           icon:'💣',  desc:'+1 Granada inicial/nivel',   cost:40, maxLevel:2 },
  { id:'soul_start', name:'Alma Despierta',    icon:'⚡',  desc:'Empiezas con 30 de Alma',    cost:25, maxLevel:1 },
  { id:'relic_plus', name:'Cofre del Destino', icon:'📦',  desc:'+1 reliquia extra siempre',  cost:50, maxLevel:1 },
  { id:'combo_start',name:'Racha Perpetua',    icon:'🔥',  desc:'Combo inicia en ×3',         cost:35, maxLevel:1 },
  { id:'ess_boost',  name:'Colector',          icon:'✨',  desc:'+50% esencia por run',        cost:60, maxLevel:1 },
];

// ── Clases de personaje ───────────────────────────────────────────────────────
interface ClassConfig { id:PlayerClass; name:string; icon:string; color:string; passive:string; desc:string; }
const CLASSES: ClassConfig[] = [
  { id:'grammatico', name:'El Gramático',   icon:'🗡️',  color:'#ff8844',
    passive:'Grammar +2 DMG',    desc:'Grammar da +2 DMG.\nVocab da -1 DMG.\nEspecialista ofensivo.' },
  { id:'vocabulista', name:'El Vocabulista', icon:'🏹',  color:'#44ffaa',
    passive:'Vocab kill: +30 Alma', desc:'Vocab kills cargan\n+30 Alma extra.\nAgilidad en combate.' },
  { id:'lector',     name:'El Lector',       icon:'📖', color:'#88aaff',
    passive:'+50% tiempo Q',      desc:'Acierto ralentiza\nal enemigo 2.5s.\n+50% tiempo preguntas.' },
  { id:'bilingue',   name:'El Bilingüe',     icon:'⚡',  color:'#ffdd55',
    passive:'1 reliquia inicial', desc:'Empieza con 1\nreliquia aleatoria.\nEstadísticas balanceadas.' },
];

// ── Misc ──────────────────────────────────────────────────────────────────────
const REWARD_LABELS: Record<string,string> = {
  bullet:'→ 🔫 +1 DMG', double:'→ ⚡ +2 DMG', grenade:'→ 💣 KILL', shield:'→ 🛡️ BLOCK',
};
const ENGLISH_RANKS = [
  { min:85, label:'B+', color:'#ff88ff' },
  { min:70, label:'B1', color:'#88aaff' },
  { min:55, label:'A2', color:'#44ffaa' },
  { min:40, label:'A1', color:'#ffee44' },
  { min: 0, label:'A-', color:'#ff6644' },
];

// ═════════════════════════════════════════════════════════════════════════════
export class GameScene extends Phaser.Scene {

  // ── Estado ──────────────────────────────────────────────────────────────
  private state:      GameState = 'idle';
  private wave        = 0;
  private enemyQueue: EnemyType[] = [];
  private enemyIdx    = 0;
  private enemy:      ActiveEnemy | null = null;

  // ── Clase & meta-progresión ──────────────────────────────────────────────
  private playerClass:       PlayerClass = 'bilingue';
  private nextWaveModifier:  PathChoice  = 'normal';
  private isEliteQuestion    = false;
  private questionDuration   = QUESTION_TIME;
  private enemySlowLeft      = 0;     // ms restantes del slow del Lector
  private runEssence         = 0;     // esencia ganada esta corrida
  private totalEssence       = 0;     // esencia persistente (localStorage)
  private metaUpgLevels:     Record<string,number> = {};
  private essMultiplier      = 1.0;
  private poisonTimer:       Phaser.Time.TimerEvent | null = null;
  // ── Culpa (Blasphemous) ─────────────────────────────────────────────────
  private guilt              = 0;       // 0-3, persiste entre runs
  private guiltHud!:         Phaser.GameObjects.Text;
  // ── Scrolls in-run (Dead Cells) ─────────────────────────────────────────
  private scrollAtk          = 0;       // +DMG acumulado esta run
  private scrollSoulMax      = 0;       // +Alma máx acumulada
  private scrollSpeedMult    = 1.0;     // multiplicador velocidad
  // ── Penitencia (Blasphemous) ─────────────────────────────────────────────
  private penitencia:        'none'|'asceta'|'silencio' = 'none';
  private classBadge!:       Phaser.GameObjects.Text;
  private essenceHud!:       Phaser.GameObjects.Text;
  private qPanelBg!:         Phaser.GameObjects.Rectangle;
  private qEliteBadge!:      Phaser.GameObjects.Text;

  // ── Stats ────────────────────────────────────────────────────────────────
  private hp           = PLAYER_MAX_HP;
  private maxHp        = PLAYER_MAX_HP;
  private grenades     = PLAYER_GRENADES;
  private score        = 0;
  private combo        = 0;
  private hasShield    = false;
  private soul         = 0;
  private correctAns   = 0;
  private totalAns     = 0;
  private killCount    = 0;
  private killStreak   = 0;   // muertes seguidas rápidas (Streets of Rage feel)
  private killStreakTimer = 0; // ms hasta que se resetea la racha
  private activeRelics: string[] = [];
  private comboShieldUsed = false;
  private bossPhase    = 0;

  // ── Física ───────────────────────────────────────────────────────────────
  private pX             = PLAYER_X;
  private pY             = GROUND_Y;
  private pVelX          = 0;
  private pVelY          = 0;
  private pOnGround      = true;
  private pFacingRight   = true;
  private pDashing       = false;
  private pDashDir       = 1;
  private pDashTimeLeft  = 0;
  private pCanDash       = true;
  private pDashCdLeft    = 0;
  private pDodging       = false;
  private pDodgeDir      = 1;
  private pDodgeTimeLeft = 0;
  private pCanDodge      = true;
  private pDodgeCdLeft   = 0;
  private pIframeLeft    = 0;
  private pIsAttacking   = false;
  private pIsHurt        = false;
  private pSelectedAtk: AttackType = 'light';

  // ── Sprites ──────────────────────────────────────────────────────────────
  private playerSprite!: Phaser.GameObjects.Sprite;
  private shieldSprite!: Phaser.GameObjects.Image;
  private muzzleFlash!:  Phaser.GameObjects.Rectangle;
  private playerAura!:   Phaser.GameObjects.Ellipse;   // aura de clase
  private comboRing!:    Phaser.GameObjects.Ellipse;   // anillo de combo alto
  private dustEmitter!:  Phaser.GameObjects.Particles.ParticleEmitter; // polvo al correr

  // ── HUD ──────────────────────────────────────────────────────────────────
  private hearts:       Phaser.GameObjects.Image[] = [];
  private scoreText!:   Phaser.GameObjects.Text;
  private waveLabel!:   Phaser.GameObjects.Text;
  private comboText!:   Phaser.GameObjects.Text;
  private grenadeIcon!: Phaser.GameObjects.Text;
  private atkHint!:     Phaser.GameObjects.Text;
  private dashCDIcon!:  Phaser.GameObjects.Text;
  private soulBarBg!:   Phaser.GameObjects.Rectangle;
  private soulBarFill!: Phaser.GameObjects.Rectangle;
  private soulLabel!:   Phaser.GameObjects.Text;
  private rankBadge!:   Phaser.GameObjects.Text;
  private relicHud!:    Phaser.GameObjects.Text;

  // ── Controles ────────────────────────────────────────────────────────────
  private keys!: {
    k1:Phaser.Input.Keyboard.Key; k2:Phaser.Input.Keyboard.Key;
    k3:Phaser.Input.Keyboard.Key; k4:Phaser.Input.Keyboard.Key;
    g:Phaser.Input.Keyboard.Key;  q:Phaser.Input.Keyboard.Key;
  };
  private mk!: {
    left:Phaser.Input.Keyboard.Key;  right:Phaser.Input.Keyboard.Key;
    up:Phaser.Input.Keyboard.Key;    a:Phaser.Input.Keyboard.Key;
    d:Phaser.Input.Keyboard.Key;     w:Phaser.Input.Keyboard.Key;
    space:Phaser.Input.Keyboard.Key; shift:Phaser.Input.Keyboard.Key;
    z:Phaser.Input.Keyboard.Key;     x:Phaser.Input.Keyboard.Key;
    c:Phaser.Input.Keyboard.Key;     v:Phaser.Input.Keyboard.Key;
    e:Phaser.Input.Keyboard.Key;
  };
  private starMoveCdLeft  = 0;   // ms cooldown Star Move
  private starMoveHud!:   Phaser.GameObjects.Text;
  private currentWeapon:    WeaponId | null = null;
  private weaponHud!:       Phaser.GameObjects.Text;
  private obstacleHurtLeft  = 0;   // ms de invulnerabilidad por obstáculo
  private acidDmgAccum      = 0;   // ms acumulados en ácido
  // ── Notch system (Hollow Knight charms) ─────────────────────────────────
  private notchesUsed     = 0;   // ranuras usadas por reliquias activas
  private notchHud!:      Phaser.GameObjects.Text;
  // ── Pausa ────────────────────────────────────────────────────────────────
  private paused          = false;
  private pauseOverlay!:  Phaser.GameObjects.Container | null;
  // ── Proyectiles enemigos ─────────────────────────────────────────────────
  private projectiles:    EnemyProjectile[] = [];
  private projShootTimer  = 0;    // ms hasta próximo disparo
  // ── Pickups en plataformas ───────────────────────────────────────────────
  private platformPickups: PlatformPickup[] = [];

  // ── Panel pregunta ───────────────────────────────────────────────────────
  private qPanel!:     Phaser.GameObjects.Container;
  private qText!:      Phaser.GameObjects.Text;
  private qTypeBadge!: Phaser.GameObjects.Text;
  private qReward!:    Phaser.GameObjects.Text;
  private qTimerBar!:  Phaser.GameObjects.Rectangle;
  private qBtnBgs:     Phaser.GameObjects.Rectangle[] = [];
  private qBtnLabels:  Phaser.GameObjects.Text[]      = [];

  // ── Wave banner ──────────────────────────────────────────────────────────
  private waveBanner!: Phaser.GameObjects.Container;

  // ── Timer ────────────────────────────────────────────────────────────────
  private timerEvent:  Phaser.Time.TimerEvent | null = null;
  private timerElapsed = 0;
  private currentQ:    Question | null = null;

  // ── Biomas ───────────────────────────────────────────────────────────────
  private biomeIdx         = 0;
  private bgImg!:           Phaser.GameObjects.Image;
  private mtImg!:           Phaser.GameObjects.TileSprite;
  private skyBandRef!:      Phaser.GameObjects.Rectangle;
  private horizGlowRef!:    Phaser.GameObjects.Rectangle;
  private fogRects:         Phaser.GameObjects.Rectangle[] = [];
  private fogAlphas:        number[]                       = [];
  private poolElls:         Phaser.GameObjects.Ellipse[]   = [];
  private gndG1!:           Phaser.GameObjects.Rectangle;
  private gndG2!:           Phaser.GameObjects.Rectangle;
  private gndG3!:           Phaser.GameObjects.Rectangle;
  private ambientEmitter!:  Phaser.GameObjects.Particles.ParticleEmitter;

  // ── Audio ─────────────────────────────────────────────────────────────────
  private audioCtx: AudioContext | null = null;

  constructor() { super('Game'); }

  // ═══════════════════════════════════════════════════════════════════════════
  create(): void {
    resetQuestionPool();
    this.state    = 'class_select';
    this.wave     = 0;
    this.hp       = PLAYER_MAX_HP;
    this.maxHp    = PLAYER_MAX_HP;
    this.grenades = PLAYER_GRENADES;
    this.score    = 0; this.combo     = 0;
    this.hasShield= false; this.soul  = 0;
    this.correctAns = 0;  this.totalAns = 0;
    this.killCount  = 0;  this.bossPhase= 0; this.killStreak = 0; this.killStreakTimer = 0;
    this.activeRelics = []; this.comboShieldUsed = false;
    this.runEssence = 0; this.enemySlowLeft = 0;
    this.nextWaveModifier = 'normal'; this.isEliteQuestion = false;
    this.questionDuration = QUESTION_TIME;
    this.scrollAtk = 0; this.scrollSoulMax = 0; this.scrollSpeedMult = 1.0;
    this.penitencia = 'none'; this.starMoveCdLeft = 0; this.currentWeapon = null;
    this.obstacleHurtLeft = 0; this.acidDmgAccum = 0;
    this.notchesUsed = 0; this.paused = false; this.pauseOverlay = null;
    this.projectiles = []; this.projShootTimer = 0;
    this.platformPickups = [];
    try { this.guilt = Math.min(3, parseInt(localStorage.getItem(GUILT_KEY)||'0',10)); } catch { this.guilt=0; }
    try { this.totalEssence = parseInt(localStorage.getItem(ESSENCE_KEY)||'0',10); } catch { this.totalEssence=0; }
    try { this.metaUpgLevels = JSON.parse(localStorage.getItem(META_UPG_KEY)||'{}') as Record<string,number>; } catch { this.metaUpgLevels={}; }
    this.applyMetaUpgrades();
    this.pX = PLAYER_X; this.pY = GROUND_Y;
    this.pVelX = 0; this.pVelY = 0;
    this.pOnGround = true; this.pFacingRight = true;
    this.pDashing = false; this.pCanDash = true;
    this.pDodging = false; this.pCanDodge= true; this.pIframeLeft = 0;
    this.pIsAttacking = false; this.pIsHurt = false;
    this.biomeIdx = 0;
    this.fogRects  = []; this.fogAlphas = []; this.poolElls = [];
    this.hearts    = []; this.qBtnBgs   = []; this.qBtnLabels = [];

    this.buildBackground();
    this.buildPlayer();
    this.buildHUD();
    this.buildQuestionPanel();
    this.buildWaveBanner();
    this.setupKeys();
    this.registerAnimations();

    this.scene.launch('CRT');
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.time.delayedCall(600, () => this.showMetaShop(() => {
      this.time.delayedCall(200, () => this.showClassSelector(() => {
        this.time.delayedCall(300, () => this.startWave());
      }));
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  update(_t: number, delta: number): void {
    if (this.state === 'game_over') return;
    if (this.paused) return;

    if (this.state === 'questioning' && this.timerEvent) {
      this.timerElapsed += delta;
      const pct = Math.max(0, 1 - this.timerElapsed / this.questionDuration);
      this.qTimerBar.width = Math.max(0, (GW - 8) * pct);
      if      (pct < 0.3) this.qTimerBar.setFillStyle(C.WRONG);
      else if (pct < 0.6) this.qTimerBar.setFillStyle(0xffaa00);
      else                this.qTimerBar.setFillStyle(this.isEliteQuestion ? 0xffcc00 : C.PANEL_BORDER);
    }

    const dt = delta / 1000;
    if (this.pIframeLeft > 0)   this.pIframeLeft   -= delta;
    if (this.enemySlowLeft > 0) this.enemySlowLeft -= delta;
    this.updatePlayer(dt);
    this.updateEnemy(dt);
    this.updateProjectiles(dt);
    this.updatePlatformPickups();
    // Kill streak timer
    if (this.killStreakTimer > 0) {
      this.killStreakTimer -= delta;
      if (this.killStreakTimer <= 0) { this.killStreak = 0; this.killStreakTimer = 0; }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏗️  BUILDERS
  // ═══════════════════════════════════════════════════════════════════════════

  private buildBackground(): void {
    this.bgImg = this.add.image(GW/2, GH/2, 'bg-graveyard').setDisplaySize(GW, GH).setDepth(0);
    this.mtImg = this.add.tileSprite(GW/2, GH*0.38, GW, 260, 'bg-mountains').setAlpha(0.62).setDepth(0);

    this.skyBandRef = this.add.rectangle(GW/2, 55, GW, 180, 0x28006e, 0.22).setDepth(0.5);
    this.tweens.add({ targets:this.skyBandRef, alpha:{from:0.22,to:0.06}, duration:4500, yoyo:true, repeat:-1 });

    this.horizGlowRef = this.add.rectangle(GW/2, 165, GW, 90, 0x003366, 0.17).setDepth(0.5);
    this.tweens.add({ targets:this.horizGlowRef, alpha:{from:0.17,to:0.04}, duration:3800, yoyo:true, repeat:-1, delay:700 });

    const mh1 = this.add.circle(720,52,105,0xeeeebb,0.025).setDepth(0.6);
    const mh2 = this.add.circle(720,52, 72,0xeeeebb,0.05 ).setDepth(0.7);
    const mh3 = this.add.circle(720,52, 44,0xe8e8c0,0.09 ).setDepth(0.8);
    this.tweens.add({ targets:[mh1,mh2,mh3], alpha:{from:1,to:0.4}, duration:3200, yoyo:true, repeat:-1 });
    this.add.image(720,52,'moon').setDepth(1);
    const moonRay = this.add.rectangle(720,GH/2+20,22,GH,0xddeeff,0.024).setDepth(0.6);
    this.tweens.add({ targets:moonRay, alpha:{from:0.024,to:0.007}, scaleX:{from:1,to:1.7}, duration:3500, yoyo:true, repeat:-1 });

    const pools = [
      {x:80,      color:0x6600cc,rw:210,rh:65},
      {x:290,     color:0x004488,rw:190,rh:56},
      {x:510,     color:0x550099,rw:200,rh:60},
      {x:GW-75,   color:0x440077,rw:190,rh:58},
    ];
    pools.forEach(({x,color,rw,rh},i) => {
      const p = this.add.ellipse(x,GROUND_Y,rw,rh,color,0.11).setDepth(1.2);
      this.tweens.add({ targets:p, alpha:{from:0.11,to:0.035}, scaleX:{from:1,to:1.2},
        duration:2600+i*550, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });
      this.poolElls.push(p);
    });

    const fogLayers = [
      {y:408,h:60,color:0x1e0048,a:0.62,dur:7200},
      {y:378,h:48,color:0x0e0034,a:0.46,dur:5900},
      {y:350,h:40,color:0x070028,a:0.30,dur:6800},
      {y:320,h:34,color:0x040f26,a:0.20,dur:5100},
    ];
    fogLayers.forEach((f,i) => {
      const fog = this.add.rectangle(GW/2,f.y,GW+150,f.h,f.color,f.a).setDepth(1.5);
      this.tweens.add({ targets:fog, x:{from:GW/2-65,to:GW/2+65}, alpha:{from:f.a,to:f.a*0.28},
        duration:f.dur, yoyo:true, repeat:-1, ease:'Sine.easeInOut', delay:i*1100 });
      this.fogRects.push(fog);
      this.fogAlphas.push(f.a);
    });

    [60,220,380,540,700].forEach((px,idx) => {
      this.add.image(px,GROUND_Y,'pillar').setOrigin(0.5,1).setAlpha(0.22+idx*0.03).setDepth(1);
      if (idx===0||idx===4) {
        const pg = this.add.ellipse(px,GROUND_Y-6,80,28,0x8800ff,0.14).setDepth(1.3);
        this.tweens.add({ targets:pg, alpha:{from:0.14,to:0.04}, duration:2100+idx*350, yoyo:true, repeat:-1 });
      }
    });

    this.add.image(GW/2,GROUND_Y,'ground').setOrigin(0.5,1).setDepth(2);
    this.gndG1 = this.add.rectangle(GW/2,GROUND_Y+1, GW, 3,0x00ff44,0.52).setDepth(3);
    this.gndG2 = this.add.rectangle(GW/2,GROUND_Y+4, GW, 7,0x00ff44,0.14).setDepth(3);
    this.gndG3 = this.add.rectangle(GW/2,GROUND_Y+11,GW,12,0x00ff44,0.05).setDepth(3);
    this.tweens.add({ targets:[this.gndG1,this.gndG2,this.gndG3], alpha:{from:1,to:0.30}, duration:1800, yoyo:true, repeat:-1 });

    // ── Plataformas ────────────────────────────────────────────────────────
    GAME_PLATFORMS.forEach(p => {
      const plat = this.add.rectangle(p.x, p.y, p.w, 18, 0x4422aa, 0.95).setDepth(3);
      plat.setStrokeStyle(2, 0x8855ff, 0.9);
      const glow = this.add.rectangle(p.x, p.y-7, p.w, 4, 0xaa88ff, 0.65).setDepth(3.5);
      this.tweens.add({ targets:glow, alpha:{from:0.65,to:0.12}, duration:1400, yoyo:true, repeat:-1 });
      this.add.rectangle(p.x - p.w/2 + 8,  p.y+14, 14, 28, 0x331188, 0.8).setDepth(2.8);
      this.add.rectangle(p.x + p.w/2 - 8,  p.y+14, 14, 28, 0x331188, 0.8).setDepth(2.8);
    });

    // ── Obstáculos ambientales ─────────────────────────────────────────────
    GAME_OBSTACLES.forEach(obs => {
      if (obs.type === 'spikes') {
        const bg = this.add.rectangle(obs.x, GROUND_Y-6, obs.w, 18, 0x111122, 0.9).setDepth(3);
        bg.setStrokeStyle(1, 0x553333, 0.5);
        const spikeCnt = Math.floor(obs.w / 10);
        for (let i = 0; i < spikeCnt; i++) {
          const sx = obs.x - obs.w/2 + 5 + i*10;
          const spike = this.add.triangle(sx, GROUND_Y-7, 0,12, 5,-4, 10,12, 0xcc3333, 0.9).setDepth(3.5);
          this.tweens.add({ targets:spike, alpha:{from:0.9,to:0.4}, duration:1000+i*80, yoyo:true, repeat:-1 });
        }
      } else {
        // Charco de ácido
        const pool = this.add.ellipse(obs.x, GROUND_Y-4, obs.w, 14, 0x22dd44, 0.78).setDepth(3);
        this.tweens.add({ targets:pool, scaleX:{from:1,to:1.06}, scaleY:{from:1,to:0.85},
          alpha:{from:0.78,to:0.45}, duration:900, yoyo:true, repeat:-1 });
        // Burbujas de ácido
        for (let b = 0; b < 4; b++) {
          const bx = obs.x + Phaser.Math.Between(-obs.w/2+8, obs.w/2-8);
          const bubble = this.add.ellipse(bx, GROUND_Y-8, 5, 5, 0x55ff66, 0.65).setDepth(3.8);
          this.tweens.add({
            targets:bubble, y:GROUND_Y-22, alpha:0, duration:Phaser.Math.Between(800,1600),
            delay:b*300, repeat:-1,
            onRepeat:()=>{ bubble.setPosition(bx, GROUND_Y-8); bubble.setAlpha(0.65); },
          });
        }
      }
    });

    this.ambientEmitter = this.add.particles(0,0,'spark',{
      x:{min:30,max:GW-30}, y:{min:95,max:GROUND_Y-30},
      speedY:{min:-15,max:-55}, speedX:{min:-12,max:12},
      scale:{start:0.28,end:0}, alpha:{start:0.65,end:0},
      lifespan:{min:3000,max:5500},
      tint:[0x00ff88,0x44aaff,0xbb55ff,0xff6622,0x88ff44],
      frequency:350, gravityY:-6,
    }).setDepth(2.5);
  }

  private buildPlayer(): void {
    // Aura de clase (debajo del sprite, depth 6)
    this.playerAura = this.add.ellipse(this.pX, this.pY - 2, 68, 22, 0xffffff, 0)
      .setDepth(6);
    // Anillo de combo (visible solo con combo >= 5)
    this.comboRing = this.add.ellipse(this.pX, this.pY - 38, 52, 52, 0xffdd44, 0)
      .setDepth(6).setStrokeStyle(2, 0xffdd44, 0);

    this.playerSprite = this.add.sprite(this.pX,this.pY,'hero-idle-1')
      .setOrigin(0.5,1).setDepth(7).setScale(1.4);
    this.playerSprite.play('hero_idle');
    this.shieldSprite = this.add.image(this.pX,this.pY-50,'shield')
      .setAlpha(0).setDepth(5).setScale(1.2);
    this.muzzleFlash = this.add.rectangle(this.pX+68,this.pY-52,18,14,0xffffaa,1)
      .setAlpha(0).setDepth(8);

    // Polvo al correr
    this.dustEmitter = this.add.particles(this.pX, this.pY, 'spark', {
      speed: { min:20, max:55 }, angle: { min:160, max:200 },
      scale: { start:0.18, end:0 }, alpha: { start:0.55, end:0 },
      lifespan: { min:200, max:400 }, gravityY:90,
      tint:[0xaaaaaa, 0xccbbaa, 0x998877],
      frequency:-1,   // emisión manual (explode mode)
    }).setDepth(6.5);
  }

  private buildHUD(): void {
    // Barra HUD principal (56px)
    this.add.rectangle(0,0,GW,56,C.HUD_BG,0.88).setOrigin(0).setDepth(10);
    this.add.rectangle(0,56,GW,2,0x00aa44,0.7).setOrigin(0).setDepth(10);

    // Corazones (PLAYER_MAX_HP + 2 slots para relic stone_heart)
    for (let i = 0; i < PLAYER_MAX_HP + 2; i++) {
      const h = this.add.image(18+i*26, 20,'heart').setDepth(11).setScale(0.85);
      h.setVisible(i < PLAYER_MAX_HP);
      this.hearts.push(h);
    }

    // Wave / score / combo
    this.waveLabel = this.add.text(GW/2, 13, 'WAVE 1', {
      fontFamily:'monospace', fontSize:'15px', color:'#00ff44', fontStyle:'bold',
    }).setOrigin(0.5).setDepth(11);

    this.scoreText = this.add.text(GW-12, 5, 'SCORE: 0', {
      fontFamily:'monospace', fontSize:'12px', color:'#ffee33',
    }).setOrigin(1,0).setDepth(11);

    this.comboText = this.add.text(GW-12, 21, '', {
      fontFamily:'monospace', fontSize:'11px', color:'#ff8800',
    }).setOrigin(1,0).setDepth(11);

    // Rank badge MCER
    this.rankBadge = this.add.text(GW/2+55, 32, '🎓 A-', {
      fontFamily:'monospace', fontSize:'11px', color:'#ff6644',
      backgroundColor:'#001422', padding:{x:6,y:2},
    }).setOrigin(0.5).setDepth(11);

    // Clase del personaje
    this.classBadge = this.add.text(GW/2-55, 32, '⚡ Bilingüe', {
      fontFamily:'monospace', fontSize:'11px', color:'#ffdd55',
      backgroundColor:'#1a1200', padding:{x:6,y:2},
    }).setOrigin(0.5).setDepth(11);

    // Esencia acumulada (meta-progresión)
    this.essenceHud = this.add.text(GW-12, 22, `✨ ${this.totalEssence}`, {
      fontFamily:'monospace', fontSize:'10px', color:'#aaddff',
    }).setOrigin(1, 0.5).setDepth(11);

    // Culpa (Blasphemous) — íconos de calavera
    this.guiltHud = this.add.text(GW-12, 36, '', {
      fontFamily:'monospace', fontSize:'10px', color:'#ff4444',
    }).setOrigin(1, 0.5).setDepth(11);
    this.updateGuiltHud();

    // Grenades + shield
    this.grenadeIcon = this.add.text(20,42,`💣 ${this.grenades}`,{
      fontFamily:'monospace', fontSize:'12px', color:'#ff8800',
    }).setOrigin(0,0.5).setDepth(11);
    this.add.text(58,42,'[G]',{fontFamily:'monospace',fontSize:'9px',color:'#884400'})
      .setOrigin(0,0.5).setDepth(11);
    this.add.text(GW/2,49,'',{fontFamily:'monospace',fontSize:'10px',color:'#00ccff'})
      .setOrigin(0.5).setDepth(11).setName('shieldHud');

    // Reliquias activas (iconos en HUD derecha)
    this.relicHud = this.add.text(GW-10,44,'',{
      fontFamily:'monospace', fontSize:'14px', color:'#ffffff',
    }).setOrigin(1,0.5).setDepth(11);

    // Notch slots (Hollow Knight charms system)
    this.notchHud = this.add.text(GW-10, 57, '', {
      fontFamily:'monospace', fontSize:'9px', color:'#aaddff',
    }).setOrigin(1,0.5).setDepth(11);
    this.updateNotchHud();

    // ── Barra de Alma (debajo del HUD, y=62) ────────────────────────────
    this.add.rectangle(GW/2,62,GW,10,0x000c18,0.95).setOrigin(0.5).setDepth(10);
    this.soulBarBg   = this.add.rectangle(4,62,GW-8,8,0x001a30,1).setOrigin(0,0.5).setDepth(10);
    this.soulBarFill = this.add.rectangle(4,62,1,   8,0x4488ff,1).setOrigin(0,0.5).setDepth(11);
    this.soulLabel   = this.add.text(GW/2,62,'⚡ ALMA  [Q]',{
      fontFamily:'monospace', fontSize:'8px', color:'#4488ff',
    }).setOrigin(0.5).setDepth(12).setAlpha(0.7);
    this.add.rectangle(0,57,GW,1,0x4488ff,0.25).setOrigin(0).setDepth(10);
    this.add.rectangle(0,67,GW,1,0x4488ff,0.25).setOrigin(0).setDepth(10);

    // Hints
    this.atkHint = this.add.text(this.pX,this.pY-118,
      '[Z] Golpe  [X] Combo  [C] Especial  [V] Dodge  [Q] ⚡Alma',{
      fontFamily:'monospace', fontSize:'9px', color:'#ffee33',
      backgroundColor:'#00000099', padding:{x:4,y:2},
    }).setOrigin(0.5,1).setDepth(16).setVisible(false);

    this.dashCDIcon = this.add.text(this.pX,this.pY-100,'⚡ listo',{
      fontFamily:'monospace', fontSize:'9px', color:'#88aaff',
    }).setOrigin(0.5,1).setDepth(16).setVisible(false);

    // Star Move HUD — abajo izquierda
    this.starMoveHud = this.add.text(20, GH-16,
      '⭐ STAR MOVE [E]  listo', {
      fontFamily:'monospace', fontSize:'10px', color:'#ffee55',
      backgroundColor:'#00000099', padding:{x:4,y:2},
    }).setOrigin(0,1).setDepth(11);

    // Arma actual — esquina inferior derecha
    this.weaponHud = this.add.text(GW-14, GH-16, '', {
      fontFamily:'monospace', fontSize:'11px', color:'#ff8844',
      backgroundColor:'#00000099', padding:{x:4,y:2},
    }).setOrigin(1,1).setDepth(11);
  }

  // ── Panel pregunta ───────────────────────────────────────────────────────
  private buildQuestionPanel(): void {
    this.qPanel = this.add.container(GW/2, Q_PY).setDepth(20).setVisible(false);

    this.qPanelBg = this.add.rectangle(0,0,GW,Q_PH,0x020c1a,0.97);
    const bg     = this.qPanelBg;
    const topBar = this.add.rectangle(0,-Q_PH/2+2,GW,4,C.PANEL_BORDER);
    this.tweens.add({ targets:topBar, alpha:{from:1,to:0.25}, duration:900, yoyo:true, repeat:-1 });

    const timerBg = this.add.rectangle(0,-Q_PH/2+12,GW-8,7,0x050f1a);
    timerBg.setStrokeStyle(1,0x081a2a);
    this.qTimerBar = this.add.rectangle(-(GW-8)/2,-Q_PH/2+12,GW-8,7,C.PANEL_BORDER).setOrigin(0,0.5);

    this.qTypeBadge = this.add.text(-GW/2+12,-Q_PH/2+24,'📖 VOCAB',{
      fontFamily:'monospace', fontSize:'11px', color:'#00eeff',
      backgroundColor:'#001829', padding:{x:6,y:3},
    }).setOrigin(0,0);
    this.qReward = this.add.text(GW/2-12,-Q_PH/2+24,'',{
      fontFamily:'monospace', fontSize:'11px', color:'#ffdd55',
      backgroundColor:'#1a1000', padding:{x:6,y:3},
    }).setOrigin(1,0);
    this.qText = this.add.text(0,-Q_PH/2+44,'',{
      fontFamily:'monospace', fontSize:'14px', color:'#cce8ff',
      align:'center', wordWrap:{width:GW-24},
    }).setOrigin(0.5,0);

    this.qEliteBadge = this.add.text(0,-Q_PH/2+38,'',{
      fontFamily:'monospace', fontSize:'10px', color:'#ffcc00',
      backgroundColor:'#1a1000', padding:{x:6,y:2},
    }).setOrigin(0.5,0).setVisible(false);

    const sep = this.add.rectangle(0,-Q_PH/2+96,GW-16,1,0x0d2040);
    this.qPanel.add([bg,topBar,timerBg,this.qTimerBar,this.qTypeBadge,this.qReward,this.qText,this.qEliteBadge,sep]);

    const BW=396, BH=42;
    const colX:[number,number] = [-200,200];
    const rowY:[number,number] = [-Q_PH/2+112+BH/2, -Q_PH/2+112+BH+6+BH/2];
    const layout:[number,number][] = [
      [colX[0],rowY[0]],[colX[1],rowY[0]],
      [colX[0],rowY[1]],[colX[1],rowY[1]],
    ];
    layout.forEach(([cx,cy],i) => {
      const col = BTN_COLORS[i];
      const bbg = this.add.rectangle(cx,cy,BW,BH,0x010a18,0.95);
      bbg.setStrokeStyle(1.5,col,0.6);
      bbg.setInteractive({useHandCursor:true});
      bbg.on('pointerdown', () => this.onAnswer(i));
      bbg.on('pointerover', () => { bbg.setFillStyle(col,0.22); bbg.setStrokeStyle(2,col,1.0); });
      bbg.on('pointerout',  () => { bbg.setFillStyle(0x010a18,0.95); bbg.setStrokeStyle(1.5,col,0.6); });

      const accent    = this.add.rectangle(cx-BW/2,cy,5,BH,col,1).setOrigin(0,0.5);
      const badge     = this.add.rectangle(cx-BW/2+20,cy,26,BH-8,col,0.85);
      const badgeTxt  = this.add.text(cx-BW/2+20,cy,BTN_LABELS[i],{
        fontFamily:'monospace', fontSize:'14px', color:'#ffffff', fontStyle:'bold',
      }).setOrigin(0.5);
      const bt        = this.add.text(cx-BW/2+42,cy,'',{
        fontFamily:'monospace', fontSize:'13px', color:'#ddeeff', wordWrap:{width:BW-56},
      }).setOrigin(0,0.5);

      this.qBtnBgs.push(bbg);
      this.qBtnLabels.push(bt);
      this.qPanel.add([bbg,accent,badge,badgeTxt,bt]);
    });
  }

  private buildWaveBanner(): void {
    this.waveBanner = this.add.container(GW/2,GH/2).setDepth(30).setAlpha(0);
    const bg = this.add.rectangle(0,0,500,80,0x000000,0.8);
    bg.setStrokeStyle(4,0x00ff44);
    const txt = this.add.text(0,0,'',{fontFamily:'monospace',fontSize:'40px',color:'#00ff44',fontStyle:'bold'})
      .setOrigin(0.5).setName('bannerTxt');
    this.waveBanner.add([bg,txt]);
  }

  private registerAnimations(): void {
    const heroAnims = [
      { key:'hero_idle',   frames:[1,2,3,4].map(i=>`hero-idle-${i}`),    rate:6,  rep:-1 },
      { key:'hero_run',    frames:[1,2,3,4,5,6].map(i=>`hero-run-${i}`), rate:10, rep:-1 },
      { key:'hero_attack', frames:[1,2,3,4,5].map(i=>`hero-attack-${i}`),rate:14, rep:0  },
      { key:'hero_jump',   frames:[1,2,3,4].map(i=>`hero-jump-${i}`),    rate:8,  rep:0  },
      { key:'hero_hurt',   frames:['hero-hurt'],                          rate:1,  rep:0  },
    ];
    heroAnims.forEach(({key,frames,rate,rep}) => {
      if (!this.anims.exists(key))
        this.anims.create({ key, frames:frames.map(f=>({key:f})), frameRate:rate, repeat:rep });
    });
    const enemyDefs = [
      { key:'zombie_walk',   frames:Array.from({length:8},(_,i)=>`skel-${i+1}`),    rate:9 },
      { key:'skeleton_walk', frames:Array.from({length:8},(_,i)=>`skelc-${i+1}`),   rate:9 },
      { key:'vampire_float', frames:Array.from({length:4},(_,i)=>`ghost-${i+1}`),   rate:5 },
      { key:'golem_stomp',   frames:Array.from({length:4},(_,i)=>`hellcat-${i+1}`), rate:6 },
    ];
    enemyDefs.forEach(({key,frames,rate}) => {
      if (!this.anims.exists(key))
        this.anims.create({ key, frames:frames.map(f=>({key:f})), frameRate:rate, repeat:-1 });
    });
    if (!this.anims.exists('boss_fly')) {
      this.anims.create({ key:'boss_fly',
        frames:this.anims.generateFrameNumbers('hell-beast',{start:0,end:4}), frameRate:6, repeat:-1 });
    }
    if (!this.anims.exists('enemy_die')) {
      this.anims.create({ key:'enemy_die',
        frames:[1,2,3,4,5].map(i=>({key:`edeath-${i}`})), frameRate:14, repeat:0 });
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
      q:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
    };
    this.keys.k1.on('down',()=>this.onAnswer(0));
    this.keys.k2.on('down',()=>this.onAnswer(1));
    this.keys.k3.on('down',()=>this.onAnswer(2));
    this.keys.k4.on('down',()=>this.onAnswer(3));
    this.keys.g.on('down', ()=>this.useGrenade());

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
      v:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.V),
      e:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };
    this.mk.e.on('down', () => this.useStarMove());

    // ESC — Pausa
    kb.on('keydown-ESC', () => this.togglePause());
  }

  // ── Pausa ────────────────────────────────────────────────────────────────────
  private togglePause(): void {
    // No pausar si está en overlay
    if (this.state === 'game_over' || this.state === 'class_select'
     || this.state === 'relic_pick' || this.state === 'path_select') return;

    this.paused = !this.paused;

    if (this.paused) {
      this.physics.pause?.();
      this.tweens.pauseAll();
      this.time.paused = true;

      const ov = this.add.container(0,0).setDepth(60);
      this.pauseOverlay = ov;

      const bg = this.add.rectangle(GW/2, GH/2, GW, GH, 0x000000, 0.78);
      const panel = this.add.rectangle(GW/2, GH/2, 360, 180, 0x030920, 0.97);
      panel.setStrokeStyle(2, 0x4488ff);

      const title = this.add.text(GW/2, GH/2-50, '⏸  PAUSA', {
        fontFamily:'monospace', fontSize:'28px', color:'#4488ff', fontStyle:'bold',
      }).setOrigin(0.5);
      const hint1 = this.add.text(GW/2, GH/2-10, 'ESC — Continuar', {
        fontFamily:'monospace', fontSize:'13px', color:'#aaccff',
      }).setOrigin(0.5);
      const hint2 = this.add.text(GW/2, GH/2+18, 'R — Reiniciar desde inicio', {
        fontFamily:'monospace', fontSize:'11px', color:'#778899',
      }).setOrigin(0.5);
      const hint3 = this.add.text(GW/2, GH/2+44, 'M — Volver al menú', {
        fontFamily:'monospace', fontSize:'11px', color:'#778899',
      }).setOrigin(0.5);

      ov.add([bg, panel, title, hint1, hint2, hint3]);

      // Teclas extra dentro de pausa
      const onR = () => { if (this.paused) { this.resumeGame(); this.scene.start('Game'); } };
      const onM = () => { if (this.paused) { this.resumeGame(); this.scene.start('Menu'); } };
      this.input.keyboard?.once('keydown-R', onR);
      this.input.keyboard?.once('keydown-M', onM);

    } else {
      this.resumeGame();
    }
  }

  private resumeGame(): void {
    this.paused = false;
    this.tweens.resumeAll();
    this.time.paused = false;
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎮  FÍSICA DEL JUGADOR
  // ═══════════════════════════════════════════════════════════════════════════

  private updatePlayer(dt: number): void {
    const frozen = this.state === 'questioning' || this.state === 'feedback'
                || this.state === 'relic_pick'  || this.state === 'class_select'
                || this.state === 'path_select';

    // ── Cooldowns ───────────────────────────────────────────────────────────
    if (this.starMoveCdLeft > 0) {
      this.starMoveCdLeft -= dt * 1000;
      if (this.starMoveCdLeft <= 0) {
        this.starMoveCdLeft = 0;
        this.starMoveHud.setText('⭐ STAR MOVE [E]  listo').setColor('#ffee55');
      } else {
        const secLeft = Math.ceil(this.starMoveCdLeft / 1000);
        this.starMoveHud.setText(`⭐ STAR MOVE [E]  ${secLeft}s`).setColor('#888844');
      }
    }
    if (!this.pCanDash) {
      this.pDashCdLeft -= dt*1000;
      if (this.pDashCdLeft <= 0) { this.pCanDash = true; this.dashCDIcon.setVisible(false); }
    }
    if (this.pDashing) {
      this.pDashTimeLeft -= dt*1000;
      if (this.pDashTimeLeft <= 0) { this.pDashing = false; this.playerSprite.setAlpha(1); }
    }
    if (!this.pCanDodge) {
      this.pDodgeCdLeft -= dt*1000;
      if (this.pDodgeCdLeft <= 0) this.pCanDodge = true;
    }
    if (this.pDodging) {
      this.pDodgeTimeLeft -= dt*1000;
      if (this.pDodgeTimeLeft <= 0) { this.pDodging = false; this.playerSprite.setAlpha(1); }
    }

    // ── Soul special ────────────────────────────────────────────────────────
    if (!frozen) {
      const threshold = this.hasRelic('soul_boost') ? 70 : SOUL_MAX;
      if (Phaser.Input.Keyboard.JustDown(this.keys.q) && this.soul >= threshold)
        this.triggerSoulAttack();
    }

    // ── Movimiento ──────────────────────────────────────────────────────────
    if (!frozen && !this.pIsAttacking && !this.pIsHurt) {
      const goLeft  = this.mk.left.isDown  || this.mk.a.isDown;
      const goRight = this.mk.right.isDown || this.mk.d.isDown;

      if (!this.pDashing && !this.pDodging) {
        if      (goLeft)  { this.pVelX = -P_MOVE_SPEED; this.pFacingRight = false; }
        else if (goRight) { this.pVelX =  P_MOVE_SPEED; this.pFacingRight = true;  }
        else              { this.pVelX *= 0.72; }

        // Salto
        const jump = Phaser.Input.Keyboard.JustDown(this.mk.space)
                  || Phaser.Input.Keyboard.JustDown(this.mk.w)
                  || Phaser.Input.Keyboard.JustDown(this.mk.up);
        if (jump && this.pOnGround) {
          this.pVelY = P_JUMP_VEL; this.pOnGround = false;
          this.playBeep('dash');
        }

        // Dash (Shift)
        if (Phaser.Input.Keyboard.JustDown(this.mk.shift) && this.pCanDash) {
          this.pDashing = true; this.pDashDir = this.pFacingRight ? 1 : -1;
          this.pDashTimeLeft = P_DASH_MS; this.pCanDash = false; this.pDashCdLeft = P_DASH_CD_MS;
          this.pVelX = P_DASH_SPEED * this.pDashDir;
          this.spawnDashAfterimage(); this.dashCDIcon.setVisible(true);
          this.playBeep('dash');
        }

        // Dodge roll (V) ── con i-frames
        if (Phaser.Input.Keyboard.JustDown(this.mk.v) && this.pCanDodge) {
          const dir = goLeft ? -1 : (goRight ? 1 : (this.pFacingRight ? 1 : -1));
          this.pDodging = true; this.pDodgeDir = dir;
          this.pDodgeTimeLeft = P_DODGE_MS;
          this.pCanDodge = false; this.pDodgeCdLeft = P_DODGE_CD_MS;
          this.pVelX = P_DODGE_SPEED * dir;
          this.pIframeLeft = P_IFRAME_MS + (this.hasRelic('iron_dodge') ? 200 : 0);
          this.spawnDodgeAfterimage();
          this.playBeep('dodge');
        }
      } else if (this.pDodging) {
        this.pVelX = P_DODGE_SPEED * this.pDodgeDir;
      } else {
        this.pVelX = P_DASH_SPEED * this.pDashDir;
      }

      // Ataques
      if (this.state === 'idle' && this.enemy && !this.pDashing && !this.pDodging) {
        if (Phaser.Input.Keyboard.JustDown(this.mk.z)) this.tryAttack('light');
        if (Phaser.Input.Keyboard.JustDown(this.mk.x)) this.tryAttack('heavy');
        if (Phaser.Input.Keyboard.JustDown(this.mk.c)) this.tryAttack('special');
      }
    }

    if (!this.pOnGround) this.pVelY += P_GRAVITY * dt;
    const prevPY = this.pY;
    this.pX += this.pVelX * dt * this.scrollSpeedMult;
    this.pY += this.pVelY * dt;

    // ── Colisión plataformas ───────────────────────────────────────────────
    for (const plat of GAME_PLATFORMS) {
      const inX = this.pX > plat.x - plat.w/2 && this.pX < plat.x + plat.w/2;
      if (inX && this.pVelY >= 0 && prevPY <= plat.y && this.pY >= plat.y) {
        this.pY = plat.y; this.pVelY = 0; this.pOnGround = true;
      }
    }
    // Si estamos por encima del suelo y no sobre ninguna plataforma, caemos
    if (this.pY < GROUND_Y && this.pOnGround) {
      const onPlat = GAME_PLATFORMS.some(p =>
        this.pX > p.x - p.w/2 && this.pX < p.x + p.w/2 && Math.abs(this.pY - p.y) < 5);
      if (!onPlat) this.pOnGround = false;
    }
    if (this.pY >= GROUND_Y) { this.pY = GROUND_Y; this.pVelY = 0; this.pOnGround = true; }
    this.pX = Phaser.Math.Clamp(this.pX, 24, GW - 24);

    // ── Colisión obstáculos (solo en suelo, fuera de i-frames) ───────────
    if (this.pOnGround && this.pY >= GROUND_Y - 6 && this.pIframeLeft <= 0
        && this.obstacleHurtLeft <= 0 && this.state !== 'game_over') {
      for (const obs of GAME_OBSTACLES) {
        const inX = this.pX > obs.x - obs.w/2 - 8 && this.pX < obs.x + obs.w/2 + 8;
        if (!inX) continue;
        if (obs.type === 'spikes') {
          // Daño inmediato + lanzamiento
          this.obstacleHurtLeft = 1800;
          this.playerHit();
          this.pVelY = -280; this.pOnGround = false;
          this.showFloatingText(this.pX, this.pY-60, '🔴 ESPINAS -1', 0xff3333);
          break;
        } else {
          // Ácido: daño gradual (1 HP / 3s)
          this.acidDmgAccum += dt * 1000;
          if (this.acidDmgAccum >= 3000) {
            this.acidDmgAccum = 0;
            this.obstacleHurtLeft = 500;
            this.playerHit();
            this.showFloatingText(this.pX, this.pY-60, '☠️ ÁCIDO -1', 0x44ff66);
          }
          break;
        }
      }
    } else {
      // Fuera de obstáculos: resetear acumulador ácido
      const onAcid = GAME_OBSTACLES.some(o =>
        o.type === 'acid' && this.pX > o.x-o.w/2-8 && this.pX < o.x+o.w/2+8
        && this.pOnGround && this.pY >= GROUND_Y-6);
      if (!onAcid) this.acidDmgAccum = 0;
    }
    if (this.obstacleHurtLeft > 0) this.obstacleHurtLeft -= dt * 1000;

    if (this.enemy && Math.abs(this.pVelX) < 20 && !this.pIsAttacking)
      this.pFacingRight = this.enemy.sprite.x > this.pX;

    this.playerSprite.setPosition(this.pX, this.pY);
    this.playerSprite.setFlipX(!this.pFacingRight);
    this.shieldSprite.setPosition(this.pX, this.pY-50);
    this.muzzleFlash.setPosition(this.pX+(this.pFacingRight?68:-68), this.pY-52);
    this.atkHint.setPosition(this.pX, this.pY-118);
    this.dashCDIcon.setPosition(this.pX, this.pY-100);
    this.playerAura.setPosition(this.pX, this.pY - 4);
    this.comboRing.setPosition(this.pX, this.pY - 38);

    // ── Combo ring — brilla con combo >= 5 ──────────────────────────────────
    if (this.combo >= 10) {
      this.comboRing.setStrokeStyle(3, 0xff4400, 0.9);
      this.comboRing.setFillStyle(0xff2200, 0.08);
    } else if (this.combo >= 5) {
      this.comboRing.setStrokeStyle(2, 0xffdd44, 0.75);
      this.comboRing.setFillStyle(0xffdd44, 0.05);
    } else {
      this.comboRing.setStrokeStyle(0, 0x000000, 0);
      this.comboRing.setFillStyle(0x000000, 0);
    }

    // ── Polvo de pasos (en suelo, moviéndose) ──────────────────────────────
    if (this.pOnGround && Math.abs(this.pVelX) > 60 && !this.pDashing) {
      this.dustEmitter.setPosition(this.pX, this.pY);
      this.dustEmitter.explode(2);
    }

    // Tinte de i-frames (parpadeo durante dodge)
    if (this.pDodging || this.pIframeLeft > 0)
      this.playerSprite.setAlpha(Math.sin(Date.now()*0.03)*0.4+0.6);
    else if (!this.pDashing)
      this.playerSprite.setAlpha(1);

    this.updatePlayerAnim();
  }

  private updatePlayerAnim(): void {
    if (this.pIsAttacking || this.pIsHurt) return;
    if (this.pDodging) { this.playerSprite.play('hero_run', true); return; }
    if (!this.pOnGround) { this.playerSprite.play('hero_jump', true); return; }
    if (this.pDashing || Math.abs(this.pVelX) > 20) { this.playerSprite.play('hero_run', true); return; }
    this.playerSprite.play('hero_idle', true);
  }

  private spawnDashAfterimage(): void {
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(i*35, () => {
        const g = this.add.sprite(this.pX, this.pY, 'hero-run-1')
          .setOrigin(0.5,1).setScale(1.4).setFlipX(!this.pFacingRight)
          .setAlpha(0.45-i*0.08).setTint(0x88aaff).setDepth(6);
        this.tweens.add({ targets:g, alpha:0, scaleX:1.5, scaleY:1.5,
          duration:220, ease:'Power2', onComplete:()=>g.destroy() });
      });
    }
  }

  private spawnDodgeAfterimage(): void {
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i*25, () => {
        const g = this.add.sprite(this.pX, this.pY, 'hero-run-1')
          .setOrigin(0.5,1).setScale(1.4).setFlipX(!this.pFacingRight)
          .setAlpha(0.5-i*0.07).setTint(0xffffff).setDepth(6);
        this.tweens.add({ targets:g, alpha:0, scaleY:0.8,
          duration:180, ease:'Power2', onComplete:()=>g.destroy() });
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 👾  ENEMIGO — CHASE AI + TELEGRAFÍA
  // ═══════════════════════════════════════════════════════════════════════════

  private updateEnemy(dt: number): void {
    if (!this.enemy) return;
    const { sprite, hpBg, hpFill, hpLabel, spriteH, behavior } = this.enemy;
    const dx    = this.pX - sprite.x;
    const absDx = Math.abs(dx);
    const dir   = dx > 0 ? 1 : -1;

    // Velocidad según fase del boss + behavior
    let speed: number = ENEMY_STATS[this.enemy.type].speed;
    if (this.enemy.type === 'boss') {
      if      (this.bossPhase >= 2) speed *= 2.5;
      else if (this.bossPhase >= 1) speed *= 1.6;
    }
    if (behavior === 'turbo')            speed *= 1.9;
    if (this.enemySlowLeft > 0)          speed *= 0.30;  // Lector class slow

    // ── Status effects ────────────────────────────────────────────────────
    if (this.enemy.statusLeft > 0) {
      this.enemy.statusLeft -= dt;
      if (this.enemy.statusLeft <= 0) {
        this.enemy.status = 'none';
        sprite.clearTint();
        this.enemy.statusIcon?.destroy(); this.enemy.statusIcon = null;
        if (behavior === 'turbo') sprite.setTint(0xffee44);
        if (behavior === 'elite') sprite.setTint(0xdd88ff);
        if (behavior === 'duplicator') sprite.setTint(0x44ffcc);
      }
    }
    if (this.enemy.status === 'stunned') speed = 0;
    if (this.enemy.status === 'slowed')  speed *= 0.28;
    if (this.enemy.status === 'burning' && this.enemy.burnTicks > 0) {
      this.enemy.burnTicks--;
      this.time.delayedCall(900, () => {
        if (this.enemy && this.enemy.hpCurrent > 0) {
          this.dealDamage(1);
          this.showFloatingText(this.enemy.sprite.x, this.enemy.sprite.y-40, '🔥-1', 0xff5500);
        }
      });
    }
    if (this.enemy.statusIcon) {
      this.enemy.statusIcon.setPosition(sprite.x, sprite.y - spriteH - 30);
    }

    if (this.state === 'idle' && absDx > E_MELEE_RANGE) {
      sprite.x += dir * speed * dt;
      sprite.setFlipX(dx < 0);
    }

    // Telegrafía de ataque — flash rojo + ⚠️ (silent se salta)
    if (behavior !== 'silent' && !this.enemy.warned && absDx <= E_WARN_RANGE && this.state === 'idle') {
      this.enemy.warned = true;
      sprite.setTint(0xff2200);
      this.time.delayedCall(100, ()=>{ if(this.enemy) sprite.clearTint(); });
      this.time.delayedCall(200, ()=>{ if(this.enemy) sprite.setTint(0xff2200); });
      this.time.delayedCall(320, ()=>{ if(this.enemy) sprite.clearTint(); });
      this.showFloatingText(sprite.x, sprite.y - spriteH - 18, '⚠️', 0xff3300);
    }

    if (absDx <= E_MELEE_RANGE && this.state === 'idle') {
      this.pSelectedAtk = 'light';
      this.onEnemyArrived(false);
    }

    // ── Proyectiles (skeleton, golem, boss en phase 1+) ───────────────────
    const canShoot = this.state === 'idle'
      && (this.enemy.type === 'skeleton' || this.enemy.type === 'boss' || this.enemy.type === 'golem')
      && absDx > E_MELEE_RANGE + 20 && absDx < 450;

    if (canShoot) {
      this.projShootTimer -= dt * 1000;
      if (this.projShootTimer <= 0) {
        const cooldown = this.enemy.type === 'boss' ? 2800 : 4500;
        this.projShootTimer = cooldown + Math.random() * 1500;
        this.spawnEnemyProjectile(sprite.x, sprite.y - spriteH * 0.55, dir < 0 ? -1 : 1);
      }
    }

    const barY = sprite.y - spriteH - 10;
    hpBg.setPosition(sprite.x, barY);
    hpLabel.setPosition(sprite.x, barY-10);
    hpFill.setPosition(sprite.x-26, barY);
    // Mover glow de behavior
    if (this.enemy.behaviorGlow) {
      this.enemy.behaviorGlow.setPosition(sprite.x, sprite.y - spriteH/2);
    }
    this.atkHint.setVisible(absDx <= E_CHASE_RANGE && this.state === 'idle');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⚔️  COMBATE
  // ═══════════════════════════════════════════════════════════════════════════

  private tryAttack(type: AttackType): void {
    if (!this.enemy || this.pIsAttacking) return;
    if (Math.abs(this.pX - this.enemy.sprite.x) > E_CHASE_RANGE) {
      this.showFloatingText(this.pX, this.pY-90, '¡Muy lejos!', 0xff8800); return;
    }
    this.pSelectedAtk = type; this.pIsAttacking = true;
    this.playerSprite.play('hero_attack', true); this.muzzleFlash.setAlpha(1);
    this.playerSprite.once('animationcomplete', () => {
      this.pIsAttacking = false; this.muzzleFlash.setAlpha(0);
    });
    this.onEnemyArrived(true);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 💥  PROYECTILES ENEMIGOS
  // ═══════════════════════════════════════════════════════════════════════════

  private spawnEnemyProjectile(ex: number, ey: number, dir: number): void {
    const isBoss = this.enemy?.type === 'boss';
    const color  = isBoss ? 0xff2200 : 0xaa44ff;
    const emoji  = isBoss ? '🔥' : '💀';
    const speed  = isBoss ? 420 : 310;
    const dmg    = isBoss ? 2 : 1;

    const visual = this.add.ellipse(ex, ey, isBoss ? 22 : 16, isBoss ? 22 : 16, color, 0.9).setDepth(12);
    const trail  = this.add.text(ex, ey, emoji, {fontSize: isBoss ? '18px' : '14px'})
      .setOrigin(0.5).setDepth(12);

    // Pulso visual
    this.tweens.add({ targets:visual, scaleX:{from:0.7,to:1.2}, scaleY:{from:0.7,to:1.2},
      duration:200, yoyo:true, repeat:-1 });

    // SFX
    this.playBeep('special');

    this.projectiles.push({ x: ex, y: ey, velX: dir * speed, visual, trail, dmg });
  }

  private updateProjectiles(dt: number): void {
    if (this.projectiles.length === 0) return;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.velX * dt;

      p.visual.setPosition(p.x, p.y);
      p.trail.setPosition(p.x, p.y);

      // Fuera de pantalla — destruir
      if (p.x < -60 || p.x > GW + 60) {
        p.visual.destroy(); p.trail.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }

      // Colisión con jugador (solo si no hay i-frames)
      const inX = Math.abs(p.x - this.pX) < 24;
      const inY = Math.abs(p.y - (this.pY - 40)) < 38;
      if (inX && inY && this.pIframeLeft <= 0 && !this.pDodging) {
        // Hit!
        p.visual.destroy(); p.trail.destroy();
        this.projectiles.splice(i, 1);

        // Flash rojo en pantalla
        const flash = this.add.rectangle(GW/2,GH/2,GW,GH,0xff0000,0.25).setDepth(22);
        this.tweens.add({ targets:flash, alpha:0, duration:250, onComplete:()=>flash.destroy() });

        this.showFloatingText(this.pX, this.pY-70,
          `${p.dmg === 2 ? '🔥' : '💀'} -${p.dmg} HP`, 0xff3333);
        this.pIframeLeft = 900;  // invencibilidad temporal
        for (let d = 0; d < p.dmg; d++) {
          this.time.delayedCall(d * 80, () => this.playerHit());
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎁  PICKUPS DE PLATAFORMA
  // ═══════════════════════════════════════════════════════════════════════════

  private spawnPlatformPickups(): void {
    // Limpiar pickups anteriores
    for (const p of this.platformPickups) {
      if (!p.collected) { p.visual.destroy(); p.glow.destroy(); p.bobTween.stop(); }
    }
    this.platformPickups = [];

    // Spawn un pickup por plataforma (~60% de probabilidad)
    const types: PickupType[] = ['hp','soul','essence','grenade'];
    const weights = [0.35, 0.35, 0.20, 0.10];

    for (const plat of GAME_PLATFORMS) {
      if (Math.random() > 0.65) continue; // 65% chance de spawn

      // Elegir tipo por peso
      const roll = Math.random();
      let acc = 0, type: PickupType = 'soul';
      for (let i = 0; i < types.length; i++) {
        acc += weights[i];
        if (roll <= acc) { type = types[i]; break; }
      }

      const emojis: Record<PickupType,string> = { hp:'❤️', soul:'🔷', essence:'✨', grenade:'💣' };
      const colors: Record<PickupType,number> = { hp:0xff4466, soul:0x4488ff, essence:0xaaddff, grenade:0xff8800 };

      const py = plat.y - 28;
      const glow = this.add.ellipse(plat.x, py+14, 36, 14, colors[type], 0.3).setDepth(7.5);
      const visual = this.add.text(plat.x, py, emojis[type], {fontSize:'20px'})
        .setOrigin(0.5).setDepth(7.6);

      const bobTween = this.tweens.add({
        targets: visual, y: py - 8, duration: 700 + Math.random()*300,
        yoyo:true, repeat:-1, ease:'Sine.easeInOut',
      });

      this.platformPickups.push({ type, x:plat.x, y:py, visual, glow, bobTween, collected:false });
    }
  }

  private updatePlatformPickups(): void {
    for (const p of this.platformPickups) {
      if (p.collected) continue;
      // Colisión con jugador
      if (Math.abs(this.pX - p.x) < 28 && Math.abs(this.pY - p.y) < 30) {
        p.collected = true;
        p.bobTween.stop();
        p.visual.destroy(); p.glow.destroy();

        // Aplicar efecto del pickup
        switch (p.type) {
          case 'hp':
            if (this.hp < this.maxHp) {
              this.hp++; this.updateHearts();
              this.showFloatingText(this.pX, this.pY-70, '❤️ +1 HP', 0xff4466);
            } else {
              this.addScore(150);
              this.showFloatingText(this.pX, this.pY-70, '❤️ +150 pts', 0xff4466);
            }
            break;
          case 'soul':
            this.soul = Math.min(SOUL_MAX + this.scrollSoulMax, this.soul + 30);
            this.updateSoulBar();
            this.showFloatingText(this.pX, this.pY-70, '🔷 +30 Alma', 0x4488ff);
            break;
          case 'essence':
            this.addRunEssence(8);
            this.showFloatingText(this.pX, this.pY-70, '✨ +8 Esencia', 0xaaddff);
            break;
          case 'grenade':
            this.grenades = Math.min(this.grenades + 1, 5);
            this.grenadeIcon.setText(`💣 ${this.grenades}`);
            this.showFloatingText(this.pX, this.pY-70, '💣 +1 Granada', 0xff8800);
            break;
        }
        this.playBeep('relic');
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🌊  OLAS
  // ═══════════════════════════════════════════════════════════════════════════

  private startWave(): void {
    const waveData = WAVES[this.wave % WAVES.length];
    this.enemyQueue = [...waveData];

    // Camino peligroso: +2 enemigos aleatorios extra
    if (this.nextWaveModifier === 'dangerous') {
      const extras: EnemyType[] = ['zombie','skeleton','vampire'];
      this.enemyQueue.push(
        extras[Math.floor(Math.random()*extras.length)],
        extras[Math.floor(Math.random()*extras.length)],
      );
    }
    this.nextWaveModifier = 'normal'; // reset
    this.enemyIdx = 0;

    const isBossWave = this.wave === 4 || this.wave === 7;
    const label = this.wave < WAVES.length
      ? (isBossWave ? '⚡ BOSS !' : `WAVE ${this.wave+1}`)
      : `WAVE ${this.wave+1}`;
    this.waveLabel.setText(label);
    this.spawnPlatformPickups();

    // ── Previsualización de oleada ──────────────────────────────────────────
    if (!isBossWave) {
      this.showWavePreview(label, () => {
        // Tutorial solo en oleada 1
        if (this.wave === 0) {
          this.showTutorialOverlay(() => this.spawnNextEnemy());
        } else {
          this.spawnNextEnemy();
        }
      });
    } else {
      this.showBanner(label, ()=>this.spawnNextEnemy());
    }
  }

  // ── Wave preview (Dead Cells style) ────────────────────────────────────────
  private showWavePreview(label: string, onDone: () => void): void {
    // Contar tipos de enemigos
    const counts: Partial<Record<EnemyType,number>> = {};
    for (const t of this.enemyQueue) counts[t] = (counts[t] ?? 0) + 1;

    const emojiMap: Record<EnemyType,string> = {
      zombie:'🧟', skeleton:'💀', vampire:'🧛', golem:'🗿', boss:'👹',
    };
    const enemySummary = Object.entries(counts)
      .map(([t, n]) => `${emojiMap[t as EnemyType]??'👾'}×${n}`)
      .join('  ');

    const biome = BIOMES[this.biomeIdx % BIOMES.length];

    const overlay = this.add.container(0,0).setDepth(44);

    const bg = this.add.rectangle(GW/2, GH - 72, GW, 68, 0x020b18, 0.93);
    bg.setStrokeStyle(1, 0x003344, 0.7);
    const waveT = this.add.text(GW/2, GH - 84, `${biome.icon} ${label}`, {
      fontFamily:'monospace', fontSize:'17px', color:'#00ff88', fontStyle:'bold',
    }).setOrigin(0.5);
    const enemyT = this.add.text(GW/2, GH - 62, enemySummary || '???', {
      fontFamily:'monospace', fontSize:'13px', color:'#ffdd55',
    }).setOrigin(0.5);
    const hint   = this.add.text(GW/2, GH - 44, '¡Derrota todos los enemigos para avanzar!', {
      fontFamily:'monospace', fontSize:'10px', color:'#557799',
    }).setOrigin(0.5);

    overlay.add([bg, waveT, enemyT, hint]);
    overlay.setAlpha(0);
    this.tweens.add({ targets:overlay, alpha:1, duration:280, ease:'Power2' });

    this.time.delayedCall(1800, () => {
      this.tweens.add({ targets:overlay, alpha:0, duration:280, ease:'Power2',
        onComplete:()=>{ overlay.destroy(); onDone(); } });
    });
  }

  // ── Tutorial oleada 1 ───────────────────────────────────────────────────────
  private showTutorialOverlay(onDone: () => void): void {
    const overlay = this.add.container(0,0).setDepth(44);
    const bg = this.add.rectangle(GW/2, GH/2, GW, GH, 0x000000, 0.78);
    const panel = this.add.rectangle(GW/2, GH/2 - 20, 540, 260, 0x030920, 0.97);
    panel.setStrokeStyle(2, 0x00ff88);

    const title = this.add.text(GW/2, GH/2 - 128, '🎮  CONTROLES BÁSICOS', {
      fontFamily:'monospace', fontSize:'18px', color:'#00ff88', fontStyle:'bold',
    }).setOrigin(0.5);

    const controls = [
      '← → / A D          Mover',
      'SPACE / W / ↑       Saltar',
      'SHIFT               Dash',
      'Z / X / C           Atacar (acércate al enemigo)',
      'V                   Dodge roll (i-frames)',
      'G                   Granada',
      'Q                   Especial de Alma',
      'E                   Star Move (consume granadas)',
      'ESC                 Pausa',
    ];

    controls.forEach((line, i) => {
      const col = i < 2 ? '#aaddff' : i < 5 ? '#ffdd88' : '#cc99ff';
      this.add.text(GW/2 - 240, GH/2 - 96 + i * 22, line, {
        fontFamily:'monospace', fontSize:'11px', color:col,
      }).setOrigin(0);
      overlay.add(this.children.getByName('') as Phaser.GameObjects.GameObject ?? this.add.text(0,0,''));
    });

    const hint = this.add.text(GW/2, GH/2 + 118, 'ESPACIO · ENTER — ¡Comenzar!', {
      fontFamily:'monospace', fontSize:'12px', color:'#ffee44',
    }).setOrigin(0.5);
    this.tweens.add({ targets:hint, alpha:{from:1,to:0.3}, duration:600, yoyo:true, repeat:-1 });

    overlay.add([bg, panel, title, hint]);

    // Cerrar al presionar espacio/enter o después de 8s
    const close = () => {
      this.tweens.add({ targets:overlay, alpha:0, duration:300,
        onComplete:()=>{ overlay.destroy(); onDone(); } });
    };
    this.input.keyboard?.once('keydown-SPACE', close);
    this.input.keyboard?.once('keydown-ENTER', close);
    this.time.delayedCall(8000, () => { if (overlay.active) close(); });

    overlay.setAlpha(0);
    this.tweens.add({ targets:overlay, alpha:1, duration:350, ease:'Power2' });
  }

  private spawnNextEnemy(): void {
    if (this.enemyIdx >= this.enemyQueue.length) { this.waveComplete(); return; }
    const type  = this.enemyQueue[this.enemyIdx++];
    const stats = ENEMY_STATS[type];

    // Asignar behavior (wave 1+, non-boss, 35% chance)
    let behavior: EnemyBehavior = 'normal';
    if (type !== 'boss' && this.wave >= 1) {
      const roll = Math.random();
      if      (roll < 0.10) behavior = 'shielded';
      else if (roll < 0.20) behavior = 'turbo';
      else if (roll < 0.28) behavior = 'duplicator';
      else if (roll < 0.35) behavior = 'silent';
      else if (roll < 0.42 && this.wave >= 3) behavior = 'elite';
    }

    const animKey    = type==='boss'?'boss_fly':type==='vampire'?'vampire_float':type==='golem'?'golem_stomp':type==='skeleton'?'skeleton_walk':'zombie_walk';
    const firstTex   = type==='boss'?'hell-beast':type==='vampire'?'ghost-1':type==='golem'?'hellcat-1':type==='skeleton'?'skelc-1':'skel-1';
    const spriteH    = type==='boss'?134:type==='vampire'?65:type==='golem'?53:52;
    const spriteScale= type==='boss'?2.0:1.0;

    // ── Portal de aparición ────────────────────────────────────────────────
    const portalColor = type === 'boss' ? 0xff0000 : type === 'vampire' ? 0xaa00ff : 0x00ff44;
    const portalScale = type === 'boss' ? 2.2 : 1.4;
    const portal = this.add.ellipse(SPAWN_X, GROUND_Y - (spriteH/2), 55, 80, portalColor, 0.7)
      .setDepth(7.8).setScale(0.1);
    this.tweens.add({
      targets: portal, scaleX: portalScale, scaleY: portalScale, alpha: 0,
      duration: 600, ease: 'Back.easeOut',
      onComplete: () => portal.destroy(),
    });
    // Partículas de portal
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 40, () => {
        const spark = this.add.ellipse(
          SPAWN_X + Phaser.Math.Between(-30, 30),
          GROUND_Y - Phaser.Math.Between(20, spriteH),
          8, 8, portalColor, 0.9,
        ).setDepth(7.9);
        this.tweens.add({ targets: spark, y: spark.y - 50, alpha: 0, scaleX:0.2, scaleY:0.2,
          duration: 450, ease: 'Quad.easeOut', onComplete: ()=>spark.destroy() });
      });
    }

    const sprite = this.add.sprite(SPAWN_X, GROUND_Y, firstTex)
      .setOrigin(0.5,1).setDepth(8).setFlipX(true).setScale(spriteScale * 0.1)
      .setAlpha(0);
    sprite.play(animKey);
    // Entrada con zoom-in del sprite
    this.tweens.add({ targets:sprite, scaleX:spriteScale, scaleY:spriteScale, alpha:1,
      duration:350, ease:'Back.easeOut' });

    // Tints por behavior
    if (behavior === 'turbo')      sprite.setTint(0xffee44);
    if (behavior === 'elite')      sprite.setTint(0xdd88ff);
    if (behavior === 'duplicator') sprite.setTint(0x44ffcc);
    if (behavior === 'silent')     sprite.setTint(0x8888aa);

    const behaviorSuffix: Record<EnemyBehavior,string> = {
      normal:'', shielded:' 🛡️', turbo:' ⚡', duplicator:' 👥', silent:' 🔇', elite:' 💎',
    };
    const barY   = GROUND_Y - spriteH - 10;
    const hpBg   = this.add.rectangle(SPAWN_X, barY, 56, 8, 0x333333).setDepth(9);
    const hpFill = this.add.rectangle(SPAWN_X-26, barY, 52, 6, 0x00ff44).setOrigin(0,0.5).setDepth(9);
    const hpLabel= this.add.text(SPAWN_X, barY-10, stats.label+behaviorSuffix[behavior], {
      fontFamily:'monospace', fontSize:'11px', color:'#'+stats.color.toString(16).padStart(6,'0'),
    }).setOrigin(0.5).setDepth(9);

    // Glow visual para shielded
    let behaviorGlow: Phaser.GameObjects.Ellipse | null = null;
    if (behavior === 'shielded') {
      behaviorGlow = this.add.ellipse(SPAWN_X, GROUND_Y - spriteH/2, 80, 120, 0x4488ff, 0.18)
        .setDepth(7.5).setStrokeStyle(2, 0x4488ff, 0.9);
      this.tweens.add({ targets:behaviorGlow, alpha:{from:0.18,to:0.04}, scaleX:{from:1,to:1.2},
        duration:700, yoyo:true, repeat:-1 });
    }

    const bob = this.tweens.add({ targets:sprite, y:GROUND_Y-5, duration:380, yoyo:true, repeat:-1 });
    this.enemy = { type, sprite, hpCurrent:stats.hp, hpMax:stats.hp, hpBg, hpFill, hpLabel, bob,
      spriteH, warned:false, behavior, isDuplicate:false, behaviorGlow,
      status:'none', statusLeft:0, burnTicks:0, statusIcon:null };
    this.bossPhase = 0;

    // ── Boss intro cinematográfico ─────────────────────────────────────────
    if (type === 'boss') {
      this.state = 'wave_clear'; // congelar player temporalmente
      this.showBossIntro(() => { this.state = 'idle'; });
    } else {
      this.state = 'idle';
    }

    // Label de behavior al aparecer
    if (behavior !== 'normal') {
      const bLabels: Record<EnemyBehavior,string> = {
        normal:'', shielded:'🛡️ ESCUDADO', turbo:'⚡ TURBO',
        duplicator:'👥 DUPLICADOR', silent:'🔇 SILENCIOSO', elite:'💎 ÉLITE',
      };
      const bColors: Record<EnemyBehavior,number> = {
        normal:0xffffff, shielded:0x4488ff, turbo:0xffee44,
        duplicator:0x44ffcc, silent:0x8888aa, elite:0xdd88ff,
      };
      this.showFloatingText(SPAWN_X, GROUND_Y - spriteH - 30, bLabels[behavior], bColors[behavior]);
    }
  }

  // ── Boss intro cinematográfico ─────────────────────────────────────────────
  private showBossIntro(onDone: () => void): void {
    this.cameras.main.shake(400, 0.022);

    // Overlay rojo dramático
    const overlay = this.add.rectangle(GW/2, GH/2, GW, GH, 0x880000, 0).setDepth(45);
    this.tweens.add({ targets:overlay, alpha:{from:0,to:0.55}, duration:300,
      onComplete:()=>{
        this.tweens.add({ targets:overlay, alpha:0, duration:600, delay:800,
          onComplete:()=>overlay.destroy() });
      }
    });

    // Texto dramático de boss
    const lines = [
      { txt:'⚠️  BOSS WAVE  ⚠️', color:'#ff2200', size:'30px', y: GH/2-40 },
      { txt:this.getBossName(),    color:'#ffaa44', size:'20px', y: GH/2-4  },
      { txt:'¡Prepárate!',         color:'#ffee44', size:'14px', y: GH/2+28 },
    ];

    lines.forEach((l, idx) => {
      const t = this.add.text(GW/2, l.y, l.txt, {
        fontFamily:'monospace', fontSize:l.size, color:l.color, fontStyle:'bold',
        stroke:'#330000', strokeThickness:4,
      }).setOrigin(0.5).setDepth(46).setAlpha(0).setScale(0.5);

      this.tweens.add({
        targets:t, alpha:1, scaleX:1, scaleY:1,
        duration:280, delay: idx * 150, ease:'Back.easeOut',
        onComplete:()=>{
          this.tweens.add({
            targets:t, alpha:0, y:t.y - 18, duration:380, delay:900,
            onComplete:()=>t.destroy(),
          });
        },
      });
    });

    // Scan line rojo horizontal
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 80, () => {
        const line = this.add.rectangle(GW/2, Phaser.Math.Between(80,GH-80), GW, 3, 0xff2200, 0.6)
          .setDepth(46);
        this.tweens.add({ targets:line, alpha:0, duration:350, onComplete:()=>line.destroy() });
      });
    }

    // SFX de alerta
    this.playBeep('special');
    this.time.delayedCall(180, () => this.playBeep('special'));

    // Dar control al jugador después del intro
    this.time.delayedCall(1600, onDone);
  }

  private getBossName(): string {
    const names = [
      'DEMONIO CAÍDO', 'SEÑOR DEL ABISMO', 'BESTIA OSCURA',
      'REY NO MUERTO', 'ÁNGEL CORROMPIDO',
    ];
    return names[this.wave % names.length];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ❓  PREGUNTAS
  // ═══════════════════════════════════════════════════════════════════════════

  private onEnemyArrived(playerInitiated = false): void {
    if (this.state === 'game_over') return;
    this.state    = 'questioning';
    this.currentQ = getRandomQuestion(this.enemy?.type === 'boss');

    // Elite question chance (enemy élite = 65%, boss berserker = 35%, otherwise 18%)
    const eliteChance = this.enemy?.behavior === 'elite' ? 0.65
      : this.bossPhase >= 2 ? 0.35 : 0.18;
    this.isEliteQuestion = Math.random() < eliteChance;

    // questionDuration: boss berserker = 40% tiempo (pánico), Lector = +50%
    let dur = QUESTION_TIME;
    if (this.bossPhase >= 2) dur *= 0.4;
    if (this.playerClass === 'lector') dur *= 1.5;
    this.questionDuration = dur;

    if (playerInitiated) {
      const rewardMap: Record<AttackType,'bullet'|'double'|'grenade'> = {
        light:   'bullet',
        heavy:   'double',
        special: this.grenades > 0 ? 'grenade' : 'double',
      };
      this.currentQ = { ...this.currentQ!, reward: rewardMap[this.pSelectedAtk] };
    }
    this.showQuestion(this.currentQ!);
  }

  private showQuestion(q: Question): void {
    const typeColors: Record<string,string> = { vocab:'#00eeff', grammar:'#ffee33', bonus:'#ff88ff' };
    const typeLbls:  Record<string,string>  = { vocab:'📖 VOCAB', grammar:'✍️ GRAMMAR', bonus:'⚡ BONUS' };

    const prefix = this.isEliteQuestion ? '💎 ' : '';
    this.qTypeBadge.setText(prefix+(typeLbls[q.type] ?? q.type.toUpperCase()));
    this.qTypeBadge.setColor(this.isEliteQuestion ? '#ffcc00' : (typeColors[q.type] ?? '#ffffff'));
    this.qReward.setText(REWARD_LABELS[q.reward] ?? '');
    this.qText.setText(q.text);

    // Elite / pánico / shielded badge
    if (this.isEliteQuestion) {
      this.qEliteBadge.setText('💎 ÉLITE — Acierto: ×2 DMG  |  Fallo: ×2 DAÑO').setColor('#ffcc00').setVisible(true);
      this.qPanelBg.setStrokeStyle(3, 0xffcc00, 1.0);
    } else if (this.bossPhase >= 2) {
      this.qEliteBadge.setText('⚠️ MODO PÁNICO — 40% TIEMPO').setColor('#ff4400').setVisible(true);
      this.qPanelBg.setStrokeStyle(3, 0xff4400, 1.0);
    } else if (this.enemy?.behavior === 'shielded') {
      this.qEliteBadge.setText('🛡️ RESPONDE EN 4s PARA ROMPER EL ESCUDO').setColor('#4488ff').setVisible(true);
      this.qPanelBg.setStrokeStyle(2, 0x4488ff, 0.8);
    } else {
      this.qEliteBadge.setVisible(false);
      this.qPanelBg.setStrokeStyle(0);
    }

    q.opts.forEach((opt,i) => {
      this.qBtnLabels[i].setText(opt);
      this.qBtnBgs[i].setFillStyle(0x010a18,0.95);
      this.qBtnBgs[i].setStrokeStyle(1.5,BTN_COLORS[i],0.6);
    });

    this.timerElapsed = 0;
    this.qTimerBar.width = GW-8;
    this.qTimerBar.setFillStyle(this.isEliteQuestion ? 0xffcc00 : C.PANEL_BORDER);

    this.qPanel.setVisible(true).setAlpha(0).setY(GH+Q_PH/2);
    this.tweens.add({ targets:this.qPanel, alpha:1, y:Q_PY, duration:320, ease:'Back.easeOut' });
    this.timerEvent = this.time.delayedCall(this.questionDuration, ()=>this.onTimeout());

    // Pregunta Envenenada: activa si enemy élite, boss, o wave >= 5
    const poisoned = this.isEliteQuestion || this.enemy?.type === 'boss' || this.wave >= 4;
    if (poisoned) this.startPoisonTimer();
  }

  private hideQuestion(): void {
    this.timerEvent?.remove();   this.timerEvent  = null;
    this.poisonTimer?.remove();  this.poisonTimer  = null;
    this.tweens.add({
      targets:this.qPanel, alpha:0, y:GH+Q_PH/2, duration:240, ease:'Power2.easeIn',
      onComplete:()=>this.qPanel.setVisible(false),
    });
  }

  /** Pregunta Envenenada: el enemigo golpea al jugador cada 4s mientras no responde */
  private startPoisonTimer(): void {
    this.poisonTimer?.remove();
    const interval = 4000;
    this.poisonTimer = this.time.addEvent({
      delay: interval,
      loop: true,
      callback: () => {
        if (this.state !== 'questioning') { this.poisonTimer?.remove(); return; }
        // Flash ámbar en el panel
        this.tweens.add({ targets:this.qPanelBg, alpha:{from:1,to:0.2}, duration:80, yoyo:true, repeat:2 });
        this.showFloatingText(this.enemy?.sprite.x ?? GW/2,
          (this.enemy?.sprite.y ?? 200)-60, '☠️ ¡GOLPE VENENO!', 0xff8800);
        this.playBeep('wrong');
        this.cameras.main.shake(120, 0.01);
        const flash = this.add.rectangle(GW/2,GH/2,GW,GH,0xff6600,0.22).setDepth(50);
        this.tweens.add({ targets:flash, alpha:0, duration:200, onComplete:()=>flash.destroy() });
        // Daño real — respeta shield (i-frames no aplican aquí, es veneno)
        if (this.hp > 0) {
          if (this.hasShield) {
            this.hasShield=false; this.shieldSprite.setAlpha(0);
            this.tweens.killTweensOf(this.shieldSprite);
            (this.children.getByName('shieldHud') as Phaser.GameObjects.Text|null)?.setText('');
          } else {
            this.hp = Math.max(0, this.hp - 1);
            this.updateHearts();
            if (this.hp <= 0) { this.hideQuestion(); this.doGameOver(); }
          }
        }
      },
    });
  }

  private onAnswer(idx: number): void {
    if (this.state !== 'questioning' || !this.currentQ) return;
    this.state = 'feedback';
    this.timerEvent?.remove(); this.timerEvent = null;
    this.totalAns++;

    const correct = idx === this.currentQ.ans;
    this.qBtnBgs.forEach((bg,i) => {
      if      (i===this.currentQ!.ans)   { bg.setFillStyle(C.CORRECT,0.7); bg.setStrokeStyle(2,C.CORRECT,1); }
      else if (i===idx && !correct)      { bg.setFillStyle(C.WRONG,  0.6); bg.setStrokeStyle(2,C.WRONG,  1); }
      else                               { bg.setFillStyle(0x010a18, 0.5); bg.setStrokeStyle(1,0x334466, 0.4); }
    });

    this.time.delayedCall(FEEDBACK_TIME, ()=>{
      this.hideQuestion();
      if (correct) this.onCorrectAnswer(this.currentQ!);
      else         this.onWrongAnswer();
    });
  }

  private onTimeout(): void {
    if (this.state !== 'questioning') return;
    this.state = 'feedback';
    this.totalAns++;
    this.tweens.add({ targets:this.qPanel, alpha:0.3, duration:100, yoyo:true, repeat:3 });
    this.time.delayedCall(FEEDBACK_TIME, ()=>{ this.hideQuestion(); this.onWrongAnswer(); });
  }

  private onCorrectAnswer(q: Question): void {
    this.combo++;
    this.correctAns++;
    this.comboShieldUsed = false;
    const comboBonus = Math.floor(this.combo/3)*50;

    // Cargar alma
    let soulGain = SOUL_CHARGE;
    if (this.hasRelic('vocab_soul') && q.type==='vocab' && this.timerElapsed < 3000) soulGain += 20;
    this.soul = Math.min(SOUL_MAX, this.soul + soulGain);
    this.updateSoulBar();
    this.updateEnglishRank();
    this.playBeep('correct');

    if (!this.pIsAttacking) {
      this.pIsAttacking = true;
      this.playerSprite.play('hero_attack',true); this.muzzleFlash.setAlpha(1);
      this.playerSprite.once('animationcomplete', ()=>{
        this.pIsAttacking = false; this.muzzleFlash.setAlpha(0);
        this.playerSprite.play('hero_idle',true);
      });
    }

    // Calcular daño y tipo con reliquias + clase + elite
    let reward = q.reward as string;
    let dmg    = reward === 'double' ? 2 : 1;
    if (this.hasRelic('grammar_dmg') && q.type==='grammar') dmg++;
    if (this.hasRelic('twin_shot')   && reward==='bullet')  { reward='double'; dmg=2; }
    if (this.enemy?.type==='boss' && this.hasRelic('boss_breaker')) dmg+=2;

    // ── Pasivas de clase ──────────────────────────────────────────────────
    if (this.playerClass === 'grammatico') {
      if (q.type === 'grammar') dmg += 2;
      if (q.type === 'vocab')   dmg  = Math.max(0, dmg - 1);
    }

    // ── Status effects según tipo de pregunta ─────────────────────────────
    if (q.type === 'grammar') this.applyStatus('stunned', 2000);
    if (q.type === 'vocab')   this.applyStatus('burning', 3000);
    if (q.type === 'bonus')   this.applyStatus('slowed',  3500);

    // ── Culpa reduce daño ─────────────────────────────────────────────────
    dmg = Math.max(0, dmg - Math.floor(this.guilt / 2));

    // Limpiar culpa al llegar a combo 5
    if (this.combo >= 5 && this.guilt > 0) {
      this.guilt = 0;
      try { localStorage.setItem(GUILT_KEY,'0'); } catch { /* noop */ }
      this.showFloatingText(this.pX, this.pY-110, '⚰️ ¡CULPA PURIFICADA!', 0xffaa44);
      this.updateGuiltHud();
    }

    // ── Scroll +ATK bonus ─────────────────────────────────────────────────
    dmg += this.scrollAtk;

    // ── Weapon bonus (Dead Cells) ─────────────────────────────────────────
    if (this.currentWeapon && reward === 'bullet') {
      switch (this.currentWeapon) {
        case 'sword':  dmg += 2; break;
        case 'bow':
          // Bow ignores shielded behavior damage penalty
          if (this.enemy?.behavior === 'shielded') dmg = Math.max(dmg, 2);
          break;
        case 'hammer':
          this.applyStatus('stunned', 2000);
          break;
        case 'dagger':
          reward = 'double'; dmg = Math.max(dmg, 2);
          break;
      }
    }

    if (this.playerClass === 'lector' && this.enemy) {
      this.enemySlowLeft = 2500;
      this.showFloatingText(this.enemy.sprite.x, this.enemy.sprite.y-55, '📖 RALENTIZADO', 0x88aaff);
    }

    // ── Bonus de altura (responder desde plataforma = +1 DMG) ────────────────
    const onPlatform = GAME_PLATFORMS.some(p =>
      this.pX > p.x - p.w/2 && this.pX < p.x + p.w/2 && Math.abs(this.pY - p.y) < 8);
    if (onPlatform) {
      dmg += 1;
      this.showFloatingText(this.pX, this.pY - 85, '⬆️ ALTURA +1', 0x44ffcc);
    }

    // ── Pregunta élite: ×2 daño ───────────────────────────────────────────
    if (this.isEliteQuestion) {
      dmg *= 2;
      this.showFloatingText(this.enemy?.sprite.x ?? GW/2,
        (this.enemy?.sprite.y ?? 200)-70, '💎 ×2 DMG!', 0xffcc00);
    }

    // ── Shielded: escudo roto si respuesta rápida ─────────────────────────
    if (this.enemy?.behavior === 'shielded' && this.timerElapsed <= SHIELD_FAST_MS) {
      this.enemy.behaviorGlow?.destroy();
      this.enemy.behaviorGlow = null;
      this.showFloatingText(this.enemy.sprite.x, this.enemy.sprite.y-55, '🛡️ ESCUDO ROTO!', 0x4488ff);
    }

    if      (reward==='grenade') { this.fireGrenade(); }
    else if (reward==='shield')  { this.activateShield(); this.addScore(150+comboBonus); this.time.delayedCall(300,()=>this.afterShot()); }
    else { this.fireBullet(reward, dmg); this.addScore((reward==='double'?120:80)+comboBonus); }

    if (this.combo>=3) {
      this.comboText.setText(`🔥 COMBO ×${this.combo}`);
      this.tweens.add({ targets:this.comboText, scaleX:1.3, scaleY:1.3, duration:200, yoyo:true });
    } else { this.comboText.setText(''); }
  }

  private onWrongAnswer(): void {
    // Relic: escudo de racha
    if (this.hasRelic('combo_shield') && !this.comboShieldUsed && this.combo > 0) {
      this.comboShieldUsed = true;
      this.showFloatingText(this.pX, this.pY-85, '⚔️ RACHA PROTEGIDA', 0xffaa00);
    } else {
      this.combo = 0; this.comboText.setText('');
    }
    // Drenar alma
    const drain = this.hasRelic('soul_leech') ? 15 : SOUL_DRAIN;
    this.soul = Math.max(0, this.soul - drain);
    this.updateSoulBar();
    this.updateEnglishRank();

    this.playerHit();
    // Elite: doble castigo (segundo hit si sigue vivo)
    if (this.isEliteQuestion && this.state !== 'game_over') {
      this.time.delayedCall(150, () => {
        if (this.state !== 'game_over') {
          this.showFloatingText(this.pX, this.pY-80, '💎 ×2 DAÑO!', 0xff4400);
          this.playerHit();
        }
      });
    }
    if (this.state !== 'game_over' && this.enemy) {
      const pushDir = this.enemy.sprite.x > this.pX ? 1 : -1;
      this.enemy.sprite.x += pushDir * 90;
      this.state = 'idle';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⚡  ESPECIAL DE ALMA
  // ═══════════════════════════════════════════════════════════════════════════

  private triggerSoulAttack(): void {
    if (!this.enemy) {
      this.showFloatingText(this.pX,this.pY-80,'Sin enemigo','#888888' as unknown as number);
      return;
    }
    this.soul = 0; this.updateSoulBar();
    this.playBeep('special');

    const flash = this.add.rectangle(GW/2,GH/2,GW,GH,0xaaddff,0.5).setDepth(50);
    this.tweens.add({ targets:flash, alpha:0, duration:400, onComplete:()=>flash.destroy() });
    this.cameras.main.shake(200,0.02);

    for (let r = 0; r < 3; r++) {
      const ring = this.add.circle(this.pX,this.pY-40,10,0x4488ff,0.7).setDepth(13);
      this.tweens.add({
        targets:ring, radius:180+r*40, alpha:0,
        duration:450+r*80, delay:r*60, ease:'Power1',
        onComplete:()=>ring.destroy(),
      });
    }
    this.add.particles(this.pX,this.pY-40,'spark',{
      speed:{min:100,max:350}, angle:{min:0,max:360}, scale:{start:1.5,end:0},
      lifespan:{min:200,max:500}, quantity:30, tint:[0x4488ff,0x88aaff,0xaaddff],
    }).setDepth(13).explode(30);

    this.showFloatingText(this.enemy.sprite.x, this.enemy.sprite.y-80,'⚡ ESPECIAL!',0x4488ff);
    this.dealDamage(3);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 💥  PROYECTILES & EFECTOS
  // ═══════════════════════════════════════════════════════════════════════════

  private fireBullet(type: string, damage: number): void {
    if (!this.enemy) return;
    this.state = 'shooting';
    const tex = type==='double'?'dbullet':'bullet';
    const sx = this.pX+(this.pFacingRight?62:-62), sy = this.pY-54;
    const tx = this.enemy.sprite.x, ty = this.enemy.sprite.y-30;
    const ms = Math.max(120, Math.abs(tx-sx)*0.7);

    const bullet = this.add.image(sx,sy,tex).setDepth(7);
    const trail  = this.add.particles(sx,sy,'spark',{
      speed:{min:10,max:40}, angle:{min:160,max:200},
      scale:{start:0.8,end:0}, lifespan:110,
      tint:type==='double'?0x33ffcc:0xffee33, frequency:18,
    }).setDepth(6);

    this.tweens.add({
      targets:bullet, x:tx, y:ty, duration:ms, ease:'Linear',
      onUpdate:()=>trail.setPosition(bullet.x, bullet.y),
      onComplete:()=>{
        trail.stop(); this.time.delayedCall(150,()=>trail.destroy());
        bullet.destroy();
        this.spawnHitParticles(tx, ty, type==='double'?0x33ffcc:0xffee33);
        this.hitFreeze(65);
        this.playBeep('hit');
        this.dealDamage(damage);
      },
    });
  }

  private fireGrenade(): void {
    if (!this.enemy) return;
    this.state = 'shooting';
    const sx = this.pX+(this.pFacingRight?52:-52), sy = this.pY-38;
    const tx = this.enemy.sprite.x, ty = this.enemy.sprite.y;

    const gren = this.add.image(sx,sy,'grenade').setDepth(7);
    this.tweens.add({
      targets:gren, x:tx, y:ty-20, duration:350, ease:'Power1',
      onComplete:()=>{
        gren.destroy(); this.spawnExplosion(tx,ty);
        this.hitFreeze(100);
        this.playBeep('special');
        if (this.enemy) { this.enemy.hpCurrent=0; this.killEnemy(); }
      },
    });
    this.tweens.add({ targets:gren, angle:360, duration:300 });
  }

  private activateShield(): void {
    this.hasShield = true; this.shieldSprite.setAlpha(0.8);
    this.tweens.add({ targets:this.shieldSprite, alpha:{from:0.8,to:0.4}, duration:500, yoyo:true, repeat:-1 });
    this.showFloatingText(this.pX,this.pY-80,'🛡️ ESCUDO',0x00ccff);
    (this.children.getByName('shieldHud') as Phaser.GameObjects.Text|null)?.setText('🛡️ SHIELD ACTIVO');
  }

  private useGrenade(): void {
    if (this.grenades<=0||!this.enemy||this.state==='game_over') return;
    this.grenades--; this.grenadeIcon.setText(`💣 ${this.grenades}`);
    if (this.state==='questioning') { this.hideQuestion(); this.state='shooting'; }
    this.fireGrenade();
  }

  // ── Star Move (Streets of Rage) — E ──────────────────────────────────────
  private useStarMove(): void {
    if (this.state === 'game_over') return;
    if (this.starMoveCdLeft > 0)   return;
    if (this.grenades < 1)         return;    // necesita al menos 1 granada

    // Consume TODAS las granadas
    const used = this.grenades;
    this.grenades = 0;
    this.grenadeIcon.setText(`💣 0`);

    // Activa cooldown
    this.starMoveCdLeft = STAR_MOVE_CD_MS;

    // Si hay pregunta abierta, la cierra sin penalizar
    if (this.state === 'questioning') {
      this.hideQuestion();
      this.state = 'shooting';
    }

    // ── Visual: onda expansiva + flash de pantalla ──────────────────────
    this.hitFreeze(220);
    this.playBeep('special');

    // Flash blanco en toda la pantalla
    const flash = this.add.rectangle(GW/2, GH/2, GW, GH, 0xffffff, 0.85).setDepth(30);
    this.tweens.add({ targets:flash, alpha:0, duration:400, onComplete:()=>flash.destroy() });

    // Onda expansiva desde el jugador
    for (let r = 1; r <= 3; r++) {
      this.time.delayedCall(r * 60, () => {
        const ring = this.add.ellipse(this.pX, this.pY-38,
          r * 80, r * 40, 0xffee44, 0.55 - r*0.1).setDepth(25);
        this.tweens.add({
          targets: ring, scaleX:2.5, scaleY:2.5, alpha:0,
          duration: 450, ease:'Quad.easeOut',
          onComplete: () => ring.destroy(),
        });
      });
    }

    // Texto STAR MOVE
    const txt = this.add.text(GW/2, GH/2 - 40, `⭐ STAR MOVE ×${used}!`, {
      fontFamily:'monospace', fontSize:'28px', color:'#ffee44', fontStyle:'bold',
      stroke:'#884400', strokeThickness:4,
    }).setOrigin(0.5).setDepth(31).setAlpha(0);
    this.tweens.add({
      targets:txt, alpha:{from:0,to:1}, y:{from:GH/2-10, to:GH/2-60},
      duration:350, ease:'Back.easeOut',
      onComplete:()=>{
        this.tweens.add({ targets:txt, alpha:0, duration:500, delay:600,
          onComplete:()=>txt.destroy() });
      },
    });

    // ── Daño proporcional a granadas usadas ──────────────────────────────
    if (this.enemy) {
      const totalDmg = STAR_MOVE_DMG * used;

      // Partículas de estrellas alrededor del enemigo
      const ex = this.enemy.sprite.x, ey = this.enemy.sprite.y;
      for (let i = 0; i < 8; i++) {
        const star = this.add.text(
          ex + Phaser.Math.Between(-60,60),
          ey + Phaser.Math.Between(-60,20), '⭐', {fontSize:'16px'}
        ).setDepth(28);
        this.tweens.add({
          targets:star, y:star.y-80, alpha:0,
          duration:Phaser.Math.Between(500,900),
          delay:i*40, ease:'Quad.easeOut',
          onComplete:()=>star.destroy(),
        });
      }

      this.time.delayedCall(200, () => {
        if (!this.enemy) return;
        this.dealDamage(totalDmg);
        // Stun automático del Star Move
        this.applyStatus('stunned', 2500);
        this.showFloatingText(ex, ey-60, `⭐ -${totalDmg}`, 0xffee44);
        this.addScore(50 * used);
      });
    }
  }

  private dealDamage(amount: number): void {
    if (!this.enemy) return;
    let dmg = amount;
    if (this.enemy.type==='boss' && this.hasRelic('boss_breaker')) dmg+=2;

    this.enemy.hpCurrent = Math.max(0, this.enemy.hpCurrent - dmg);
    this.tweens.add({ targets:this.enemy.sprite, alpha:0.2, duration:80, yoyo:true, repeat:2 });
    this.hitFreeze(65);

    const pct = this.enemy.hpCurrent / this.enemy.hpMax;
    this.tweens.add({ targets:this.enemy.hpFill, width:Math.max(2,52*pct), duration:200 });
    this.enemy.hpFill.setFillStyle(pct>0.6?0x00ff44:pct>0.3?0xffaa00:0xff3300);

    // ── Fases del boss ────────────────────────────────────────────────────
    if (this.enemy.type === 'boss') {
      if (pct <= 0.25 && this.bossPhase < 2) {
        this.bossPhase = 2;
        this.enemy.sprite.setTint(0xff6600);
        this.cameras.main.shake(300,0.025);
        this.showFloatingText(this.enemy.sprite.x,this.enemy.sprite.y-80,'💢 BERSERKER!',0xff6600);
        this.playBeep('enrage');
        this.add.particles(this.enemy.sprite.x,this.enemy.sprite.y-60,'spark',{
          speed:{min:80,max:220},angle:{min:0,max:360},scale:{start:1.5,end:0},
          lifespan:{min:200,max:400},quantity:20,tint:[0xff2200,0xff6600,0xffaa00],
        }).setDepth(12).explode(20);
      } else if (pct <= 0.5 && this.bossPhase < 1) {
        this.bossPhase = 1;
        this.enemy.sprite.setTint(0xff2200);
        this.cameras.main.shake(200,0.018);
        this.showFloatingText(this.enemy.sprite.x,this.enemy.sprite.y-80,'💢 ENRABIADO!',0xff2200);
        this.playBeep('enrage');
        this.add.particles(this.enemy.sprite.x,this.enemy.sprite.y-60,'spark',{
          speed:{min:60,max:150},angle:{min:0,max:360},scale:{start:1,end:0},
          lifespan:{min:150,max:300},quantity:12,tint:[0xff4400,0xff8800],
        }).setDepth(12).explode(12);
      }
    }

    if (this.enemy.hpCurrent <= 0) this.killEnemy(); else this.afterShot();
  }

  private afterShot(): void {
    this.time.delayedCall(350,()=>{ if(this.state!=='game_over') this.state='idle'; });
  }

  private killEnemy(): void {
    if (!this.enemy) return;
    const { sprite, hpBg, hpFill, hpLabel, bob, type } = this.enemy;
    const ex = sprite.x, ey = sprite.y;

    bob.stop(); sprite.stop(); hpBg.destroy(); hpFill.destroy(); hpLabel.destroy();

    // Limpiar proyectiles pendientes del enemigo
    for (const p of this.projectiles) { p.visual.destroy(); p.trail.destroy(); }
    this.projectiles = [];
    this.projShootTimer = 0;

    const base = ENEMY_STATS[type].score;
    const mult = 1 + Math.floor(this.combo/3)*0.25;
    this.addScore(Math.floor(base*mult));

    // HP regen relic
    this.killCount++;
    if (this.hasRelic('hp_regen') && this.killCount%5===0 && this.hp < this.maxHp) {
      this.hp++; this.updateHearts();
      this.showFloatingText(this.pX,this.pY-80,'💧 +1 HP',0x44ddff);
    }

    // ── Kill streak (Streets of Rage) ─────────────────────────────────────
    this.killStreak++;
    this.killStreakTimer = 4500;  // resetea si no mata en 4.5s
    if (this.killStreak >= 3) {
      const streakMsgs = ['','','','🔥 TRIPLE KILL!','💥 QUADRA!','⭐ KILLING SPREE!','🌟 RAMPAGE!'];
      const msg = this.killStreak < streakMsgs.length
        ? streakMsgs[this.killStreak] : `☠️ ${this.killStreak}× STREAK!`;
      const col = this.killStreak >= 6 ? 0xff00ff : this.killStreak >= 5 ? 0xff8800 : 0xffee44;
      // Texto grande centrado
      const t = this.add.text(GW/2, GH/2 - 60, msg, {
        fontFamily:'monospace', fontSize:'22px', color:'#'+col.toString(16).padStart(6,'0'),
        fontStyle:'bold', stroke:'#000033', strokeThickness:4,
      }).setOrigin(0.5).setDepth(25).setScale(0.6);
      this.tweens.add({
        targets:t, scaleX:1, scaleY:1, alpha:{from:1,to:0},
        y: t.y - 50, duration:1200, ease:'Back.easeOut',
        onComplete:()=>t.destroy(),
      });
      // Bonus score por streak
      this.addScore(this.killStreak * 30);
    }

    // Word echo — muestra la palabra en inglés al matar
    if (this.currentQ?.type==='vocab') {
      this.showWordEcho(this.currentQ.opts[this.currentQ.ans], ex, ey);
    }

    // Vocabulista: +30 Alma al matar con vocab
    if (this.playerClass === 'vocabulista' && this.currentQ?.type === 'vocab') {
      this.soul = Math.min(SOUL_MAX, this.soul + 30);
      this.updateSoulBar();
      this.showFloatingText(ex, ey-55, '🏹 +30 ALMA', 0x44ffaa);
    }

    // Duplicador: insertar 2 zombies en la cola al morir (si no es ya un duplicado)
    if (this.enemy && !this.enemy.isDuplicate && this.enemy.behavior === 'duplicator') {
      const dupeType: EnemyType = 'zombie';
      this.enemyQueue.splice(this.enemyIdx, 0, dupeType, dupeType);
      this.showFloatingText(ex, ey-70, '👥 ¡SE DIVIDE!', 0x44ffcc);
    }

    // Destruir glow y status icon
    this.enemy?.behaviorGlow?.destroy();
    this.enemy?.statusIcon?.destroy();

    // ── Drop de Scroll (20% chance, no boss) ──────────────────────────────
    if (type !== 'boss' && Math.random() < 0.20) {
      const scroll = SCROLL_DROPS[Math.floor(Math.random()*SCROLL_DROPS.length)];
      this.applyScroll(scroll, ex, ey);
    }
    // ── Drop de Arma (12% chance, no boss, no scroll mismo frame) ─────────
    else if (type !== 'boss' && Math.random() < 0.12) {
      const wpn = WEAPON_DROPS[Math.floor(Math.random()*WEAPON_DROPS.length)];
      this.time.delayedCall(250, () => this.applyWeapon(wpn, ex, ey));
    }

    // Esencia por kill
    this.addRunEssence(type === 'boss' ? 10 : 2);

    this.hitFreeze(80);

    this.tweens.add({
      targets:sprite, y:GROUND_Y+10, alpha:0,
      angle:type==='boss'?90:30,
      scaleX:type==='boss'?0.5:0.3, scaleY:type==='boss'?0.5:0.3,
      duration:type==='boss'?600:350, ease:'Power2',
      onComplete:()=>sprite.destroy(),
    });

    this.spawnExplosion(ex,ey-20);
    this.showFloatingText(ex,ey-60,`+${Math.floor(base*mult)}`,C.YELLOW);
    this.cameras.main.shake(type==='boss'?400:120, type==='boss'?0.02:0.007);
    this.atkHint.setVisible(false);
    this.enemy = null; this.bossPhase = 0;

    this.time.delayedCall(type==='boss'?1200:600,()=>{
      if (this.state!=='game_over') this.spawnNextEnemy();
    });
  }

  private playerHit(): void {
    if (this.pIframeLeft > 0) return;   // i-frames del dodge roll

    if (this.hasShield) {
      this.hasShield=false; this.shieldSprite.setAlpha(0); this.tweens.killTweensOf(this.shieldSprite);
      this.showFloatingText(this.pX,this.pY-90,'🛡️ BLOQUEADO',0x00ccff);
      (this.children.getByName('shieldHud') as Phaser.GameObjects.Text|null)?.setText('');
      this.playBeep('hit');
      return;
    }
    this.hp--; this.updateHearts();
    this.cameras.main.shake(180,0.015);
    const flash = this.add.rectangle(GW/2,GH/2,GW,GH,0xff0000,0.35).setDepth(50);
    this.tweens.add({ targets:flash, alpha:0, duration:250, onComplete:()=>flash.destroy() });

    const knockDir = this.enemy ? (this.pX < this.enemy.sprite.x ? -1 : 1) : -1;
    this.pVelX = knockDir*260; this.pVelY = -200; this.pOnGround = false;

    this.pIsHurt = true;
    this.playerSprite.play('hero_hurt',true);
    this.playBeep('wrong');
    this.time.delayedCall(400,()=>{
      this.pIsHurt = false;
      if (this.state!=='game_over') this.playerSprite.play('hero_idle',true);
    });

    this.showFloatingText(this.pX,this.pY-80,'💔 -1 HP',C.WRONG);
    if (this.hp<=0) this.doGameOver();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎆  PARTÍCULAS & EFECTOS VISUALES
  // ═══════════════════════════════════════════════════════════════════════════

  private spawnHitParticles(x:number,y:number,color=0xffee33): void {
    const sparks = this.add.particles(x,y,'spark',{
      speed:{min:80,max:260}, angle:{min:0,max:360}, scale:{start:1.2,end:0},
      lifespan:{min:150,max:320}, quantity:14, tint:[color,0xffffff,0xffaa00], gravityY:180,
    }).setDepth(12);
    sparks.explode(14);
    this.time.delayedCall(400,()=>sparks.destroy());
    const imp = this.add.circle(x,y,14,color,0.9).setDepth(11);
    this.tweens.add({ targets:imp, radius:28, alpha:0, duration:180, ease:'Power2', onComplete:()=>imp.destroy() });
  }

  private spawnExplosion(x:number,y:number): void {
    const exp = this.add.image(x,y,'explosion').setDepth(10).setScale(0.3);
    this.tweens.add({ targets:exp, scale:3.0, alpha:0, duration:450, ease:'Power2', onComplete:()=>exp.destroy() });
    const fire = this.add.particles(x,y,'ptfire',{
      speed:{min:60,max:280},angle:{min:0,max:360},scale:{start:2,end:0},
      lifespan:{min:250,max:550},quantity:32,tint:[0xff2200,0xff6600,0xffaa00,0xffff00],gravityY:120,
    }).setDepth(11);
    fire.explode(32);
    const smoke = this.add.particles(x,y,'ptsmoke',{
      speed:{min:20,max:80},angle:{min:230,max:310},scale:{start:1.5,end:0},
      lifespan:{min:400,max:800},quantity:10,tint:[0x555555,0x888888,0xaaaaaa],gravityY:-30,
    }).setDepth(12);
    smoke.explode(10);
    for (let i=0;i<3;i++) {
      const ring = this.add.circle(x,y,8,0xff6600,0.7).setDepth(9);
      this.tweens.add({ targets:ring, radius:30+i*22, alpha:0, duration:280+i*90, delay:i*60, ease:'Power1', onComplete:()=>ring.destroy() });
    }
    this.time.delayedCall(700,()=>{ fire.destroy(); smoke.destroy(); });
  }

  private showFloatingText(x:number,y:number,msg:string,color:number): void {
    const t = this.add.text(x,y,msg,{
      fontFamily:'monospace', fontSize:'16px', color:'#'+color.toString(16).padStart(6,'0'),
      fontStyle:'bold', stroke:'#000000', strokeThickness:3,
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets:t, y:y-50, alpha:0, duration:900, ease:'Power2', onComplete:()=>t.destroy() });
  }

  // Word echo — la palabra en inglés flota al matar con vocab
  private showWordEcho(word:string, x:number, y:number): void {
    const w = word.length*13+28;
    const bg = this.add.rectangle(x,y-40,w,36,0x000000,0.76).setDepth(14);
    bg.setStrokeStyle(2,0x00eeff,0.9);
    const t = this.add.text(x,y-40,word.toUpperCase(),{
      fontFamily:'monospace', fontSize:'18px', color:'#00eeff',
      fontStyle:'bold', stroke:'#003344', strokeThickness:2,
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({
      targets:[t,bg], y:y-100, alpha:0, duration:1600, ease:'Power2',
      onComplete:()=>{ t.destroy(); bg.destroy(); },
    });
  }

  // Hit-freeze: pausa los tweens por `ms` milisegundos reales
  private hitFreeze(ms=65): void {
    this.tweens.timeScale = 0.02;
    window.setTimeout(()=>{ if(this.tweens) this.tweens.timeScale=1; }, ms);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔊  AUDIO PROCEDURAL (Web Audio API)
  // ═══════════════════════════════════════════════════════════════════════════

  private getAudioCtx(): AudioContext|null {
    if (!this.audioCtx) {
      try {
        const Ctor = window.AudioContext
          ?? (window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;
        this.audioCtx = new Ctor();
      } catch { return null; }
    }
    if (this.audioCtx.state==='suspended') { void this.audioCtx.resume(); }
    return this.audioCtx;
  }

  private playBeep(type:string): void {
    const ctx = this.getAudioCtx();
    if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    const t = ctx.currentTime;

    switch(type) {
      case 'correct':
        osc.type='sine';
        osc.frequency.setValueAtTime(440,t);
        osc.frequency.setValueAtTime(660,t+0.08);
        osc.frequency.setValueAtTime(880,t+0.16);
        gain.gain.setValueAtTime(0.14,t);
        gain.gain.exponentialRampToValueAtTime(0.001,t+0.35);
        osc.start(t); osc.stop(t+0.35);
        break;
      case 'wrong':
        osc.type='sawtooth';
        osc.frequency.setValueAtTime(220,t);
        osc.frequency.exponentialRampToValueAtTime(55,t+0.25);
        gain.gain.setValueAtTime(0.18,t);
        gain.gain.exponentialRampToValueAtTime(0.001,t+0.3);
        osc.start(t); osc.stop(t+0.3);
        break;
      case 'hit':
        osc.type='square';
        osc.frequency.setValueAtTime(160,t);
        osc.frequency.exponentialRampToValueAtTime(40,t+0.12);
        gain.gain.setValueAtTime(0.22,t);
        gain.gain.exponentialRampToValueAtTime(0.001,t+0.15);
        osc.start(t); osc.stop(t+0.15);
        break;
      case 'special':
        osc.type='sine';
        osc.frequency.setValueAtTime(220,t);
        osc.frequency.exponentialRampToValueAtTime(880,t+0.3);
        osc.frequency.exponentialRampToValueAtTime(1320,t+0.5);
        gain.gain.setValueAtTime(0.16,t);
        gain.gain.exponentialRampToValueAtTime(0.001,t+0.6);
        osc.start(t); osc.stop(t+0.6);
        break;
      case 'dash':
        osc.type='sine';
        osc.frequency.setValueAtTime(600,t);
        osc.frequency.exponentialRampToValueAtTime(200,t+0.1);
        gain.gain.setValueAtTime(0.09,t);
        gain.gain.exponentialRampToValueAtTime(0.001,t+0.12);
        osc.start(t); osc.stop(t+0.12);
        break;
      case 'dodge':
        osc.type='sine';
        osc.frequency.setValueAtTime(800,t);
        osc.frequency.exponentialRampToValueAtTime(300,t+0.09);
        gain.gain.setValueAtTime(0.07,t);
        gain.gain.exponentialRampToValueAtTime(0.001,t+0.1);
        osc.start(t); osc.stop(t+0.1);
        break;
      case 'enrage':
        osc.type='sawtooth';
        osc.frequency.setValueAtTime(80,t);
        osc.frequency.exponentialRampToValueAtTime(160,t+0.2);
        osc.frequency.exponentialRampToValueAtTime(80,t+0.4);
        gain.gain.setValueAtTime(0.28,t);
        gain.gain.exponentialRampToValueAtTime(0.001,t+0.5);
        osc.start(t); osc.stop(t+0.5);
        break;
      case 'relic':
        osc.type='sine';
        osc.frequency.setValueAtTime(660,t);
        osc.frequency.setValueAtTime(880,t+0.1);
        osc.frequency.setValueAtTime(1100,t+0.2);
        osc.frequency.setValueAtTime(1320,t+0.3);
        gain.gain.setValueAtTime(0.12,t);
        gain.gain.exponentialRampToValueAtTime(0.001,t+0.45);
        osc.start(t); osc.stop(t+0.45);
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📊  HUD — actualizaciones
  // ═══════════════════════════════════════════════════════════════════════════

  private updateHearts(): void {
    this.hearts.forEach((h,i)=>{
      h.setVisible(i < this.maxHp);
      h.setTexture(i < this.hp ? 'heart' : 'heart_empty');
    });
  }

  private addScore(pts:number): void {
    this.score += pts;
    this.scoreText.setText(`SCORE: ${this.score.toLocaleString()}`);
    try {
      const hi = parseInt(localStorage.getItem('icfes_shooter_hi')||'0',10);
      if (this.score>hi) localStorage.setItem('icfes_shooter_hi',String(this.score));
    } catch { /* noop */ }
  }

  private applyStatus(status: EnemyStatus, durationMs: number): void {
    if (!this.enemy) return;
    this.enemy.status     = status;
    this.enemy.statusLeft = durationMs;
    const tints: Record<EnemyStatus,number> = {
      none:0xffffff, stunned:0x4488ff, burning:0xff4400, slowed:0x44ffcc,
    };
    const icons: Record<EnemyStatus,string> = {
      none:'', stunned:'❄️ STUN', burning:'🔥 BURN', slowed:'🐌 SLOW',
    };
    this.enemy.sprite.setTint(tints[status]);
    this.enemy.statusIcon?.destroy();
    if (status !== 'none') {
      this.enemy.statusIcon = this.add.text(
        this.enemy.sprite.x, this.enemy.sprite.y - this.enemy.spriteH - 30,
        icons[status],
        { fontFamily:'monospace', fontSize:'11px', color:'#ffffff',
          backgroundColor:'#00000088', padding:{x:4,y:2} }
      ).setOrigin(0.5).setDepth(14);
    }
    if (status === 'burning') this.enemy.burnTicks = 3;
  }

  private updateGuiltHud(): void {
    const skulls = '☠️'.repeat(this.guilt);
    this.guiltHud?.setText(this.guilt > 0 ? `${skulls} CULPA` : '');
  }

  private updateSoulBar(): void {
    const threshold = this.hasRelic('soul_boost') ? 70 : SOUL_MAX;
    const pct = Math.min(this.soul/SOUL_MAX, 1);
    this.soulBarFill.width = Math.max(1, (GW-8)*pct);
    if (this.soul >= threshold) {
      this.soulBarFill.setFillStyle(0xaaddff);
      this.soulLabel.setText('⚡ ALMA  [Q] ¡LISTO!').setColor('#aaddff').setAlpha(1);
    } else {
      this.soulBarFill.setFillStyle(0x4488ff);
      this.soulLabel.setText(`⚡ ALMA  [Q]   ${Math.floor(this.soul)}%`).setColor('#4488ff').setAlpha(0.7);
    }
  }

  private updateEnglishRank(): void {
    if (this.totalAns===0) return;
    const pct = (this.correctAns/this.totalAns)*100;
    const rank = ENGLISH_RANKS.find(r=>pct>=r.min) ?? ENGLISH_RANKS[ENGLISH_RANKS.length-1];
    this.rankBadge.setText(`🎓 ${rank.label}`).setColor(rank.color);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🛡️  RELIQUIAS
  // ═══════════════════════════════════════════════════════════════════════════

  private hasRelic(id:string): boolean { return this.activeRelics.includes(id); }

  private showRelicPicker(onDone:()=>void, count=3): void {
    // relic_plus meta upgrade: +1 reliquia siempre
    if ((this.metaUpgLevels['relic_plus']??0) >= 1) count = Math.min(count + 1, 6);
    this.state = 'relic_pick';

    const available = RELICS.filter(r=>!this.activeRelics.includes(r.id));
    const pool = (Phaser.Utils.Array.Shuffle([...available]) as RelicConfig[]).slice(0,count);
    while (pool.length < count) pool.push(RELICS[Math.floor(Math.random()*RELICS.length)]);

    const totalNotches = BASE_NOTCHES + ((this.metaUpgLevels['relic_plus']??0) >= 1 ? 2 : 0);
    const overlay = this.add.rectangle(GW/2,GH/2,GW,GH,0x000000,0.84).setDepth(40);
    const cont    = this.add.container(0,0).setDepth(41);

    const titleTxt = this.add.text(GW/2,74,count>3?'✨ ELIGE UNA RELIQUIA  🔴 ×5':'✨ ELIGE UNA RELIQUIA',{
      fontFamily:'monospace', fontSize:'22px', color:'#ffdd55', fontStyle:'bold',
    }).setOrigin(0.5);
    const subTxt = this.add.text(GW/2,100,'Completaste la ola — escoge tu recompensa.',{
      fontFamily:'monospace', fontSize:'11px', color:'#88aacc',
    }).setOrigin(0.5);
    // Notch budget display
    const notchSlots = Array.from({length:totalNotches}, (_,i) => i < this.notchesUsed ? '■' : '□').join('');
    const notchInfoTxt = this.add.text(GW/2, 118,
      `Ranuras: ${notchSlots}  ${this.notchesUsed}/${totalNotches}`, {
      fontFamily:'monospace', fontSize:'11px',
      color: this.notchesUsed >= totalNotches ? '#ff4444' : '#aaddff',
    }).setOrigin(0.5);
    cont.add([titleTxt, subTxt, notchInfoTxt]);

    const CW = count > 3 ? 148 : 208;
    const CH = 185;
    const spacing = count > 3 ? 157 : 252;
    const startX  = GW/2 - spacing * (count-1) / 2;
    const cardXs  = Array.from({length:count}, (_,i) => startX + i * spacing);

    pool.forEach((relic,i)=>{
      const cx=cardXs[i], cy=GH/2+18;
      const canAfford = (this.notchesUsed + relic.notchCost) <= totalNotches
                     && !this.activeRelics.includes(relic.id);
      const locked    = !canAfford;

      const card = this.add.rectangle(cx,cy,CW,CH, locked ? 0x080808 : 0x020c1a, locked ? 0.5 : 0.96);
      if (!locked) card.setInteractive({useHandCursor:true});
      card.setStrokeStyle(2, locked ? 0x222222 : 0x334466, locked ? 0.4 : 0.8);

      const iconTxt = this.add.text(cx,cy-62,relic.icon,{fontFamily:'monospace',fontSize:'38px'})
        .setOrigin(0.5).setAlpha(locked ? 0.3 : 1);
      const nameTxt = this.add.text(cx,cy-14,relic.name,{
        fontFamily:'monospace',fontSize:'13px',color: locked ? '#555566' : '#eeddaa',fontStyle:'bold',
        wordWrap:{width:CW-18},align:'center',
      }).setOrigin(0.5);
      const descTxt = this.add.text(cx,cy+26,relic.desc,{
        fontFamily:'monospace',fontSize:'11px',color: locked ? '#333344' : '#88aacc',
        wordWrap:{width:CW-18},align:'center',
      }).setOrigin(0.5);
      // Notch cost badge
      const costStr = this.activeRelics.includes(relic.id) ? '✓ ya equipada'
                    : `■×${relic.notchCost} ranura${relic.notchCost>1?'s':''}`;
      const costTxt = this.add.text(cx, cy+72, costStr, {
        fontFamily:'monospace', fontSize:'10px',
        color: this.activeRelics.includes(relic.id) ? '#55ff88' : locked ? '#ff4444' : '#aaddff',
      }).setOrigin(0.5);

      // Lock icon overlay
      if (locked && !this.activeRelics.includes(relic.id)) {
        const lockIcon = this.add.text(cx, cy-30, '🔒', {fontSize:'22px'}).setOrigin(0.5).setAlpha(0.5);
        cont.add(lockIcon);
      }

      if (!locked) {
        card.on('pointerover',()=>{
          card.setFillStyle(0x0a2040,0.98); card.setStrokeStyle(2.5,0xffdd55,1);
          this.tweens.add({ targets:[iconTxt,nameTxt,descTxt], scaleX:1.06, scaleY:1.06, duration:100 });
        });
        card.on('pointerout',()=>{
          card.setFillStyle(0x020c1a,0.96); card.setStrokeStyle(2,0x334466,0.8);
          this.tweens.add({ targets:[iconTxt,nameTxt,descTxt], scaleX:1, scaleY:1, duration:100 });
        });
        card.on('pointerdown',()=>{
          this.applyRelic(relic);
          this.playBeep('relic');
          this.tweens.add({ targets:card, scaleX:1.08, scaleY:1.08, duration:120, yoyo:true });
          this.time.delayedCall(380,()=>{
            this.tweens.add({ targets:[overlay,cont], alpha:0, duration:280, ease:'Power2',
              onComplete:()=>{ overlay.destroy(); cont.destroy(); onDone(); } });
          });
        });
      }

      cont.add([card, iconTxt, nameTxt, descTxt, costTxt]);
    });

    cont.setAlpha(0).setY(28);
    this.tweens.add({ targets:cont, alpha:1, y:0, duration:380, ease:'Back.easeOut' });
  }

  private applyRelic(relic:RelicConfig): void {
    if (this.activeRelics.includes(relic.id)) return;
    this.activeRelics.push(relic.id);
    this.notchesUsed += relic.notchCost;
    if (relic.id==='stone_heart') {
      this.maxHp++; this.hp = Math.min(this.hp+1, this.maxHp);
      this.updateHearts();
    }
    this.relicHud.setText(this.activeRelics.map(id=>RELICS.find(r=>r.id===id)?.icon??'').join(' '));
    this.updateNotchHud();
    this.showFloatingText(GW/2,GH/2-20,`✨ ${relic.name}!`,0xffdd55);
  }

  private updateNotchHud(): void {
    const total = BASE_NOTCHES + ((this.metaUpgLevels['relic_plus']??0) >= 1 ? 2 : 0);
    const used  = this.notchesUsed;
    const filled = '⬡'.repeat(used).substring(0, total);
    const empty  = '⬡'.repeat(Math.max(0, total - used));
    const display = (used > 0 ? `[color=#ff8888]${filled}[/color]` : '') + empty;
    // Texto simple: ■ para usados, □ para libres
    const slots = Array.from({length:total}, (_,i) => i < used ? '■' : '□').join('');
    this.notchHud.setText(`Ranuras ${slots}  ${used}/${total}`);
    this.notchHud.setColor(used >= total ? '#ff4444' : '#6699cc');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🌊  OLEADAS
  // ═══════════════════════════════════════════════════════════════════════════

  private waveComplete(): void {
    this.state = 'wave_clear';
    const bonus = this.grenades*200;
    if (bonus>0) this.addScore(bonus);
    this.addRunEssence(5); // esencia por oleada completada

    const isLastBoss = this.wave >= WAVES.length-1;
    const msg = isLastBoss ? '🏆 ¡GANASTE!' : `✅ WAVE ${this.wave+1} CLEAR`;
    this.showBanner(msg, ()=>{
      if (isLastBoss) {
        this.doVictory();
      } else {
        this.showPathSelector((path) => {
          if (path === 'safe') {
            // Sala segura: recuperar HP + Alma, sin relic
            this.hp = Math.min(this.hp + 1, this.maxHp);
            this.soul = Math.min(SOUL_MAX, this.soul + 25);
            this.updateHearts(); this.updateSoulBar();
            this.showFloatingText(GW/2, GH/2-10, '🟢 +1 HP · +25 ALMA', 0x44ff88);
            this.time.delayedCall(900, ()=>{
              this.wave++;
              this.transitionBiome();
              this.time.delayedCall(700,()=>this.startWave());
            });
          } else {
            const relicCount = path === 'dangerous' ? 5 : 3;
            this.showRelicPicker(()=>{
              // Checkpoint cada 3 oleadas completadas (Hollow Knight bench)
              const nextWave = this.wave + 1;
              if (nextWave % 3 === 0) {
                this.showCheckpoint(() => {
                  this.wave++;
                  this.transitionBiome();
                  this.time.delayedCall(700, () => this.startWave());
                });
              } else {
                this.wave++;
                this.transitionBiome();
                this.time.delayedCall(700, () => this.startWave());
              }
            }, relicCount);
          }
        });
      }
    }, isLastBoss ? 2500 : 1500);
  }

  // ── Checkpoint (Hollow Knight bench) — cada 3 oleadas ──────────────────────
  private showCheckpoint(onDone: () => void): void {
    // Guardar mejor oleada
    const reachedWave = this.wave + 1;
    try {
      const best = parseInt(localStorage.getItem(CHECKPOINT_KEY)||'0',10);
      if (reachedWave > best) localStorage.setItem(CHECKPOINT_KEY, String(reachedWave));
    } catch { /* noop */ }

    // Curar al jugador
    if (this.hp < this.maxHp) {
      this.hp = Math.min(this.hp + 1, this.maxHp);
      this.updateHearts();
    }
    this.soul = Math.min(SOUL_MAX + this.scrollSoulMax, this.soul + 30);
    this.updateSoulBar();

    // Overlay de checkpoint
    const overlay = this.add.rectangle(GW/2, GH/2, GW, GH, 0x000000, 0.82).setDepth(50);
    const cont = this.add.container(0,0).setDepth(51);

    const panel = this.add.rectangle(GW/2, GH/2, 400, 220, 0x04041a, 0.97);
    panel.setStrokeStyle(2, 0x4488ff);
    cont.add(panel);

    // Fogón (unicode + animación)
    const fire = this.add.text(GW/2, GH/2-75, '🔥', {fontSize:'36px'}).setOrigin(0.5);
    cont.add(fire);
    this.tweens.add({ targets:fire, scaleX:1.15, scaleY:1.15, duration:400, yoyo:true, repeat:-1 });

    const title = this.add.text(GW/2, GH/2-35, '✦ PUNTO DE CONTROL ✦', {
      fontFamily:'monospace', fontSize:'18px', color:'#4488ff', fontStyle:'bold',
    }).setOrigin(0.5);
    cont.add(title);

    const sub = this.add.text(GW/2, GH/2-8, `Oleada ${reachedWave} alcanzada — progreso guardado`, {
      fontFamily:'monospace', fontSize:'11px', color:'#8899cc',
    }).setOrigin(0.5);
    cont.add(sub);

    const stats = this.add.text(GW/2, GH/2+20,
      `❤️ ${this.hp}/${this.maxHp}  ·  🔷 ${this.soul} Alma  ·  ✨ ${this.totalEssence+this.runEssence} Esencia`, {
      fontFamily:'monospace', fontSize:'12px', color:'#aaddff',
    }).setOrigin(0.5);
    cont.add(stats);

    // Heal feedback
    const healTxt = this.add.text(GW/2, GH/2+42, '💧 +1 HP  +30 Alma restaurados', {
      fontFamily:'monospace', fontSize:'11px', color:'#44ffaa',
    }).setOrigin(0.5);
    cont.add(healTxt);

    const hint = this.add.text(GW/2, GH/2+72, 'ESPACIO · ENTER  para continuar', {
      fontFamily:'monospace', fontSize:'10px', color:'#555577',
    }).setOrigin(0.5);
    cont.add(hint);

    // Pulso del hint
    this.tweens.add({ targets:hint, alpha:{from:1,to:0.3}, duration:700, yoyo:true, repeat:-1 });

    cont.setAlpha(0);
    this.tweens.add({ targets:cont, alpha:1, duration:400, ease:'Quad.easeOut' });

    const close = () => {
      this.tweens.add({
        targets:[overlay,cont], alpha:0, duration:350,
        onComplete:()=>{ overlay.destroy(); cont.destroy(); onDone(); },
      });
    };

    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    spaceKey?.once('down', close);
    enterKey?.once('down', close);
    // Auto-continúa después de 5s
    this.time.delayedCall(5000, () => {
      spaceKey?.off('down', close);
      enterKey?.off('down', close);
      if (overlay.active) close();
    });
  }

  private showBanner(text:string,onDone:()=>void,duration=1200): void {
    const txt = this.waveBanner.getByName('bannerTxt') as Phaser.GameObjects.Text;
    txt.setText(text);
    this.waveBanner.setAlpha(0).setScale(0.8);
    this.tweens.add({
      targets:this.waveBanner, alpha:1, scaleX:1, scaleY:1, duration:300, ease:'Back.easeOut',
      onComplete:()=>{
        this.time.delayedCall(duration,()=>{
          this.tweens.add({ targets:this.waveBanner, alpha:0, scaleX:1.1, scaleY:1.1, duration:300, onComplete:onDone });
        });
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🌍  TRANSICIÓN DE BIOMA
  // ═══════════════════════════════════════════════════════════════════════════

  private transitionBiome(): void {
    this.biomeIdx = (this.biomeIdx+1) % BIOMES.length;
    const b = BIOMES[this.biomeIdx];

    const flash = this.add.rectangle(GW/2,GH/2,GW,GH,0xffffff,0.85).setDepth(50);
    this.tweens.add({ targets:flash, alpha:0, duration:700, ease:'Power2', onComplete:()=>flash.destroy() });

    this.time.delayedCall(120,()=>{
      this.bgImg.setTint(b.bgTint); this.mtImg.setTint(b.bgTint);
      this.skyBandRef.setFillStyle(b.sky,0.22);
      this.horizGlowRef.setFillStyle(b.sky,0.17);
      this.fogRects.forEach((r,i)=>r.setFillStyle(b.fog,this.fogAlphas[i]));
      this.poolElls.forEach(e=>e.setFillStyle(b.ground,0.11));
      this.gndG1.setFillStyle(b.ground,0.52);
      this.gndG2.setFillStyle(b.ground,0.14);
      this.gndG3.setFillStyle(b.ground,0.05);

      this.ambientEmitter.destroy();
      this.ambientEmitter = this.add.particles(0,0,'spark',{
        x:{min:30,max:GW-30}, y:{min:95,max:GROUND_Y-30},
        speedY:{min:-15,max:-55}, speedX:{min:-12,max:12},
        scale:{start:0.28,end:0}, alpha:{start:0.65,end:0},
        lifespan:{min:3000,max:5500}, tint:b.pts,
        frequency:350, gravityY:-6,
      }).setDepth(2.5);

      this.showBiomeLabel(b);
    });
  }

  private showBiomeLabel(b:BiomeConfig): void {
    const colorHex = '#'+b.ground.toString(16).padStart(6,'0');
    const cont = this.add.container(GW/2,GH/2-28).setDepth(45).setAlpha(0).setScale(0.85);

    const bg = this.add.rectangle(0,0,380,76,0x000000,0.84);
    bg.setStrokeStyle(3,b.ground,1);
    const iconTxt = this.add.text(-128,0,b.icon,{fontFamily:'monospace',fontSize:'32px'}).setOrigin(0.5);
    const nameTxt = this.add.text(30,-13,b.name,{
      fontFamily:'monospace',fontSize:'22px',color:colorHex,fontStyle:'bold',
    }).setOrigin(0.5);
    const worldTxt= this.add.text(30,15,`MUNDO ${this.biomeIdx+1}  /  ${BIOMES.length}`,{
      fontFamily:'monospace',fontSize:'12px',color:'#99bbdd',
    }).setOrigin(0.5);
    cont.add([bg,iconTxt,nameTxt,worldTxt]);

    this.tweens.add({
      targets:cont, alpha:1, scaleX:1, scaleY:1, duration:420, ease:'Back.easeOut',
      onComplete:()=>{
        this.time.delayedCall(1700,()=>{
          this.tweens.add({ targets:cont, alpha:0, y:GH/2-70, duration:380, ease:'Power2',
            onComplete:()=>cont.destroy() });
        });
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏁  FIN DE JUEGO
  // ═══════════════════════════════════════════════════════════════════════════

  private doGameOver(): void {
    this.state='game_over'; this.timerEvent?.remove(); this.enemy?.bob.stop();
    this.saveEssence();
    // Culpa: acumular al morir (máx 3)
    const newGuilt = Math.min(3, this.guilt + 1);
    try { localStorage.setItem(GUILT_KEY, String(newGuilt)); } catch { /* noop */ }
    this.scene.stop('CRT');
    this.cameras.main.shake(500,0.03);
    this.time.delayedCall(600,()=>{
      this.cameras.main.fadeOut(600,0,0,0);
      this.time.delayedCall(700,()=>
        this.scene.start('GameOver',{score:this.score,wave:this.wave+1,win:false,essence:this.runEssence}));
    });
  }

  private doVictory(): void {
    this.state='game_over';
    this.addRunEssence(25);
    this.saveEssence();
    // Victoria limpia culpa acumulada
    try { localStorage.setItem(GUILT_KEY,'0'); } catch { /* noop */ }
    this.scene.stop('CRT');
    this.cameras.main.fadeOut(800,255,255,200);
    this.time.delayedCall(900,()=>
      this.scene.start('GameOver',{score:this.score,wave:WAVES.length,win:true,essence:this.runEssence}));
  }

  private applyScroll(scroll: ScrollDrop, x: number, y: number): void {
    switch(scroll.id) {
      case 'atk':   this.scrollAtk++;
        this.showFloatingText(x, y-50, `${scroll.icon} ${scroll.name}!`, 0xff8844); break;
      case 'hp':
        this.maxHp++; this.hp = Math.min(this.hp+1, this.maxHp);
        this.updateHearts();
        this.showFloatingText(x, y-50, `${scroll.icon} ${scroll.name}!`, 0xff88aa); break;
      case 'soul':
        this.scrollSoulMax += 20;
        this.showFloatingText(x, y-50, `${scroll.icon} ${scroll.name}!`, 0x4488ff); break;
      case 'speed':
        this.scrollSpeedMult = Math.min(this.scrollSpeedMult + 0.25, 1.75);
        this.showFloatingText(x, y-50, `${scroll.icon} ${scroll.name}!`, 0x44ffcc); break;
    }
    this.playBeep('relic');
    // Icono flotante en posición del scroll
    const icon = this.add.text(x, y-20, scroll.icon, {fontFamily:'monospace',fontSize:'28px'})
      .setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets:icon, y:y-80, alpha:0, duration:1200, ease:'Power2',
      onComplete:()=>icon.destroy() });
  }

  private applyWeapon(wpn: WeaponDrop, x: number, y: number): void {
    this.currentWeapon = wpn.id;
    this.weaponHud.setText(`${wpn.icon} ${wpn.name}`).setColor(wpn.color);
    this.playBeep('relic');
    this.showFloatingText(x, y-50, `${wpn.icon} ¡${wpn.name}!`, parseInt(wpn.color.replace('#',''), 16));

    // Tarjeta pickup
    const card = this.add.rectangle(x, y-35, 160, 44, 0x080820, 0.92).setDepth(22);
    card.setStrokeStyle(2, parseInt(wpn.color.replace('#',''), 16));
    const cardTxt = this.add.text(x, y-35, `${wpn.icon} ${wpn.name}\n${wpn.desc}`, {
      fontFamily:'monospace', fontSize:'9px', color:wpn.color, align:'center',
    }).setOrigin(0.5).setDepth(23);
    this.tweens.add({
      targets:[card,cardTxt], y:`-=50`, alpha:{from:1,to:0},
      duration:1400, delay:600, ease:'Power2',
      onComplete:()=>{ card.destroy(); cardTxt.destroy(); },
    });
  }

  private addRunEssence(amount: number): void {
    this.runEssence += Math.floor(amount * this.essMultiplier);
    this.essenceHud.setText(`✨ ${this.totalEssence + this.runEssence}`);
  }

  private saveEssence(): void {
    try {
      const saved = parseInt(localStorage.getItem(ESSENCE_KEY)||'0',10);
      localStorage.setItem(ESSENCE_KEY, String(saved + this.runEssence));
    } catch { /* noop */ }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🛒  META-PROGRESIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  private applyMetaUpgrades(): void {
    const lvl = (id:string) => this.metaUpgLevels[id] ?? 0;
    this.hp      = Math.min(PLAYER_MAX_HP + lvl('hp_up'), PLAYER_MAX_HP + 3);
    this.maxHp   = this.hp;
    this.grenades= PLAYER_GRENADES + lvl('grenade_up');
    if (lvl('soul_start') >= 1)  this.soul  = 30;
    if (lvl('combo_start') >= 1) this.combo = 3;
    this.essMultiplier = lvl('ess_boost') >= 1 ? 1.5 : 1.0;
  }

  private showMetaShop(onDone: ()=>void): void {
    // Si no hay esencia ni upgrades comprados, saltar directo
    if (this.totalEssence === 0 && Object.keys(this.metaUpgLevels).length === 0) {
      onDone(); return;
    }

    this.state = 'class_select'; // reutilizamos para congelar movimiento
    const overlay = this.add.rectangle(GW/2,GH/2,GW,GH,0x000000,0.94).setDepth(40);
    const cont    = this.add.container(0,0).setDepth(41);

    const title = this.add.text(GW/2, 38, '🏪  TIENDA PERMANENTE', {
      fontFamily:'monospace', fontSize:'22px', color:'#ffdd55', fontStyle:'bold',
    }).setOrigin(0.5);
    const essTxt = this.add.text(GW/2, 64, `✨ Esencia disponible: ${this.totalEssence}`, {
      fontFamily:'monospace', fontSize:'13px', color:'#aaddff',
    }).setOrigin(0.5).setName('essTxt');
    const hint = this.add.text(GW/2, 82, 'Las mejoras son PERMANENTES entre runs.', {
      fontFamily:'monospace', fontSize:'10px', color:'#556677',
    }).setOrigin(0.5);
    cont.add([title, essTxt, hint]);

    const CW=140, CH=160, cols=6, spacing=148;
    const startX = GW/2 - spacing*(cols-1)/2;

    const refreshCards = () => {
      essTxt.setText(`✨ Esencia disponible: ${this.totalEssence}`);
    };

    META_UPGRADES.forEach((upg, i) => {
      const cx = startX + i*spacing, cy = GH/2 + 20;
      const curLvl  = this.metaUpgLevels[upg.id] ?? 0;
      const maxed   = curLvl >= upg.maxLevel;
      const canBuy  = !maxed && this.totalEssence >= upg.cost;
      const borderC = maxed ? 0xffdd55 : canBuy ? 0x44ff88 : 0x334466;

      const card = this.add.rectangle(cx, cy, CW, CH, 0x020c1a, 0.96)
        .setInteractive({useHandCursor: canBuy});
      card.setStrokeStyle(2, borderC, maxed ? 1.0 : 0.7);
      card.setName(`card_${upg.id}`);

      const iconT  = this.add.text(cx, cy-58, upg.icon,  {fontFamily:'monospace',fontSize:'28px'}).setOrigin(0.5);
      const nameT  = this.add.text(cx, cy-24, upg.name,  {fontFamily:'monospace',fontSize:'11px',color:maxed?'#ffdd55':'#eeddaa',fontStyle:'bold',wordWrap:{width:CW-12},align:'center'}).setOrigin(0.5);
      const descT  = this.add.text(cx, cy+8,  upg.desc,  {fontFamily:'monospace',fontSize:'9px', color:'#88aacc',wordWrap:{width:CW-12},align:'center'}).setOrigin(0.5);
      const lvlT   = this.add.text(cx, cy+42, maxed ? '✅ MAX' : `Nv ${curLvl}/${upg.maxLevel}`, {fontFamily:'monospace',fontSize:'10px',color:maxed?'#ffdd55':'#556677'}).setOrigin(0.5);
      const costT  = this.add.text(cx, cy+60, maxed ? '' : `✨ ${upg.cost}`, {fontFamily:'monospace',fontSize:'11px',color:canBuy?'#aaddff':'#334466',fontStyle:'bold'}).setOrigin(0.5);

      if (canBuy) {
        card.on('pointerover', ()=>{ card.setFillStyle(0x0a2040,0.98); card.setStrokeStyle(3,0x44ff88,1); });
        card.on('pointerout',  ()=>{ card.setFillStyle(0x020c1a,0.96); card.setStrokeStyle(2,borderC,0.7); });
        card.on('pointerdown', ()=>{
          const newLvl = (this.metaUpgLevels[upg.id]??0) + 1;
          this.metaUpgLevels[upg.id] = newLvl;
          this.totalEssence -= upg.cost;
          try {
            localStorage.setItem(ESSENCE_KEY,   String(this.totalEssence));
            localStorage.setItem(META_UPG_KEY,  JSON.stringify(this.metaUpgLevels));
          } catch { /* noop */ }
          this.playBeep('relic');
          this.tweens.add({targets:card,scaleX:1.1,scaleY:1.1,duration:120,yoyo:true});
          // Actualizar textos del card
          const isFull = newLvl >= upg.maxLevel;
          nameT.setColor(isFull ? '#ffdd55' : '#eeddaa');
          lvlT.setText(isFull ? '✅ MAX' : `Nv ${newLvl}/${upg.maxLevel}`).setColor(isFull?'#ffdd55':'#556677');
          costT.setText(isFull ? '' : `✨ ${upg.cost}`);
          card.setStrokeStyle(2, isFull ? 0xffdd55 : 0x334466, isFull ? 1 : 0.7);
          if (isFull || this.totalEssence < upg.cost) {
            card.removeInteractive();
            card.removeAllListeners();
          }
          refreshCards();
          this.applyMetaUpgrades();
          this.updateHearts();
        });
      }

      cont.add([card, iconT, nameT, descT, lvlT, costT]);
    });

    // Botón JUGAR
    const playBtn = this.add.rectangle(GW/2, GH-48, 220, 40, 0x003300, 0.97)
      .setInteractive({useHandCursor:true}).setStrokeStyle(2,0x00ff44,0.9);
    const playTxt = this.add.text(GW/2, GH-48, '▶  JUGAR', {
      fontFamily:'monospace', fontSize:'16px', color:'#00ff44', fontStyle:'bold',
    }).setOrigin(0.5);
    playBtn.on('pointerover',  ()=>playBtn.setFillStyle(0x005500,0.97));
    playBtn.on('pointerout',   ()=>playBtn.setFillStyle(0x003300,0.97));
    playBtn.on('pointerdown',  ()=>{
      this.playBeep('correct');
      this.tweens.add({targets:[overlay,cont,playBtn,playTxt],alpha:0,duration:300,ease:'Power2',
        onComplete:()=>{ overlay.destroy(); cont.destroy(); playBtn.destroy(); playTxt.destroy(); onDone(); }});
    });
    cont.add([playBtn, playTxt]);

    cont.setAlpha(0).setY(20);
    this.tweens.add({targets:cont, alpha:1, y:0, duration:400, ease:'Back.easeOut'});
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎭  SELECTOR DE CLASE
  // ═══════════════════════════════════════════════════════════════════════════

  private showClassSelector(onDone: ()=>void): void {
    this.state = 'class_select';
    const overlay = this.add.rectangle(GW/2,GH/2,GW,GH,0x000000,0.93).setDepth(40);
    const cont    = this.add.container(0,0).setDepth(41);

    const title = this.add.text(GW/2, 48, '⚔️  ELIGE TU CLASE', {
      fontFamily:'monospace', fontSize:'26px', color:'#ffffff', fontStyle:'bold',
      stroke:'#00ff44', strokeThickness:2,
    }).setOrigin(0.5);
    const sub   = this.add.text(GW/2, 82, 'Cada clase cambia tu estilo de juego para toda la corrida.', {
      fontFamily:'monospace', fontSize:'11px', color:'#88aacc',
    }).setOrigin(0.5);
    const essLine = this.add.text(GW/2, 100, `✨ Esencia acumulada: ${this.totalEssence}`, {
      fontFamily:'monospace', fontSize:'10px', color:'#aaddff',
    }).setOrigin(0.5);
    cont.add([title, sub, essLine]);

    const CW = 148, CH = 195;
    const spacing = 160;
    const startX  = GW/2 - spacing * (CLASSES.length - 1) / 2;

    CLASSES.forEach((cls, i) => {
      const cx = startX + i * spacing;
      const cy = GH/2 + 35;
      const col = parseInt(cls.color.replace('#',''), 16);

      const card = this.add.rectangle(cx, cy, CW, CH, 0x020c1a, 0.96)
        .setInteractive({useHandCursor:true});
      card.setStrokeStyle(2, col, 0.7);

      const iconT  = this.add.text(cx, cy-75, cls.icon,  {fontFamily:'monospace',fontSize:'32px'}).setOrigin(0.5);
      const nameT  = this.add.text(cx, cy-36, cls.name,  {fontFamily:'monospace',fontSize:'12px',color:cls.color,fontStyle:'bold',wordWrap:{width:CW-14},align:'center'}).setOrigin(0.5);
      const passT  = this.add.text(cx, cy-8,  cls.passive,{fontFamily:'monospace',fontSize:'10px',color:'#ffdd55',wordWrap:{width:CW-14},align:'center'}).setOrigin(0.5);
      const descT  = this.add.text(cx, cy+38, cls.desc,  {fontFamily:'monospace',fontSize:'9px', color:'#88aacc',wordWrap:{width:CW-14},align:'center'}).setOrigin(0.5);

      card.on('pointerover',  ()=>{ card.setFillStyle(0x0a2040,0.98); card.setStrokeStyle(3,col,1); this.tweens.add({targets:[iconT,nameT],scaleX:1.08,scaleY:1.08,duration:100}); });
      card.on('pointerout',   ()=>{ card.setFillStyle(0x020c1a,0.96); card.setStrokeStyle(2,col,0.7); this.tweens.add({targets:[iconT,nameT],scaleX:1,scaleY:1,duration:100}); });
      card.on('pointerdown',  ()=>{
        this.playerClass = cls.id;
        this.classBadge.setText(`${cls.icon} ${cls.name.replace('El ','')}`).setColor(cls.color);
        // Tinte visual del jugador según clase
        const classTints: Record<PlayerClass,number> = {
          grammatico: 0xffcc88, vocabulista: 0x88ffcc, lector: 0xaabbff, bilingue: 0xffffdd,
        };
        const classAuras: Record<PlayerClass,number> = {
          grammatico: 0xff8844, vocabulista: 0x44ffaa, lector: 0x6699ff, bilingue: 0xffdd55,
        };
        this.playerSprite.setTint(classTints[cls.id]);
        // Activar aura de clase con pulso
        this.playerAura.setFillStyle(classAuras[cls.id], 0.22);
        this.tweens.add({ targets:this.playerAura,
          scaleX:{from:1,to:1.35}, scaleY:{from:1,to:1.35}, alpha:{from:0.22,to:0.06},
          duration:900, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });
        this.playBeep('relic');
        // Bilingüe: 1 reliquia inicial
        if (cls.id === 'bilingue') {
          const avail = RELICS.filter(r=>!this.activeRelics.includes(r.id));
          const startRelic = avail[Math.floor(Math.random()*avail.length)];
          if (startRelic) {
            this.time.delayedCall(300, ()=>this.applyRelic(startRelic));
          }
        }
        this.tweens.add({targets:card,scaleX:1.1,scaleY:1.1,duration:120,yoyo:true});
        this.time.delayedCall(380, ()=>{
          this.tweens.add({targets:[overlay,cont],alpha:0,duration:300,ease:'Power2',
            onComplete:()=>{ overlay.destroy(); cont.destroy(); this.showPenitenciaSelector(onDone); }});
        });
      });

      cont.add([card, iconT, nameT, passT, descT]);
    });

    cont.setAlpha(0).setY(30);
    this.tweens.add({targets:cont, alpha:1, y:0, duration:450, ease:'Back.easeOut'});
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🗺️  SELECTOR DE CAMINO
  // ═══════════════════════════════════════════════════════════════════════════

  private showPathSelector(onDone: (p:PathChoice)=>void): void {
    this.state = 'path_select';
    const overlay = this.add.rectangle(GW/2,GH/2,GW,GH,0x000000,0.85).setDepth(40);
    const cont    = this.add.container(0,0).setDepth(41);

    const title = this.add.text(GW/2, 78, '🗺️  ELIGE TU CAMINO', {
      fontFamily:'monospace', fontSize:'22px', color:'#ffffff', fontStyle:'bold',
    }).setOrigin(0.5);
    const sub   = this.add.text(GW/2, 106, 'Cada oleada decides tu destino.', {
      fontFamily:'monospace', fontSize:'11px', color:'#88aacc',
    }).setOrigin(0.5);
    cont.add([title, sub]);

    type PathDef = {choice:PathChoice; icon:string; title:string; desc:string; col:number;};
    const paths: PathDef[] = [
      {choice:'dangerous', icon:'🔴', title:'PELIGROSO', col:0xff3322,
       desc:'+2 enemigos extra.\n5 reliquias ofrecidas.\nAlto riesgo, alta recompensa.'},
      {choice:'normal',    icon:'🟡', title:'NORMAL',    col:0xffcc22,
       desc:'Oleada estándar.\n3 reliquias ofrecidas.\nFlujo habitual.'},
      {choice:'safe',      icon:'🟢', title:'SALA SEGURA', col:0x44ff88,
       desc:'Sin combate.\n+1 HP · +25 Alma.\nSin reliquia ofrecida.'},
    ];

    const CW=190, CH=185, spacing=220;
    const startX = GW/2 - spacing*(paths.length-1)/2;

    paths.forEach((p,i) => {
      const cx = startX + i * spacing, cy = GH/2 + 28;
      const card = this.add.rectangle(cx,cy,CW,CH,0x020c1a,0.96).setInteractive({useHandCursor:true});
      card.setStrokeStyle(2,p.col,0.7);

      const iconT  = this.add.text(cx, cy-68, p.icon,  {fontFamily:'monospace',fontSize:'36px'}).setOrigin(0.5);
      const titleT = this.add.text(cx, cy-26, p.title, {fontFamily:'monospace',fontSize:'13px',color:'#'+p.col.toString(16).padStart(6,'0'),fontStyle:'bold',wordWrap:{width:CW-14},align:'center'}).setOrigin(0.5);
      const descT  = this.add.text(cx, cy+28, p.desc,  {fontFamily:'monospace',fontSize:'10px',color:'#aabbcc',wordWrap:{width:CW-18},align:'center'}).setOrigin(0.5);

      card.on('pointerover',  ()=>{ card.setFillStyle(0x0a2040,0.98); card.setStrokeStyle(3,p.col,1); this.tweens.add({targets:[iconT,titleT],scaleX:1.08,scaleY:1.08,duration:100}); });
      card.on('pointerout',   ()=>{ card.setFillStyle(0x020c1a,0.96); card.setStrokeStyle(2,p.col,0.7); this.tweens.add({targets:[iconT,titleT],scaleX:1,scaleY:1,duration:100}); });
      card.on('pointerdown',  ()=>{
        this.nextWaveModifier = p.choice;
        this.playBeep('correct');
        this.tweens.add({targets:card,scaleX:1.08,scaleY:1.08,duration:120,yoyo:true});
        this.time.delayedCall(350,()=>{
          this.tweens.add({targets:[overlay,cont],alpha:0,duration:280,ease:'Power2',
            onComplete:()=>{ overlay.destroy(); cont.destroy(); onDone(p.choice); }});
        });
      });

      cont.add([card, iconT, titleT, descT]);
    });

    cont.setAlpha(0).setY(28);
    this.tweens.add({targets:cont, alpha:1, y:0, duration:380, ease:'Back.easeOut'});
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🙏  PENITENCIA (Blasphemous — modificadores opcionales de run)
  // ═══════════════════════════════════════════════════════════════════════════

  private showPenitenciaSelector(onDone: ()=>void): void {
    const overlay = this.add.rectangle(GW/2,GH/2,GW,GH,0x000000,0.90).setDepth(40);
    const cont    = this.add.container(0,0).setDepth(41);

    const title = this.add.text(GW/2, 70, '🙏  PENITENCIA', {
      fontFamily:'monospace', fontSize:'22px', color:'#ffaa44', fontStyle:'bold',
      stroke:'#331100', strokeThickness:2,
    }).setOrigin(0.5);
    const sub = this.add.text(GW/2, 100, 'Elige un desafío voluntario. Mayor riesgo, mayor recompensa.', {
      fontFamily:'monospace', fontSize:'11px', color:'#886644',
    }).setOrigin(0.5);
    cont.add([title, sub]);

    type PenDef = { id:'none'|'asceta'|'silencio'; icon:string; name:string; desc:string; col:number; };
    const opts: PenDef[] = [
      { id:'none',     icon:'🕊️', name:'SIN PENITENCIA', col:0x888888,
        desc:'Run normal.\nNingún modificador.\nRecompensas estándar.' },
      { id:'asceta',   icon:'⚔️', name:'MODO ASCETA',    col:0xff4422,
        desc:'HP máx = 2.\nDMG base ×2.\nRiesgoso pero letal.' },
      { id:'silencio', icon:'🔇', name:'MODO SILENCIO',  col:0x8844ff,
        desc:'Sin telegrafía.\nPreguntas +50% recompensa.\nEnemigos más imprevisibles.' },
    ];

    const CW=195, spacing=215;
    const startX = GW/2 - spacing*(opts.length-1)/2;

    opts.forEach((opt,i) => {
      const cx = startX + i*spacing, cy = GH/2+24;
      const card = this.add.rectangle(cx,cy,CW,190,0x020c1a,0.96).setInteractive({useHandCursor:true});
      card.setStrokeStyle(2,opt.col,0.7);

      const iconT  = this.add.text(cx,cy-70,opt.icon,  {fontFamily:'monospace',fontSize:'32px'}).setOrigin(0.5);
      const nameT  = this.add.text(cx,cy-28,opt.name,  {fontFamily:'monospace',fontSize:'12px',color:'#'+opt.col.toString(16).padStart(6,'0'),fontStyle:'bold',wordWrap:{width:CW-14},align:'center'}).setOrigin(0.5);
      const descT  = this.add.text(cx,cy+20,opt.desc,  {fontFamily:'monospace',fontSize:'10px',color:'#aabbcc',wordWrap:{width:CW-18},align:'center'}).setOrigin(0.5);

      card.on('pointerover',  ()=>{ card.setFillStyle(0x0a2040,0.98); card.setStrokeStyle(3,opt.col,1); });
      card.on('pointerout',   ()=>{ card.setFillStyle(0x020c1a,0.96); card.setStrokeStyle(2,opt.col,0.7); });
      card.on('pointerdown',  ()=>{
        this.penitencia = opt.id;
        // Aplicar efectos
        if (opt.id === 'asceta') {
          this.maxHp = 2; this.hp = 2; this.updateHearts();
          this.showFloatingText(GW/2,GH/2,'⚔️ MODO ASCETA — HP=2, DMG×2',0xff4422);
        }
        this.playBeep(opt.id==='none' ? 'dodge' : 'enrage');
        this.tweens.add({targets:card,scaleX:1.1,scaleY:1.1,duration:120,yoyo:true});
        this.time.delayedCall(350,()=>{
          this.tweens.add({targets:[overlay,cont],alpha:0,duration:280,ease:'Power2',
            onComplete:()=>{ overlay.destroy(); cont.destroy(); onDone(); }});
        });
      });
      cont.add([card,iconT,nameT,descT]);
    });

    cont.setAlpha(0).setY(20);
    this.tweens.add({targets:cont,alpha:1,y:0,duration:380,ease:'Back.easeOut'});
  }
}
