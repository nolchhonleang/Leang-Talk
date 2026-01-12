import { AvatarStyle, FaceLandmarkerResult } from '../types';

// Colors for different avatars
const AVATAR_COLORS: Record<AvatarStyle, { base: string; secondary: string; detail: string }> = {
  [AvatarStyle.CAT]: { base: '#fbbf24', secondary: '#ffffff', detail: '#d97706' }, // Orange Tabby
  [AvatarStyle.DOG]: { base: '#a8a29e', secondary: '#f5f5f5', detail: '#57534e' }, // Grey/White
  [AvatarStyle.BEAR]: { base: '#78350f', secondary: '#b45309', detail: '#451a03' }, // Brown
  [AvatarStyle.RABBIT]: { base: '#fce7f3', secondary: '#ffffff', detail: '#f472b6' }, // Pink/White
  [AvatarStyle.FOX]: { base: '#ea580c', secondary: '#ffffff', detail: '#1e293b' }, // Orange/White
  [AvatarStyle.PANDA]: { base: '#ffffff', secondary: '#18181b', detail: '#000000' },
  [AvatarStyle.UNICORN]: { base: '#e0f2fe', secondary: '#fdf4ff', detail: '#8b5cf6' },
  [AvatarStyle.KOALA]: { base: '#9ca3af', secondary: '#e5e7eb', detail: '#4b5563' },
  [AvatarStyle.TIGER]: { base: '#f97316', secondary: '#ffedd5', detail: '#111827' },
  [AvatarStyle.LION]: { base: '#facc15', secondary: '#fef9c3', detail: '#b45309' },
  [AvatarStyle.PIG]: { base: '#f472b6', secondary: '#fbcfe8', detail: '#be185d' },
};

// Helper to get midpoint
const mid = (p1: {x:number, y:number}, p2: {x:number, y:number}) => ({
  x: (p1.x + p2.x) / 2,
  y: (p1.y + p2.y) / 2
});

// Helper to get distance
const dist = (p1: {x:number, y:number}, p2: {x:number, y:number}) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const drawAvatar = (
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number; z: number }[],
  style: AvatarStyle,
  width: number,
  height: number
) => {
  const colors = AVATAR_COLORS[style];

  // Clear canvas with a cute background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#e0f2fe'); // Light Blue
  gradient.addColorStop(1, '#fdf4ff'); // Light Pink
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  if (!landmarks || landmarks.length === 0) return;

  // Key landmarks (MediaPipe Face Mesh indices)
  // 1: Nose tip
  // 152: Chin
  // 10: Top of head
  // 234: Left ear/cheek area
  // 454: Right ear/cheek area
  const nose = { x: landmarks[1].x * width, y: landmarks[1].y * height };
  const chin = { x: landmarks[152].x * width, y: landmarks[152].y * height };
  const topHead = { x: landmarks[10].x * width, y: landmarks[10].y * height };
  const leftSide = { x: landmarks[234].x * width, y: landmarks[234].y * height };
  const rightSide = { x: landmarks[454].x * width, y: landmarks[454].y * height };

  // Calculate head dimensions
  const faceWidth = dist(leftSide, rightSide);
  const faceHeight = dist(topHead, chin);
  const centerX = nose.x;
  const centerY = nose.y;

  // Draw Ears (Behind head)
  ctx.fillStyle = colors.base;
  ctx.strokeStyle = colors.detail;
  ctx.lineWidth = 4;

  const earOffset = faceWidth * 0.4;
  const earY = topHead.y + faceHeight * 0.1;

  ctx.beginPath();
  if (style === AvatarStyle.RABBIT) {
    // Long ears
    ctx.ellipse(centerX - earOffset, earY - faceHeight * 0.5, faceWidth * 0.15, faceHeight * 0.4, -0.2, 0, Math.PI * 2);
    ctx.ellipse(centerX + earOffset, earY - faceHeight * 0.5, faceWidth * 0.15, faceHeight * 0.4, 0.2, 0, Math.PI * 2);
  } else if (style === AvatarStyle.CAT || style === AvatarStyle.FOX) {
    // Pointy ears
    ctx.moveTo(centerX - earOffset - faceWidth * 0.2, earY);
    ctx.lineTo(centerX - earOffset, earY - faceHeight * 0.4);
    ctx.lineTo(centerX - earOffset + faceWidth * 0.1, earY);

    ctx.moveTo(centerX + earOffset + faceWidth * 0.2, earY);
    ctx.lineTo(centerX + earOffset, earY - faceHeight * 0.4);
    ctx.lineTo(centerX + earOffset - faceWidth * 0.1, earY);
  } else if (style === AvatarStyle.BEAR || style === AvatarStyle.PANDA || style === AvatarStyle.KOALA || style === AvatarStyle.LION || style === AvatarStyle.TIGER) {
    // Round ears
    ctx.arc(centerX - earOffset, earY - faceHeight * 0.1, faceWidth * 0.2, 0, Math.PI * 2);
    ctx.arc(centerX + earOffset, earY - faceHeight * 0.1, faceWidth * 0.2, 0, Math.PI * 2);
  } else if (style === AvatarStyle.UNICORN) {
    // Horse ears
    ctx.moveTo(centerX - earOffset, earY);
    ctx.lineTo(centerX - earOffset - 10, earY - faceHeight * 0.3);
    ctx.lineTo(centerX - earOffset + 10, earY);
    
    ctx.moveTo(centerX + earOffset, earY);
    ctx.lineTo(centerX + earOffset + 10, earY - faceHeight * 0.3);
    ctx.lineTo(centerX + earOffset - 10, earY);
    
    // Horn
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.moveTo(centerX - 10, topHead.y);
    ctx.lineTo(centerX, topHead.y - faceHeight * 0.4);
    ctx.lineTo(centerX + 10, topHead.y);
    ctx.fill();
    ctx.stroke();
    // Reset fill
    ctx.fillStyle = colors.base;
  } else if (style === AvatarStyle.PIG) {
     // Pig ears (simplified)
     ctx.moveTo(centerX - earOffset, earY);
     ctx.quadraticCurveTo(centerX - earOffset - faceWidth * 0.2, earY - faceHeight * 0.3, centerX - earOffset - faceWidth * 0.3, earY);
     ctx.quadraticCurveTo(centerX - earOffset - faceWidth * 0.15, earY + faceHeight * 0.1, centerX - earOffset, earY);

     ctx.moveTo(centerX + earOffset, earY);
     ctx.quadraticCurveTo(centerX + earOffset + faceWidth * 0.2, earY - faceHeight * 0.3, centerX + earOffset + faceWidth * 0.3, earY);
     ctx.quadraticCurveTo(centerX + earOffset + faceWidth * 0.15, earY + faceHeight * 0.1, centerX + earOffset, earY);
  } else {
    // Dog floppy ears (Default)
    ctx.ellipse(centerX - earOffset - 20, earY + 20, faceWidth * 0.15, faceHeight * 0.25, 0.5, 0, Math.PI * 2);
    ctx.ellipse(centerX + earOffset + 20, earY + 20, faceWidth * 0.15, faceHeight * 0.25, -0.5, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();

  // Draw Head
  ctx.beginPath();
  ctx.fillStyle = colors.base;
  // Use a rounded rect/ellipse based on jawline
  ctx.ellipse(centerX, centerY, faceWidth * 0.6, faceHeight * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner face / Muzzle area
  ctx.beginPath();
  ctx.fillStyle = colors.secondary;
  if (style === AvatarStyle.PANDA) {
    // Eye patches
    ctx.ellipse(leftSide.x * 0.7 + centerX * 0.3, centerY - faceHeight * 0.1, faceWidth * 0.15, faceWidth * 0.12, -0.2, 0, Math.PI * 2);
    ctx.ellipse(rightSide.x * 0.7 + centerX * 0.3, centerY - faceHeight * 0.1, faceWidth * 0.15, faceWidth * 0.12, 0.2, 0, Math.PI * 2);
  } else {
    ctx.ellipse(centerX, centerY + faceHeight * 0.15, faceWidth * 0.35, faceHeight * 0.25, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  // Eyes
  // Left: 33 (inner), 133 (outer), 159 (top), 145 (bottom)
  // Right: 362 (inner), 263 (outer), 386 (top), 374 (bottom)
  const leftEyeCenter = {
    x: (landmarks[33].x + landmarks[133].x) / 2 * width,
    y: (landmarks[159].y + landmarks[145].y) / 2 * height
  };
  const rightEyeCenter = {
    x: (landmarks[362].x + landmarks[263].x) / 2 * width,
    y: (landmarks[386].y + landmarks[374].y) / 2 * height
  };

  const eyeSize = faceWidth * 0.12;

  // Eye Whites
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(leftEyeCenter.x, leftEyeCenter.y, eyeSize, 0, Math.PI * 2);
  ctx.arc(rightEyeCenter.x, rightEyeCenter.y, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pupils (Tracking gaze slightly)
  // Look at relative position of iris to eye corners
  const leftIris = { x: landmarks[468].x * width, y: landmarks[468].y * height };
  const rightIris = { x: landmarks[473].x * width, y: landmarks[473].y * height };

  const pupilSize = eyeSize * 0.5;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(leftIris.x, leftIris.y, pupilSize, 0, Math.PI * 2);
  ctx.arc(rightIris.x, rightIris.y, pupilSize, 0, Math.PI * 2);
  ctx.fill();

  // Shine in eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(leftIris.x - pupilSize*0.3, leftIris.y - pupilSize*0.3, pupilSize * 0.4, 0, Math.PI * 2);
  ctx.arc(rightIris.x - pupilSize*0.3, rightIris.y - pupilSize*0.3, pupilSize * 0.4, 0, Math.PI * 2);
  ctx.fill();


  // Nose
  const noseTip = { x: landmarks[1].x * width, y: landmarks[1].y * height };
  ctx.fillStyle = style === AvatarStyle.CAT ? '#pink' : '#000000';
  ctx.beginPath();
  if (style === AvatarStyle.CAT || style === AvatarStyle.RABBIT || style === AvatarStyle.FOX) {
    ctx.moveTo(noseTip.x - 10, noseTip.y - 5);
    ctx.lineTo(noseTip.x + 10, noseTip.y - 5);
    ctx.lineTo(noseTip.x, noseTip.y + 10);
  } else if (style === AvatarStyle.PIG) {
    ctx.fillStyle = '#f9a8d4';
    ctx.ellipse(noseTip.x, noseTip.y, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.arc(noseTip.x - 4, noseTip.y, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(noseTip.x + 4, noseTip.y, 3, 0, Math.PI*2); ctx.fill();
  } else {
    ctx.ellipse(noseTip.x, noseTip.y, 12, 8, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  // Mouth
  // 13 (upper lip), 14 (lower lip), 78 (left corner), 308 (right corner)
  const mouthLeft = { x: landmarks[78].x * width, y: landmarks[78].y * height };
  const mouthRight = { x: landmarks[308].x * width, y: landmarks[308].y * height };
  const mouthTop = { x: landmarks[13].x * width, y: landmarks[13].y * height };
  const mouthBottom = { x: landmarks[14].x * width, y: landmarks[14].y * height };

  const mouthOpenness = dist(mouthTop, mouthBottom);
  const isSmiling = (mouthLeft.y + mouthRight.y) / 2 < noseTip.y + (chin.y - noseTip.y) * 0.4;

  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000000';

  if (mouthOpenness > 10) {
      // Open mouth
      ctx.fillStyle = '#9f1239'; // Dark red inside
      ctx.moveTo(mouthLeft.x, mouthLeft.y);
      ctx.quadraticCurveTo(noseTip.x, mouthBottom.y + (mouthOpenness * 0.5), mouthRight.x, mouthRight.y);
      ctx.quadraticCurveTo(noseTip.x, mouthTop.y, mouthLeft.x, mouthLeft.y);
      ctx.fill();
      ctx.stroke();

      // Tongue
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(noseTip.x, mouthBottom.y, mouthOpenness * 0.4, 0, Math.PI, false);
      ctx.fill();
  } else {
      // Closed mouth
      ctx.moveTo(mouthLeft.x, mouthLeft.y);
      ctx.quadraticCurveTo(noseTip.x, mouthBottom.y, mouthRight.x, mouthRight.y);
      ctx.stroke();
  }

  // Whiskers (for Cat, Rabbit, Fox, Dog)
  if (style !== AvatarStyle.BEAR && style !== AvatarStyle.PANDA && style !== AvatarStyle.UNICORN && style !== AvatarStyle.PIG && style !== AvatarStyle.KOALA) {
     ctx.strokeStyle = '#000000';
     ctx.lineWidth = 2;
     ctx.beginPath();
     // Left whiskers
     ctx.moveTo(noseTip.x - 30, noseTip.y + 5);
     ctx.lineTo(noseTip.x - 70, noseTip.y - 10);
     ctx.moveTo(noseTip.x - 30, noseTip.y + 15);
     ctx.lineTo(noseTip.x - 70, noseTip.y + 15);

     // Right whiskers
     ctx.moveTo(noseTip.x + 30, noseTip.y + 5);
     ctx.lineTo(noseTip.x + 70, noseTip.y - 10);
     ctx.moveTo(noseTip.x + 30, noseTip.y + 15);
     ctx.lineTo(noseTip.x + 70, noseTip.y + 15);
     ctx.stroke();
  }

  // Blush
  ctx.fillStyle = 'rgba(244, 114, 182, 0.4)';
  ctx.beginPath();
  ctx.ellipse(leftSide.x * 0.8 + noseTip.x * 0.2, noseTip.y + 10, 20, 10, 0, 0, Math.PI*2);
  ctx.ellipse(rightSide.x * 0.8 + noseTip.x * 0.2, noseTip.y + 10, 20, 10, 0, 0, Math.PI*2);
  ctx.fill();
};

export const drawStaticAvatar = (
  ctx: CanvasRenderingContext2D,
  style: AvatarStyle,
  width: number,
  height: number
) => {
   // Simplified static drawing for when face is not found
   const colors = AVATAR_COLORS[style];
   const gradient = ctx.createLinearGradient(0, 0, 0, height);
   gradient.addColorStop(0, '#e0f2fe');
   gradient.addColorStop(1, '#fdf4ff');
   ctx.fillStyle = gradient;
   ctx.fillRect(0, 0, width, height);

   // Draw a simple circle head centered
   ctx.fillStyle = colors.base;
   ctx.beginPath();
   ctx.arc(width/2, height/2, width/3, 0, Math.PI*2);
   ctx.fill();
   ctx.stroke();

   // Simple face
   ctx.fillStyle = '#fff';
   ctx.beginPath();
   ctx.arc(width/2 - 40, height/2 - 20, 15, 0, Math.PI*2);
   ctx.arc(width/2 + 40, height/2 - 20, 15, 0, Math.PI*2);
   ctx.fill();

   ctx.fillStyle = '#000';
   ctx.beginPath();
   ctx.arc(width/2 - 40, height/2 - 20, 5, 0, Math.PI*2);
   ctx.arc(width/2 + 40, height/2 - 20, 5, 0, Math.PI*2);
   ctx.fill();
};
