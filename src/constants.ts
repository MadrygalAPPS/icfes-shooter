// =====================================================
// 🎮 ICFES SHOOTER — Constantes globales
// =====================================================

export const GW = 800;   // Game width
export const GH = 480;   // Game height

// Posiciones clave en el escenario
export const GROUND_Y    = 390;   // Y del suelo (pies del personaje)
export const PLAYER_X    = 90;    // X fija del jugador
export const SPAWN_X     = 900;   // Donde aparecen los enemigos
export const TRIGGER_X   = 440;   // Enemigo llega aquí → pregunta aparece
export const KILL_X      = 150;   // Enemigo llega aquí → daño al jugador

// Timing
export const QUESTION_TIME = 12000; // 12 segundos para responder
export const FEEDBACK_TIME  = 1100; // ms de feedback visual tras responder
export const WAVE_DELAY     = 2200; // ms entre oleadas
export const SPAWN_INTERVAL = 1800; // ms entre spawns de la misma oleada

// Jugador
export const PLAYER_MAX_HP    = 5;
export const PLAYER_GRENADES  = 3;

// Colores (0x hex para Phaser)
export const C = {
  SKY_TOP:      0x0a0014,
  SKY_BOT:      0x1a0a2e,
  GROUND:       0x0d1b0d,
  GROUND_LINE:  0x1a3a1a,
  STAR:         0xffffff,
  MOON:         0xe8e8c0,

  PLAYER_BODY:  0x2255cc,
  PLAYER_SKIN:  0xffd8a0,
  PLAYER_HELM:  0x3a4a28,
  PLAYER_DARK:  0x111122,
  PLAYER_GUN:   0x888888,

  Z_HEAD:       0x5aaa40,   // Zombie
  Z_DARK:       0x2a5a20,
  Z_EYE:        0xff2200,

  SK_BONE:      0xddddcc,   // Skeleton
  SK_DARK:      0x888877,
  SK_EYE:       0x00ffff,

  VP_BODY:      0x220033,   // Vampire
  VP_SKIN:      0xddeeff,
  VP_CAPE:      0x550066,
  VP_EYE:       0xff0000,

  GL_BODY:      0x7a5030,   // Golem
  GL_DARK:      0x4a3020,
  GL_CRACK:     0xffcc00,

  BOSS_BODY:    0xcc1100,   // Dragon
  BOSS_WING:    0x880000,
  BOSS_FIRE:    0xff8800,
  BOSS_EYE:     0xffff00,
  BOSS_BELLY:   0xff5500,

  BULLET:       0xffee33,
  BULLET_TRAIL: 0xff9900,
  DOUBLE_BULLET:0x33ffcc,
  GRENADE:      0xff6600,
  SHIELD_COLOR: 0x00ccff,
  EXPLOSION:    0xff5500,

  HUD_BG:       0x050510,
  PANEL_BG:     0x050518,
  PANEL_BORDER: 0x00eeff,
  PANEL_GLOW:   0x0088cc,

  ANSWER_A:     0xcc4400,
  ANSWER_B:     0x0044cc,
  ANSWER_C:     0x00aa44,
  ANSWER_D:     0xaa0099,
  CORRECT:      0x00ff88,
  WRONG:        0xff3333,

  WHITE:        0xffffff,
  YELLOW:       0xffee33,
  GRAY:         0x888888,
  BLACK:        0x000000,
} as const;

// Tipos de enemigos con sus estadísticas
export const ENEMY_STATS = {
  zombie:   { hp: 1, speed: 55,  score: 100, label: 'ZOMBIE',   color: C.Z_HEAD,   size: 'S' },
  skeleton: { hp: 2, speed: 75,  score: 200, label: 'SKELETON', color: C.SK_BONE,  size: 'S' },
  vampire:  { hp: 3, speed: 95,  score: 350, label: 'VAMPIRE',  color: C.VP_SKIN,  size: 'M' },
  golem:    { hp: 4, speed: 40,  score: 500, label: 'GOLEM',    color: C.GL_BODY,  size: 'L' },
  boss:     { hp: 12, speed: 30, score: 2000, label: '⚡ BOSS', color: C.BOSS_BODY, size: 'XL' },
} as const;

export type EnemyType = keyof typeof ENEMY_STATS;

// Ondas: lista de enemigos por onda
export const WAVES: EnemyType[][] = [
  ['zombie', 'zombie', 'zombie'],
  ['zombie', 'skeleton', 'zombie', 'skeleton'],
  ['skeleton', 'vampire', 'skeleton', 'vampire'],
  ['vampire', 'golem', 'vampire'],
  ['boss'],
  ['zombie', 'skeleton', 'vampire', 'zombie', 'skeleton', 'golem'],
  ['golem', 'vampire', 'golem', 'vampire'],
  ['boss'],
];

// Colores de los botones de respuesta
export const BTN_COLORS = [C.ANSWER_A, C.ANSWER_B, C.ANSWER_C, C.ANSWER_D];
export const BTN_LABELS = ['A', 'B', 'C', 'D'];
