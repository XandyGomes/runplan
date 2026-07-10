import sharp from 'sharp';

const SRC = 'D:/Projetos/Aplicativo de corrida com IA ligado ao Strava/public/logo.png';
const OUT = 'D:/Projetos/RunPlan/public/logo.png';

const overlaySvg = Buffer.from(`
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect x="100" y="705" width="824" height="165" fill="rgb(5,15,22)"/>
  <text x="512" y="812" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="900"
        font-size="104" letter-spacing="2">
    <tspan fill="#FFFFFF">RUN</tspan><tspan fill="#FD4D02"> PLAN</tspan>
  </text>
</svg>
`);

await sharp(SRC)
  .composite([{ input: overlaySvg, top: 0, left: 0 }])
  .png()
  .toFile(OUT);

console.log('done');
