import { AvatarStyle, AvatarConfig } from '../types';

// --- Configuration & Constants ---

const COLORS: Record<AvatarStyle, { base: string; secondary: string; detail: string }> = {
  [AvatarStyle.CAT]: { base: '#fbbf24', secondary: '#fffbeb', detail: '#d97706' }, 
  [AvatarStyle.DOG]: { base: '#a8a29e', secondary: '#f5f5f5', detail: '#57534e' },
  [AvatarStyle.BEAR]: { base: '#78350f', secondary: '#b45309', detail: '#451a03' },
  [AvatarStyle.RABBIT]: { base: '#fce7f3', secondary: '#ffffff', detail: '#ec4899' },
  [AvatarStyle.FOX]: { base: '#ea580c', secondary: '#ffffff', detail: '#1e293b' },
  [AvatarStyle.PANDA]: { base: '#ffffff', secondary: '#18181b', detail: '#000000' },
  [AvatarStyle.UNICORN]: { base: '#c084fc', secondary: '#fae8ff', detail: '#7e22ce' },
  [AvatarStyle.KOALA]: { base: '#9ca3af', secondary: '#e5e7eb', detail: '#4b5563' },
  [AvatarStyle.TIGER]: { base: '#f97316', secondary: '#ffedd5', detail: '#111827' },
  [AvatarStyle.LION]: { base: '#facc15', secondary: '#fef9c3', detail: '#b45309' },
  [AvatarStyle.PIG]: { base: '#f472b6', secondary: '#fbcfe8', detail: '#be185d' },
};

// Linear Interpolation for smoothness
const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

// State for smoothing
let currentMouthOpen = 0;
let currentBlinkL = 0;
let currentBlinkR = 0;
let currentHeadX = 0;
let currentHeadY = 0;
let currentRotation = 0;

// Helper: Get blendshape score safely
const getScore = (blendshapes: any, name: string) => {
  if (!blendshapes || !blendshapes[0]) return 0;
  const category = blendshapes[0].categories.find((c: any) => c.categoryName === name);
  return category ? category.score : 0;
};

// --- Main Drawing Function ---

export const drawAvatar = (
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number; z: number }[],
  blendshapes: any,
  config: AvatarConfig,
  width: number,
  height: number
) => {
  if (!landmarks || landmarks.length === 0) return;

  // Raw Values
  const nose = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  // Calculate Scale & Rotation
  const rawHeadScale = Math.hypot((leftEye.x - rightEye.x) * width, (leftEye.y - rightEye.y) * height) * 2.5;
  const rawRotationZ = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
  const rawCx = nose.x * width;
  const rawCy = nose.y * height;

  // Smoothing (Lerp) - Makes movement fluid
  const smoothFactor = 0.4;
  currentHeadX = lerp(currentHeadX, rawCx, smoothFactor);
  currentHeadY = lerp(currentHeadY, rawCy, smoothFactor);
  currentRotation = lerp(currentRotation, rawRotationZ, smoothFactor);
  
  // Blendshape Values with smoothing
  const targetJawOpen = getScore(blendshapes, 'jawOpen');
  const targetMouthSmile = (getScore(blendshapes, 'mouthSmileLeft') + getScore(blendshapes, 'mouthSmileRight')) / 2;
  const targetBlinkL = getScore(blendshapes, 'eyeBlinkLeft');
  const targetBlinkR = getScore(blendshapes, 'eyeBlinkRight');
  const browInnerUp = getScore(blendshapes, 'browInnerUp');

  currentMouthOpen = lerp(currentMouthOpen, targetJawOpen, 0.5);
  currentBlinkL = lerp(currentBlinkL, targetBlinkL, 0.5);
  currentBlinkR = lerp(currentBlinkR, targetBlinkR, 0.5);

  // Colors
  const theme = COLORS[config.style];
  const baseColor = config.color || theme.base;

  // Prepare Canvas
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Dynamic Background (Subtle Gradient that shifts with head position)
  const gradX = currentHeadX;
  const gradY = currentHeadY;
  const grad = ctx.createRadialGradient(gradX, gradY, 10, width/2, height/2, width);
  
  if (document.documentElement.classList.contains('dark')) {
      grad.addColorStop(0, '#1e293b'); 
      grad.addColorStop(1, '#020617');
  } else {
      grad.addColorStop(0, '#ffffff'); 
      grad.addColorStop(1, '#e0f2fe');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Apply Transformations
  ctx.translate(currentHeadX, currentHeadY);
  ctx.rotate(currentRotation);
  ctx.translate(-currentHeadX, -currentHeadY);

  const s = rawHeadScale; // shorthand

  // --- DRAWING LAYERS ---

  // 1. Shadow (Drop shadow for depth)
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 10;

  // 2. Behind Head
  if (config.style === AvatarStyle.LION) drawMane(ctx, currentHeadX, currentHeadY, s, theme.detail);
  if (config.accessory === 'scarf') drawScarf(ctx, currentHeadX, currentHeadY, s, '#ef4444');
  if (config.accessory === 'headphones') drawHeadphonesBand(ctx, currentHeadX, currentHeadY, s);
  drawEars(ctx, currentHeadX, currentHeadY, s, baseColor, theme.detail, config.style);

  // Reset shadow for details
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 3. Head
  drawHead(ctx, currentHeadX, currentHeadY, s, baseColor, theme.secondary, config.style);

  // 4. Face
  drawEyes(ctx, currentHeadX, currentHeadY, s, currentBlinkL, currentBlinkR, browInnerUp, landmarks, width, height, theme.detail);
  drawNose(ctx, currentHeadX, currentHeadY, s, theme.detail, config.style);
  drawMouth(ctx, currentHeadX, currentHeadY, s, currentMouthOpen, targetMouthSmile);

  // 5. Foreground Accessories
  if (config.accessory !== 'none') {
      drawAccessories(ctx, currentHeadX, currentHeadY, s, config.accessory);
  }

  // 6. Speaking Indicator (If mouth is open significantly)
  if (currentMouthOpen > 0.15) {
      ctx.restore(); // Reset transform for static glow
      ctx.save();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.beginPath();
      ctx.arc(currentHeadX, currentHeadY, s * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)'; // Green glow
      ctx.fill();
      ctx.restore();
      return; // Exit early to avoid double restore
  }

  ctx.restore();
};

// --- Sub-Drawing Functions ---

const drawMane = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    const spikes = 20;
    const outerRadius = s * 0.9;
    const innerRadius = s * 0.65;
    for (let i = 0; i < spikes * 2; i++) {
        const r = (i % 2 === 0) ? outerRadius : innerRadius;
        const a = (Math.PI * i) / spikes;
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
}

const drawHeadphonesBand = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number) => {
    ctx.beginPath();
    ctx.lineWidth = s * 0.15;
    ctx.strokeStyle = '#333';
    ctx.lineCap = 'round';
    ctx.arc(x, y - s * 0.1, s * 0.65, Math.PI, 0);
    ctx.stroke();
};

const drawScarf = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) => {
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 2;
    const sy = y + s * 0.45;
    ctx.beginPath();
    ctx.roundRect(x - s * 0.4, sy, s * 0.8, s * 0.25, 15);
    ctx.fill();
    ctx.stroke();
    // Stripes
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - s*0.2, sy); ctx.lineTo(x - s*0.2, sy + s*0.25);
    ctx.moveTo(x + s*0.2, sy); ctx.lineTo(x + s*0.2, sy + s*0.25);
    ctx.stroke();
};

const drawEars = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, detail: string, style: AvatarStyle) => {
  ctx.fillStyle = color;
  ctx.strokeStyle = detail;
  ctx.lineWidth = s * 0.05;

  ctx.beginPath();
  if (style === AvatarStyle.CAT || style === AvatarStyle.FOX || style === AvatarStyle.UNICORN) {
    ctx.moveTo(x - s * 0.4, y - s * 0.3);
    ctx.lineTo(x - s * 0.65, y - s * 0.95); 
    ctx.lineTo(x - s * 0.15, y - s * 0.55);
    
    ctx.moveTo(x + s * 0.4, y - s * 0.3);
    ctx.lineTo(x + s * 0.65, y - s * 0.95); 
    ctx.lineTo(x + s * 0.15, y - s * 0.55);
  } else if (style === AvatarStyle.RABBIT) {
    ctx.ellipse(x - s * 0.3, y - s * 0.9, s * 0.15, s * 0.6, -0.2, 0, Math.PI * 2);
    ctx.ellipse(x + s * 0.3, y - s * 0.9, s * 0.15, s * 0.6, 0.2, 0, Math.PI * 2);
  } else if (style === AvatarStyle.BEAR || style === AvatarStyle.PANDA || style === AvatarStyle.LION || style === AvatarStyle.TIGER) {
    // Round ears
    ctx.arc(x - s * 0.45, y - s * 0.45, s * 0.22, 0, Math.PI * 2);
    ctx.moveTo(x + s * 0.45, y - s * 0.45);
    ctx.arc(x + s * 0.45, y - s * 0.45, s * 0.22, 0, Math.PI * 2);
  } else if (style === AvatarStyle.KOALA) {
    // Big fluffy ears
    ctx.arc(x - s * 0.55, y - s * 0.4, s * 0.3, 0, Math.PI * 2);
    ctx.moveTo(x + s * 0.55, y - s * 0.4);
    ctx.arc(x + s * 0.55, y - s * 0.4, s * 0.3, 0, Math.PI * 2);
  } else if (style === AvatarStyle.PIG) {
     // Floppy pig ears
     ctx.moveTo(x - s * 0.3, y - s * 0.4);
     ctx.quadraticCurveTo(x - s * 0.6, y - s * 0.6, x - s * 0.7, y - s * 0.3);
     ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.2, x - s * 0.35, y - s * 0.3);

     ctx.moveTo(x + s * 0.3, y - s * 0.4);
     ctx.quadraticCurveTo(x + s * 0.6, y - s * 0.6, x + s * 0.7, y - s * 0.3);
     ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.2, x + s * 0.35, y - s * 0.3);
  } else {
    // Dog
    ctx.ellipse(x - s * 0.55, y - s * 0.1, s * 0.18, s * 0.35, 0.4, 0, Math.PI * 2);
    ctx.ellipse(x + s * 0.55, y - s * 0.1, s * 0.18, s * 0.35, -0.4, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();

  // Inner Ear Detail for Koala
  if (style === AvatarStyle.KOALA) {
     ctx.fillStyle = '#f3f4f6';
     ctx.beginPath();
     ctx.arc(x - s * 0.55, y - s * 0.4, s * 0.15, 0, Math.PI * 2);
     ctx.arc(x + s * 0.55, y - s * 0.4, s * 0.15, 0, Math.PI * 2);
     ctx.fill();
  }

  if (style === AvatarStyle.UNICORN) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x - s * 0.1, y - s * 0.4);
      ctx.lineTo(x, y - s * 1.1);
      ctx.lineTo(x + s * 0.1, y - s * 0.4);
      ctx.fill();
      ctx.stroke();
  }
};

const drawHead = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, secColor: string, style: AvatarStyle) => {
  ctx.fillStyle = color;
  ctx.lineWidth = s * 0.03;
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  
  ctx.beginPath();
  if (style === AvatarStyle.KOALA) {
      // Wider head for koala
      ctx.ellipse(x, y, s * 0.65, s * 0.5, 0, 0, Math.PI * 2);
  } else {
      ctx.ellipse(x, y, s * 0.55, s * 0.5, 0, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();

  // Stripes for Tiger
  if (style === AvatarStyle.TIGER) {
      ctx.fillStyle = '#1e1b4b'; // Dark stripes
      // Top stripes
      ctx.beginPath(); ctx.moveTo(x, y - s*0.48); ctx.lineTo(x-s*0.08, y-s*0.35); ctx.lineTo(x+s*0.08, y-s*0.35); ctx.fill();
      // Side stripes
      ctx.beginPath(); ctx.moveTo(x - s*0.53, y); ctx.lineTo(x-s*0.35, y-s*0.05); ctx.lineTo(x-s*0.35, y+s*0.05); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + s*0.53, y); ctx.lineTo(x+s*0.35, y-s*0.05); ctx.lineTo(x+s*0.35, y+s*0.05); ctx.fill();
  }

  ctx.fillStyle = secColor;
  if (style === AvatarStyle.PANDA) {
      ctx.beginPath();
      ctx.ellipse(x - s * 0.2, y - s * 0.1, s * 0.14, s * 0.12, -0.2, 0, Math.PI * 2);
      ctx.ellipse(x + s * 0.2, y - s * 0.1, s * 0.14, s * 0.12, 0.2, 0, Math.PI * 2);
      ctx.fill();
  } else if (style === AvatarStyle.FOX || style === AvatarStyle.DOG || style === AvatarStyle.CAT || style === AvatarStyle.LION || style === AvatarStyle.TIGER) {
      ctx.beginPath();
      ctx.ellipse(x, y + s * 0.15, s * 0.35, s * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
  }
};

const drawEyes = (ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, blinkL: number, blinkR: number, browUp: number, landmarks: any[], w: number, h: number, color: string) => {
    const eyeY = cy - s * 0.05;
    const eyeOff = s * 0.2;
    const eyeSize = s * 0.13;

    const irisL = landmarks[468];
    const dx = (irisL.x - landmarks[1].x) * w * 2.0; 
    const dy = (irisL.y - landmarks[1].y) * h * 2.0;

    [cx - eyeOff, cx + eyeOff].forEach((ex, i) => {
        const blink = i === 0 ? blinkL : blinkR;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        if (blink > 0.6) {
            ctx.beginPath();
            ctx.moveTo(ex - eyeSize, eyeY);
            ctx.quadraticCurveTo(ex, eyeY + eyeSize * 0.3, ex + eyeSize, eyeY);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(ex, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#1e293b';
            const px = Math.max(-eyeSize * 0.5, Math.min(eyeSize * 0.5, dx));
            const py = Math.max(-eyeSize * 0.5, Math.min(eyeSize * 0.5, dy));
            
            ctx.beginPath();
            ctx.arc(ex + px, eyeY + py, eyeSize * 0.55, 0, Math.PI * 2);
            ctx.fill();
            
            // Eye shine (cute factor)
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath();
            ctx.arc(ex + px - eyeSize*0.2, eyeY + py - eyeSize*0.2, eyeSize * 0.25, 0, Math.PI * 2);
            ctx.fill();
        }

        const browY = eyeY - eyeSize * 1.3 - (browUp * s * 0.15);
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.moveTo(ex - eyeSize, browY);
        ctx.quadraticCurveTo(ex, browY - (browUp * 15), ex + eyeSize, browY);
        ctx.stroke();
    });
};

const drawNose = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, style: AvatarStyle) => {
    const noseY = y + s * 0.18;
    ctx.fillStyle = color;
    
    ctx.beginPath();
    if (style === AvatarStyle.CAT || style === AvatarStyle.RABBIT || style === AvatarStyle.FOX || style === AvatarStyle.LION || style === AvatarStyle.TIGER) {
        ctx.moveTo(x - s * 0.06, noseY - s * 0.04);
        ctx.lineTo(x + s * 0.06, noseY - s * 0.04);
        ctx.lineTo(x, noseY + s * 0.06);
    } else if (style === AvatarStyle.PIG) {
        ctx.ellipse(x, noseY, s * 0.12, s * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.arc(x - s*0.04, noseY, s*0.025, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + s*0.04, noseY, s*0.025, 0, Math.PI*2); ctx.fill();
        return;
    } else if (style === AvatarStyle.KOALA) {
        ctx.fillStyle = '#374151';
        ctx.roundRect(x - s * 0.1, noseY - s * 0.1, s * 0.2, s * 0.25, 10);
    } else {
        ctx.ellipse(x, noseY, s * 0.08, s * 0.05, 0, 0, Math.PI * 2);
    }
    ctx.fill();
};

const drawMouth = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, open: number, smile: number) => {
    const mouthY = y + s * 0.35;
    const width = s * 0.15 + (smile * s * 0.08);
    const height = Math.max(0, open * s * 0.25);

    ctx.fillStyle = '#9f1239';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;

    ctx.beginPath();
    
    if (height > s * 0.05) {
        ctx.moveTo(x - width, mouthY);
        ctx.quadraticCurveTo(x, mouthY + (smile * 10), x + width, mouthY);
        ctx.quadraticCurveTo(x, mouthY + height, x - width, mouthY);
        ctx.fill();
        ctx.stroke();
        
        if (open > 0.3) {
            ctx.fillStyle = '#fb7185';
            ctx.beginPath();
            ctx.arc(x, mouthY + height - height * 0.3, width * 0.6, 0, Math.PI, false);
            ctx.fill();
        }
    } else {
        ctx.moveTo(x - width, mouthY);
        ctx.quadraticCurveTo(x, mouthY + (smile * s * 0.15), x + width, mouthY);
        ctx.stroke();
    }
};

const drawAccessories = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, type: string) => {
    if (type === 'glasses') {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 5;
        ctx.fillStyle = 'rgba(147, 197, 253, 0.3)';
        const gy = y - s * 0.05;
        ctx.beginPath(); ctx.arc(x - s * 0.22, gy, s * 0.18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + s * 0.22, gy, s * 0.18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.lineWidth = 3; ctx.moveTo(x - s * 0.04, gy); ctx.lineTo(x + s * 0.04, gy); ctx.stroke();
    } else if (type === 'bow') {
        ctx.fillStyle = '#ef4444';
        const by = y + s * 0.55;
        ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x - s * 0.25, by - s * 0.15); ctx.lineTo(x - s * 0.25, by + s * 0.15); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x + s * 0.25, by - s * 0.15); ctx.lineTo(x + s * 0.25, by + s * 0.15); ctx.fill();
        ctx.fillStyle = '#b91c1c'; ctx.beginPath(); ctx.arc(x, by, s * 0.06, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'hat') {
        const hy = y - s * 0.55;
        ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.ellipse(x, hy, s * 0.7, s * 0.15, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.roundRect(x - s * 0.4, hy - s * 0.5, s * 0.8, s * 0.5, 10); ctx.fill();
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.rect(x - s * 0.4, hy - s * 0.1, s * 0.8, s * 0.1); ctx.fill();
    } else if (type === 'headphones') {
        ctx.fillStyle = '#ef4444';
        const hy = y - s * 0.1;
        ctx.beginPath(); ctx.roundRect(x - s * 0.7, hy, s * 0.15, s * 0.4, 5); ctx.fill();
        ctx.beginPath(); ctx.roundRect(x + s * 0.55, hy, s * 0.15, s * 0.4, 5); ctx.fill();
    } else if (type === 'crown') {
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        const cy = y - s * 0.6;
        ctx.beginPath();
        ctx.moveTo(x - s * 0.4, cy);
        ctx.lineTo(x - s * 0.4, cy - s * 0.3);
        ctx.lineTo(x - s * 0.2, cy - s * 0.15);
        ctx.lineTo(x, cy - s * 0.4);
        ctx.lineTo(x + s * 0.2, cy - s * 0.15);
        ctx.lineTo(x + s * 0.4, cy - s * 0.3);
        ctx.lineTo(x + s * 0.4, cy);
        ctx.fill(); ctx.stroke();
    } else if (type === 'flower') {
        ctx.fillStyle = '#f472b6';
        const fy = y - s * 0.4;
        const fx = x + s * 0.45;
        for(let i=0; i<5; i++) {
           const ang = (i * Math.PI * 2) / 5;
           ctx.beginPath();
           ctx.arc(fx + Math.cos(ang)*s*0.1, fy + Math.sin(ang)*s*0.1, s*0.08, 0, Math.PI*2);
           ctx.fill();
        }
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.arc(fx, fy, s*0.06, 0, Math.PI*2); ctx.fill();
    } else if (type === 'mask') {
        ctx.fillStyle = '#3b82f6';
        const my = y + s * 0.2;
        ctx.beginPath();
        ctx.roundRect(x - s * 0.45, my, s * 0.9, s * 0.35, 10);
        ctx.fill();
        // Straps
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - s * 0.45, my + s*0.1); ctx.lineTo(x - s * 0.6, my - s*0.1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + s * 0.45, my + s*0.1); ctx.lineTo(x + s * 0.6, my - s*0.1); ctx.stroke();
    } else if (type === 'pirate') {
        ctx.fillStyle = '#1e1b4b';
        const py = y - s * 0.6;
        ctx.beginPath();
        ctx.moveTo(x - s * 0.8, py);
        ctx.quadraticCurveTo(x, py - s * 0.5, x + s * 0.8, py);
        ctx.lineTo(x, py - s * 0.2);
        ctx.fill();
        // Skull
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x, py - s * 0.15, s * 0.08, 0, Math.PI*2); ctx.fill();
    } else if (type === 'monocle') {
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        const my = y - s * 0.05;
        ctx.beginPath(); ctx.arc(x - s * 0.22, my, s * 0.18, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - s * 0.22 + s * 0.18, my); ctx.lineTo(x - s * 0.22 + s * 0.18, y + s * 0.5); ctx.stroke();
    } else if (type === 'mustache') {
        ctx.fillStyle = '#333';
        const my = y + s * 0.22;
        ctx.beginPath();
        ctx.moveTo(x, my);
        ctx.quadraticCurveTo(x - s*0.2, my - s*0.1, x - s*0.3, my + s*0.1);
        ctx.quadraticCurveTo(x - s*0.15, my, x, my + s*0.05);
        ctx.quadraticCurveTo(x + s*0.15, my, x + s*0.3, my + s*0.1);
        ctx.quadraticCurveTo(x + s*0.2, my - s*0.1, x, my);
        ctx.fill();
    } else if (type === 'bowtie') {
        ctx.fillStyle = '#ef4444';
        const by = y + s * 0.65; // Neck area
        ctx.beginPath();
        ctx.moveTo(x, by);
        ctx.lineTo(x - s * 0.25, by - s * 0.15);
        ctx.lineTo(x - s * 0.25, by + s * 0.15);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x, by);
        ctx.lineTo(x + s * 0.25, by - s * 0.15);
        ctx.lineTo(x + s * 0.25, by + s * 0.15);
        ctx.fill();
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath(); ctx.arc(x, by, s * 0.05, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'beanie') {
         const hy = y - s * 0.5;
         ctx.fillStyle = '#ea580c'; // Orange beanie
         ctx.beginPath();
         ctx.moveTo(x - s * 0.55, hy);
         ctx.quadraticCurveTo(x, hy - s * 0.6, x + s * 0.55, hy);
         ctx.lineTo(x + s * 0.55, hy + s * 0.2);
         ctx.quadraticCurveTo(x, hy + s * 0.1, x - s * 0.55, hy + s * 0.2);
         ctx.fill();
         // Pom pom
         ctx.fillStyle = '#fbbf24';
         ctx.beginPath(); ctx.arc(x, hy - s * 0.35, s * 0.12, 0, Math.PI*2); ctx.fill();
    } else if (type === 'earrings') {
         ctx.strokeStyle = '#ffd700'; // Gold
         ctx.lineWidth = 3;
         const ey = y + s * 0.1;
         ctx.beginPath(); ctx.arc(x - s * 0.6, ey, s * 0.1, 0, Math.PI*2); ctx.stroke();
         ctx.beginPath(); ctx.arc(x + s * 0.6, ey, s * 0.1, 0, Math.PI*2); ctx.stroke();
    } else if (type === 'visor') {
        ctx.fillStyle = '#06b6d4'; // Cyan
        const vy = y - s * 0.15;
        ctx.beginPath();
        ctx.moveTo(x - s * 0.5, vy);
        ctx.quadraticCurveTo(x, vy - s * 0.1, x + s * 0.5, vy);
        ctx.lineTo(x + s * 0.45, vy + s * 0.15);
        ctx.quadraticCurveTo(x, vy + s * 0.05, x - s * 0.45, vy + s * 0.15);
        ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - s * 0.3, vy + s * 0.05);
        ctx.lineTo(x - s * 0.2, vy + s * 0.1);
        ctx.stroke();
    }
};

export const drawStaticAvatar = (ctx: CanvasRenderingContext2D, config: AvatarConfig, w: number, h: number) => {
    const s = Math.min(w, h) * 0.5;
    const theme = COLORS[config.style];
    const baseColor = config.color || theme.base;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (document.documentElement.classList.contains('dark')) {
      grad.addColorStop(0, '#020617'); 
      grad.addColorStop(1, '#1e293b');
    } else {
      grad.addColorStop(0, '#e0f2fe'); 
      grad.addColorStop(1, '#fdf4ff');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Static centered face
    if (config.style === AvatarStyle.LION) drawMane(ctx, w/2, h/2, s*1.5, theme.detail);
    if (config.accessory === 'scarf') drawScarf(ctx, w/2, h/2, s*1.5, '#ef4444');
    if (config.accessory === 'headphones') drawHeadphonesBand(ctx, w/2, h/2, s*1.5);
    drawEars(ctx, w/2, h/2, s*1.5, baseColor, theme.detail, config.style);
    drawHead(ctx, w/2, h/2, s*1.5, baseColor, theme.secondary, config.style);
    
    // Sleeping Eyes
    const eyeY = h/2;
    const eyeOff = s * 0.3;
    const eyeSize = s * 0.2;
    
    ctx.lineWidth = 3;
    ctx.strokeStyle = theme.detail;
    
    // Left Zzz
    ctx.beginPath();
    ctx.moveTo(w/2 - eyeOff - eyeSize, eyeY);
    ctx.lineTo(w/2 - eyeOff + eyeSize, eyeY);
    ctx.stroke();

    // Right Zzz
    ctx.beginPath();
    ctx.moveTo(w/2 + eyeOff - eyeSize, eyeY);
    ctx.lineTo(w/2 + eyeOff + eyeSize, eyeY);
    ctx.stroke();
    
    drawAccessories(ctx, w/2, h/2, s*1.5, config.accessory);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 24px Fredoka';
    ctx.textAlign = 'center';
    ctx.fillText("zZz", w/2 + s * 0.6, h/2 - s * 0.6);
};