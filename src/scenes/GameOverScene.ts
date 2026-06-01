import Phaser from 'phaser';
import { GW, GH } from '../constants';

// =====================================================
// 💀 GAME OVER SCENE — Pantalla de fin de juego v2
// =====================================================
interface GOData {
  score:       number;
  hi?:         number;
  wave:        number;
  won?:        boolean;
  win?:        boolean;    // alias enviado desde GameScene
  essence?:    number;
  kills?:      number;
  accuracy?:   number;     // 0-100
  maxStreak?:  number;
  weapon?:     string;
  scrollAtk?:  number;
  playerClass?: string;
  relicCount?: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data: GOData): void {
    const score      = data?.score       ?? 0;
    const hi         = data?.hi          ?? 0;
    const wave       = data?.wave        ?? 1;
    const won        = data?.won         ?? data?.win ?? false;
    const essence    = data?.essence     ?? 0;
    const kills      = data?.kills       ?? 0;
    const accuracy   = data?.accuracy    ?? 0;
    const maxStreak  = data?.maxStreak   ?? 0;
    const weapon     = data?.weapon      ?? '';
    const scrollAtk  = data?.scrollAtk  ?? 0;
    const relicCount = data?.relicCount  ?? 0;
    const isNewHi    = score > 0 && score >= hi;

    // ── Fondo ──────────────────────────────────────────────────────────────
    this.add.tileSprite(0, 0, GW, GH, 'bg_tile').setOrigin(0);

    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GW);
      const y = Phaser.Math.Between(0, GH - 80);
      const a = Phaser.Math.FloatBetween(0.2, 0.9);
      const s = this.add.image(x, y, 'star').setAlpha(a);
      this.tweens.add({
        targets: s, alpha: { from: a, to: 0.05 },
        duration: Phaser.Math.Between(600, 2000),
        yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1500),
      });
    }

    this.add.image(700, 60, 'moon').setAlpha(0.7);
    this.add.image(GW / 2, GH - 20, 'ground').setOrigin(0.5, 1);
    for (let x = 60; x < GW; x += 160) {
      this.add.image(x, GH - 40, 'pillar').setOrigin(0.5, 1).setAlpha(0.5);
    }

    this.add.rectangle(GW / 2, GH / 2, GW, GH, 0x000000, 0.55);

    // ── Panel central (más alto para más stats) ────────────────────────────
    const panelH = 420;
    const panelCY = GH / 2 - 8;
    const panel = this.add.rectangle(GW / 2, panelCY, 560, panelH, 0x050518, 0.96);
    panel.setStrokeStyle(3, won ? 0x00ff88 : 0xff3333);
    panel.setAlpha(0);
    this.tweens.add({
      targets: panel,
      alpha: 1, y: { from: panelCY + 40, to: panelCY },
      duration: 500, ease: 'Back.easeOut',
    });

    // ── Título ──────────────────────────────────────────────────────────────
    const titleColor = won ? '#00ff88' : '#ff3333';
    const titleText  = won ? '¡VICTORIA!' : 'GAME OVER';
    const titleEmoji = won ? '🏆' : '💀';

    this.add.text(GW / 2 + 3, 98, `${titleEmoji} ${titleText} ${titleEmoji}`, {
      fontFamily: 'monospace', fontSize: '38px', color: '#000000', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    const title = this.add.text(GW / 2, 95, `${titleEmoji} ${titleText} ${titleEmoji}`, {
      fontFamily: 'monospace', fontSize: '38px', color: titleColor, fontStyle: 'bold',
      stroke: won ? '#004422' : '#330000', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 400, delay: 200 });
    this.tweens.add({
      targets: title,
      scaleX: { from: 1, to: 1.04 }, scaleY: { from: 1, to: 1.04 },
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 600,
    });

    // ── Subtítulo ────────────────────────────────────────────────────────────
    const subtitle = won ? '¡Derrotaste todas las hordas!' : 'Los monstruos llegaron al jugador...';
    this.time.delayedCall(300, () => {
      this.add.text(GW / 2, 143, subtitle, {
        fontFamily: 'monospace', fontSize: '14px', color: '#aaaacc',
      }).setOrigin(0.5);
    });

    // ── Stats principales ─────────────────────────────────────────────────────
    const statsY    = 178;
    const statsDelay = 450;
    const ROW_H = 34;

    const mainStats = [
      { label: '⭐ PUNTAJE',        value: score.toLocaleString(),            color: '#ffee33' },
      { label: '🌊 OLEADA',         value: `${wave}`,                         color: '#33ccff' },
      { label: '🏅 HIGH SCORE',     value: hi.toLocaleString(),               color: '#ff9900' },
      { label: '✨ ESENCIA GANADA', value: `+${essence}`,                     color: '#aaddff' },
    ];

    mainStats.forEach((s, i) => {
      const y = statsY + i * ROW_H;
      const cont = this.add.container(GW / 2, y).setAlpha(0);
      const bg = this.add.rectangle(0, 0, 430, 26, 0x0a0a20, 0.8);
      bg.setStrokeStyle(1, 0x222244);
      const lbl = this.add.text(-200, 0, s.label, {
        fontFamily: 'monospace', fontSize: '13px', color: '#8888aa',
      }).setOrigin(0, 0.5);
      const val = this.add.text(200, 0, s.value, {
        fontFamily: 'monospace', fontSize: '15px', color: s.color, fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      cont.add([bg, lbl, val]);
      this.tweens.add({
        targets: cont, alpha: 1, x: { from: GW / 2 + 40, to: GW / 2 },
        duration: 320, delay: statsDelay + i * 100, ease: 'Quad.easeOut',
      });
    });

    // ── Divisor ───────────────────────────────────────────────────────────────
    const divY = statsY + mainStats.length * ROW_H + 6;
    this.time.delayedCall(statsDelay + mainStats.length * 100 + 80, () => {
      const div = this.add.rectangle(GW / 2, divY, 460, 1, 0x334466, 0.6);
      const lbl = this.add.text(GW / 2, divY - 10, '── DETALLES DE RUN ──', {
        fontFamily: 'monospace', fontSize: '9px', color: '#445566',
      }).setOrigin(0.5);
      this.tweens.add({ targets: [div, lbl], alpha: { from: 0, to: 1 }, duration: 300 });
    });

    // ── Stats de run (2 por fila) ─────────────────────────────────────────────
    const runY      = divY + 14;
    const runDelay  = statsDelay + mainStats.length * 100 + 200;
    const runStats  = [
      { label: '⚔️ KILLS',          value: `${kills}` },
      { label: '🎯 PRECISIÓN',       value: `${accuracy}%` },
      { label: '🔥 RACHA MÁX',       value: `×${maxStreak}` },
      { label: '🗿 RELIQUIAS',        value: `${relicCount}` },
      { label: '📜 TOMOS +ATK',       value: scrollAtk > 0 ? `+${scrollAtk}` : '—' },
      { label: '⚔️ ARMA RUN',        value: weapon || 'ninguna' },
    ];

    // 3 columnas × 2 filas
    const cols = 3;
    runStats.forEach((s, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx  = GW / 2 - 180 + col * 185;
      const cy  = runY + row * 36;

      const cont = this.add.container(cx, cy).setAlpha(0);
      const bg = this.add.rectangle(0, 0, 172, 28, 0x080818, 0.8);
      bg.setStrokeStyle(1, 0x1a1a33);
      const lbl = this.add.text(-80, -6, s.label, {
        fontFamily: 'monospace', fontSize: '9px', color: '#6677aa',
      }).setOrigin(0, 0.5);
      const val = this.add.text(-80, 7, s.value, {
        fontFamily: 'monospace', fontSize: '12px', color: '#eeddaa', fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      cont.add([bg, lbl, val]);
      this.tweens.add({
        targets: cont, alpha: 1, y: { from: cy + 12, to: cy },
        duration: 260, delay: runDelay + i * 60, ease: 'Quad.easeOut',
      });
    });

    // ── Nuevo High Score ──────────────────────────────────────────────────────
    if (isNewHi) {
      const hiY = runY + 2 * 36 + 18;
      const hiText = this.add.text(GW / 2, hiY, '🎉 ¡NUEVO RÉCORD PERSONAL! 🎉', {
        fontFamily: 'monospace', fontSize: '13px', color: '#ffee33', fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({
        targets: hiText, alpha: 1, duration: 400, delay: runDelay + 500,
        onComplete: () => {
          this.tweens.add({ targets: hiText, alpha: { from: 1, to: 0.3 },
            duration: 600, yoyo: true, repeat: -1 });
        },
      });
    }

    // ── Botones ───────────────────────────────────────────────────────────────
    const btnY      = panelCY + panelH / 2 - 30;
    const btnDelay  = runDelay + 500;

    const btnPlay = this.add.rectangle(GW / 2 - 120, btnY, 210, 46, 0x003300).setAlpha(0);
    btnPlay.setStrokeStyle(2, 0x00ff44);
    btnPlay.setInteractive({ useHandCursor: true });
    const btnPlayTxt = this.add.text(GW / 2 - 120, btnY, '▶ JUGAR DE NUEVO', {
      fontFamily: 'monospace', fontSize: '13px', color: '#00ff44', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    const btnMenu = this.add.rectangle(GW / 2 + 120, btnY, 210, 46, 0x100020).setAlpha(0);
    btnMenu.setStrokeStyle(2, 0x8844ff);
    btnMenu.setInteractive({ useHandCursor: true });
    const btnMenuTxt = this.add.text(GW / 2 + 120, btnY, '🏠 MENÚ PRINCIPAL', {
      fontFamily: 'monospace', fontSize: '13px', color: '#cc88ff', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [btnPlay, btnPlayTxt, btnMenu, btnMenuTxt],
      alpha: 1, duration: 350, delay: btnDelay,
    });
    this.time.delayedCall(btnDelay + 350, () => {
      this.tweens.add({
        targets: [btnPlay, btnPlayTxt],
        alpha: { from: 1, to: 0.65 },
        duration: 600, yoyo: true, repeat: -1,
      });
    });

    const goToGame = () => {
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(350, () => this.scene.start('Game'));
    };
    const goToMenu = () => {
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(350, () => this.scene.start('Menu'));
    };

    btnPlay.on('pointerdown', goToGame);
    btnPlay.on('pointerover', () => btnPlay.setFillStyle(0x005500));
    btnPlay.on('pointerout',  () => btnPlay.setFillStyle(0x003300));
    btnMenu.on('pointerdown', goToMenu);
    btnMenu.on('pointerover', () => btnMenu.setFillStyle(0x220044));
    btnMenu.on('pointerout',  () => btnMenu.setFillStyle(0x100020));

    this.input.keyboard?.once('keydown-SPACE', goToGame);
    this.input.keyboard?.once('keydown-ENTER', goToGame);
    this.input.keyboard?.once('keydown-ESC',   goToMenu);

    // ── Confeti (victoria) ────────────────────────────────────────────────────
    if (won) {
      this.time.delayedCall(300, () => {
        const colors = [0x00ff88, 0xffee33, 0xff6699, 0x33ccff, 0xff9900];
        for (let i = 0; i < 40; i++) {
          const cx = Phaser.Math.Between(80, GW - 80);
          const cy = Phaser.Math.Between(40, 180);
          const color = Phaser.Utils.Array.GetRandom(colors) as number;
          const rect = this.add.rectangle(cx, cy, 7, 7, color);
          this.tweens.add({
            targets: rect,
            x: cx + Phaser.Math.Between(-80, 80),
            y: cy + Phaser.Math.Between(100, 260),
            alpha: { from: 1, to: 0 },
            angle: Phaser.Math.Between(-180, 180),
            duration: Phaser.Math.Between(900, 2000),
            delay: Phaser.Math.Between(0, 700),
            ease: 'Quad.easeIn',
            onComplete: () => rect.destroy(),
          });
        }
      });
    }

    // ── Hint teclado ──────────────────────────────────────────────────────────
    this.time.delayedCall(btnDelay + 800, () => {
      this.add.text(GW / 2, GH - 18, 'SPACE / ENTER = Jugar de nuevo  ·  ESC = Menú', {
        fontFamily: 'monospace', fontSize: '10px', color: '#444466',
      }).setOrigin(0.5);
    });

    // ── Decoración lateral ────────────────────────────────────────────────────
    if (!won) {
      const zombie = this.add.image(695, GH - 42, 'zombie').setOrigin(0.5, 1).setAlpha(0.32);
      this.tweens.add({ targets: zombie, angle: { from: 0, to: 14 },
        duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      const player = this.add.image(695, GH - 42, 'player').setOrigin(0.5, 1).setAlpha(0.48);
      this.tweens.add({ targets: player, y: GH - 52,
        duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}
