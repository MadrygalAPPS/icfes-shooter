import Phaser from 'phaser';
import { GW, GH } from '../constants';

// =====================================================
// 📺 CRT SCENE — Overlay de efecto retro
//    Corre en paralelo sobre cualquier escena activa
// =====================================================
export class CRTScene extends Phaser.Scene {
  constructor() { super({ key: 'CRT', active: false }); }

  create(): void {
    // ── Scanlines: tile de 1×4 (2px claro + 2px oscuro) ──────────────────
    const scanTex = this.textures.createCanvas('scanlines', 2, 4);
    if (scanTex) {
      const ctx = scanTex.getContext();
      ctx.clearRect(0, 0, 2, 4);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0, 2, 2, 2);
      scanTex.refresh();
    }

    this.add.tileSprite(0, 0, GW, GH, 'scanlines')
      .setOrigin(0)
      .setDepth(200)
      .setScrollFactor(0);

    // ── Viñeta: oscurecimiento en las 4 esquinas ──────────────────────────
    const vigTex = this.textures.createCanvas('vignette', GW, GH);
    if (vigTex) {
      const ctx = vigTex.getContext();
      // Gradiente radial desde el centro (transparente) hacia los bordes (negro)
      const grad = ctx.createRadialGradient(
        GW / 2, GH / 2, GH * 0.15,
        GW / 2, GH / 2, GH * 0.78,
      );
      grad.addColorStop(0,   'rgba(0,0,0,0)');
      grad.addColorStop(0.6, 'rgba(0,0,0,0.1)');
      grad.addColorStop(1,   'rgba(0,0,0,0.72)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, GW, GH);
      vigTex.refresh();
    }

    this.add.image(GW / 2, GH / 2, 'vignette')
      .setDepth(201)
      .setScrollFactor(0);

    // ── Aberración cromática en bordes laterales ──────────────────────────
    // Franja roja izquierda
    const leftGrad = this.add.rectangle(0, GH / 2, 40, GH, 0xff0000, 0)
      .setOrigin(0, 0.5).setDepth(202).setScrollFactor(0);
    this.tweens.add({
      targets: leftGrad,
      alpha: { from: 0, to: 0.025 },
      duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    // Franja azul derecha
    const rightGrad = this.add.rectangle(GW, GH / 2, 40, GH, 0x0000ff, 0)
      .setOrigin(1, 0.5).setDepth(202).setScrollFactor(0);
    this.tweens.add({
      targets: rightGrad,
      alpha: { from: 0, to: 0.025 },
      duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      delay: 1000,
    });

    // ── Parpadeo de pantalla (CRT flicker) ───────────────────────────────
    const flicker = this.add.rectangle(GW / 2, GH / 2, GW, GH, 0x000000, 0)
      .setDepth(203).setScrollFactor(0);

    // Parpadeo ocasional (cada 3-7 segundos)
    const scheduleFlicker = () => {
      const delay = Phaser.Math.Between(3000, 7000);
      this.time.delayedCall(delay, () => {
        // Flash muy rápido
        this.tweens.add({
          targets: flicker,
          alpha: { from: 0.08, to: 0 },
          duration: 60, ease: 'Linear',
          onComplete: () => {
            this.time.delayedCall(40, () => {
              this.tweens.add({
                targets: flicker,
                alpha: { from: 0.05, to: 0 },
                duration: 80,
                onComplete: scheduleFlicker,
              });
            });
          },
        });
      });
    };
    scheduleFlicker();

    // ── Línea de escaneo (horizontal scan line que baja) ─────────────────
    const scanLine = this.add.rectangle(GW / 2, -2, GW, 3, 0x88ffaa, 0.06)
      .setDepth(204).setScrollFactor(0);

    this.tweens.add({
      targets: scanLine,
      y: { from: -2, to: GH + 2 },
      duration: 3500,
      repeat: -1,
      ease: 'Linear',
    });
  }
}
