import Phaser from 'phaser';
import { C, GW, GH } from '../constants';

// =====================================================
// 🔧 BOOT SCENE — Genera todas las texturas pixel art
//    V2 — sprites mejorados con shading, outlines y
//    más detalle en cada personaje y el escenario
// =====================================================

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create(): void {
    this.createSprites();
    this.scene.start('Menu');
  }

  // ── Helper canvas ────────────────────────────────────────────────────────
  private px(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): void {
    const tex = this.textures.createCanvas(key, w, h);
    if (!tex) return;
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    draw(ctx);
    tex.refresh();
  }

  private hex(n: number): string {
    return '#' + n.toString(16).padStart(6, '0');
  }

  // ── Helper: rect relleno con outline automático (1px outline negro) ───────
  private ro(
    c: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    fill: string, outline = '#000000'
  ): void {
    c.fillStyle = outline;
    c.fillRect(x - 1, y - 1, w + 2, h + 2);
    c.fillStyle = fill;
    c.fillRect(x, y, w, h);
  }

  // ────────────────────────────────────────────────────────────────────────
  private createSprites(): void {
    this.makePlayer();
    this.makePlayerShoot();
    this.makeZombie();
    this.makeSkeleton();
    this.makeVampire();
    this.makeGolem();
    this.makeDragon();
    this.makeBullet();
    this.makeDoubleBullet();
    this.makeGrenade();
    this.makeExplosion();
    this.makeShield();
    this.makeParticleTextures();
    this.makeEnemyAnimFrames();
    this.makeHeart();
    this.makeHeartEmpty();
    this.makeBackground();
    this.makeStar();
    this.makeMoon();
    this.makeGround();
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🧍 JUGADOR (54×68)  — soldado militar estilizado
  // ════════════════════════════════════════════════════════════════════════
  private makePlayer(): void {
    this.px('player', 54, 68, (c) => {
      // ── Casco ──
      c.fillStyle = '#1a2410'; c.fillRect(12, 0, 28, 4);   // outline top
      c.fillStyle = '#3a4a28'; c.fillRect(10, 2, 32, 6);   // brim
      c.fillStyle = '#4a6030'; c.fillRect(12, 4, 28, 2);   // brim highlight
      c.fillStyle = '#3a4a28'; c.fillRect(8,  6, 36, 8);   // casco body
      c.fillStyle = '#2a3418'; c.fillRect(8,  12, 36, 2);  // casco shadow
      c.fillStyle = '#5a7040'; c.fillRect(12, 6, 12, 3);   // highlight izq
      // visera
      c.fillStyle = '#1a2010'; c.fillRect(8, 14, 36, 3);

      // ── Cara ──
      c.fillStyle = '#cc9966'; c.fillRect(10, 17, 32, 14); // cara sombra
      c.fillStyle = '#ffd8a0'; c.fillRect(12, 17, 28, 12); // cara
      c.fillStyle = '#ffecc0'; c.fillRect(12, 17, 28, 4);  // frente highlight
      // ojos
      c.fillStyle = '#1a0a00'; c.fillRect(15, 21, 8, 5);   // ojo izq bg
      c.fillStyle = '#1a0a00'; c.fillRect(29, 21, 8, 5);
      c.fillStyle = '#4488ff'; c.fillRect(16, 22, 5, 3);   // iris azul
      c.fillStyle = '#4488ff'; c.fillRect(30, 22, 5, 3);
      c.fillStyle = '#000000'; c.fillRect(17, 22, 3, 3);   // pupila
      c.fillStyle = '#000000'; c.fillRect(31, 22, 3, 3);
      c.fillStyle = '#ffffff'; c.fillRect(17, 22, 1, 1);   // reflejo
      c.fillStyle = '#ffffff'; c.fillRect(31, 22, 1, 1);
      // boca / mandíbula
      c.fillStyle = '#cc9966'; c.fillRect(10, 29, 32, 2);  // chin line
      c.fillStyle = '#553322'; c.fillRect(20, 27, 12, 3);  // boca

      // ── Cuello ──
      c.fillStyle = '#cc9966'; c.fillRect(18, 31, 16, 4);

      // ── Cuerpo / armadura ──
      c.fillStyle = '#0a1a44'; c.fillRect(6,  35, 40, 20); // outline cuerpo
      c.fillStyle = '#1133aa'; c.fillRect(8,  35, 36, 18); // cuerpo dark
      c.fillStyle = '#2255cc'; c.fillRect(10, 35, 30, 16); // cuerpo base
      c.fillStyle = '#4488ee'; c.fillRect(10, 35, 30,  4); // pecho highlight
      // placas de armadura
      c.fillStyle = '#335599'; c.fillRect(14, 39, 24, 2);
      c.fillStyle = '#335599'; c.fillRect(14, 44, 24, 2);
      c.fillStyle = '#1a3388'; c.fillRect(18, 35, 16, 18); // línea central
      c.fillStyle = '#2255cc'; c.fillRect(19, 36, 14, 16);
      // insignia en el pecho
      c.fillStyle = '#ffcc00'; c.fillRect(22, 38, 8, 6);
      c.fillStyle = '#ffee88'; c.fillRect(24, 39, 4, 4);
      c.fillStyle = '#cc9900'; c.fillRect(23, 40, 1, 2);
      c.fillStyle = '#cc9900'; c.fillRect(28, 40, 1, 2);

      // ── Hombro y brazo izquierdo ──
      c.fillStyle = '#0a1a44'; c.fillRect(0, 33, 10, 16);  // outline
      c.fillStyle = '#1133aa'; c.fillRect(1, 34, 8, 14);
      c.fillStyle = '#2255cc'; c.fillRect(2, 34, 6, 12);
      c.fillStyle = '#4488ee'; c.fillRect(2, 34, 6, 3);    // shoulder pad
      // guante
      c.fillStyle = '#221100'; c.fillRect(0, 46, 8, 6);
      c.fillStyle = '#331a00'; c.fillRect(1, 47, 6, 4);

      // ── Arma (rifle) ──
      c.fillStyle = '#1a1a1a'; c.fillRect(36, 34, 22, 8);  // cañón outline
      c.fillStyle = '#555555'; c.fillRect(37, 35, 20, 6);  // cañón
      c.fillStyle = '#888888'; c.fillRect(37, 35, 20, 2);  // highlight
      c.fillStyle = '#333333'; c.fillRect(37, 39, 14, 2);  // shadow cañón
      // culata
      c.fillStyle = '#8b5e3c'; c.fillRect(34, 37, 6, 4);
      c.fillStyle = '#aa7a55'; c.fillRect(34, 37, 6, 2);
      // boca del cañón
      c.fillStyle = '#111111'; c.fillRect(55, 33, 4, 10);
      c.fillStyle = '#333333'; c.fillRect(56, 34, 2, 8);

      // ── Pantalón ──
      c.fillStyle = '#0d1018'; c.fillRect(8, 53, 16, 14);  // pierna izq
      c.fillStyle = '#111520'; c.fillRect(9, 53, 14, 12);
      c.fillStyle = '#0d1018'; c.fillRect(28, 53, 16, 14); // pierna der
      c.fillStyle = '#111520'; c.fillRect(29, 53, 14, 12);
      c.fillStyle = '#1a2030'; c.fillRect(10, 53, 10, 4);  // highlight pierna
      c.fillStyle = '#1a2030'; c.fillRect(30, 53, 10, 4);

      // ── Botas ──
      c.fillStyle = '#050508'; c.fillRect(6, 60, 20, 8);   // bota izq
      c.fillStyle = '#0a0a12'; c.fillRect(7, 60, 18, 6);
      c.fillStyle = '#1a1a2a'; c.fillRect(7, 60, 14, 2);   // highlight
      c.fillStyle = '#050508'; c.fillRect(26, 60, 20, 8);  // bota der
      c.fillStyle = '#0a0a12'; c.fillRect(27, 60, 18, 6);
      c.fillStyle = '#1a1a2a'; c.fillRect(27, 60, 14, 2);
    });
  }

  // ── JUGADOR disparando (igual + muzzle flash) ───────────────────────────
  private makePlayerShoot(): void {
    this.px('player_shoot', 62, 68, (c) => {
      // Copiar player (simplificado)
      c.fillStyle = '#3a4a28'; c.fillRect(8, 2, 32, 14);
      c.fillStyle = '#4a6030'; c.fillRect(12, 4, 28, 2);
      c.fillStyle = '#ffd8a0'; c.fillRect(12, 17, 28, 12);
      c.fillStyle = '#4488ff'; c.fillRect(16, 22, 5, 3);
      c.fillStyle = '#4488ff'; c.fillRect(30, 22, 5, 3);
      c.fillStyle = '#000000'; c.fillRect(17, 22, 3, 3);
      c.fillStyle = '#000000'; c.fillRect(31, 22, 3, 3);
      c.fillStyle = '#2255cc'; c.fillRect(8, 35, 36, 18);
      c.fillStyle = '#4488ee'; c.fillRect(10, 35, 30, 4);
      c.fillStyle = '#ffcc00'; c.fillRect(22, 38, 8, 6);
      c.fillStyle = '#1133aa'; c.fillRect(1, 34, 8, 14);
      c.fillStyle = '#555555'; c.fillRect(37, 35, 20, 6);
      c.fillStyle = '#8b5e3c'; c.fillRect(34, 37, 6, 4);
      c.fillStyle = '#111111'; c.fillRect(55, 33, 4, 10);
      c.fillStyle = '#111520'; c.fillRect(9, 53, 14, 12);
      c.fillStyle = '#111520'; c.fillRect(29, 53, 14, 12);
      c.fillStyle = '#0a0a12'; c.fillRect(7, 60, 18, 6);
      c.fillStyle = '#0a0a12'; c.fillRect(27, 60, 18, 6);
      // Flash del disparo
      c.fillStyle = 'rgba(255,220,0,0.9)';
      c.fillRect(57, 28, 10, 20);
      c.fillStyle = 'rgba(255,255,100,0.8)';
      c.fillRect(58, 30, 8, 16);
      c.fillStyle = 'rgba(255,255,255,0.95)';
      c.fillRect(59, 33, 5, 10);
      // Chispas
      c.fillStyle = '#ffff88';
      c.fillRect(62, 29, 3, 3);
      c.fillRect(62, 41, 3, 3);
      c.fillRect(60, 26, 2, 2);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🧟 ZOMBIE (44×60)  — caminante putrefacto
  // ════════════════════════════════════════════════════════════════════════
  private makeZombie(): void {
    this.px('zombie', 44, 60, (c) => {
      // Paleta
      const G  = '#5aaa40'; // verde piel
      const GD = '#2a5a20'; // verde oscuro
      const GL = '#7acc55'; // verde claro (highlight)
      const ER = '#ff2200'; // ojo rojo
      const BD = '#221408'; // ropa dark
      const BL = '#cc1100'; // sangre

      // ── Outline general: sombra de cuerpo ──
      c.fillStyle = '#0a1a08';
      c.fillRect(6, 0, 28, 24); // cabeza outline
      c.fillRect(4, 22, 36, 24);// cuerpo outline

      // ── Cabeza inclinada ──
      c.fillStyle = GD; c.fillRect(8,  2, 24, 20);  // base
      c.fillStyle = G;  c.fillRect(9,  2, 22, 18);  // fill
      c.fillStyle = GL; c.fillRect(10, 2, 14,  4);  // highlight superior
      // manchas de descomposición
      c.fillStyle = GD; c.fillRect(10, 6, 7, 7);
      c.fillStyle = GD; c.fillRect(22, 4, 5, 6);
      c.fillStyle = GD; c.fillRect(14, 14, 4, 5);
      // herida en cabeza
      c.fillStyle = BL;  c.fillRect(20, 8, 6, 3);
      c.fillStyle = '#880000'; c.fillRect(21, 9, 4, 2);
      // ── Ojos ──
      c.fillStyle = '#000000'; c.fillRect(10, 8, 8, 6);
      c.fillStyle = '#000000'; c.fillRect(22, 8, 8, 6);
      c.fillStyle = ER; c.fillRect(11, 9, 6, 4);
      c.fillStyle = ER; c.fillRect(23, 9, 6, 4);
      c.fillStyle = '#ff8888'; c.fillRect(12, 9, 3, 2); // glow
      c.fillStyle = '#ff8888'; c.fillRect(24, 9, 3, 2);
      // ── Nariz podrida ──
      c.fillStyle = GD; c.fillRect(15, 14, 4, 4);
      c.fillStyle = '#0a0a0a'; c.fillRect(16, 15, 1, 2);
      c.fillStyle = '#0a0a0a'; c.fillRect(18, 15, 1, 2);
      // ── Boca abierta con dientes ──
      c.fillStyle = '#0a0a0a'; c.fillRect(10, 18, 20, 5);
      c.fillStyle = '#ccccbb'; c.fillRect(11, 18, 3, 4); // dientes
      c.fillStyle = '#ccccbb'; c.fillRect(15, 18, 3, 3);
      c.fillStyle = '#ccccbb'; c.fillRect(19, 18, 3, 4);
      c.fillStyle = '#ccccbb'; c.fillRect(23, 18, 3, 3);
      c.fillStyle = BL; c.fillRect(12, 20, 16, 2); // sangre
      // ── Cuello ──
      c.fillStyle = GD; c.fillRect(14, 22, 12, 5);
      c.fillStyle = G;  c.fillRect(15, 22, 10, 4);

      // ── Cuerpo harapiento ──
      c.fillStyle = '#1a1008'; c.fillRect(5, 27, 32, 22); // outline
      c.fillStyle = BD;  c.fillRect(6, 27, 30, 20);
      c.fillStyle = '#3a2818'; c.fillRect(8, 27, 26, 8); // highlight
      // rasgaduras en la ropa
      c.fillStyle = G; c.fillRect(10, 30, 5, 8);  // piel visible izq
      c.fillStyle = G; c.fillRect(26, 32, 5, 10);
      c.fillStyle = BL; c.fillRect(14, 34, 10, 5); // mancha sangre
      c.fillStyle = '#880000'; c.fillRect(15, 35, 8, 3);
      // herida en torso
      c.fillStyle = '#0a0a0a'; c.fillRect(18, 31, 6, 8);
      c.fillStyle = BL; c.fillRect(19, 32, 4, 6);
      c.fillStyle = '#ffcccc'; c.fillRect(20, 33, 2, 4); // hueso visible

      // ── Brazos extendidos (zombie arms!) ──
      // Brazo izquierdo
      c.fillStyle = GD; c.fillRect(0, 25, 8, 10);
      c.fillStyle = G;  c.fillRect(0, 26, 7, 8);
      c.fillStyle = GL; c.fillRect(0, 26, 5, 2);
      // dedos izq
      c.fillStyle = G; c.fillRect(0, 30, 2, 5);
      c.fillStyle = G; c.fillRect(2, 32, 2, 6);
      c.fillStyle = G; c.fillRect(4, 31, 2, 5);

      // Brazo derecho (extendido hacia el jugador = izquierda del sprite)
      c.fillStyle = GD; c.fillRect(34, 23, 10, 10);
      c.fillStyle = G;  c.fillRect(34, 24, 9, 8);
      c.fillStyle = GL; c.fillRect(34, 24, 7, 2);
      // dedos der
      c.fillStyle = G; c.fillRect(42, 28, 2, 5);
      c.fillStyle = G; c.fillRect(40, 30, 2, 6);
      c.fillStyle = G; c.fillRect(38, 29, 2, 5);

      // ── Piernas ──
      c.fillStyle = '#1a1008'; c.fillRect(7, 49, 13, 12);  // outline izq
      c.fillStyle = '#1a1008'; c.fillRect(23, 49, 13, 12); // outline der
      c.fillStyle = BD; c.fillRect(8, 49, 11, 10);
      c.fillStyle = BD; c.fillRect(24, 49, 11, 10);
      c.fillStyle = '#3a2818'; c.fillRect(9, 49, 7, 4);
      c.fillStyle = '#3a2818'; c.fillRect(25, 49, 7, 4);
      // pies podridos
      c.fillStyle = G;  c.fillRect(6, 56, 15, 4);
      c.fillStyle = GD; c.fillRect(6, 58, 15, 2);
      c.fillStyle = G;  c.fillRect(22, 56, 15, 4);
      c.fillStyle = GD; c.fillRect(22, 58, 15, 2);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 💀 ESQUELETO (38×62)  — guerrero de huesos
  // ════════════════════════════════════════════════════════════════════════
  private makeSkeleton(): void {
    this.px('skeleton', 38, 62, (c) => {
      const BN = '#ddddcc'; // hueso
      const BD = '#888877'; // sombra hueso
      const BH = '#eeeedd'; // highlight hueso
      const EG = '#00ffff'; // brillo ojos
      const ED = '#004444'; // oscuro ojos

      // ── Cráneo ──
      c.fillStyle = '#222211'; c.fillRect(7, 0, 22, 22); // outline
      c.fillStyle = BD; c.fillRect(8, 1, 20, 20);
      c.fillStyle = BN; c.fillRect(9, 2, 18, 18);
      c.fillStyle = BH; c.fillRect(10, 2, 12, 5);  // highlight

      // Cuencas de los ojos
      c.fillStyle = '#000000'; c.fillRect(10, 6, 7, 8);
      c.fillStyle = '#000000'; c.fillRect(19, 6, 7, 8);
      c.fillStyle = EG; c.fillRect(11, 7, 5, 6);
      c.fillStyle = EG; c.fillRect(20, 7, 5, 6);
      c.fillStyle = ED; c.fillRect(12, 8, 3, 4);  // pupila
      c.fillStyle = ED; c.fillRect(21, 8, 3, 4);
      // Grieta en cráneo
      c.fillStyle = BD; c.fillRect(17, 2, 2, 8);
      c.fillStyle = '#aaaaaa'; c.fillRect(17, 3, 1, 6);

      // Nariz (solo cavidad)
      c.fillStyle = '#111111'; c.fillRect(15, 14, 7, 5);
      c.fillStyle = BD; c.fillRect(16, 14, 5, 4);

      // ── Mandíbula ──
      c.fillStyle = BD; c.fillRect(8, 19, 20, 8);
      c.fillStyle = BN; c.fillRect(9, 19, 18, 6);
      // Dientes
      c.fillStyle = '#ccccaa'; c.fillRect(10, 20, 3, 5);
      c.fillStyle = '#ccccaa'; c.fillRect(14, 20, 3, 6);
      c.fillStyle = '#ccccaa'; c.fillRect(18, 20, 3, 5);
      c.fillStyle = '#ccccaa'; c.fillRect(22, 20, 3, 6);
      c.fillStyle = '#888866'; c.fillRect(11, 23, 2, 2); // sombra diente
      c.fillStyle = '#888866'; c.fillRect(15, 23, 2, 2);
      c.fillStyle = '#888866'; c.fillRect(19, 23, 2, 2);
      c.fillStyle = '#888866'; c.fillRect(23, 23, 2, 2);

      // ── Columna vertebral ──
      c.fillStyle = BD; c.fillRect(15, 27, 8, 18);
      c.fillStyle = BN; c.fillRect(16, 27, 6, 17);
      // Vértebras
      for (let y = 27; y < 44; y += 5) {
        c.fillStyle = BH; c.fillRect(16, y, 6, 2);
        c.fillStyle = BD; c.fillRect(16, y + 3, 6, 2);
      }

      // ── Costillas ──
      c.fillStyle = BD; c.fillRect(5, 28, 26, 3);
      c.fillStyle = BN; c.fillRect(6, 28, 24, 2);
      c.fillStyle = BH; c.fillRect(6, 28, 12, 1);

      c.fillStyle = BD; c.fillRect(5, 33, 26, 3);
      c.fillStyle = BN; c.fillRect(6, 33, 24, 2);
      c.fillStyle = BH; c.fillRect(6, 33, 10, 1);

      c.fillStyle = BD; c.fillRect(6, 38, 24, 3);
      c.fillStyle = BN; c.fillRect(7, 38, 22, 2);

      // ── Cadera ──
      c.fillStyle = BD; c.fillRect(8, 44, 22, 6);
      c.fillStyle = BN; c.fillRect(9, 44, 20, 5);
      c.fillStyle = BH; c.fillRect(10, 44, 12, 2);

      // ── Brazos ──
      // Brazo izquierdo (con espada)
      c.fillStyle = BD; c.fillRect(0, 26, 8, 6);
      c.fillStyle = BN; c.fillRect(0, 27, 7, 4);
      c.fillStyle = BD; c.fillRect(0, 32, 6, 6);
      c.fillStyle = BN; c.fillRect(0, 33, 5, 4);
      // mano y espada
      c.fillStyle = BN; c.fillRect(0, 38, 5, 5);
      c.fillStyle = '#aaaaaa'; c.fillRect(1, 20, 3, 22); // hoja espada
      c.fillStyle = '#cccccc'; c.fillRect(1, 20, 1, 20); // brillo hoja
      c.fillStyle = '#888800'; c.fillRect(0, 42, 5, 3);  // guardia dorada
      c.fillStyle = '#ffcc00'; c.fillRect(0, 43, 5, 2);  // guardia highlight
      c.fillStyle = '#666644'; c.fillRect(1, 16, 2, 5);  // punta
      c.fillStyle = '#bbbbbb'; c.fillRect(1, 15, 2, 3);

      // Brazo derecho
      c.fillStyle = BD; c.fillRect(30, 26, 8, 6);
      c.fillStyle = BN; c.fillRect(31, 27, 7, 4);
      c.fillStyle = BD; c.fillRect(32, 32, 6, 6);
      c.fillStyle = BN; c.fillRect(32, 33, 5, 4);
      c.fillStyle = BN; c.fillRect(33, 38, 5, 5);

      // ── Piernas ──
      c.fillStyle = BD; c.fillRect(9, 50, 8, 12);
      c.fillStyle = BN; c.fillRect(10, 50, 6, 11);
      c.fillStyle = BH; c.fillRect(10, 50, 4, 2);
      c.fillStyle = BD; c.fillRect(21, 50, 8, 12);
      c.fillStyle = BN; c.fillRect(21, 50, 6, 11);
      c.fillStyle = BH; c.fillRect(21, 50, 4, 2);
      // pie (forma de boot)
      c.fillStyle = BN; c.fillRect(7, 58, 12, 4);
      c.fillStyle = BN; c.fillRect(20, 58, 12, 4);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🧛 VAMPIRO (46×70)  — señor de la oscuridad
  // ════════════════════════════════════════════════════════════════════════
  private makeVampire(): void {
    this.px('vampire', 46, 70, (c) => {
      const CP = '#550066'; // capa púrpura
      const CD = '#330044'; // capa dark
      const CH = '#7700aa'; // capa highlight
      const SK = '#ddeeff'; // piel pálida
      const SD = '#aabbdd'; // piel sombra
      const BD = '#220033'; // traje oscuro
      const EY = '#ff0000'; // ojo rojo

      // ── Capa trasera (grande, atrás de todo) ──
      c.fillStyle = '#1a0022'; c.fillRect(0, 18, 46, 52); // outline capa
      c.fillStyle = CD; c.fillRect(1, 20, 44, 50);
      c.fillStyle = CP; c.fillRect(3, 20, 40, 48);
      // pliegues de la capa
      c.fillStyle = CD; c.fillRect(10, 22, 4, 44);
      c.fillStyle = CD; c.fillRect(20, 20, 3, 46);
      c.fillStyle = CD; c.fillRect(30, 24, 4, 42);
      c.fillStyle = CH; c.fillRect(4, 22, 4, 44);
      c.fillStyle = CH; c.fillRect(13, 20, 3, 46);

      // ── Interior de la capa (rojo oscuro) ──
      c.fillStyle = '#440000'; c.fillRect(14, 28, 18, 42);
      c.fillStyle = '#550000'; c.fillRect(15, 28, 16, 40);
      c.fillStyle = '#331100'; c.fillRect(16, 32, 14, 10);

      // ── Cuerpo / traje ──
      c.fillStyle = '#0a0010'; c.fillRect(12, 26, 22, 30); // outline
      c.fillStyle = BD; c.fillRect(13, 26, 20, 28);
      // solapa blanca
      c.fillStyle = '#eeeeff'; c.fillRect(17, 28, 5, 14);
      c.fillStyle = '#eeeeff'; c.fillRect(24, 28, 5, 14);
      c.fillStyle = '#ccccdd'; c.fillRect(18, 30, 3, 12);
      c.fillStyle = '#ccccdd'; c.fillRect(25, 30, 3, 12);
      // botón/broche
      c.fillStyle = '#ffcc00'; c.fillRect(21, 26, 4, 4);
      c.fillStyle = '#ffee88'; c.fillRect(22, 27, 2, 2);

      // ── Cuello ──
      c.fillStyle = SD; c.fillRect(17, 16, 12, 12);
      c.fillStyle = SK; c.fillRect(18, 16, 10, 10);

      // ── Cabeza ──
      c.fillStyle = '#0a0010'; c.fillRect(8, 0, 30, 20);  // outline
      c.fillStyle = SD; c.fillRect(9, 1, 28, 18);
      c.fillStyle = SK; c.fillRect(10, 1, 26, 16);
      c.fillStyle = '#eeffff'; c.fillRect(12, 1, 16, 5);  // frente highlight

      // Pelo negro con viuda
      c.fillStyle = '#0a0010'; c.fillRect(9, 1, 28, 6);   // pelo
      c.fillStyle = '#111122'; c.fillRect(10, 1, 26, 5);
      c.fillStyle = '#0a0010'; c.fillRect(9, 1, 5, 12);   // sienes
      c.fillStyle = '#111122'; c.fillRect(10, 2, 4, 10);
      c.fillStyle = '#0a0010'; c.fillRect(32, 1, 5, 12);
      c.fillStyle = '#111122'; c.fillRect(32, 2, 4, 10);
      // pico de viuda
      c.fillStyle = '#0a0010'; c.fillRect(20, 1, 6, 4);
      c.fillStyle = '#111122'; c.fillRect(21, 2, 4, 3);

      // ── Cejas amenazantes ──
      c.fillStyle = '#0a0010'; c.fillRect(12, 7, 8, 2);
      c.fillStyle = '#0a0010'; c.fillRect(26, 7, 8, 2);

      // ── Ojos rojos brillantes ──
      c.fillStyle = '#000000'; c.fillRect(12, 8, 8, 6);
      c.fillStyle = '#000000'; c.fillRect(26, 8, 8, 6);
      c.fillStyle = EY; c.fillRect(13, 9, 6, 4);
      c.fillStyle = EY; c.fillRect(27, 9, 6, 4);
      c.fillStyle = '#ff8888'; c.fillRect(14, 9, 3, 2);  // glow
      c.fillStyle = '#ff8888'; c.fillRect(28, 9, 3, 2);
      c.fillStyle = '#ffcccc'; c.fillRect(14, 10, 1, 1); // reflejo
      c.fillStyle = '#ffcccc'; c.fillRect(28, 10, 1, 1);

      // ── Nariz elegante ──
      c.fillStyle = SD; c.fillRect(20, 12, 6, 4);
      c.fillStyle = '#8899bb'; c.fillRect(21, 13, 1, 2);
      c.fillStyle = '#8899bb'; c.fillRect(24, 13, 1, 2);

      // ── Boca con colmillos ──
      c.fillStyle = SD; c.fillRect(14, 15, 18, 3);      // sombra
      c.fillStyle = '#000000'; c.fillRect(15, 15, 16, 2); // boca
      c.fillStyle = '#ffffff'; c.fillRect(17, 14, 3, 4); // colmillo izq
      c.fillStyle = '#ffffff'; c.fillRect(26, 14, 3, 4); // colmillo der
      c.fillStyle = '#ffaaaa'; c.fillRect(18, 15, 2, 3); // sangre
      c.fillStyle = '#ffaaaa'; c.fillRect(27, 15, 2, 3);

      // ── Manos (saliendo de la capa) ──
      c.fillStyle = SD; c.fillRect(1, 36, 8, 8);
      c.fillStyle = SK; c.fillRect(2, 36, 6, 7);
      // dedos
      c.fillStyle = SK; c.fillRect(0, 40, 2, 5);
      c.fillStyle = SK; c.fillRect(2, 41, 2, 5);
      c.fillStyle = SK; c.fillRect(4, 42, 2, 4);
      // uñas
      c.fillStyle = '#221100'; c.fillRect(0, 44, 2, 1);
      c.fillStyle = '#221100'; c.fillRect(2, 45, 2, 1);
      c.fillStyle = SD; c.fillRect(38, 36, 8, 8);
      c.fillStyle = SK; c.fillRect(38, 36, 6, 7);
      c.fillStyle = SK; c.fillRect(44, 40, 2, 5);
      c.fillStyle = SK; c.fillRect(42, 41, 2, 5);
      c.fillStyle = SK; c.fillRect(40, 42, 2, 4);
      c.fillStyle = '#221100'; c.fillRect(44, 44, 2, 1);
      c.fillStyle = '#221100'; c.fillRect(42, 45, 2, 1);

      // ── Botas puntiagudas ──
      c.fillStyle = '#0a0010'; c.fillRect(11, 60, 10, 10);
      c.fillStyle = '#111122'; c.fillRect(12, 60, 8, 9);
      c.fillStyle = '#222244'; c.fillRect(12, 60, 6, 3); // highlight
      c.fillStyle = '#0a0010'; c.fillRect(7, 68, 14, 2);  // punta
      c.fillStyle = '#0a0010'; c.fillRect(25, 60, 10, 10);
      c.fillStyle = '#111122'; c.fillRect(26, 60, 8, 9);
      c.fillStyle = '#222244'; c.fillRect(26, 60, 6, 3);
      c.fillStyle = '#0a0010'; c.fillRect(25, 68, 14, 2);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🪨 GÓLEM (60×62)  — constructor de piedra con runas
  // ════════════════════════════════════════════════════════════════════════
  private makeGolem(): void {
    this.px('golem', 60, 62, (c) => {
      const ST = '#7a5030'; // piedra base
      const SD = '#4a3020'; // piedra sombra
      const SH = '#aa7040'; // piedra highlight
      const CK = '#ffcc00'; // grieta brillante
      const CI = '#ff8800'; // interior grieta
      const CG = '#ff5500'; // glow grieta

      // ── Sombra general (outline) ──
      c.fillStyle = '#1a0a00';
      c.fillRect(6, 8, 50, 46); // body shadow
      c.fillRect(8, 0, 46, 12); // head shadow

      // ── Cabeza ──
      c.fillStyle = SD; c.fillRect(9, 1, 44, 12);
      c.fillStyle = ST; c.fillRect(10, 1, 42, 10);
      c.fillStyle = SH; c.fillRect(10, 1, 26, 4); // highlight top

      // Textura de roca en cabeza
      c.fillStyle = SD; c.fillRect(14, 3, 6, 5);
      c.fillStyle = SD; c.fillRect(34, 2, 8, 6);
      c.fillStyle = SD; c.fillRect(24, 6, 5, 5);
      c.fillStyle = SH; c.fillRect(16, 2, 4, 3);
      c.fillStyle = SH; c.fillRect(36, 3, 4, 3);

      // ── Ojos brillantes ──
      c.fillStyle = '#0a0000'; c.fillRect(14, 3, 10, 8);
      c.fillStyle = '#0a0000'; c.fillRect(38, 3, 10, 8);
      c.fillStyle = CK; c.fillRect(15, 4, 8, 6);
      c.fillStyle = CK; c.fillRect(39, 4, 8, 6);
      c.fillStyle = CI; c.fillRect(16, 4, 6, 5);
      c.fillStyle = CI; c.fillRect(40, 4, 6, 5);
      c.fillStyle = CG; c.fillRect(17, 5, 4, 3);
      c.fillStyle = CG; c.fillRect(41, 5, 4, 3);
      c.fillStyle = '#ffffff'; c.fillRect(18, 5, 2, 2);  // núcleo
      c.fillStyle = '#ffffff'; c.fillRect(42, 5, 2, 2);

      // ── Nariz/cara de roca ──
      c.fillStyle = SD; c.fillRect(26, 6, 10, 5);
      c.fillStyle = ST; c.fillRect(27, 6, 8, 4);
      c.fillStyle = '#0a0000'; c.fillRect(28, 8, 2, 3);  // fosa nasal
      c.fillStyle = '#0a0000'; c.fillRect(32, 8, 2, 3);

      // ── Grieta vertical en cara ──
      c.fillStyle = CK; c.fillRect(30, 1, 2, 10);
      c.fillStyle = CI; c.fillRect(30, 2, 1, 8);

      // ── Cuerpo enorme ──
      c.fillStyle = SD; c.fillRect(7, 13, 48, 40);
      c.fillStyle = ST; c.fillRect(9, 13, 44, 38);
      c.fillStyle = SH; c.fillRect(9, 13, 28, 6); // pecho highlight

      // Textura de piedra en cuerpo
      c.fillStyle = SD; c.fillRect(14, 16, 8, 8);
      c.fillStyle = SD; c.fillRect(40, 18, 8, 10);
      c.fillStyle = SD; c.fillRect(24, 28, 10, 8);
      c.fillStyle = SD; c.fillRect(12, 36, 8, 8);
      c.fillStyle = SD; c.fillRect(38, 34, 8, 10);
      c.fillStyle = SH; c.fillRect(16, 14, 6, 4);
      c.fillStyle = SH; c.fillRect(42, 16, 5, 4);
      c.fillStyle = SH; c.fillRect(22, 22, 8, 4);

      // ── Grietas con energía ──
      c.fillStyle = CK; c.fillRect(12, 18, 16, 2);  // grieta horizontal izq
      c.fillStyle = CI; c.fillRect(13, 19, 14, 1);
      c.fillStyle = CK; c.fillRect(34, 22, 14, 2);  // grieta horizontal der
      c.fillStyle = CI; c.fillRect(35, 23, 12, 1);
      c.fillStyle = CK; c.fillRect(28, 13, 2, 18);  // grieta vertical centro
      c.fillStyle = CI; c.fillRect(28, 14, 1, 16);
      c.fillStyle = CK; c.fillRect(18, 32, 2, 14);  // grieta izq-baja
      c.fillStyle = CI; c.fillRect(19, 33, 1, 12);
      c.fillStyle = CK; c.fillRect(42, 30, 2, 16);  // grieta der-baja
      // Nodo de energía central
      c.fillStyle = CG; c.fillRect(26, 24, 8, 8);
      c.fillStyle = CI; c.fillRect(27, 25, 6, 6);
      c.fillStyle = CK; c.fillRect(28, 26, 4, 4);
      c.fillStyle = '#ffffff'; c.fillRect(29, 27, 2, 2);

      // ── Brazos enormes ──
      c.fillStyle = '#1a0a00'; c.fillRect(0, 11, 11, 32); // outline
      c.fillStyle = SD; c.fillRect(0, 12, 10, 30);
      c.fillStyle = ST; c.fillRect(1, 12, 8, 28);
      c.fillStyle = SH; c.fillRect(1, 12, 5, 6); // shoulder highlight
      // grieta en brazo
      c.fillStyle = CK; c.fillRect(2, 22, 2, 12);
      c.fillStyle = CI; c.fillRect(2, 23, 1, 10);
      // puño izq
      c.fillStyle = SD; c.fillRect(0, 40, 12, 10);
      c.fillStyle = ST; c.fillRect(1, 40, 10, 9);
      c.fillStyle = SH; c.fillRect(1, 40, 8, 3);

      c.fillStyle = '#1a0a00'; c.fillRect(51, 11, 11, 32); // outline brazo der
      c.fillStyle = SD; c.fillRect(52, 12, 10, 30);
      c.fillStyle = ST; c.fillRect(52, 12, 8, 28);
      c.fillStyle = SH; c.fillRect(54, 12, 5, 6);
      c.fillStyle = CK; c.fillRect(58, 22, 2, 12);
      c.fillStyle = CI; c.fillRect(59, 23, 1, 10);
      c.fillStyle = SD; c.fillRect(50, 40, 12, 10);
      c.fillStyle = ST; c.fillRect(51, 40, 10, 9);
      c.fillStyle = SH; c.fillRect(52, 40, 8, 3);

      // ── Piernas ──
      c.fillStyle = '#1a0a00'; c.fillRect(10, 51, 16, 12);
      c.fillStyle = SD; c.fillRect(11, 51, 14, 10);
      c.fillStyle = ST; c.fillRect(12, 51, 12, 9);
      c.fillStyle = SH; c.fillRect(13, 51, 8, 3);
      c.fillStyle = '#1a0a00'; c.fillRect(36, 51, 16, 12);
      c.fillStyle = SD; c.fillRect(37, 51, 14, 10);
      c.fillStyle = ST; c.fillRect(38, 51, 12, 9);
      c.fillStyle = SH; c.fillRect(39, 51, 8, 3);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🐉 DRAGÓN BOSS (140×96)  — señor oscuro alado
  // ════════════════════════════════════════════════════════════════════════
  private makeDragon(): void {
    this.px('boss', 140, 96, (c) => {
      const RD  = '#cc1100'; // rojo cuerpo
      const RDK = '#880000'; // rojo oscuro
      const RLT = '#ee3322'; // rojo highlight
      const WG  = '#660000'; // ala
      const WGD = '#3a0000'; // ala dark
      const WGL = '#880000'; // ala highlight
      const BL  = '#ff5500'; // panza naranja
      const BLD = '#cc3300'; // panza dark
      const BLH = '#ff8844'; // panza highlight
      const EY  = '#ffff00'; // ojo amarillo
      const EP  = '#ff2200'; // pupila
      const FR  = '#ff8800'; // fuego
      const FY  = '#ffff00'; // fuego amarillo
      const FW  = '#ffffff'; // fuego blanco centro

      // ══ ALAS ══
      // Ala izquierda (grande, atrás)
      c.fillStyle = WGD; c.fillRect(0, 20, 40, 44);    // membrana oscura
      c.fillStyle = WG; c.fillRect(2, 22, 36, 40);
      c.fillStyle = WGL; c.fillRect(4, 24, 10, 30);     // hueso ala
      c.fillStyle = WGL; c.fillRect(14, 28, 6, 26);
      c.fillStyle = WGL; c.fillRect(24, 32, 6, 22);
      // borde ala irregular
      c.fillStyle = WGD; c.fillRect(0, 58, 14, 4);
      c.fillStyle = WGD; c.fillRect(14, 60, 12, 4);
      c.fillStyle = WGD; c.fillRect(26, 58, 10, 4);
      c.fillStyle = WGD; c.fillRect(0, 62, 6, 4);

      // Ala derecha
      c.fillStyle = WGD; c.fillRect(100, 20, 40, 44);
      c.fillStyle = WG; c.fillRect(102, 22, 36, 40);
      c.fillStyle = WGL; c.fillRect(126, 24, 10, 30);
      c.fillStyle = WGL; c.fillRect(120, 28, 6, 26);
      c.fillStyle = WGL; c.fillRect(110, 32, 6, 22);
      c.fillStyle = WGD; c.fillRect(126, 58, 14, 4);
      c.fillStyle = WGD; c.fillRect(114, 60, 12, 4);
      c.fillStyle = WGD; c.fillRect(104, 58, 10, 4);
      c.fillStyle = WGD; c.fillRect(134, 62, 6, 4);

      // ══ CUERPO PRINCIPAL ══
      c.fillStyle = '#1a0000'; c.fillRect(24, 22, 72, 58); // shadow
      c.fillStyle = RDK; c.fillRect(26, 22, 70, 56);
      c.fillStyle = RD; c.fillRect(28, 22, 66, 54);
      c.fillStyle = RLT; c.fillRect(28, 22, 40, 6);         // chest highlight
      // escamas (patrón)
      for (let sx = 28; sx < 92; sx += 8) {
        for (let sy = 28; sy < 76; sy += 6) {
          c.fillStyle = RDK; c.fillRect(sx, sy, 7, 5);
          c.fillStyle = RD;  c.fillRect(sx+1, sy+1, 5, 3);
          c.fillStyle = RLT; c.fillRect(sx+1, sy+1, 3, 1);
        }
      }

      // ── Panza ──
      c.fillStyle = '#1a0800'; c.fillRect(36, 34, 48, 36); // outline panza
      c.fillStyle = BLD; c.fillRect(37, 34, 46, 34);
      c.fillStyle = BL; c.fillRect(38, 35, 44, 32);
      c.fillStyle = BLH; c.fillRect(38, 35, 28, 6);        // highlight
      // Rayas de la panza
      for (let py = 40; py < 66; py += 8) {
        c.fillStyle = BLD; c.fillRect(38, py, 44, 4);
        c.fillStyle = BL;  c.fillRect(39, py + 1, 42, 2);
      }

      // ══ CABEZA ══
      c.fillStyle = '#1a0000'; c.fillRect(16, 4, 52, 32);  // outline
      c.fillStyle = RDK; c.fillRect(18, 5, 50, 30);
      c.fillStyle = RD; c.fillRect(20, 5, 48, 28);
      c.fillStyle = RLT; c.fillRect(20, 5, 30, 5);          // highlight
      // escamas cabeza
      c.fillStyle = RDK; c.fillRect(24, 8, 10, 8);
      c.fillStyle = RDK; c.fillRect(40, 8, 10, 8);
      c.fillStyle = RDK; c.fillRect(32, 12, 8, 8);

      // ── Cuernos ──
      // Cuerno izquierdo
      c.fillStyle = '#331100'; c.fillRect(22, 0, 8, 10);
      c.fillStyle = '#553322'; c.fillRect(23, 0, 6, 9);
      c.fillStyle = '#775544'; c.fillRect(24, 0, 4, 5);
      c.fillStyle = '#221100'; c.fillRect(24, 0, 2, 3);     // punta
      // Cuerno derecho
      c.fillStyle = '#331100'; c.fillRect(58, 0, 8, 10);
      c.fillStyle = '#553322'; c.fillRect(59, 0, 6, 9);
      c.fillStyle = '#775544'; c.fillRect(60, 0, 4, 5);
      c.fillStyle = '#221100'; c.fillRect(62, 0, 2, 3);

      // ── Ojos ──
      c.fillStyle = '#000000'; c.fillRect(22, 8, 14, 10);
      c.fillStyle = EY; c.fillRect(23, 9, 12, 8);
      c.fillStyle = '#ffee44'; c.fillRect(24, 9, 10, 6);
      c.fillStyle = EP; c.fillRect(26, 10, 6, 6);
      c.fillStyle = '#000000'; c.fillRect(27, 11, 4, 4);    // pupila vertical
      c.fillStyle = '#ffff99'; c.fillRect(25, 10, 2, 2);    // reflejo
      c.fillStyle = '#000000'; c.fillRect(48, 8, 14, 10);
      c.fillStyle = EY; c.fillRect(49, 9, 12, 8);
      c.fillStyle = '#ffee44'; c.fillRect(50, 9, 10, 6);
      c.fillStyle = EP; c.fillRect(52, 10, 6, 6);
      c.fillStyle = '#000000'; c.fillRect(53, 11, 4, 4);
      c.fillStyle = '#ffff99'; c.fillRect(51, 10, 2, 2);

      // ── Hocico / mandíbula ──
      c.fillStyle = '#1a0000'; c.fillRect(16, 22, 52, 16); // outline
      c.fillStyle = RDK; c.fillRect(17, 22, 50, 14);
      c.fillStyle = RD; c.fillRect(18, 23, 48, 12);
      c.fillStyle = RLT; c.fillRect(18, 23, 30, 3);
      // fosas nasales
      c.fillStyle = '#0a0000'; c.fillRect(24, 26, 8, 6);
      c.fillStyle = '#220000'; c.fillRect(25, 27, 6, 4);
      c.fillStyle = '#0a0000'; c.fillRect(50, 26, 8, 6);
      c.fillStyle = '#220000'; c.fillRect(51, 27, 6, 4);
      // dientes / colmillos
      c.fillStyle = '#eeeedd'; c.fillRect(20, 34, 5, 8);
      c.fillStyle = '#eeeedd'; c.fillRect(27, 34, 4, 6);
      c.fillStyle = '#eeeedd'; c.fillRect(33, 34, 5, 8);
      c.fillStyle = '#eeeedd'; c.fillRect(40, 34, 5, 8);
      c.fillStyle = '#eeeedd'; c.fillRect(47, 34, 4, 6);
      c.fillStyle = '#eeeedd'; c.fillRect(54, 34, 5, 8);
      c.fillStyle = '#ccccaa'; c.fillRect(20, 36, 2, 6); // sombra dientes
      c.fillStyle = '#ccccaa'; c.fillRect(33, 36, 2, 6);
      c.fillStyle = '#ccccaa'; c.fillRect(40, 36, 2, 6);
      c.fillStyle = '#ccccaa'; c.fillRect(54, 36, 2, 6);

      // ══ FUEGO ══
      // Lengua de fuego desde la boca
      c.fillStyle = '#440000'; c.fillRect(0, 28, 22, 16);  // outer glow
      c.fillStyle = FR; c.fillRect(0, 29, 20, 14);
      c.fillStyle = '#ff6600'; c.fillRect(0, 30, 18, 12);
      c.fillStyle = FY; c.fillRect(0, 31, 14, 10);
      c.fillStyle = '#ffee00'; c.fillRect(0, 33, 10, 6);
      c.fillStyle = FW; c.fillRect(0, 34, 6, 4);
      // llamas superiores
      c.fillStyle = FR; c.fillRect(4, 26, 4, 4);
      c.fillStyle = FR; c.fillRect(8, 24, 4, 6);
      c.fillStyle = FR; c.fillRect(12, 26, 4, 4);
      c.fillStyle = FY; c.fillRect(5, 27, 2, 3);
      c.fillStyle = FY; c.fillRect(9, 25, 2, 4);
      c.fillStyle = FY; c.fillRect(13, 27, 2, 3);
      // llamas inferiores
      c.fillStyle = FR; c.fillRect(2, 42, 4, 5);
      c.fillStyle = FR; c.fillRect(8, 42, 4, 6);
      c.fillStyle = FR; c.fillRect(14, 42, 4, 5);
      c.fillStyle = FY; c.fillRect(3, 43, 2, 3);
      c.fillStyle = FY; c.fillRect(9, 43, 2, 4);

      // ══ PATAS ══
      c.fillStyle = '#1a0000'; c.fillRect(30, 76, 22, 18); // pata izq
      c.fillStyle = RDK; c.fillRect(31, 76, 20, 16);
      c.fillStyle = RD; c.fillRect(32, 76, 18, 14);
      c.fillStyle = RLT; c.fillRect(32, 76, 12, 3);
      c.fillStyle = '#1a0000'; c.fillRect(74, 76, 22, 18); // pata der
      c.fillStyle = RDK; c.fillRect(75, 76, 20, 16);
      c.fillStyle = RD; c.fillRect(76, 76, 18, 14);
      c.fillStyle = RLT; c.fillRect(76, 76, 12, 3);
      // Garras
      c.fillStyle = '#1a0000'; c.fillRect(28, 88, 8, 8);
      c.fillStyle = '#333333'; c.fillRect(29, 89, 6, 6);
      c.fillStyle = '#555555'; c.fillRect(30, 89, 4, 4);
      c.fillStyle = '#1a0000'; c.fillRect(38, 90, 8, 6);
      c.fillStyle = '#333333'; c.fillRect(39, 91, 6, 4);
      c.fillStyle = '#1a0000'; c.fillRect(48, 88, 8, 8);
      c.fillStyle = '#333333'; c.fillRect(49, 89, 6, 6);
      c.fillStyle = '#1a0000'; c.fillRect(72, 88, 8, 8);
      c.fillStyle = '#333333'; c.fillRect(73, 89, 6, 6);
      c.fillStyle = '#555555'; c.fillRect(74, 89, 4, 4);
      c.fillStyle = '#1a0000'; c.fillRect(82, 90, 8, 6);
      c.fillStyle = '#333333'; c.fillRect(83, 91, 6, 4);

      // ══ COLA ══
      c.fillStyle = '#1a0000'; c.fillRect(90, 62, 48, 16);
      c.fillStyle = RDK; c.fillRect(91, 63, 46, 14);
      c.fillStyle = RD; c.fillRect(92, 64, 44, 12);
      c.fillStyle = RLT; c.fillRect(92, 64, 30, 3);
      // punta de cola con púa
      c.fillStyle = '#1a0000'; c.fillRect(118, 68, 22, 10);
      c.fillStyle = RDK; c.fillRect(119, 69, 20, 8);
      c.fillStyle = RD; c.fillRect(120, 70, 18, 6);
      c.fillStyle = '#880000'; c.fillRect(126, 66, 8, 14);  // punta
      c.fillStyle = '#aa0000'; c.fillRect(127, 67, 6, 12);
      c.fillStyle = '#cc1100'; c.fillRect(128, 68, 4, 10);
      c.fillStyle = '#880000'; c.fillRect(130, 72, 2, 4);   // punta extrema
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 💥 PROYECTILES  —  balas y granada mejoradas
  // ════════════════════════════════════════════════════════════════════════
  private makeBullet(): void {
    this.px('bullet', 22, 10, (c) => {
      // Estela de trail
      c.fillStyle = 'rgba(255,140,0,0.4)'; c.fillRect(0, 3, 10, 4);
      c.fillStyle = 'rgba(255,200,0,0.6)'; c.fillRect(6, 3, 8, 4);
      // Cuerpo de la bala
      c.fillStyle = '#cc8800'; c.fillRect(10, 2, 12, 6);   // casquillo
      c.fillStyle = '#ffee33'; c.fillRect(12, 2, 10, 6);   // latón
      c.fillStyle = '#ffffaa'; c.fillRect(12, 2, 8, 2);    // highlight
      c.fillStyle = '#cc8800'; c.fillRect(10, 2, 4, 6);    // base
      c.fillStyle = '#886600'; c.fillRect(10, 7, 12, 1);   // sombra
      // Punta
      c.fillStyle = '#cccc88'; c.fillRect(20, 3, 2, 4);    // punta ojival
    });
  }

  private makeDoubleBullet(): void {
    this.px('dbullet', 24, 16, (c) => {
      // Bala superior (cyan)
      c.fillStyle = 'rgba(0,200,150,0.4)'; c.fillRect(0, 0, 10, 4);
      c.fillStyle = 'rgba(0,240,180,0.6)'; c.fillRect(6, 0, 6, 4);
      c.fillStyle = '#006655'; c.fillRect(10, 0, 14, 4);
      c.fillStyle = '#33ffcc'; c.fillRect(12, 0, 12, 4);
      c.fillStyle = '#aaffee'; c.fillRect(12, 0, 8, 1);
      c.fillStyle = '#33bbaa'; c.fillRect(10, 3, 14, 1);
      c.fillStyle = '#99ffdd'; c.fillRect(22, 1, 2, 2);
      // Bala inferior (cyan)
      c.fillStyle = 'rgba(0,200,150,0.4)'; c.fillRect(0, 12, 10, 4);
      c.fillStyle = 'rgba(0,240,180,0.6)'; c.fillRect(6, 12, 6, 4);
      c.fillStyle = '#006655'; c.fillRect(10, 12, 14, 4);
      c.fillStyle = '#33ffcc'; c.fillRect(12, 12, 12, 4);
      c.fillStyle = '#aaffee'; c.fillRect(12, 12, 8, 1);
      c.fillStyle = '#33bbaa'; c.fillRect(10, 15, 14, 1);
      c.fillStyle = '#99ffdd'; c.fillRect(22, 13, 2, 2);
      // Destello entre las dos balas
      c.fillStyle = 'rgba(100,255,220,0.3)'; c.fillRect(14, 5, 6, 6);
    });
  }

  private makeGrenade(): void {
    this.px('grenade', 22, 24, (c) => {
      // Cuerpo de la granada (oval)
      c.fillStyle = '#1a0a00'; c.fillRect(4, 6, 14, 14);   // shadow
      c.fillStyle = '#3a2800'; c.fillRect(5, 5, 12, 14);
      c.fillStyle = '#6a4800'; c.fillRect(5, 6, 12, 12);
      c.fillStyle = '#885500'; c.fillRect(6, 6, 10, 10);
      c.fillStyle = '#aa7700'; c.fillRect(7, 6, 8, 6);     // highlight
      // Bandas de la granada
      c.fillStyle = '#553300'; c.fillRect(5, 10, 12, 2);
      c.fillStyle = '#553300'; c.fillRect(5, 14, 12, 2);
      // Seguridad (anillo)
      c.fillStyle = '#999900'; c.fillRect(8, 4, 6, 3);
      c.fillStyle = '#cccc00'; c.fillRect(9, 4, 4, 2);
      c.fillStyle = '#ffff00'; c.fillRect(10, 3, 2, 2);
      // Pin
      c.fillStyle = '#888800'; c.fillRect(12, 2, 3, 4);
      c.fillStyle = '#aaaa00'; c.fillRect(13, 1, 2, 3);
      // Mecha encendida
      c.fillStyle = '#554400'; c.fillRect(10, 0, 2, 5);
      c.fillStyle = '#ffaa00'; c.fillRect(10, 0, 1, 3);    // chispa
      c.fillStyle = '#ffff88'; c.fillRect(10, 0, 1, 1);
    });
  }

  private makeExplosion(): void {
    this.px('explosion', 56, 56, (c) => {
      // Círculo exterior rojo
      c.fillStyle = '#440000'; c.fillRect(4, 16, 48, 24);
      c.fillStyle = '#440000'; c.fillRect(16, 4, 24, 48);
      c.fillStyle = '#880000'; c.fillRect(8, 8, 40, 40);
      // Anillo de fuego
      c.fillStyle = '#cc0000'; c.fillRect(6, 18, 44, 20);
      c.fillStyle = '#cc0000'; c.fillRect(18, 6, 20, 44);
      c.fillStyle = '#ff2200'; c.fillRect(10, 10, 36, 36);
      // Bola de fuego
      c.fillStyle = '#ff6600'; c.fillRect(8, 20, 40, 16);
      c.fillStyle = '#ff6600'; c.fillRect(20, 8, 16, 40);
      c.fillStyle = '#ff6600'; c.fillRect(12, 12, 32, 32);
      // Centro caliente
      c.fillStyle = '#ffaa00'; c.fillRect(14, 22, 28, 12);
      c.fillStyle = '#ffaa00'; c.fillRect(22, 14, 12, 28);
      c.fillStyle = '#ffcc00'; c.fillRect(16, 16, 24, 24);
      // Núcleo amarillo
      c.fillStyle = '#ffff00'; c.fillRect(20, 20, 16, 16);
      c.fillStyle = '#ffff88'; c.fillRect(22, 22, 12, 12);
      // Core blanco
      c.fillStyle = '#ffffff'; c.fillRect(24, 24, 8, 8);
      // Rayos de explosión
      c.fillStyle = '#ff8800'; c.fillRect(0, 26, 8, 4);    // izq
      c.fillStyle = '#ff8800'; c.fillRect(48, 26, 8, 4);   // der
      c.fillStyle = '#ff8800'; c.fillRect(26, 0, 4, 8);    // up
      c.fillStyle = '#ff8800'; c.fillRect(26, 48, 4, 8);   // down
      c.fillStyle = '#ffcc00'; c.fillRect(0, 27, 6, 2);
      c.fillStyle = '#ffcc00'; c.fillRect(50, 27, 6, 2);
      c.fillStyle = '#ffcc00'; c.fillRect(27, 0, 2, 6);
      c.fillStyle = '#ffcc00'; c.fillRect(27, 50, 2, 6);
      // Destellos diagonales
      c.fillStyle = '#ff6600'; c.fillRect(6, 6, 6, 6);
      c.fillStyle = '#ff6600'; c.fillRect(44, 6, 6, 6);
      c.fillStyle = '#ff6600'; c.fillRect(6, 44, 6, 6);
      c.fillStyle = '#ff6600'; c.fillRect(44, 44, 6, 6);
    });
  }

  private makeShield(): void {
    this.px('shield', 56, 68, (c) => {
      // Borde exterior brillante
      c.fillStyle = 'rgba(0,150,200,0.15)'; c.fillRect(0, 0, 56, 68);
      c.fillStyle = 'rgba(0,200,255,0.8)';
      // Marco exterior
      c.fillRect(0, 4, 4, 60);    // izq
      c.fillRect(52, 4, 4, 60);   // der
      c.fillRect(4, 0, 48, 4);    // top
      c.fillRect(8, 64, 40, 4);   // bot
      // Esquinas
      c.fillRect(0, 0, 8, 8);
      c.fillRect(48, 0, 8, 8);
      c.fillRect(0, 60, 8, 8);
      c.fillRect(48, 60, 8, 8);
      // Interior translúcido
      c.fillStyle = 'rgba(0,200,255,0.12)'; c.fillRect(4, 4, 48, 60);
      c.fillStyle = 'rgba(0,200,255,0.25)'; c.fillRect(6, 6, 44, 56);
      // Cruz central
      c.fillStyle = 'rgba(0,220,255,0.6)';
      c.fillRect(24, 6, 8, 56);
      c.fillRect(6, 30, 44, 8);
      // Hexágono central
      c.fillStyle = 'rgba(100,240,255,0.5)';
      c.fillRect(20, 22, 16, 24);
      c.fillRect(16, 26, 24, 16);
      // Brillo central
      c.fillStyle = 'rgba(200,250,255,0.7)';
      c.fillRect(24, 30, 8, 8);
      // Partículas de energía
      c.fillStyle = '#00ffff'; c.fillRect(4, 4, 2, 2);
      c.fillStyle = '#00ffff'; c.fillRect(50, 4, 2, 2);
      c.fillStyle = '#00ffff'; c.fillRect(4, 62, 2, 2);
      c.fillStyle = '#00ffff'; c.fillRect(50, 62, 2, 2);
      c.fillStyle = '#ffffff'; c.fillRect(27, 27, 2, 2);  // núcleo
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // ❤️  HUD — CORAZONES mejorados
  // ════════════════════════════════════════════════════════════════════════
  private makeHeart(): void {
    this.px('heart', 22, 20, (c) => {
      // Outline
      c.fillStyle = '#660011';
      c.fillRect(2, 4, 7, 7);
      c.fillRect(13, 4, 7, 7);
      c.fillRect(0, 8, 22, 8);
      c.fillRect(2, 14, 18, 5);
      c.fillRect(6, 17, 10, 5);
      // Relleno rojo oscuro (sombra)
      c.fillStyle = '#cc1133';
      c.fillRect(3, 5, 5, 5);
      c.fillRect(14, 5, 5, 5);
      c.fillRect(1, 9, 20, 6);
      c.fillRect(3, 13, 16, 4);
      c.fillRect(7, 16, 8, 4);
      // Relleno rojo base
      c.fillStyle = '#ff2244';
      c.fillRect(4, 5, 4, 4);
      c.fillRect(14, 5, 4, 4);
      c.fillRect(2, 9, 18, 5);
      c.fillRect(4, 13, 14, 3);
      c.fillRect(8, 15, 6, 3);
      // Highlight (brillo)
      c.fillStyle = '#ff88aa';
      c.fillRect(5, 6, 2, 2);
      c.fillRect(15, 6, 2, 2);
      c.fillRect(4, 9, 6, 2);
      // Brillo puntual
      c.fillStyle = '#ffccdd';
      c.fillRect(5, 6, 1, 1);
      c.fillRect(15, 6, 1, 1);
    });
  }

  private makeHeartEmpty(): void {
    this.px('heart_empty', 22, 20, (c) => {
      // Outline gris
      c.fillStyle = '#330011';
      c.fillRect(2, 4, 7, 7);
      c.fillRect(13, 4, 7, 7);
      c.fillRect(0, 8, 22, 8);
      c.fillRect(2, 14, 18, 5);
      c.fillRect(6, 17, 10, 5);
      // Interior oscuro vacío
      c.fillStyle = '#1a0008';
      c.fillRect(3, 5, 5, 5);
      c.fillRect(14, 5, 5, 5);
      c.fillRect(1, 9, 20, 6);
      c.fillRect(3, 13, 16, 4);
      c.fillRect(7, 16, 8, 4);
      // Borde rojo oscuro
      c.fillStyle = '#440011';
      c.fillRect(4, 5, 4, 1);
      c.fillRect(14, 5, 4, 1);
      c.fillRect(2, 9, 18, 1);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🌌 FONDO — Cielo nocturno con castillo lejano y neblina
  // ════════════════════════════════════════════════════════════════════════
  private makeBackground(): void {
    // ── Tile de cielo (200×200) con gradiente mejorado + nebulosa ──
    this.px('bg_tile', 200, 200, (c) => {
      // Gradiente nocturno rico
      for (let y = 0; y < 200; y++) {
        const t = y / 200;
        const r = Math.round(5  + t * 12);
        const g = Math.round(0  + t * 5);
        const b = Math.round(22 + t * 30);
        c.fillStyle = `rgb(${r},${g},${b})`;
        c.fillRect(0, y, 200, 1);
      }
      // Neblina / nebulosa (manchas suaves)
      c.fillStyle = 'rgba(80,0,120,0.08)';
      c.fillRect(0, 20, 80, 60);
      c.fillRect(120, 50, 80, 70);
      c.fillStyle = 'rgba(0,40,120,0.06)';
      c.fillRect(40, 60, 120, 50);
      c.fillStyle = 'rgba(60,0,100,0.05)';
      c.fillRect(0, 80, 200, 40);
      // Pequeñas motas de nebulosa
      for (let i = 0; i < 12; i++) {
        const nx = (i * 37 + 10) % 200;
        const ny = (i * 29 + 5) % 160;
        const nw = 8 + (i % 5) * 4;
        c.fillStyle = `rgba(${40 + (i % 3) * 20},0,${80 + (i % 4) * 15},0.06)`;
        c.fillRect(nx, ny, nw, nw);
      }
    });

    // ── Suelo (800×44) — adoquines con brillo neon ──
    this.px('ground', GW, 44, (c) => {
      // Base oscura
      c.fillStyle = '#050d05'; c.fillRect(0, 0, GW, 44);
      // Capa 1: Roca base
      c.fillStyle = '#0a1a0a'; c.fillRect(0, 2, GW, 42);
      // Bloques de adoquín
      for (let x = 0; x < GW; x += 50) {
        c.fillStyle = '#0c1e0c';
        c.fillRect(x, 8, 48, 22);
        c.fillStyle = '#0e220e';
        c.fillRect(x + 1, 9, 46, 20);
        c.fillStyle = '#101f10';
        c.fillRect(x + 1, 9, 30, 4); // highlight bloque
        c.fillStyle = '#080e08';
        c.fillRect(x, 8, 2, 22); // borde izq
        c.fillRect(x, 29, 48, 2); // borde bot
      }
      // Segunda fila de adoquines (offset)
      for (let x = -25; x < GW; x += 50) {
        c.fillStyle = '#0a1a0a';
        c.fillRect(x, 30, 48, 14);
        c.fillStyle = '#0d1d0d';
        c.fillRect(x + 1, 31, 46, 12);
        c.fillStyle = '#0f200f';
        c.fillRect(x + 1, 31, 28, 3);
        c.fillStyle = '#060e06';
        c.fillRect(x, 30, 2, 14);
      }
      // Línea de brillo neon en el top
      c.fillStyle = '#003300'; c.fillRect(0, 0, GW, 3);
      c.fillStyle = '#004400'; c.fillRect(0, 0, GW, 2);
      c.fillStyle = '#00aa22'; c.fillRect(0, 0, GW, 1);  // neon line
      c.fillStyle = '#00ff44'; c.fillRect(0, 1, GW, 1);  // brillo
      // Reflexión del neon en el suelo
      c.fillStyle = 'rgba(0,255,68,0.06)'; c.fillRect(0, 2, GW, 4);
      c.fillStyle = 'rgba(0,255,68,0.03)'; c.fillRect(0, 6, GW, 6);
      // Grietas en el suelo
      for (let x = 80; x < GW; x += 140) {
        c.fillStyle = '#060e06';
        c.fillRect(x, 10, 1, 16);
        c.fillRect(x + 2, 14, 1, 10);
        c.fillRect(x + 4, 16, 1, 8);
      }
    });

    // ── Pilares (44×220) — columnas góticas ──
    this.px('pillar', 44, 220, (c) => {
      // Fondo transparente → oscuro
      c.fillStyle = '#060614'; c.fillRect(0, 0, 44, 220);

      // Capitel superior
      c.fillStyle = '#0c0c22'; c.fillRect(0, 0, 44, 14);
      c.fillStyle = '#111130'; c.fillRect(2, 2, 40, 10);
      c.fillStyle = '#1a1a44'; c.fillRect(4, 4, 36, 6);
      c.fillStyle = '#222255'; c.fillRect(6, 5, 32, 3); // top highlight
      // Ornamento capitel
      c.fillStyle = '#0a0a1e';
      c.fillRect(6, 10, 6, 8);    // dentado 1
      c.fillRect(14, 10, 6, 8);   // dentado 2
      c.fillRect(22, 10, 6, 8);   // dentado 3
      c.fillRect(30, 10, 6, 8);   // dentado 4
      c.fillStyle = '#141432';
      c.fillRect(7, 11, 4, 6);
      c.fillRect(15, 11, 4, 6);
      c.fillRect(23, 11, 4, 6);
      c.fillRect(31, 11, 4, 6);

      // Columna principal
      c.fillStyle = '#060614'; c.fillRect(2, 18, 40, 196);
      c.fillStyle = '#0a0a1e'; c.fillRect(4, 18, 36, 196);
      c.fillStyle = '#0d0d28'; c.fillRect(6, 18, 32, 196);
      // Bordes de la columna
      c.fillStyle = '#141432'; c.fillRect(6, 18, 4, 196);
      c.fillStyle = '#141432'; c.fillRect(34, 18, 4, 196);
      c.fillStyle = '#0a0a24'; c.fillRect(10, 18, 24, 196);
      // Centro oscuro
      c.fillStyle = '#050510'; c.fillRect(16, 18, 12, 196);
      // Líneas decorativas horizontales
      for (let y = 28; y < 214; y += 40) {
        c.fillStyle = '#1a1a44';
        c.fillRect(4, y, 36, 3);
        c.fillStyle = '#222255';
        c.fillRect(6, y, 32, 1);
      }
      // Base capitel inferior
      c.fillStyle = '#0c0c22'; c.fillRect(0, 206, 44, 14);
      c.fillStyle = '#111130'; c.fillRect(2, 208, 40, 10);
      c.fillStyle = '#1a1a44'; c.fillRect(4, 210, 36, 6);
      c.fillStyle = '#222255'; c.fillRect(6, 214, 32, 3);
    });
  }

  // ── ESTRELLA (6×6) — con forma de cruz más visible ──────────────────────
  private makeStar(): void {
    this.px('star', 6, 6, (c) => {
      c.fillStyle = '#ffffff';
      c.fillRect(2, 0, 2, 6);   // vertical
      c.fillRect(0, 2, 6, 2);   // horizontal
      c.fillStyle = '#aaccff';  // puntas diagonales (tenue)
      c.fillRect(1, 1, 1, 1);
      c.fillRect(4, 1, 1, 1);
      c.fillRect(1, 4, 1, 1);
      c.fillRect(4, 4, 1, 1);
      c.fillStyle = '#ffffff';  // núcleo brillante
      c.fillRect(2, 2, 2, 2);
    });
  }

  // ── LUNA (36×36) — creciente con cráteres ───────────────────────────────
  private makeMoon(): void {
    this.px('moon', 36, 36, (c) => {
      // Forma de luna completa
      c.fillStyle = '#c8c890'; c.fillRect(6, 2, 24, 32);
      c.fillStyle = '#c8c890'; c.fillRect(2, 6, 32, 24);
      c.fillStyle = '#ddddb0'; c.fillRect(6, 4, 22, 28);   // base
      c.fillStyle = '#ddddb0'; c.fillRect(4, 6, 24, 24);
      c.fillStyle = '#eeeec8'; c.fillRect(6, 6, 20, 22);   // interior
      // Highlight superior
      c.fillStyle = '#f8f8e0'; c.fillRect(8, 6, 12, 4);
      c.fillStyle = '#ffffff'; c.fillRect(9, 6, 8, 2);
      // Sombra de creciente (máscara oscura sobre el lado derecho)
      c.fillStyle = '#0a0014'; c.fillRect(18, 2, 16, 32);
      c.fillStyle = '#0a0014'; c.fillRect(16, 4, 18, 28);
      c.fillStyle = '#0a0014'; c.fillRect(14, 6, 20, 24);
      c.fillStyle = '#080010'; c.fillRect(12, 8, 22, 20);  // borde suave
      // Cráteres
      c.fillStyle = '#b8b880'; c.fillRect(8, 12, 5, 5);
      c.fillStyle = '#aaaaaa'; c.fillRect(9, 13, 3, 3);
      c.fillStyle = '#c8c890'; c.fillRect(10, 14, 1, 1);   // brillo cráter
      c.fillStyle = '#b8b880'; c.fillRect(6, 22, 4, 4);
      c.fillStyle = '#aaaaaa'; c.fillRect(7, 23, 2, 2);
      c.fillStyle = '#b0b080'; c.fillRect(12, 28, 3, 3);
      c.fillStyle = '#888870'; c.fillRect(13, 29, 1, 1);
      // Borde de luna (rim glow)
      c.fillStyle = 'rgba(255,255,220,0.2)'; c.fillRect(2, 6, 2, 24);
    });
  }

  private makeGround(): void {
    // Ya hecho en makeBackground
  }

  // ════════════════════════════════════════════════════════════════════════
  // ✨ TEXTURAS DE PARTÍCULAS
  // ════════════════════════════════════════════════════════════════════════
  private makeParticleTextures(): void {
    // Punto blanco (se tinta dinámicamente)
    this.px('ptdot', 6, 6, (c) => {
      c.fillStyle = '#ffffff';
      c.fillRect(1, 1, 4, 4);
      c.fillStyle = 'rgba(255,255,255,0.5)';
      c.fillRect(0, 2, 1, 2);
      c.fillRect(5, 2, 1, 2);
      c.fillRect(2, 0, 2, 1);
      c.fillRect(2, 5, 2, 1);
    });
    // Chispa (para impactos de bala)
    this.px('spark', 4, 4, (c) => {
      c.fillStyle = '#ffffff';
      c.fillRect(1, 0, 2, 4);
      c.fillRect(0, 1, 4, 2);
    });
    // Punto de fuego (para explosiones)
    this.px('ptfire', 6, 6, (c) => {
      c.fillStyle = '#ff4400';
      c.fillRect(1, 1, 4, 4);
      c.fillStyle = '#ffaa00';
      c.fillRect(2, 2, 2, 2);
    });
    // Punto de humo (para efectos de muerte)
    this.px('ptsmoke', 8, 8, (c) => {
      c.fillStyle = 'rgba(180,180,180,0.7)';
      c.fillRect(2, 2, 4, 4);
      c.fillStyle = 'rgba(220,220,220,0.4)';
      c.fillRect(1, 1, 6, 6);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 🎞️  FRAMES DE ANIMACIÓN por enemigo (2-3 frames por personaje)
  //     Nombrado: zombie_f0, zombie_f1, zombie_f2, etc.
  // ════════════════════════════════════════════════════════════════════════
  private makeEnemyAnimFrames(): void {
    this.makeZombieFrames();
    this.makeSkeletonFrames();
    this.makeVampireFrames();
    this.makeGolemFrames();
    this.makeBossFrames();
  }

  // ── ZOMBIE — 3 frames de shuffling ───────────────────────────────────────
  private makeZombieFrames(): void {
    // Frame 0 = copia exacta del sprite base
    this.makeZombieFrame('zombie_f0', 0, 0, 0, 0);
    // Frame 1: pierna izq adelante, der atrás
    this.makeZombieFrame('zombie_f1', -4, -2, 4, 2);
    // Frame 2: pierna der adelante, izq atrás
    this.makeZombieFrame('zombie_f2', 4, 2, -4, -2);
  }

  private makeZombieFrame(key: string, llx: number, lly: number, rlx: number, rly: number): void {
    this.px(key, 44, 60, (c) => {
      const G  = '#5aaa40', GD = '#2a5a20', GL = '#7acc55';
      const ER = '#ff2200', BD = '#221408', BL = '#cc1100';

      c.fillStyle = '#0a1a08';
      c.fillRect(6, 0, 28, 24);
      c.fillRect(4, 22, 36, 24);

      c.fillStyle = GD; c.fillRect(8, 2, 24, 20);
      c.fillStyle = G;  c.fillRect(9, 2, 22, 18);
      c.fillStyle = GL; c.fillRect(10, 2, 14, 4);
      c.fillStyle = GD; c.fillRect(10, 6, 7, 7);
      c.fillStyle = GD; c.fillRect(22, 4, 5, 6);
      c.fillStyle = GD; c.fillRect(14, 14, 4, 5);
      c.fillStyle = BL;  c.fillRect(20, 8, 6, 3);
      c.fillStyle = '#880000'; c.fillRect(21, 9, 4, 2);

      c.fillStyle = '#000000'; c.fillRect(10, 8, 8, 6);
      c.fillStyle = '#000000'; c.fillRect(22, 8, 8, 6);
      c.fillStyle = ER; c.fillRect(11, 9, 6, 4);
      c.fillStyle = ER; c.fillRect(23, 9, 6, 4);
      c.fillStyle = '#ff8888'; c.fillRect(12, 9, 3, 2);
      c.fillStyle = '#ff8888'; c.fillRect(24, 9, 3, 2);
      c.fillStyle = GD; c.fillRect(15, 14, 4, 4);
      c.fillStyle = '#0a0000'; c.fillRect(16, 15, 1, 2);
      c.fillStyle = '#0a0000'; c.fillRect(18, 15, 1, 2);
      c.fillStyle = '#0a0a0a'; c.fillRect(10, 18, 20, 5);
      c.fillStyle = '#ccccbb'; c.fillRect(11, 18, 3, 4);
      c.fillStyle = '#ccccbb'; c.fillRect(15, 18, 3, 3);
      c.fillStyle = '#ccccbb'; c.fillRect(19, 18, 3, 4);
      c.fillStyle = '#ccccbb'; c.fillRect(23, 18, 3, 3);
      c.fillStyle = BL; c.fillRect(12, 20, 16, 2);
      c.fillStyle = GD; c.fillRect(14, 22, 12, 5);
      c.fillStyle = G;  c.fillRect(15, 22, 10, 4);

      c.fillStyle = '#1a1008'; c.fillRect(5, 27, 32, 22);
      c.fillStyle = BD; c.fillRect(6, 27, 30, 20);
      c.fillStyle = '#3a2818'; c.fillRect(8, 27, 26, 8);
      c.fillStyle = G; c.fillRect(10, 30, 5, 8);
      c.fillStyle = G; c.fillRect(26, 32, 5, 10);
      c.fillStyle = BL; c.fillRect(14, 34, 10, 5);
      c.fillStyle = '#880000'; c.fillRect(15, 35, 8, 3);
      c.fillStyle = '#0a0a0a'; c.fillRect(18, 31, 6, 8);
      c.fillStyle = BL; c.fillRect(19, 32, 4, 6);
      c.fillStyle = '#ffcccc'; c.fillRect(20, 33, 2, 4);

      c.fillStyle = GD; c.fillRect(0, 25, 8, 10);
      c.fillStyle = G;  c.fillRect(0, 26, 7, 8);
      c.fillStyle = G; c.fillRect(0, 30, 2, 5);
      c.fillStyle = G; c.fillRect(2, 32, 2, 6);
      c.fillStyle = G; c.fillRect(4, 31, 2, 5);

      c.fillStyle = GD; c.fillRect(34, 23, 10, 10);
      c.fillStyle = G;  c.fillRect(34, 24, 9, 8);
      c.fillStyle = G; c.fillRect(42, 28, 2, 5);
      c.fillStyle = G; c.fillRect(40, 30, 2, 6);
      c.fillStyle = G; c.fillRect(38, 29, 2, 5);

      // Piernas con offset de animación
      const lx = 7 + llx, rx = 23 + rlx;
      const ly = 49 + lly, ry = 49 + rly;

      c.fillStyle = '#1a1008'; c.fillRect(lx, ly, 13, 12);
      c.fillStyle = BD;        c.fillRect(lx + 1, ly, 11, 10);
      c.fillStyle = '#3a2818'; c.fillRect(lx + 2, ly, 7, 4);
      c.fillStyle = G;         c.fillRect(lx - 1, ly + 7, 15, 4);
      c.fillStyle = GD;        c.fillRect(lx - 1, ly + 9, 15, 2);

      c.fillStyle = '#1a1008'; c.fillRect(rx, ry, 13, 12);
      c.fillStyle = BD;        c.fillRect(rx + 1, ry, 11, 10);
      c.fillStyle = '#3a2818'; c.fillRect(rx + 2, ry, 7, 4);
      c.fillStyle = G;         c.fillRect(rx - 1, ry + 7, 15, 4);
      c.fillStyle = GD;        c.fillRect(rx - 1, ry + 9, 15, 2);
    });
  }

  // ── ESQUELETO — 4 frames de marcha ───────────────────────────────────────
  private makeSkeletonFrames(): void {
    this.makeSkeletonFrame('skeleton_f0', 0, 0, 0, 0, 0);
    this.makeSkeletonFrame('skeleton_f1', -3, 0, 3, 0, -4);
    this.makeSkeletonFrame('skeleton_f2', -5, -2, 5, 2, -8);
    this.makeSkeletonFrame('skeleton_f3', -2, 0, 2, 0, -4);
  }

  private makeSkeletonFrame(key: string, llx: number, lly: number, rlx: number, rly: number, swordDy: number): void {
    this.px(key, 38, 62, (c) => {
      const BN = '#ddddcc', BD = '#888877', BH = '#eeeedd';
      const EG = '#00ffff', ED = '#004444';

      c.fillStyle = '#222211'; c.fillRect(7, 0, 22, 22);
      c.fillStyle = BD; c.fillRect(8, 1, 20, 20);
      c.fillStyle = BN; c.fillRect(9, 2, 18, 18);
      c.fillStyle = BH; c.fillRect(10, 2, 12, 5);
      c.fillStyle = '#000000'; c.fillRect(10, 6, 7, 8);
      c.fillStyle = '#000000'; c.fillRect(19, 6, 7, 8);
      c.fillStyle = EG; c.fillRect(11, 7, 5, 6);
      c.fillStyle = EG; c.fillRect(20, 7, 5, 6);
      c.fillStyle = ED; c.fillRect(12, 8, 3, 4);
      c.fillStyle = ED; c.fillRect(21, 8, 3, 4);
      c.fillStyle = BD; c.fillRect(17, 2, 2, 8);
      c.fillStyle = BN; c.fillRect(8, 18, 20, 8);
      c.fillStyle = BD; c.fillRect(10, 21, 4, 5);
      c.fillStyle = BD; c.fillRect(14, 21, 4, 5);
      c.fillStyle = BD; c.fillRect(18, 21, 4, 5);
      c.fillStyle = BD; c.fillRect(22, 21, 4, 5);
      c.fillStyle = BN; c.fillRect(15, 26, 6, 16);
      c.fillStyle = BN; c.fillRect(6, 28, 24, 3);
      c.fillStyle = BN; c.fillRect(6, 33, 24, 3);
      c.fillStyle = BN; c.fillRect(6, 38, 22, 3);
      c.fillStyle = BN; c.fillRect(0, 26, 8, 5);
      c.fillStyle = BN; c.fillRect(28, 26, 8, 5);
      c.fillStyle = BN; c.fillRect(10, 42, 16, 6);

      // Espada (con offset de animación)
      const sy = swordDy;
      c.fillStyle = '#aaaaaa'; c.fillRect(1, 20 + sy, 3, 22);
      c.fillStyle = '#cccccc'; c.fillRect(1, 20 + sy, 1, 20);
      c.fillStyle = '#888800'; c.fillRect(0, 42 + sy, 5, 3);
      c.fillStyle = '#ffcc00'; c.fillRect(0, 43 + sy, 5, 2);
      c.fillStyle = '#666644'; c.fillRect(1, 16 + sy, 2, 5);
      c.fillStyle = '#bbbbbb'; c.fillRect(1, 15 + sy, 2, 3);
      c.fillStyle = BN; c.fillRect(0, 38, 5, 5);
      c.fillStyle = BN; c.fillRect(33, 38, 5, 5);
      c.fillStyle = BD; c.fillRect(32, 26, 8, 6);
      c.fillStyle = BN; c.fillRect(31, 27, 7, 4);

      // Piernas con offset
      c.fillStyle = BD; c.fillRect(9 + llx, 50 + lly, 8, 12);
      c.fillStyle = BN; c.fillRect(10 + llx, 50 + lly, 6, 11);
      c.fillStyle = BH; c.fillRect(10 + llx, 50 + lly, 4, 2);
      c.fillStyle = BN; c.fillRect(7 + llx, 58 + lly, 12, 4);

      c.fillStyle = BD; c.fillRect(21 + rlx, 50 + rly, 8, 12);
      c.fillStyle = BN; c.fillRect(21 + rlx, 50 + rly, 6, 11);
      c.fillStyle = BH; c.fillRect(21 + rlx, 50 + rly, 4, 2);
      c.fillStyle = BN; c.fillRect(20 + rlx, 58 + rly, 12, 4);
    });
  }

  // ── VAMPIRO — 2 frames de flotación ──────────────────────────────────────
  private makeVampireFrames(): void {
    // Frame 0 = base normal
    this.makeVampireFrame('vampire_f0', 0, 0);
    // Frame 1 = flota 3px arriba, capa más expandida
    this.makeVampireFrame('vampire_f1', 0, -3);
  }

  private makeVampireFrame(key: string, _dx: number, dy: number): void {
    // Redibujar el vampiro completo con offset Y en el cuerpo
    const h = 70 + Math.abs(dy);
    this.px(key, 46, h, (c) => {
      const yOff = dy < 0 ? Math.abs(dy) : 0; // padding superior

      const CP = '#550066', CD = '#330044', CH = '#7700aa';
      const SK = '#ddeeff', SD = '#aabbdd', BD = '#220033', EY = '#ff0000';

      const yo = yOff; // offset vertical aplicado a todo el dibujo

      c.fillStyle = '#1a0022'; c.fillRect(0, 18 + yo, 46, 52);
      c.fillStyle = CD; c.fillRect(1, 20 + yo, 44, 50);
      c.fillStyle = CP; c.fillRect(3, 20 + yo, 40, 48);
      c.fillStyle = CD; c.fillRect(10, 22 + yo, 4, 44);
      c.fillStyle = CD; c.fillRect(20, 20 + yo, 3, 46);
      c.fillStyle = CD; c.fillRect(30, 24 + yo, 4, 42);
      c.fillStyle = CH; c.fillRect(4, 22 + yo, 4, 44);
      c.fillStyle = CH; c.fillRect(13, 20 + yo, 3, 46);
      c.fillStyle = '#440000'; c.fillRect(14, 28 + yo, 18, 42);
      c.fillStyle = '#550000'; c.fillRect(15, 28 + yo, 16, 40);
      c.fillStyle = '#0a0010'; c.fillRect(12, 26 + yo, 22, 30);
      c.fillStyle = BD; c.fillRect(13, 26 + yo, 20, 28);
      c.fillStyle = '#eeeeff'; c.fillRect(17, 28 + yo, 5, 14);
      c.fillStyle = '#eeeeff'; c.fillRect(24, 28 + yo, 5, 14);
      c.fillStyle = '#ffcc00'; c.fillRect(21, 26 + yo, 4, 4);
      c.fillStyle = SD; c.fillRect(17, 16 + yo, 12, 12);
      c.fillStyle = SK; c.fillRect(18, 16 + yo, 10, 10);
      c.fillStyle = '#0a0010'; c.fillRect(8, 0 + yo, 30, 20);
      c.fillStyle = SD; c.fillRect(9, 1 + yo, 28, 18);
      c.fillStyle = SK; c.fillRect(10, 1 + yo, 26, 16);
      c.fillStyle = '#0a0010'; c.fillRect(9, 1 + yo, 28, 6);
      c.fillStyle = '#111122'; c.fillRect(10, 1 + yo, 26, 5);
      c.fillStyle = '#0a0010'; c.fillRect(9, 1 + yo, 5, 12);
      c.fillStyle = '#0a0010'; c.fillRect(32, 1 + yo, 5, 12);
      c.fillStyle = '#0a0010'; c.fillRect(20, 1 + yo, 6, 4);
      c.fillStyle = '#0a0010'; c.fillRect(12, 7 + yo, 8, 2);
      c.fillStyle = '#0a0010'; c.fillRect(26, 7 + yo, 8, 2);
      c.fillStyle = '#000000'; c.fillRect(12, 8 + yo, 8, 6);
      c.fillStyle = '#000000'; c.fillRect(26, 8 + yo, 8, 6);
      c.fillStyle = EY; c.fillRect(13, 9 + yo, 6, 4);
      c.fillStyle = EY; c.fillRect(27, 9 + yo, 6, 4);
      c.fillStyle = '#ff8888'; c.fillRect(14, 9 + yo, 3, 2);
      c.fillStyle = '#ff8888'; c.fillRect(28, 9 + yo, 3, 2);
      c.fillStyle = SD; c.fillRect(14, 15 + yo, 18, 3);
      c.fillStyle = '#000000'; c.fillRect(15, 15 + yo, 16, 2);
      c.fillStyle = '#ffffff'; c.fillRect(17, 14 + yo, 3, 4);
      c.fillStyle = '#ffffff'; c.fillRect(26, 14 + yo, 3, 4);
      c.fillStyle = SK; c.fillRect(2, 36 + yo, 6, 7);
      c.fillStyle = SK; c.fillRect(38, 36 + yo, 6, 7);
      c.fillStyle = '#0a0010'; c.fillRect(11, 60 + yo, 10, 10);
      c.fillStyle = '#111122'; c.fillRect(12, 60 + yo, 8, 9);
      c.fillStyle = '#0a0010'; c.fillRect(25, 60 + yo, 10, 10);
      c.fillStyle = '#111122'; c.fillRect(26, 60 + yo, 8, 9);
    });
  }

  // ── GÓLEM — 2 frames de pisada ────────────────────────────────────────────
  private makeGolemFrames(): void {
    this.makeGolemFrame('golem_f0', 0, 0);
    this.makeGolemFrame('golem_f1', 2, -2);
  }

  private makeGolemFrame(key: string, armDy: number, bodyDy: number): void {
    this.px(key, 60, 62, (c) => {
      const ST = '#7a5030', SD = '#4a3020', SH = '#aa7040';
      const CK = '#ffcc00', CI = '#ff8800', CG = '#ff5500';
      const yo = bodyDy < 0 ? Math.abs(bodyDy) : 0;

      c.fillStyle = '#1a0a00';
      c.fillRect(6, 8 + yo, 50, 46);
      c.fillRect(8, 0 + yo, 46, 12);
      c.fillStyle = SD; c.fillRect(9, 1 + yo, 44, 12);
      c.fillStyle = ST; c.fillRect(10, 1 + yo, 42, 10);
      c.fillStyle = SH; c.fillRect(10, 1 + yo, 26, 4);
      c.fillStyle = SD; c.fillRect(14, 3 + yo, 6, 5);
      c.fillStyle = SD; c.fillRect(34, 2 + yo, 8, 6);
      c.fillStyle = '#0a0000'; c.fillRect(14, 3 + yo, 10, 8);
      c.fillStyle = '#0a0000'; c.fillRect(38, 3 + yo, 10, 8);
      c.fillStyle = CK; c.fillRect(15, 4 + yo, 8, 6);
      c.fillStyle = CK; c.fillRect(39, 4 + yo, 8, 6);
      c.fillStyle = CI; c.fillRect(16, 4 + yo, 6, 5);
      c.fillStyle = CI; c.fillRect(40, 4 + yo, 6, 5);
      c.fillStyle = '#ffffff'; c.fillRect(18, 5 + yo, 2, 2);
      c.fillStyle = '#ffffff'; c.fillRect(42, 5 + yo, 2, 2);
      c.fillStyle = CK; c.fillRect(30, 1 + yo, 2, 10);
      c.fillStyle = SD; c.fillRect(7, 13 + yo, 48, 40);
      c.fillStyle = ST; c.fillRect(9, 13 + yo, 44, 38);
      c.fillStyle = SH; c.fillRect(9, 13 + yo, 28, 6);
      c.fillStyle = SD; c.fillRect(14, 16 + yo, 8, 8);
      c.fillStyle = SD; c.fillRect(40, 18 + yo, 8, 10);
      c.fillStyle = SD; c.fillRect(24, 28 + yo, 10, 8);
      c.fillStyle = CK; c.fillRect(12, 18 + yo, 16, 2);
      c.fillStyle = CK; c.fillRect(34, 22 + yo, 14, 2);
      c.fillStyle = CK; c.fillRect(28, 13 + yo, 2, 18);
      c.fillStyle = CK; c.fillRect(18, 32 + yo, 2, 14);
      c.fillStyle = CG; c.fillRect(26, 24 + yo, 8, 8);
      c.fillStyle = CI; c.fillRect(27, 25 + yo, 6, 6);
      c.fillStyle = CK; c.fillRect(28, 26 + yo, 4, 4);
      c.fillStyle = '#ffffff'; c.fillRect(29, 27 + yo, 2, 2);

      // Brazos con offset de animación (armDy)
      const ay = armDy;
      c.fillStyle = '#1a0a00'; c.fillRect(0, 11 + yo + ay, 11, 32);
      c.fillStyle = SD; c.fillRect(0, 12 + yo + ay, 10, 30);
      c.fillStyle = ST; c.fillRect(1, 12 + yo + ay, 8, 28);
      c.fillStyle = CK; c.fillRect(2, 22 + yo + ay, 2, 12);
      c.fillStyle = SD; c.fillRect(0, 40 + yo + ay, 12, 10);
      c.fillStyle = ST; c.fillRect(1, 40 + yo + ay, 10, 9);
      c.fillStyle = '#1a0a00'; c.fillRect(51, 11 + yo + ay, 11, 32);
      c.fillStyle = SD; c.fillRect(52, 12 + yo + ay, 10, 30);
      c.fillStyle = ST; c.fillRect(52, 12 + yo + ay, 8, 28);
      c.fillStyle = CK; c.fillRect(58, 22 + yo + ay, 2, 12);
      c.fillStyle = SD; c.fillRect(50, 40 + yo + ay, 12, 10);
      c.fillStyle = ST; c.fillRect(51, 40 + yo + ay, 10, 9);

      // Piernas fijas
      c.fillStyle = '#1a0a00'; c.fillRect(10, 51 + yo, 16, 12);
      c.fillStyle = SD; c.fillRect(11, 51 + yo, 14, 10);
      c.fillStyle = ST; c.fillRect(12, 51 + yo, 12, 9);
      c.fillStyle = '#1a0a00'; c.fillRect(36, 51 + yo, 16, 12);
      c.fillStyle = SD; c.fillRect(37, 51 + yo, 14, 10);
      c.fillStyle = ST; c.fillRect(38, 51 + yo, 12, 9);
    });
  }

  // ── BOSS — 3 frames de aleteo ─────────────────────────────────────────────
  private makeBossFrames(): void {
    this.makeBossFrame('boss_f0', 0);   // alas nivel
    this.makeBossFrame('boss_f1', -10); // alas arriba
    this.makeBossFrame('boss_f2', 10);  // alas abajo
  }

  private makeBossFrame(key: string, wingDy: number): void {
    this.px(key, 140, 96, (c) => {
      const RD = '#cc1100', RDK = '#880000', RLT = '#ee3322';
      const WG = '#660000', WGD = '#3a0000', WGL = '#880000';
      const BL = '#ff5500', BLD = '#cc3300', BLH = '#ff8844';
      const EY = '#ffff00', EP = '#ff2200';
      const FR = '#ff8800', FY = '#ffff00', FW = '#ffffff';

      const wy = wingDy; // offset vertical de las alas

      // Alas con offset
      c.fillStyle = WGD; c.fillRect(0, 20 + wy, 40, 44);
      c.fillStyle = WG;  c.fillRect(2, 22 + wy, 36, 40);
      c.fillStyle = WGL; c.fillRect(4, 24 + wy, 10, 30);
      c.fillStyle = WGL; c.fillRect(14, 28 + wy, 6, 26);
      c.fillStyle = WGL; c.fillRect(24, 32 + wy, 6, 22);
      c.fillStyle = WGD; c.fillRect(0, 58 + wy, 14, 4);
      c.fillStyle = WGD; c.fillRect(14, 60 + wy, 12, 4);
      c.fillStyle = WGD; c.fillRect(26, 58 + wy, 10, 4);

      c.fillStyle = WGD; c.fillRect(100, 20 + wy, 40, 44);
      c.fillStyle = WG;  c.fillRect(102, 22 + wy, 36, 40);
      c.fillStyle = WGL; c.fillRect(126, 24 + wy, 10, 30);
      c.fillStyle = WGL; c.fillRect(120, 28 + wy, 6, 26);
      c.fillStyle = WGL; c.fillRect(110, 32 + wy, 6, 22);
      c.fillStyle = WGD; c.fillRect(126, 58 + wy, 14, 4);
      c.fillStyle = WGD; c.fillRect(114, 60 + wy, 12, 4);
      c.fillStyle = WGD; c.fillRect(104, 58 + wy, 10, 4);

      // Cuerpo (posición fija)
      c.fillStyle = '#1a0000'; c.fillRect(24, 22, 72, 58);
      c.fillStyle = RDK; c.fillRect(26, 22, 70, 56);
      c.fillStyle = RD;  c.fillRect(28, 22, 66, 54);
      c.fillStyle = RLT; c.fillRect(28, 22, 40, 6);
      for (let sx = 28; sx < 92; sx += 8) {
        for (let sy = 28; sy < 76; sy += 6) {
          c.fillStyle = RDK; c.fillRect(sx, sy, 7, 5);
          c.fillStyle = RD;  c.fillRect(sx+1, sy+1, 5, 3);
        }
      }
      c.fillStyle = '#1a0800'; c.fillRect(36, 34, 48, 36);
      c.fillStyle = BLD; c.fillRect(37, 34, 46, 34);
      c.fillStyle = BL;  c.fillRect(38, 35, 44, 32);
      c.fillStyle = BLH; c.fillRect(38, 35, 28, 6);
      for (let py = 40; py < 66; py += 8) {
        c.fillStyle = BLD; c.fillRect(38, py, 44, 4);
        c.fillStyle = BL;  c.fillRect(39, py+1, 42, 2);
      }

      // Cabeza
      c.fillStyle = '#1a0000'; c.fillRect(16, 4, 52, 32);
      c.fillStyle = RDK; c.fillRect(18, 5, 50, 30);
      c.fillStyle = RD;  c.fillRect(20, 5, 48, 28);
      c.fillStyle = RLT; c.fillRect(20, 5, 30, 5);
      c.fillStyle = '#331100'; c.fillRect(22, 0, 8, 10);
      c.fillStyle = '#553322'; c.fillRect(23, 0, 6, 9);
      c.fillStyle = '#331100'; c.fillRect(58, 0, 8, 10);
      c.fillStyle = '#553322'; c.fillRect(59, 0, 6, 9);
      c.fillStyle = '#000000'; c.fillRect(22, 8, 14, 10);
      c.fillStyle = EY; c.fillRect(23, 9, 12, 8);
      c.fillStyle = EP; c.fillRect(26, 10, 6, 6);
      c.fillStyle = '#000000'; c.fillRect(27, 11, 4, 4);
      c.fillStyle = '#ffff99'; c.fillRect(25, 10, 2, 2);
      c.fillStyle = '#000000'; c.fillRect(48, 8, 14, 10);
      c.fillStyle = EY; c.fillRect(49, 9, 12, 8);
      c.fillStyle = EP; c.fillRect(52, 10, 6, 6);
      c.fillStyle = '#000000'; c.fillRect(53, 11, 4, 4);
      c.fillStyle = '#1a0000'; c.fillRect(16, 22, 52, 16);
      c.fillStyle = RDK; c.fillRect(17, 22, 50, 14);
      c.fillStyle = RD;  c.fillRect(18, 23, 48, 12);
      c.fillStyle = '#eeeedd'; c.fillRect(20, 34, 5, 8);
      c.fillStyle = '#eeeedd'; c.fillRect(33, 34, 5, 8);
      c.fillStyle = '#eeeedd'; c.fillRect(40, 34, 5, 8);
      c.fillStyle = '#eeeedd'; c.fillRect(54, 34, 5, 8);

      // Fuego
      c.fillStyle = '#440000'; c.fillRect(0, 28, 22, 16);
      c.fillStyle = FR; c.fillRect(0, 29, 20, 14);
      c.fillStyle = '#ff6600'; c.fillRect(0, 30, 18, 12);
      c.fillStyle = FY; c.fillRect(0, 31, 14, 10);
      c.fillStyle = FW; c.fillRect(0, 34, 6, 4);

      // Patas y cola
      c.fillStyle = '#1a0000'; c.fillRect(30, 76, 22, 18);
      c.fillStyle = RDK; c.fillRect(31, 76, 20, 16);
      c.fillStyle = RD;  c.fillRect(32, 76, 18, 14);
      c.fillStyle = '#1a0000'; c.fillRect(74, 76, 22, 18);
      c.fillStyle = RDK; c.fillRect(75, 76, 20, 16);
      c.fillStyle = RD;  c.fillRect(76, 76, 18, 14);
      c.fillStyle = '#1a0000'; c.fillRect(28, 88, 8, 8);
      c.fillStyle = '#333333'; c.fillRect(29, 89, 6, 6);
      c.fillStyle = '#1a0000'; c.fillRect(72, 88, 8, 8);
      c.fillStyle = '#333333'; c.fillRect(73, 89, 6, 6);
      c.fillStyle = '#1a0000'; c.fillRect(90, 62, 48, 16);
      c.fillStyle = RDK; c.fillRect(91, 63, 46, 14);
      c.fillStyle = RD;  c.fillRect(92, 64, 44, 12);
      c.fillStyle = '#880000'; c.fillRect(126, 66, 8, 14);
    });
  }
}
