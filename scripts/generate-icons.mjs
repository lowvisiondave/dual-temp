import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets');

// Generate a clean, minimal thermometer SVG
function createThermometerSVG(size) {
  // All coordinates are proportional to size
  const s = size;
  const cx = s / 2; // center x

  // Thermometer dimensions (proportional)
  const stemWidth = s * 0.22;
  const stemRadius = stemWidth / 2;
  const bulbRadius = s * 0.22;
  const stemTop = s * 0.1;
  const stemBottom = s * 0.62;
  const bulbCenterY = s * 0.74;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <clipPath id="thermo">
      <!-- Stem with rounded top -->
      <rect x="${cx - stemRadius}" y="${stemTop + stemRadius}" width="${stemWidth}" height="${stemBottom - stemTop - stemRadius}" rx="0"/>
      <!-- Rounded top cap -->
      <circle cx="${cx}" cy="${stemTop + stemRadius}" r="${stemRadius}"/>
      <!-- Bulb -->
      <circle cx="${cx}" cy="${bulbCenterY}" r="${bulbRadius}"/>
    </clipPath>
  </defs>
  <!-- Thermometer shape -->
  <rect x="${cx - stemRadius}" y="${stemTop + stemRadius}" width="${stemWidth}" height="${stemBottom - stemTop - stemRadius}" fill="black"/>
  <circle cx="${cx}" cy="${stemTop + stemRadius}" r="${stemRadius}" fill="black"/>
  <circle cx="${cx}" cy="${bulbCenterY}" r="${bulbRadius}" fill="black"/>
</svg>`;
}

// Sun peeking behind a cloud silhouette
function createSunCloudSVG(size) {
  const s = size;
  // Sun behind cloud — upper-left area
  const sunCx = s * 0.35;
  const sunCy = s * 0.32;
  const sunR = s * 0.18;
  const rayLen = s * 0.09;
  const rayW = s * 0.04;

  // Sun rays (8 directions)
  const rays = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const x1 = sunCx + Math.cos(angle) * (sunR + s * 0.02);
    const y1 = sunCy + Math.sin(angle) * (sunR + s * 0.02);
    const x2 = sunCx + Math.cos(angle) * (sunR + s * 0.02 + rayLen);
    const y2 = sunCy + Math.sin(angle) * (sunR + s * 0.02 + rayLen);
    rays.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" stroke-width="${rayW}" stroke-linecap="round"/>`);
  }

  // Cloud — lower-right, overlapping sun
  const cloudBaseY = s * 0.62;
  const cloudW = s * 0.7;
  const cloudX = s * 0.25;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <!-- Sun rays -->
  ${rays.join('\n  ')}
  <!-- Sun disc -->
  <circle cx="${sunCx}" cy="${sunCy}" r="${sunR}" fill="black"/>
  <!-- Cloud body (overlaps sun) -->
  <ellipse cx="${cloudX + cloudW * 0.5}" cy="${cloudBaseY}" rx="${cloudW * 0.5}" ry="${s * 0.18}" fill="black"/>
  <circle cx="${cloudX + cloudW * 0.25}" cy="${cloudBaseY - s * 0.1}" r="${s * 0.15}" fill="black"/>
  <circle cx="${cloudX + cloudW * 0.55}" cy="${cloudBaseY - s * 0.15}" r="${s * 0.18}" fill="black"/>
  <circle cx="${cloudX + cloudW * 0.78}" cy="${cloudBaseY - s * 0.06}" r="${s * 0.13}" fill="black"/>
</svg>`;
}

// 270-degree arc gauge with needle and center dot
function createGaugeSVG(size) {
  const s = size;
  const cx = s / 2;
  const cy = s * 0.52;
  const r = s * 0.36;
  const strokeW = s * 0.07;

  // 270° arc from 135° to 405° (i.e. bottom-left gap)
  const startAngle = (135 * Math.PI) / 180;
  const endAngle = (405 * Math.PI) / 180;

  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);

  // Needle pointing to ~60% position (about 2 o'clock)
  const needleAngle = (135 + 270 * 0.6) * Math.PI / 180;
  const needleLen = r * 0.75;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy + needleLen * Math.sin(needleAngle);

  const dotR = s * 0.06;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <!-- Arc -->
  <path d="M ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2}" fill="none" stroke="black" stroke-width="${strokeW}" stroke-linecap="round"/>
  <!-- Needle -->
  <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="black" stroke-width="${s * 0.045}" stroke-linecap="round"/>
  <!-- Center dot -->
  <circle cx="${cx}" cy="${cy}" r="${dotR}" fill="black"/>
</svg>`;
}

// Generate app icon SVG (larger, more detailed)
function createAppIconSVG(size) {
  const s = size;
  const cx = s / 2;

  // Outer thermometer (outline)
  const outerStemWidth = s * 0.20;
  const outerStemRadius = outerStemWidth / 2;
  const outerBulbRadius = s * 0.20;
  const stemTop = s * 0.08;
  const stemBottom = s * 0.60;
  const bulbCenterY = s * 0.72;

  // Inner cutout (for hollow effect)
  const innerStemWidth = outerStemWidth * 0.55;
  const innerStemRadius = innerStemWidth / 2;
  const innerBulbRadius = outerBulbRadius * 0.55;

  // Mercury fill level (fills ~60% of stem)
  const mercuryTop = stemTop + (stemBottom - stemTop) * 0.35;
  const mercuryWidth = innerStemWidth;
  const mercuryRadius = innerStemRadius;

  // Tick marks
  const tickLength = s * 0.06;
  const tickGap = s * 0.008;
  const tickX = cx + outerStemRadius + tickGap;
  const tickSpacing = (stemBottom - stemTop - outerStemRadius) / 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <!-- Background -->
  <rect width="${s}" height="${s}" rx="${s * 0.18}" fill="#f0f4f8"/>

  <!-- Outer thermometer body -->
  <rect x="${cx - outerStemRadius}" y="${stemTop + outerStemRadius}" width="${outerStemWidth}" height="${stemBottom - stemTop - outerStemRadius}" fill="#2d3748"/>
  <circle cx="${cx}" cy="${stemTop + outerStemRadius}" r="${outerStemRadius}" fill="#2d3748"/>
  <circle cx="${cx}" cy="${bulbCenterY}" r="${outerBulbRadius}" fill="#e53e3e"/>

  <!-- Inner hollow (white) -->
  <rect x="${cx - innerStemRadius}" y="${stemTop + outerStemRadius}" width="${innerStemWidth}" height="${stemBottom - stemTop - outerStemRadius - innerBulbRadius * 0.3}" fill="white"/>
  <circle cx="${cx}" cy="${stemTop + outerStemRadius}" r="${innerStemRadius}" fill="white"/>

  <!-- Mercury column -->
  <rect x="${cx - mercuryRadius}" y="${mercuryTop}" width="${mercuryWidth}" height="${stemBottom - mercuryTop - innerBulbRadius * 0.3}" fill="#e53e3e"/>
  <circle cx="${cx}" cy="${mercuryTop}" r="${mercuryRadius}" fill="#e53e3e"/>

  <!-- Inner bulb highlight -->
  <circle cx="${cx}" cy="${bulbCenterY}" r="${innerBulbRadius}" fill="#fc8181"/>

  <!-- Tick marks -->
  ${[0, 1, 2, 3].map(i => {
    const y = stemTop + outerStemRadius + tickSpacing * (i + 0.5);
    return `<rect x="${tickX}" y="${y - 0.5}" width="${tickLength}" height="${s * 0.012}" rx="${s * 0.004}" fill="#a0aec0"/>`;
  }).join('\n  ')}
</svg>`;
}

const iconStyles = {
  thermometer: createThermometerSVG,
  'sun-cloud': createSunCloudSVG,
  gauge: createGaugeSVG,
};

async function generateIcons() {
  // Generate style-specific menu bar icons into subdirectories
  for (const [style, svgFn] of Object.entries(iconStyles)) {
    const dir = join(assetsDir, 'icons', style);
    mkdirSync(dir, { recursive: true });

    const svg22 = svgFn(22);
    const svg44 = svgFn(44);

    await sharp(Buffer.from(svg22))
      .png()
      .toFile(join(dir, 'iconTemplate.png'));
    console.log(`Generated icons/${style}/iconTemplate.png (22x22)`);

    await sharp(Buffer.from(svg44))
      .png()
      .toFile(join(dir, 'iconTemplate@2x.png'));
    console.log(`Generated icons/${style}/iconTemplate@2x.png (44x44)`);
  }

  // Text-only: 1x1 transparent pixel
  const textOnlyDir = join(assetsDir, 'icons', 'text-only');
  mkdirSync(textOnlyDir, { recursive: true });

  const transparentPixel = await sharp({
    create: { width: 1, height: 1, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).png().toBuffer();

  writeFileSync(join(textOnlyDir, 'iconTemplate.png'), transparentPixel);
  writeFileSync(join(textOnlyDir, 'iconTemplate@2x.png'), transparentPixel);
  console.log('Generated icons/text-only/iconTemplate.png (1x1 transparent)');
  console.log('Generated icons/text-only/iconTemplate@2x.png (1x1 transparent)');

  // Root-level backward-compat (thermometer)
  const svg22 = createThermometerSVG(22);
  const svg44 = createThermometerSVG(44);

  await sharp(Buffer.from(svg22))
    .png()
    .toFile(join(assetsDir, 'iconTemplate.png'));
  console.log('Generated iconTemplate.png (22x22) — backward compat');

  await sharp(Buffer.from(svg44))
    .png()
    .toFile(join(assetsDir, 'iconTemplate@2x.png'));
  console.log('Generated iconTemplate@2x.png (44x44) — backward compat');

  // App icon
  const svgApp = createAppIconSVG(512);
  await sharp(Buffer.from(svgApp))
    .png()
    .toFile(join(assetsDir, 'app-icon.png'));
  console.log('Generated app-icon.png (512x512)');

  console.log('\nDone! All icons generated.');
}

generateIcons().catch(console.error);
