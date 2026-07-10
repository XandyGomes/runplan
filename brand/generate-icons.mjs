import sharp from 'sharp';

const SRC = 'D:/Projetos/Aplicativo de corrida com IA ligado ao Strava/public/logo.png';
const PUBLIC = 'D:/Projetos/RunPlan/public';
const BG = { r: 6, g: 16, b: 23 };

// Recorte quadrado centrado só na figura do corredor, sem o texto embaixo
// (o texto "AURA RUN" começa em y=738 na imagem original, então o recorte
// precisa terminar bem antes disso).
const crop = { left: 163, top: 45, width: 670, height: 670 };

async function main() {
  const cropped = await sharp(SRC).extract(crop).toBuffer();

  // Ícone "any": preenche o quadrado quase todo (o launcher aplica seu próprio arredondamento).
  await sharp(cropped).resize(512, 512).png().toFile(`${PUBLIC}/icon-512.png`);
  await sharp(cropped).resize(192, 192).png().toFile(`${PUBLIC}/icon-192.png`);
  await sharp(cropped).resize(180, 180).png().toFile(`${PUBLIC}/apple-icon.png`);

  // Ícone "maskable": precisa de margem de segurança (~70% de conteúdo) porque o SO
  // recorta em formatos variados (círculo, squircle, etc.) por cima do ícone.
  const inner = await sharp(cropped).resize(358, 358).toBuffer();
  await sharp({
    create: { width: 512, height: 512, channels: 3, background: BG },
  })
    .composite([{ input: inner, left: Math.round((512 - 358) / 2), top: Math.round((512 - 358) / 2) }])
    .png()
    .toFile(`${PUBLIC}/icon-maskable-512.png`);

  console.log('icons generated');
}

main();
