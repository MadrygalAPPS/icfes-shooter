import Phaser from 'phaser';
import {
  GW, GH, C, GROUND_Y, PLAYER_X, SPAWN_X, TRIGGER_X, KILL_X,
  PLAYER_MAX_HP, PLAYER_GRENADES, QUESTION_TIME, FEEDBACK_TIME,
  WAVES, ENEMY_STATS, EnemyType, BTN_COLORS, BTN_LABELS,
} from '../constants';
import { Question, getRandomQuestion, resetQuestionPool } from '../data/questions';

// =====================================================
// ⚔️ GAME SCENE — Lógica principal del shooter
// =====================================================

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
}

const REWARD_LABELS: Record<string, string> = {
  bullet:  '→ 🔫 BALA  (+1 daño)',
  double:  '→ ⚡ DOBLE (+2 daño)',
  grenade: '→ 💣 GRANADA (¡kill!)',
  shield:  '→ 🛡️ ESCUDO (protege)',
};

export class GameScene extends Phaser.Scene {
  // Estado del juego
  private state:      GameState = 'idle';
  private wave        = 0;
  private enemyQueue: EnemyType[] = [];
  private enemyIdx    = 0;
  private enemy:      ActiveEnemy | null = null;

  // Stats del jugador
  private hp       = PLAYER_MAX_HP;
  private grenades = PLAYER_GRENADES;
  private score    = 0;
  private combo    = 0;
  private hasShield = false;

  // Sprites del jugador
  private playerSprite!: Phaser.GameObjects.Image;
  private shieldSprite!:  Phaser.GameObjects.Image;
  private muzzleFlash!:   Phaser.GameObjects.Rectangle;

  // HUD
  private hearts:     Phaser.GameObjects.Image[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private waveLabel!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private grenadeIcon!: Phaser.GameObjects.Text;

  // Panel de pregunta
  private qPanel!:     Phaser.GameObjects.Container;
  private qText!:      Phaser.GameObjects.Text;
  private qTypeBadge!: Phaser.GameObjects.Text;
  private qReward!:    Phaser.GameObjects.Text;
  private qTimerBar!:  Phaser.GameObjects.Rectangle;
  private qTimerFull   = 1;
  private qBtnBgs:     Phaser.GameObjects.Rectangle[] = [];
  private qBtnLabels:  Phaser.GameObjects.Text[] = [];

  // Botones móvil
  private mobileOverlay!: Phaser.GameObjects.Container;
  private mobileBtns:  Phaser.GameObjects.Rectangle[] = [];
  private mobileTxts:  Phaser.GameObjects.Text[] = [];

  // Wave banner
  private waveBanner!: Phaser.GameObjects.Container;

  // Timer pregunta
  private timerEvent:   Phaser.Time.TimerEvent | null = null;
  private timerElapsed  = 0;
  private currentQ:     Question | null = null;

  // Keys
  private keys!: {
    k1: Phaser.Input.Keyboard.Key; k2: Phaser.Input.Keyboard.Key;
    k3: Phaser.Input.Keyboard.Key; k4: Phaser.Input.Keyboard.Key;
    g:  Phaser.Input.Keyboard.Key;
  };

  constructor() { super('Game'); }

  // ─────────────────────────────────────────────────────────────────────────
  create(): void {
    resetQuestionPool();
    this.state    = 'idle';
    this.wave     = 0;
    this.hp       = PLAYER_MAX_HP;
    this.grenades = PLAYER_GRENADES;
    this.score    = 0;
    this.combo    = 0;
    this.hasShield = false;

    this.buildBackground();
    this.buildPlayer();
    this.buildHUD();
    this.buildQuestionPanel();
    this.buildMobileOverlay();
    this.buildWaveBanner();
    this.setupKeys();
    this.registerAnimations();

    // Lanzar efecto CRT en paralelo
    this.scene.launch('CRT');

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.time.delayedCall(700, () => this.startWave());
  }

  // ─────────────────────────────────────────────────────────────────────────
  update(_t: number, delta: number): void {
    if (this.state === 'questioning' && this.timerEvent) {
      this.timerElapsed += delta;
      const pct = Math.max(0, 1 - this.timerElapsed / QUESTION_TIME);
      const maxW = 560;
      this.qTimerBar.width = Math.max(0, maxW * pct);
      if (pct < 0.3) this.qTimerBar.setFillStyle(C.WRONG);
      else if (pct < 0.6) this.qTimerBar.setFillStyle(0xffaa00);
      else this.qTimerBar.setFillStyle(C.PANEL_BORDER);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🏗️  BUILDERS
  // ════════════════════════════════════════════════════════════════════════

  private buildBackground(): void {
    // ── Cielo base ──
    this.add.tileSprite(0, 0, GW, GH, 'bg_tile').setOrigin(0);

    // ── Capa 1: Estrellas lejanas pequeñas (muy tenues, casi sin parpadeo) ──
    for (let i = 0; i < 60; i++) {
      const sx = Phaser.Math.Between(0, GW);
      const sy = Phaser.Math.Between(0, GROUND_Y - 60);
      const a  = Phaser.Math.FloatBetween(0.08, 0.30);
      const st = this.add.image(sx, sy, 'star').setAlpha(a).setScale(0.5);
      this.tweens.add({
        targets: st, alpha: { from: a, to: 0.02 },
        duration: Phaser.Math.Between(1800, 4000),
        yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 3000),
      });
    }

    // ── Capa 2: Estrellas medias (tamaño normal, parpadeo medio) ──
    for (let i = 0; i < 40; i++) {
      const sx = Phaser.Math.Between(0, GW);
      const sy = Phaser.Math.Between(0, GROUND_Y - 80);
      const a  = Phaser.Math.FloatBetween(0.25, 0.75);
      const st = this.add.image(sx, sy, 'star').setAlpha(a);
      this.tweens.add({
        targets: st, alpha: { from: a, to: 0.05 },
        duration: Phaser.Math.Between(800, 2200),
        yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000),
      });
    }

    // ── Capa 3: Estrellas grandes brillantes (pocas, muy visibles) ──
    for (let i = 0; i < 12; i++) {
      const sx = Phaser.Math.Between(20, GW - 20);
      const sy = Phaser.Math.Between(20, GROUND_Y - 100);
      const a  = Phaser.Math.FloatBetween(0.7, 1.0);
      const st = this.add.image(sx, sy, 'star').setAlpha(a).setScale(1.4);
      this.tweens.add({
        targets: st, alpha: { from: a, to: 0.2 },
        duration: Phaser.Math.Between(500, 1200),
        yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1000),
      });
    }

    // ── Luna ──
    this.add.image(720, 52, 'moon');
    // Halo lunar sutil
    this.add.circle(720, 52, 28, 0xe8e8c0, 0.05);
    this.add.circle(720, 52, 40, 0xe8e8c0, 0.03);

    // ── Neblina de fondo (tiras rectangulares animadas) ──
    const fogColors = [0x2a0044, 0x001a44, 0x0a0a44, 0x220044];
    for (let i = 0; i < 5; i++) {
      const fy  = 260 + i * 28;
      const fa  = 0.04 + i * 0.02;
      const fog = this.add.rectangle(GW / 2, fy, GW + 100, 40 + i * 10,
        fogColors[i % fogColors.length], fa);
      this.tweens.add({
        targets: fog,
        x: { from: GW / 2 - 30, to: GW / 2 + 30 },
        alpha: { from: fa, to: fa * 0.3 },
        duration: 4000 + i * 1200,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: i * 800,
      });
    }

    // ── Pilares (fondo) ── con profundidad vía alpha
    const pillarPositions = [60, 220, 380, 540, 700];
    pillarPositions.forEach((px, idx) => {
      const depthAlpha = 0.25 + idx * 0.04;
      this.add.image(px, GROUND_Y, 'pillar')
        .setOrigin(0.5, 1).setAlpha(depthAlpha).setDepth(1);
    });

    // ── Suelo ──
    this.add.image(GW / 2, GROUND_Y, 'ground').setOrigin(0.5, 1).setDepth(2);

    // ── Glow del suelo (reflexión neon) ──
    const glow1 = this.add.rectangle(GW / 2, GROUND_Y + 1, GW, 3, 0x00ff44, 0.5).setDepth(3);
    const glow2 = this.add.rectangle(GW / 2, GROUND_Y + 4, GW, 6, 0x00ff44, 0.15).setDepth(3);
    const glow3 = this.add.rectangle(GW / 2, GROUND_Y + 10, GW, 10, 0x00ff44, 0.05).setDepth(3);
    // Pulsación del glow
    this.tweens.add({
      targets: [glow1, glow2, glow3],
      alpha: { from: 1, to: 0.4 },
      duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  private buildPlayer(): void {
    this.playerSprite = this.add.image(PLAYER_X, GROUND_Y, 'player').setOrigin(0.5, 1);
    // Bob idle
    this.tweens.add({ targets: this.playerSprite, y: GROUND_Y - 3, duration: 500, yoyo: true, repeat: -1 });

    this.shieldSprite = this.add.image(PLAYER_X, GROUND_Y - 32, 'shield').setAlpha(0).setDepth(5);

    this.muzzleFlash = this.add.rectangle(PLAYER_X + 50, GROUND_Y - 38, 16, 12, 0xffffaa, 1)
      .setAlpha(0).setDepth(6);
  }

  private buildHUD(): void {
    const hudBg = this.add.rectangle(0, 0, GW, 56, C.HUD_BG, 0.88).setOrigin(0).setDepth(10);
    this.add.rectangle(0, 56, GW, 2, 0x00aa44, 0.7).setOrigin(0).setDepth(10);

    // Corazones
    for (let i = 0; i < PLAYER_MAX_HP; i++) {
      const h = this.add.image(18 + i * 26, 28, 'heart').setDepth(11).setScale(0.85);
      this.hearts.push(h);
    }

    // Texto onda
    this.waveLabel = this.add.text(GW / 2, 28, 'WAVE 1', {
      fontFamily: 'monospace', fontSize: '18px', color: '#00ff44', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);

    // Score
    this.scoreText = this.add.text(GW - 20, 15, 'SCORE: 0', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffee33',
    }).setOrigin(1, 0).setDepth(11);

    // Combo
    this.comboText = this.add.text(GW - 20, 35, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ff8800',
    }).setOrigin(1, 0).setDepth(11);

    // Granadas
    this.grenadeIcon = this.add.text(20, 45, `💣 ${this.grenades}`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#ff8800',
    }).setOrigin(0, 0.5).setDepth(11);
    this.add.text(60, 45, '[G]', {
      fontFamily: 'monospace', fontSize: '10px', color: '#884400',
    }).setOrigin(0, 0.5).setDepth(11);

    // Escudo indicador
    this.add.text(GW / 2, 44, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00ccff',
    }).setOrigin(0.5).setDepth(11).setName('shieldHud');

    void hudBg;
  }

  private buildQuestionPanel(): void {
    const PW = 600, PH = 280;
    const PX = GW / 2, PY = 230;

    this.qPanel = this.add.container(PX, PY).setDepth(20).setVisible(false);

    const bg = this.add.rectangle(0, 0, PW, PH, C.PANEL_BG, 0.97);
    bg.setStrokeStyle(3, C.PANEL_BORDER);

    // Glow border pulsante
    this.tweens.add({ targets: bg, alpha: { from: 0.97, to: 0.9 }, duration: 600, yoyo: true, repeat: -1 });

    this.qTypeBadge = this.add.text(-PW / 2 + 10, -PH / 2 + 8, 'VOCAB', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00eeff',
      backgroundColor: '#003344', padding: { x: 6, y: 3 },
    }).setOrigin(0);

    this.qReward = this.add.text(PW / 2 - 10, -PH / 2 + 8, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffee33',
    }).setOrigin(1, 0);

    this.qText = this.add.text(0, -PH / 2 + 34, '', {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffffff',
      align: 'center', wordWrap: { width: PW - 30 },
    }).setOrigin(0.5, 0);

    // Timer bar
    const timerBg = this.add.rectangle(0, PH / 2 - 68, 560, 10, 0x222222);
    timerBg.setStrokeStyle(1, 0x333333);
    this.qTimerBar = this.add.rectangle(-280, PH / 2 - 68, 560, 10, C.PANEL_BORDER).setOrigin(0, 0.5);
    this.qTimerFull = 560;

    // 4 botones de respuesta (2×2)
    const bw = 272, bh = 48;
    const positions = [
      [-bw / 2 - 2, PH / 2 - 46],
      [bw / 2 + 2,  PH / 2 - 46],
      [-bw / 2 - 2, PH / 2 + 6],
      [bw / 2 + 2,  PH / 2 + 6],
    ];

    positions.forEach((pos, i) => {
      const bbg = this.add.rectangle(pos[0], pos[1], bw, bh, BTN_COLORS[i], 0.9);
      bbg.setStrokeStyle(2, 0xffffff);
      bbg.setInteractive({ useHandCursor: true });
      bbg.on('pointerdown', () => this.onAnswer(i));
      bbg.on('pointerover', () => bbg.setAlpha(1));
      bbg.on('pointerout',  () => bbg.setAlpha(0.9));

      const bt = this.add.text(pos[0], pos[1], `${BTN_LABELS[i]}) `, {
        fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
        fontStyle: 'bold', wordWrap: { width: bw - 14 }, align: 'center',
      }).setOrigin(0.5);

      this.qBtnBgs.push(bbg);
      this.qBtnLabels.push(bt);
      this.qPanel.add([bbg, bt]);
    });

    this.qPanel.add([bg, this.qTypeBadge, this.qReward, this.qText, timerBg, this.qTimerBar]);
  }

  private buildMobileOverlay(): void {
    this.mobileOverlay = this.add.container(0, 0).setDepth(25).setVisible(false);

    const bw = 172, bh = 58;
    const positions = [
      [GW - 2 * bw - 8, GH - bh - 6],
      [GW - bw - 4,      GH - bh - 6],
      [GW - 2 * bw - 8, GH - 2 * bh - 10],
      [GW - bw - 4,      GH - 2 * bh - 10],
    ];

    positions.forEach((pos, i) => {
      const mb = this.add.rectangle(pos[0] + bw / 2, pos[1] + bh / 2, bw, bh, BTN_COLORS[i], 0.9);
      mb.setStrokeStyle(2, 0xffffff);
      mb.setInteractive({ useHandCursor: true });
      mb.on('pointerdown', () => this.onAnswer(i));
      mb.on('pointerover', () => mb.setAlpha(1));
      mb.on('pointerout',  () => mb.setAlpha(0.9));
      mb.setAlpha(0.9);

      const mt = this.add.text(pos[0] + bw / 2, pos[1] + bh / 2, BTN_LABELS[i], {
        fontFamily: 'monospace', fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);

      this.mobileBtns.push(mb);
      this.mobileTxts.push(mt);
      this.mobileOverlay.add([mb, mt]);
    });

    // Botón Granada móvil
    const gbtn = this.add.rectangle(GW - 2 * bw - 8 + bw / 2, GH - 3 * bh - 14, bw * 2 + 4, 44, 0x883300, 0.9);
    gbtn.setStrokeStyle(2, 0xff6600);
    gbtn.setInteractive({ useHandCursor: true });
    gbtn.on('pointerdown', () => this.useGrenade());
    const gtxt = this.add.text(gbtn.x, gbtn.y, '💣 GRANADA [G]', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ff8800',
    }).setOrigin(0.5);
    this.mobileOverlay.add([gbtn, gtxt]);
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
    const defs: Array<{ key: string; frames: string[]; rate: number }> = [
      { key: 'zombie_walk',   frames: ['zombie_f0','zombie_f1','zombie_f2'], rate: 7 },
      { key: 'skeleton_walk', frames: ['skeleton_f0','skeleton_f1','skeleton_f2','skeleton_f3'], rate: 9 },
      { key: 'vampire_float', frames: ['vampire_f0','vampire_f1'], rate: 4 },
      { key: 'golem_stomp',   frames: ['golem_f0','golem_f1'], rate: 3 },
      { key: 'boss_fly',      frames: ['boss_f0','boss_f1','boss_f2','boss_f1'], rate: 5 },
    ];
    defs.forEach(({ key, frames, rate }) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: frames.map(f => ({ key: f })),
          frameRate: rate,
          repeat: -1,
        });
      }
    });
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
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🌊 OLAS
  // ════════════════════════════════════════════════════════════════════════

  private startWave(): void {
    const waveData = WAVES[this.wave % WAVES.length];
    this.enemyQueue = [...waveData];
    this.enemyIdx   = 0;

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
    const animKey = type === 'boss' ? 'boss_fly'
                  : type === 'vampire' ? 'vampire_float'
                  : type === 'golem' ? 'golem_stomp'
                  : type === 'skeleton' ? 'skeleton_walk'
                  : 'zombie_walk';
    const firstFrame = type === 'boss' ? 'boss_f0'
                     : type === 'vampire' ? 'vampire_f0'
                     : type === 'golem' ? 'golem_f0'
                     : type === 'skeleton' ? 'skeleton_f0'
                     : 'zombie_f0';
    const groundOffset = type === 'boss' ? 90 : type === 'golem' ? 58
                       : type === 'vampire' ? 66 : type === 'skeleton' ? 58 : 56;

    const sprite = this.add.sprite(SPAWN_X, GROUND_Y - groundOffset / 2, firstFrame)
      .setOrigin(0.5, 1).setDepth(8).setFlipX(true);
    sprite.play(animKey);

    // HP bar
    const barY = GROUND_Y - groundOffset - 10;
    const hpBg   = this.add.rectangle(SPAWN_X, barY, 56, 8, 0x333333).setDepth(9);
    const hpFill = this.add.rectangle(SPAWN_X - 26, barY, 52, 6, 0x00ff44).setOrigin(0, 0.5).setDepth(9);
    const hpLabel = this.add.text(SPAWN_X, barY - 10, stats.label, {
      fontFamily: 'monospace', fontSize: '11px', color: '#' + stats.color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5).setDepth(9);

    // Bob animation
    const bob = this.tweens.add({
      targets: sprite, y: GROUND_Y - groundOffset / 2 - 5,
      duration: 350, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.enemy = {
      type, sprite, hpCurrent: stats.hp, hpMax: stats.hp,
      hpBg, hpFill, hpLabel, bob,
    };

    // Caminar hacia el jugador
    this.tweens.add({
      targets: [sprite, hpBg, hpFill, hpLabel],
      x: `-=${SPAWN_X - TRIGGER_X}`,
      duration: ((SPAWN_X - TRIGGER_X) / stats.speed) * 1000,
      ease: 'Linear',
      onComplete: () => this.onEnemyArrived(),
    });

    this.state = 'idle';
  }

  // ════════════════════════════════════════════════════════════════════════
  // ❓ PREGUNTAS
  // ════════════════════════════════════════════════════════════════════════

  private onEnemyArrived(): void {
    if (this.state === 'game_over') return;
    this.state = 'questioning';
    this.currentQ = getRandomQuestion(this.enemy?.type === 'boss');
    this.showQuestion(this.currentQ);
  }

  private showQuestion(q: Question): void {
    // Tipo y recompensa
    const typeColors: Record<string, string> = {
      vocab: '#00eeff', grammar: '#ffee33', bonus: '#ff88ff',
    };
    const typeLbls: Record<string, string> = {
      vocab: '📖 VOCAB', grammar: '✍️ GRAMMAR', bonus: '⚡ BONUS',
    };
    this.qTypeBadge.setText(typeLbls[q.type] ?? q.type.toUpperCase());
    this.qTypeBadge.setColor(typeColors[q.type] ?? '#ffffff');
    this.qReward.setText(REWARD_LABELS[q.reward] ?? '');
    this.qText.setText(q.text);

    // Botones de respuesta
    q.opts.forEach((opt, i) => {
      this.qBtnLabels[i].setText(`${BTN_LABELS[i]}) ${opt}`);
      this.qBtnBgs[i].setFillStyle(BTN_COLORS[i], 0.9);
    });
    // Actualizar textos móviles
    q.opts.forEach((opt, i) => {
      if (this.mobileTxts[i]) this.mobileTxts[i].setText(`${BTN_LABELS[i]}\n${opt.substring(0, 18)}`);
    });

    // Reset timer bar
    this.timerElapsed = 0;
    this.qTimerBar.width = 560;
    this.qTimerBar.setFillStyle(C.PANEL_BORDER);

    // Mostrar panel
    this.qPanel.setVisible(true).setAlpha(0).setY(280);
    this.tweens.add({ targets: this.qPanel, alpha: 1, y: 230, duration: 250, ease: 'Back.easeOut' });

    // Mostrar overlay móvil
    this.mobileOverlay.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.mobileOverlay, alpha: 1, duration: 200 });

    // Timer de pregunta
    this.timerEvent = this.time.delayedCall(QUESTION_TIME, () => this.onTimeout());
  }

  private hideQuestion(): void {
    this.timerEvent?.remove();
    this.timerEvent = null;
    this.tweens.add({ targets: [this.qPanel, this.mobileOverlay], alpha: 0, duration: 200,
      onComplete: () => { this.qPanel.setVisible(false); this.mobileOverlay.setVisible(false); }
    });
  }

  private onAnswer(idx: number): void {
    if (this.state !== 'questioning' || !this.currentQ) return;
    this.state = 'feedback';
    this.timerEvent?.remove();
    this.timerEvent = null;

    const correct = idx === this.currentQ.ans;

    // Feedback visual en los botones
    this.qBtnBgs.forEach((bg, i) => {
      if (i === this.currentQ!.ans)    bg.setFillStyle(C.CORRECT, 1);
      else if (i === idx && !correct)  bg.setFillStyle(C.WRONG, 1);
      else                             bg.setFillStyle(0x333333, 0.5);
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

    // Flash rojo en panel
    this.tweens.add({ targets: this.qPanel, alpha: 0.3, duration: 100, yoyo: true, repeat: 3 });
    this.time.delayedCall(FEEDBACK_TIME, () => {
      this.hideQuestion();
      this.onWrongAnswer();
    });
  }

  private onCorrectAnswer(q: Question): void {
    this.combo++;
    const comboBonus = Math.floor(this.combo / 3) * 50;

    // Animación del jugador disparando
    this.playerSprite.setTexture('player_shoot');
    this.muzzleFlash.setAlpha(1);
    this.time.delayedCall(120, () => {
      this.playerSprite.setTexture('player');
      this.muzzleFlash.setAlpha(0);
    });

    if (q.reward === 'grenade') {
      this.fireGrenade();
    } else if (q.reward === 'shield') {
      this.activateShield();
      this.addScore(150 + comboBonus);
      this.time.delayedCall(300, () => this.afterShot());
    } else {
      const damage = q.reward === 'double' ? 2 : 1;
      this.fireBullet(q.reward, damage);
      this.addScore((q.reward === 'double' ? 120 : 80) + comboBonus);
    }

    if (this.combo >= 3) {
      this.comboText.setText(`🔥 COMBO ×${this.combo}`);
      this.tweens.add({ targets: this.comboText, scaleX: 1.3, scaleY: 1.3, duration: 200, yoyo: true });
    } else { this.comboText.setText(''); }
  }

  private onWrongAnswer(): void {
    this.combo = 0;
    this.comboText.setText('');
    this.playerHit();
    if (this.state !== 'game_over') {
      // El enemigo avanza un poco
      if (this.enemy) {
        this.tweens.add({
          targets: [this.enemy.sprite, this.enemy.hpBg, this.enemy.hpFill, this.enemy.hpLabel],
          x: `-=40`, duration: 300, ease: 'Power2',
          onComplete: () => {
            if (this.enemy && this.enemy.sprite.x <= KILL_X) {
              this.playerHit();
              this.pushEnemyBack();
            }
            if (this.state !== 'game_over') {
              this.time.delayedCall(400, () => this.onEnemyArrived());
            }
          },
        });
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 💥 PROYECTILES & EFECTOS
  // ════════════════════════════════════════════════════════════════════════

  private fireBullet(type: string, damage: number): void {
    if (!this.enemy) return;
    this.state = 'shooting';
    const tex = type === 'double' ? 'dbullet' : 'bullet';
    const targetX = this.enemy.sprite.x;
    const targetY = this.enemy.sprite.y - 30;
    const travelTime = Math.max(120, (targetX - PLAYER_X) * 0.7);
    const trailColor = type === 'double' ? 0x33ffcc : 0xffee33;

    const bullet = this.add.image(PLAYER_X + 52, GROUND_Y - 38, tex).setDepth(7);

    // Trail de partículas siguiendo la bala
    const trail = this.add.particles(bullet.x, bullet.y, 'spark', {
      speed: { min: 10, max: 40 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.8, end: 0 },
      lifespan: 110,
      tint: trailColor,
      frequency: 18,
    });
    trail.setDepth(6);

    this.tweens.add({
      targets: bullet, x: targetX, y: targetY,
      duration: travelTime, ease: 'Linear',
      onUpdate: () => { trail.setPosition(bullet.x, bullet.y); },
      onComplete: () => {
        trail.stop();
        this.time.delayedCall(150, () => trail.destroy());
        bullet.destroy();
        this.spawnHitParticles(targetX, targetY, type === 'double' ? 0x33ffcc : 0xffee33);
        this.dealDamage(damage);
      },
    });
  }

  private fireGrenade(): void {
    if (!this.enemy) return;
    this.state = 'shooting';
    const targetX = this.enemy.sprite.x;
    const targetY = this.enemy.sprite.y;

    const gren = this.add.image(PLAYER_X + 52, GROUND_Y - 38, 'grenade').setDepth(7);
    this.tweens.add({
      targets: gren,
      x: targetX, y: targetY - 20,
      duration: 350, ease: 'Power1',
      onComplete: () => {
        gren.destroy();
        this.spawnExplosion(targetX, targetY);
        // La granada mata al instante
        if (this.enemy) {
          this.enemy.hpCurrent = 0;
          this.killEnemy();
        }
      },
    });
    // Rotación de la granada
    this.tweens.add({ targets: gren, angle: 360, duration: 300, ease: 'Linear' });
  }

  private activateShield(): void {
    this.hasShield = true;
    this.shieldSprite.setAlpha(0.8);
    this.tweens.add({
      targets: this.shieldSprite, alpha: { from: 0.8, to: 0.4 }, duration: 500, yoyo: true, repeat: -1,
    });
    this.showFloatingText(PLAYER_X, GROUND_Y - 80, '🛡️ ESCUDO', 0x00ccff);
    (this.children.getByName('shieldHud') as Phaser.GameObjects.Text | null)?.setText('🛡️ SHIELD ACTIVO');
  }

  private useGrenade(): void {
    if (this.grenades <= 0 || !this.enemy || this.state === 'game_over') return;
    this.grenades--;
    this.grenadeIcon.setText(`💣 ${this.grenades}`);
    if (this.state === 'questioning') {
      this.hideQuestion();
      this.state = 'shooting';
    }
    this.fireGrenade();
  }

  private dealDamage(amount: number): void {
    if (!this.enemy) return;
    this.enemy.hpCurrent = Math.max(0, this.enemy.hpCurrent - amount);

    // Flash rojo en enemigo
    this.tweens.add({ targets: this.enemy.sprite, alpha: 0.2, duration: 80, yoyo: true, repeat: 2 });

    // Update HP bar
    const pct = this.enemy.hpCurrent / this.enemy.hpMax;
    this.tweens.add({
      targets: this.enemy.hpFill,
      width: Math.max(2, 52 * pct),
      duration: 200, ease: 'Power2',
    });
    const barColor = pct > 0.6 ? 0x00ff44 : pct > 0.3 ? 0xffaa00 : 0xff3300;
    this.enemy.hpFill.setFillStyle(barColor);

    if (this.enemy.hpCurrent <= 0) {
      this.killEnemy();
    } else {
      this.afterShot();
    }
  }

  private afterShot(): void {
    this.time.delayedCall(350, () => {
      if (this.state !== 'game_over') this.onEnemyArrived();
    });
  }

  private killEnemy(): void {
    if (!this.enemy) return;
    const { sprite, hpBg, hpFill, hpLabel, bob, type } = this.enemy;
    const ex = sprite.x, ey = sprite.y;

    bob.stop();
    sprite.stop(); // detiene animación de frames
    hpBg.destroy(); hpFill.destroy(); hpLabel.destroy();

    const baseScore = ENEMY_STATS[type].score;
    const comboMult = 1 + Math.floor(this.combo / 3) * 0.25;
    this.addScore(Math.floor(baseScore * comboMult));

    // Muerte: caída + desvanecimiento
    this.tweens.add({
      targets: sprite,
      y: GROUND_Y + 10, alpha: 0, angle: type === 'boss' ? 90 : 30,
      scaleX: type === 'boss' ? 0.5 : 0.3, scaleY: type === 'boss' ? 0.5 : 0.3,
      duration: type === 'boss' ? 600 : 350, ease: 'Power2',
      onComplete: () => sprite.destroy(),
    });

    this.spawnExplosion(ex, ey - 20);
    this.showFloatingText(ex, ey - 60, `+${Math.floor(baseScore * comboMult)}`, C.YELLOW);
    this.cameras.main.shake(type === 'boss' ? 400 : 120, type === 'boss' ? 0.02 : 0.007);

    this.enemy = null;

    // Siguiente enemigo
    const delay = type === 'boss' ? 1200 : 600;
    this.time.delayedCall(delay, () => {
      if (this.state !== 'game_over') this.spawnNextEnemy();
    });
  }

  private playerHit(): void {
    if (this.hasShield) {
      this.hasShield = false;
      this.shieldSprite.setAlpha(0);
      this.tweens.killTweensOf(this.shieldSprite);
      this.showFloatingText(PLAYER_X, GROUND_Y - 90, '🛡️ BLOQUEADO', 0x00ccff);
      (this.children.getByName('shieldHud') as Phaser.GameObjects.Text | null)?.setText('');
      return;
    }
    this.hp--;
    this.updateHearts();
    this.cameras.main.shake(180, 0.015);
    // Flash rojo en pantalla
    const flash = this.add.rectangle(GW / 2, GH / 2, GW, GH, 0xff0000, 0.35).setDepth(50);
    this.tweens.add({ targets: flash, alpha: 0, duration: 250, onComplete: () => flash.destroy() });
    // Knockback del jugador
    this.tweens.add({ targets: this.playerSprite, x: PLAYER_X - 18, duration: 80, yoyo: true });

    this.showFloatingText(PLAYER_X, GROUND_Y - 80, '💔 -1 HP', C.WRONG);

    if (this.hp <= 0) this.doGameOver();
  }

  private pushEnemyBack(): void {
    if (!this.enemy) return;
    this.tweens.add({
      targets: [this.enemy.sprite, this.enemy.hpBg, this.enemy.hpFill, this.enemy.hpLabel],
      x: TRIGGER_X, duration: 400, ease: 'Power2',
    });
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
      if (isLastBoss) this.doVictory();
      else { this.wave++; this.startWave(); }
    }, isLastBoss ? 2500 : 1500);
  }

  private showBanner(text: string, onDone: () => void, duration = 1200): void {
    const txt = this.waveBanner.getByName('bannerTxt') as Phaser.GameObjects.Text;
    txt.setText(text);
    this.waveBanner.setAlpha(0).setScale(0.8);
    this.tweens.add({
      targets: this.waveBanner, alpha: 1, scaleX: 1, scaleY: 1,
      duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(duration, () => {
          this.tweens.add({
            targets: this.waveBanner, alpha: 0, scaleX: 1.1, scaleY: 1.1,
            duration: 300, onComplete: onDone,
          });
        });
      },
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🎆 PARTÍCULAS & EFECTOS VISUALES
  // ════════════════════════════════════════════════════════════════════════

  private spawnHitParticles(x: number, y: number, color = 0xffee33): void {
    // Chispas radiales
    const sparks = this.add.particles(x, y, 'spark', {
      speed: { min: 80, max: 260 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: { min: 150, max: 320 },
      quantity: 14,
      tint: [color, 0xffffff, 0xffaa00],
      gravityY: 180,
    });
    sparks.setDepth(12);
    sparks.explode(14);
    this.time.delayedCall(400, () => sparks.destroy());

    // Flash de impacto
    const flash = this.add.circle(x, y, 14, color, 0.9).setDepth(11);
    this.tweens.add({
      targets: flash, radius: 28, alpha: 0, duration: 180,
      ease: 'Power2', onComplete: () => flash.destroy(),
    });
  }

  private spawnExplosion(x: number, y: number): void {
    // Explosión con imagen sprite
    const exp = this.add.image(x, y, 'explosion').setDepth(10).setScale(0.3);
    this.tweens.add({
      targets: exp, scale: 3.0, alpha: 0, duration: 450, ease: 'Power2',
      onComplete: () => exp.destroy(),
    });

    // Partículas de fuego
    const fire = this.add.particles(x, y, 'ptfire', {
      speed: { min: 60, max: 280 },
      angle: { min: 0, max: 360 },
      scale: { start: 2.0, end: 0 },
      lifespan: { min: 250, max: 550 },
      quantity: 32,
      tint: [0xff2200, 0xff6600, 0xffaa00, 0xffff00],
      gravityY: 120,
    });
    fire.setDepth(11);
    fire.explode(32);

    // Partículas de humo
    const smoke = this.add.particles(x, y, 'ptsmoke', {
      speed: { min: 20, max: 80 },
      angle: { min: 230, max: 310 },
      scale: { start: 1.5, end: 0 },
      lifespan: { min: 400, max: 800 },
      quantity: 10,
      tint: [0x555555, 0x888888, 0xaaaaaa],
      gravityY: -30,
    });
    smoke.setDepth(12);
    smoke.explode(10);

    // Anillos de onda expansiva
    for (let i = 0; i < 3; i++) {
      const ring = this.add.circle(x, y, 8, 0xff6600, 0.7).setDepth(9);
      this.tweens.add({
        targets: ring, radius: 30 + i * 22, alpha: 0,
        duration: 280 + i * 90, delay: i * 60, ease: 'Power1',
        onComplete: () => ring.destroy(),
      });
    }

    this.time.delayedCall(700, () => { fire.destroy(); smoke.destroy(); });
  }

  private showFloatingText(x: number, y: number, msg: string, color: number): void {
    const col = '#' + color.toString(16).padStart(6, '0');
    const t = this.add.text(x, y, msg, {
      fontFamily: 'monospace', fontSize: '16px', color: col,
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({
      targets: t, y: y - 50, alpha: 0, duration: 900, ease: 'Power2',
      onComplete: () => t.destroy(),
    });
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
  // 🏁 FIN DE JUEGO
  // ════════════════════════════════════════════════════════════════════════

  private doGameOver(): void {
    this.state = 'game_over';
    this.timerEvent?.remove();
    this.enemy?.bob.stop();
    this.scene.stop('CRT');

    this.cameras.main.shake(500, 0.03);
    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(700, () =>
        this.scene.start('GameOver', { score: this.score, wave: this.wave + 1, win: false })
      );
    });
  }

  private doVictory(): void {
    this.state = 'game_over';
    this.scene.stop('CRT');
    this.cameras.main.fadeOut(800, 255, 255, 200);
    this.time.delayedCall(900, () =>
      this.scene.start('GameOver', { score: this.score, wave: WAVES.length, win: true })
    );
  }
}
