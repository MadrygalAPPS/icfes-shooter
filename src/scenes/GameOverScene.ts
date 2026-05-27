import Phaser from 'phaser';
import { GW, GH } from '../constants';

// =====================================================
// 💀 GAME OVER SCENE — Pantalla de fin de juego
// =====================================================
interface GOData {
  score: number;
  hi: number;
  wave: number;
  won: boolean;
}

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data: GOData): void {
    const { score = 0, hi = 0, wave = 1, won = false } = data ?? {};
    const isNewHi = score > 0 && score >= hi;

    // ── Fondo ──────────────────────────────────────────────────────────────
    this.add.tileSprite(0, 0, GW, GH, 'bg_tile').setOrigin(0);

    // Estrellas
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

    // Luna
    this.add.image(700, 60, 'moon').setAlpha(0.7);

    // Suelo
    this.add.image(GW / 2, GH - 20, 'ground').setOrigin(0.5, 1);

    // Pilares decorativos
    for (let x = 60; x < GW; x += 160) {
      this.add.image(x, GH - 40, 'pillar').setOrigin(0.5, 1).setAlpha(0.5);
    }

    // ── Overlay oscuro ──────────────────────────────────────────────────────
    this.add.rectangle(GW / 2, GH / 2, GW, GH, 0x000000, 0.55);

    // ── Panel central ──────────────────────────────────────────────────────
    const panelH = 320;
    const panel = this.add.rectangle(GW / 2, GH / 2 - 10, 540, panelH, 0x050518, 0.95);
    panel.setStrokeStyle(3, won ? 0x00ff88 : 0xff3333);
    panel.setAlpha(0);

    this.tweens.add({
      targets: panel,
      alpha: 1, y: { from: GH / 2 + 40, to: GH / 2 - 10 },
      duration: 500, ease: 'Back.easeOut',
    });

    // ── Título ──────────────────────────────────────────────────────────────
    const titleColor = won ? '#00ff88' : '#ff3333';
    const titleText  = won ? '¡VICTORIA!' : 'GAME OVER';
    const titleEmoji = won ? '🏆' : '💀';

    const titleShadow = this.add.text(GW / 2 + 3, 113, `${titleEmoji} ${titleText} ${titleEmoji}`, {
      fontFamily: 'monospace', fontSize: '42px', color: '#000000', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    const title = this.add.text(GW / 2, 110, `${titleEmoji} ${titleText} ${titleEmoji}`, {
      fontFamily: 'monospace', fontSize: '42px', color: titleColor, fontStyle: 'bold',
      stroke: won ? '#004422' : '#330000', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [title, titleShadow],
      alpha: 1, duration: 400, delay: 200,
    });

    // Pulso del título
    this.tweens.add({
      targets: title,
      scaleX: { from: 1, to: 1.04 }, scaleY: { from: 1, to: 1.04 },
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 600,
    });

    // ── Subtítulo ────────────────────────────────────────────────────────────
    const subtitle = won
      ? '¡Derrotaste todas las hordas!'
      : 'Los monstruos llegaron al jugador...';

    this.add.text(GW / 2, 160, subtitle, {
      fontFamily: 'monospace', fontSize: '15px', color: '#aaaacc',
    }).setOrigin(0.5).setAlpha(0);

    // animar con delay
    this.time.delayedCall(300, () => {
      this.add.text(GW / 2, 160, subtitle, {
        fontFamily: 'monospace', fontSize: '15px', color: '#aaaacc',
      }).setOrigin(0.5);
    });

    // ── Estadísticas ─────────────────────────────────────────────────────────
    const statsY = 210;
    const statsDelay = 500;

    // Contenedor de stats
    const statsData = [
      { label: '⭐ PUNTAJE',      value: score.toLocaleString(),   color: '#ffee33' },
      { label: '🌊 OLEADA',       value: `${wave}`,                 color: '#33ccff' },
      { label: '🏅 HIGH SCORE',   value: hi.toLocaleString(),       color: '#ff9900' },
    ];

    statsData.forEach((s, i) => {
      const y = statsY + i * 38;
      const container = this.add.container(GW / 2, y).setAlpha(0);

      // Fondo de fila
      const rowBg = this.add.rectangle(0, 0, 400, 30, 0x0a0a20, 0.8);
      rowBg.setStrokeStyle(1, 0x222244);

      const labelTxt = this.add.text(-180, 0, s.label, {
        fontFamily: 'monospace', fontSize: '14px', color: '#8888aa',
      }).setOrigin(0, 0.5);

      const valueTxt = this.add.text(180, 0, s.value, {
        fontFamily: 'monospace', fontSize: '16px', color: s.color, fontStyle: 'bold',
      }).setOrigin(1, 0.5);

      container.add([rowBg, labelTxt, valueTxt]);

      this.tweens.add({
        targets: container,
        alpha: 1, x: { from: GW / 2 + 40, to: GW / 2 },
        duration: 350, delay: statsDelay + i * 120, ease: 'Quad.easeOut',
      });
    });

    // ── Nuevo High Score ──────────────────────────────────────────────────────
    if (isNewHi && score > 0) {
      const newHiY = statsY + statsData.length * 38 + 10;
      const hiText = this.add.text(GW / 2, newHiY, '🎉 ¡NUEVO RÉCORD PERSONAL! 🎉', {
        fontFamily: 'monospace', fontSize: '14px', color: '#ffee33', fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: hiText,
        alpha: { from: 0, to: 1 }, duration: 400, delay: statsDelay + 500,
        onComplete: () => {
          this.tweens.add({
            targets: hiText,
            alpha: { from: 1, to: 0.3 },
            duration: 600, yoyo: true, repeat: -1,
          });
        },
      });
    }

    // ── Botones ───────────────────────────────────────────────────────────────
    const btnY = GH / 2 + 120;

    // Botón PLAY AGAIN
    const btnPlay = this.add.rectangle(GW / 2 - 115, btnY, 200, 48, 0x003300).setAlpha(0);
    btnPlay.setStrokeStyle(2, 0x00ff44);
    btnPlay.setInteractive({ useHandCursor: true });

    const btnPlayTxt = this.add.text(GW / 2 - 115, btnY, '▶ JUGAR DE NUEVO', {
      fontFamily: 'monospace', fontSize: '14px', color: '#00ff44', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    // Botón MENÚ
    const btnMenu = this.add.rectangle(GW / 2 + 115, btnY, 200, 48, 0x100020).setAlpha(0);
    btnMenu.setStrokeStyle(2, 0x8844ff);
    btnMenu.setInteractive({ useHandCursor: true });

    const btnMenuTxt = this.add.text(GW / 2 + 115, btnY, '🏠 MENÚ PRINCIPAL', {
      fontFamily: 'monospace', fontSize: '14px', color: '#cc88ff', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    // Animación de entrada de botones
    const btnDelay = statsDelay + 600;
    this.tweens.add({
      targets: [btnPlay, btnPlayTxt, btnMenu, btnMenuTxt],
      alpha: 1, duration: 350, delay: btnDelay,
    });

    // Pulso del botón play
    this.time.delayedCall(btnDelay + 350, () => {
      this.tweens.add({
        targets: [btnPlay, btnPlayTxt],
        alpha: { from: 1, to: 0.65 },
        duration: 600, yoyo: true, repeat: -1,
      });
    });

    // Handlers de botones
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

    // Teclas
    this.input.keyboard?.once('keydown-SPACE', goToGame);
    this.input.keyboard?.once('keydown-ENTER', goToGame);
    this.input.keyboard?.once('keydown-ESC',   goToMenu);

    // ── Partículas de confeti (solo en victoria) ──────────────────────────────
    if (won) {
      this.time.delayedCall(300, () => {
        const colors = [0x00ff88, 0xffee33, 0xff6699, 0x33ccff, 0xff9900];
        for (let i = 0; i < 30; i++) {
          const cx = Phaser.Math.Between(100, GW - 100);
          const cy = Phaser.Math.Between(50, 200);
          const color = Phaser.Utils.Array.GetRandom(colors) as number;
          const rect = this.add.rectangle(cx, cy, 6, 6, color);
          this.tweens.add({
            targets: rect,
            x: cx + Phaser.Math.Between(-60, 60),
            y: cy + Phaser.Math.Between(80, 200),
            alpha: { from: 1, to: 0 },
            angle: Phaser.Math.Between(-180, 180),
            duration: Phaser.Math.Between(800, 1800),
            delay: Phaser.Math.Between(0, 600),
            ease: 'Quad.easeIn',
            onComplete: () => rect.destroy(),
          });
        }
      });
    }

    // ── Instrucción teclado ───────────────────────────────────────────────────
    this.time.delayedCall(btnDelay + 800, () => {
      this.add.text(GW / 2, GH - 22, 'SPACE / ENTER = Jugar de nuevo  ·  ESC = Menú', {
        fontFamily: 'monospace', fontSize: '11px', color: '#444466',
      }).setOrigin(0.5);
    });

    // ── Enemigo decorativo derrotado (solo game over) ─────────────────────────
    if (!won) {
      const zombie = this.add.image(680, GH - 40, 'zombie').setOrigin(0.5, 1).setAlpha(0.35);
      this.tweens.add({
        targets: zombie, angle: { from: 0, to: 15 },
        duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    } else {
      const player = this.add.image(680, GH - 40, 'player').setOrigin(0.5, 1).setAlpha(0.5);
      this.tweens.add({
        targets: player, y: GH - 48,
        duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // ── Fade in ───────────────────────────────────────────────────────────────
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}
