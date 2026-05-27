import Phaser from 'phaser';
import { GW, GH } from './constants';
import { BootScene }    from './scenes/BootScene';
import { MenuScene }    from './scenes/MenuScene';
import { GameScene }    from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { CRTScene }      from './scenes/CRTScene';

// =====================================================
// 🎮 ICFES SHOOTER — Entry point
// =====================================================
new Phaser.Game({
  type: Phaser.AUTO,          // WebGL con fallback a Canvas
  width:  GW,                 // 800
  height: GH,                 // 480
  backgroundColor: '#000000',
  parent: 'game-container',

  // Pixel art nítido (sin anti-aliasing)
  pixelArt: true,
  antialias: false,
  roundPixels: true,

  // Escala adaptativa (desktop + móvil)
  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  // Física (Arcade para colisiones simples si se necesita)
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },

  // Escenas en orden de carga
  scene: [BootScene, MenuScene, GameScene, GameOverScene, CRTScene],
});
