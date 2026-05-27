import Phaser from 'phaser';
import { GW, GH, C } from '../constants';

// =====================================================
// 🏠 MENU SCENE — Pantalla principal del juego
// =====================================================
export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create(): void {
    const hi = this.getHighScore();

    // ── Fondo ────────────────────────────────────────────────────────────
    this.add.tileSprite(0, 0, GW, GH, 'bg_tile').setOrigin(0);

    // Estrellas decorativas
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, GW);
      const y = Phaser.Math.Between(0, GH - 100);
      const a = Phaser.Math.FloatBetween(0.3, 1.0);
      const star = this.add.image(x, y, 'star').setAlpha(a);
      this.tweens.add({
        targets: star, alpha: { from: a, to: 0.1 },
        duration: Phaser.Math.Between(800, 2400),
        yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000),
      });
    }

    // Luna
    this.add.image(700, 60, 'moon');

    // Suelo
    this.add.image(GW / 2, GH - 20, 'ground').setOrigin(0.5, 1);

    // Pilares de fondo
    for (let x = 60; x < GW; x += 160) {
      this.add.image(x, GH - 40, 'pillar').setOrigin(0.5, 1);
    }

    // ── Personajes decorativos del menú ─────────────────────────────────
    const enemies = ['zombie', 'skeleton', 'vampire', 'golem'];
    enemies.forEach((key, i) => {
      const ex = 600 + (i % 2) * 70;
      const ey = GH - 40 - (i < 2 ? 0 : 0);
      const e = this.add.image(ex, ey, key).setOrigin(0.5, 1).setAlpha(0.4);
      this.tweens.add({
        targets: e, y: ey - 4, duration: 800 + i * 200,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });

    // Jugador
    const player = this.add.image(160, GH - 40, 'player').setOrigin(0.5, 1);
    this.tweens.add({
      targets: player, y: GH - 44, duration: 600,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // ── Título ───────────────────────────────────────────────────────────
    // Sombra
    this.add.text(GW / 2 + 3, 78, 'ICFES SHOOTER', {
      fontFamily: 'monospace', fontSize: '52px', color: '#001100',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const title = this.add.text(GW / 2, 75, 'ICFES SHOOTER', {
      fontFamily: 'monospace', fontSize: '52px', color: '#00ff44',
      fontStyle: 'bold',
      stroke: '#003300', strokeThickness: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: { from: 1, to: 1.02 },
      scaleY: { from: 1, to: 1.02 },
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.add.text(GW / 2, 128, 'RESPONDE · DISPARA · VENCE', {
      fontFamily: 'monospace', fontSize: '16px', color: '#88ff88',
      letterSpacing: 4,
    }).setOrigin(0.5);

    // ── High Score ────────────────────────────────────────────────────────
    if (hi > 0) {
      this.add.text(GW / 2, 170, `🏆 MEJOR PUNTAJE: ${hi.toLocaleString()}`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#ffee33',
      }).setOrigin(0.5);
    }

    // ── Instrucciones ─────────────────────────────────────────────────────
    const instrBox = this.add.rectangle(GW / 2, 260, 520, 130, 0x051805, 0.9);
    instrBox.setStrokeStyle(2, 0x00aa44);

    const instrLines = [
      '🔫  VOCAB / GRAMMAR  → bala normal',
      '⚡  DOBLE DIFICULTAD  → bala doble (×2 daño)',
      '💣  ¡PREGUNTA BONUS!  → GRANADA (mata al instante)',
      '🛡️  BONUS ESPECIAL   → ESCUDO (bloquea el golpe)',
      '⏱️  12s para responder o el monstruo avanza',
    ];
    instrLines.forEach((line, i) => {
      this.add.text(GW / 2, 220 + i * 22, line, {
        fontFamily: 'monospace', fontSize: '13px', color: '#aaffaa',
      }).setOrigin(0.5);
    });

    // ── Controles ─────────────────────────────────────────────────────────
    const ctrlY = 345;
    this.add.text(GW / 2, ctrlY, 'PC: [1] [2] [3] [4] para responder · [G] granada', {
      fontFamily: 'monospace', fontSize: '12px', color: '#448844',
    }).setOrigin(0.5);
    this.add.text(GW / 2, ctrlY + 18, 'MÓVIL: toca los botones de pantalla', {
      fontFamily: 'monospace', fontSize: '12px', color: '#448844',
    }).setOrigin(0.5);

    // ── Botón PLAY ────────────────────────────────────────────────────────
    const btnBg = this.add.rectangle(GW / 2, 415, 280, 52, 0x003300);
    btnBg.setStrokeStyle(3, 0x00ff44);
    btnBg.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(GW / 2, 415, '▶  PLAY  ▶', {
      fontFamily: 'monospace', fontSize: '26px', color: '#00ff44', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Pulso del botón
    this.tweens.add({
      targets: [btnBg, btnText],
      alpha: { from: 1, to: 0.7 },
      duration: 700, yoyo: true, repeat: -1,
    });

    const startGame = () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start('Game'));
    };

    btnBg.on('pointerdown', startGame);
    btnBg.on('pointerover', () => { btnBg.setFillStyle(0x006600); });
    btnBg.on('pointerout',  () => { btnBg.setFillStyle(0x003300); });

    // También Space / Enter
    this.input.keyboard?.once('keydown-SPACE', startGame);
    this.input.keyboard?.once('keydown-ENTER', startGame);

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private getHighScore(): number {
    try { return parseInt(localStorage.getItem('icfes_shooter_hi') || '0', 10); } catch { return 0; }
  }
}
