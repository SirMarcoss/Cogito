import type { CategoriaOpera } from "../types/api";

export type ArtworkMotif =
  | "temple"
  | "theater"
  | "cathedral"
  | "castle"
  | "baroque"
  | "painting"
  | "sculpture"
  | "artifact"
  | "mosaic"
  | "manuscript"
  | "map"
  | "fountain";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trimEnd()}…`;
}

function renderMotifIllustration(motif: ArtworkMotif): string {
  switch (motif) {
    case "temple":
      return `
        <path d="M120 456 H680 V474 H120 Z" fill="#E8D8B8" stroke="#8A6826" stroke-width="2"/>
        <path d="M148 438 H652 V456 H148 Z" fill="#EFE2C7" stroke="#8A6826" stroke-width="1.8"/>
        <path d="M174 422 H626 V438 H174 Z" fill="#F5EBDA" stroke="#8A6826" stroke-width="1.8"/>
        <g fill="#F6EFE0" stroke="#8A6826" stroke-width="2">
          <rect x="200" y="220" width="32" height="202"/>
          <rect x="272" y="220" width="32" height="202"/>
          <rect x="344" y="220" width="32" height="202"/>
          <rect x="424" y="220" width="32" height="202"/>
          <rect x="496" y="220" width="32" height="202"/>
          <rect x="568" y="220" width="32" height="202"/>
        </g>
        <rect x="180" y="192" width="440" height="28" fill="#EFE2C7" stroke="#8A6826" stroke-width="2"/>
        <polygon points="160,192 400,118 640,192" fill="#F6EFE0" stroke="url(#goldLeaf)" stroke-width="3"/>
        <polygon points="205,184 400,132 595,184" fill="#E9D8B6" stroke="#B89045" stroke-width="1.5"/>
      `;
    case "theater":
      return `
        <path d="M150 385 Q400 470 650 385 L685 265 Q400 345 115 265 Z" fill="#EFE3CA" stroke="#8A6826" stroke-width="2"/>
        <path d="M178 355 Q400 432 622 355" fill="none" stroke="#B89045" stroke-width="2"/>
        <path d="M208 325 Q400 392 592 325" fill="none" stroke="#B89045" stroke-width="2"/>
        <path d="M238 295 Q400 352 562 295" fill="none" stroke="#8A6826" stroke-width="2"/>
        <path d="M270 392 Q400 432 530 392 L505 446 Q400 474 295 446 Z" fill="#D9C398" stroke="#8A6826" stroke-width="2"/>
        <rect x="235" y="176" width="330" height="82" fill="#F6EFE0" stroke="#8A6826" stroke-width="2"/>
        <path d="M268 258 V214 Q292 194 316 214 V258 M376 258 V206 Q400 184 424 206 V258 M484 258 V214 Q508 194 532 214 V258" fill="#4A3A28" stroke="#B89045" stroke-width="1.8"/>
      `;
    case "cathedral":
      return `
        <rect x="190" y="238" width="420" height="230" fill="#F6EFE0" stroke="#8A6826" stroke-width="2"/>
        <rect x="292" y="156" width="216" height="312" fill="#FBF6EA" stroke="#8A6826" stroke-width="2"/>
        <path d="M320 205 Q400 112 480 205 Z" fill="#EFE2C7" stroke="url(#goldLeaf)" stroke-width="2.5"/>
        <circle cx="400" cy="248" r="34" fill="#FAF6EE" stroke="url(#goldLeaf)" stroke-width="2.5"/>
        <circle cx="400" cy="248" r="18" fill="none" stroke="#8A6826" stroke-width="1.5"/>
        <path d="M352 468 V364 Q352 318 400 302 Q448 318 448 364 V468 Z" fill="#4A3A28" stroke="url(#goldLeaf)" stroke-width="2.5"/>
        <path d="M226 468 V384 Q246 356 266 384 V468 M534 468 V384 Q554 356 574 384 V468" fill="#574C3F" stroke="#B89045" stroke-width="1.8"/>
        <line x1="400" y1="128" x2="400" y2="96" stroke="#8A6826" stroke-width="3"/>
        <line x1="386" y1="110" x2="414" y2="110" stroke="#8A6826" stroke-width="3"/>
      `;
    case "castle":
      return `
        <rect x="150" y="218" width="90" height="250" fill="#EFE3CA" stroke="#8A6826" stroke-width="2"/>
        <rect x="560" y="218" width="90" height="250" fill="#EFE3CA" stroke="#8A6826" stroke-width="2"/>
        <rect x="240" y="246" width="320" height="222" fill="#F6EFE0" stroke="#8A6826" stroke-width="2"/>
        <rect x="338" y="148" width="124" height="98" fill="#F2E7CF" stroke="#8A6826" stroke-width="2"/>
        <path d="M150 218 v-20 h22 v20 h23 v-20 h22 v20 h23 v-20 M560 218 v-20 h22 v20 h23 v-20 h22 v20 h23 v-20" fill="#EFE3CA" stroke="#8A6826" stroke-width="1.8"/>
        <path d="M352 468 V352 Q352 298 400 282 Q448 298 448 352 V468 Z" fill="#4A3A28" stroke="url(#goldLeaf)" stroke-width="3"/>
        <path d="M276 330 V296 Q290 278 304 296 V330 M496 330 V296 Q510 278 524 296 V330" fill="#574C3F" stroke="#B89045" stroke-width="1.6"/>
      `;
    case "baroque":
      return `
        <rect x="195" y="268" width="410" height="200" fill="#F6EFE0" stroke="#8A6826" stroke-width="2"/>
        <rect x="295" y="180" width="210" height="288" fill="#FBF6EA" stroke="#8A6826" stroke-width="2"/>
        <path d="M295 268 Q242 268 232 325 L295 325 Z M505 268 Q558 268 568 325 L505 325 Z" fill="#EFE2C7" stroke="url(#goldLeaf)" stroke-width="2"/>
        <polygon points="300,180 400,118 500,180" fill="#EFE2C7" stroke="url(#goldLeaf)" stroke-width="2.5"/>
        <path d="M358 468 V368 Q400 332 442 368 V468 Z" fill="#4A3A28" stroke="url(#goldLeaf)" stroke-width="2.5"/>
        <rect x="372" y="218" width="56" height="84" rx="28" fill="#574C3F" stroke="url(#goldLeaf)" stroke-width="2"/>
      `;
    case "painting":
      return `
        <rect x="220" y="132" width="360" height="332" rx="6" fill="#D9BC82" stroke="#8A6826" stroke-width="3"/>
        <rect x="244" y="156" width="312" height="284" fill="#FAF6EE" stroke="#8A6826" stroke-width="1.8"/>
        <rect x="262" y="174" width="276" height="248" fill="#EFE2C7" stroke="#B89045" stroke-width="1.4"/>
        <circle cx="400" cy="242" r="38" fill="#FAF6EE" stroke="url(#goldLeaf)" stroke-width="2.2"/>
        <path d="M312 422 Q342 308 400 296 Q458 308 488 422 Z" fill="#7D3B2E" stroke="#8A6826" stroke-width="2"/>
        <path d="M356 422 L400 326 L444 422 Z" fill="#B89045" fill-opacity="0.45"/>
      `;
    case "sculpture":
      return `
        <rect x="328" y="374" width="144" height="94" fill="#EFE2C7" stroke="#8A6826" stroke-width="2"/>
        <rect x="312" y="356" width="176" height="20" fill="#E8D7B4" stroke="#8A6826" stroke-width="1.8"/>
        <path d="M342 356 L354 248 Q372 224 400 224 Q428 224 446 248 L458 356 Z" fill="#FAF6EE" stroke="url(#goldLeaf)" stroke-width="2.5"/>
        <circle cx="400" cy="184" r="34" fill="#FAF6EE" stroke="#8A6826" stroke-width="2.2"/>
        <path d="M366 254 Q400 292 434 254" fill="none" stroke="#B89045" stroke-width="2"/>
      `;
    case "artifact":
      return `
        <rect x="320" y="396" width="160" height="72" fill="#EFE2C7" stroke="#8A6826" stroke-width="2"/>
        <path d="M352 396 C322 350 322 260 364 214 L360 166 H440 L436 214 C478 260 478 350 448 396 Z" fill="#D4B074" stroke="#8A6826" stroke-width="2.5"/>
        <path d="M360 198 C316 196 312 246 340 264 M440 198 C484 196 488 246 460 264" fill="none" stroke="#8A6826" stroke-width="5"/>
        <path d="M340 286 H460 M344 318 H456" stroke="#FAF6EE" stroke-width="2"/>
        <circle cx="400" cy="302" r="24" fill="none" stroke="#4A3A28" stroke-width="2"/>
      `;
    case "mosaic":
      return `
        <rect x="200" y="146" width="400" height="316" fill="#EFE2C7" stroke="url(#goldLeaf)" stroke-width="3"/>
        <rect x="224" y="170" width="352" height="268" fill="#FAF6EE" stroke="#8A6826" stroke-width="1.8"/>
        <circle cx="400" cy="304" r="96" fill="#F2E4C4" stroke="url(#goldLeaf)" stroke-width="2.5"/>
        <polygon points="400,218 424,280 486,304 424,328 400,390 376,328 314,304 376,280" fill="#B89045" fill-opacity="0.35" stroke="#8A6826" stroke-width="2"/>
        <circle cx="400" cy="304" r="22" fill="#8A6826" fill-opacity="0.75"/>
      `;
    case "manuscript":
      return `
        <rect x="236" y="138" width="328" height="330" rx="8" fill="#FAF6EE" stroke="url(#goldLeaf)" stroke-width="3"/>
        <rect x="256" y="158" width="288" height="290" fill="#FFFDF8" stroke="#B89045" stroke-width="1.5"/>
        <rect x="282" y="186" width="66" height="66" fill="#8A6826"/>
        <text x="315" y="234" text-anchor="middle" fill="#FAF6EE" font-family="Georgia, serif" font-size="44" font-weight="bold">S</text>
        <g stroke="#B89045" stroke-width="3" stroke-linecap="round" opacity="0.65">
          <line x1="368" y1="196" x2="514" y2="196"/>
          <line x1="368" y1="222" x2="514" y2="222"/>
          <line x1="368" y1="248" x2="496" y2="248"/>
          <line x1="282" y1="284" x2="514" y2="284"/>
          <line x1="282" y1="312" x2="514" y2="312"/>
          <line x1="282" y1="340" x2="484" y2="340"/>
          <line x1="282" y1="368" x2="508" y2="368"/>
          <line x1="282" y1="396" x2="442" y2="396"/>
        </g>
      `;
    case "map":
      return `
        <path d="M180 154 H620 L602 456 H198 Z" fill="#FBF4E4" stroke="url(#goldLeaf)" stroke-width="3"/>
        <path d="M230 280 Q320 230 410 270 T570 250 L548 380 Q440 410 340 370 T220 350 Z" fill="#E8D6B3" stroke="#8A6826" stroke-width="2"/>
        <circle cx="515" cy="215" r="32" fill="none" stroke="#8A6826" stroke-width="1.8"/>
        <path d="M515 178 V252 M478 215 H552" stroke="#B89045" stroke-width="1.6"/>
        <path d="M268 320 Q360 288 452 332" fill="none" stroke="#8E2820" stroke-width="2.5" stroke-dasharray="6 5"/>
      `;
    case "fountain":
      return `
        <ellipse cx="400" cy="430" rx="190" ry="38" fill="#E8D7B4" stroke="#8A6826" stroke-width="2.5"/>
        <ellipse cx="400" cy="422" rx="160" ry="26" fill="#DCE6EC" stroke="#B89045" stroke-width="1.5"/>
        <rect x="372" y="294" width="56" height="122" fill="#EFE2C7" stroke="#8A6826" stroke-width="2"/>
        <ellipse cx="400" cy="296" rx="92" ry="20" fill="#F6EFE0" stroke="url(#goldLeaf)" stroke-width="2.2"/>
        <path d="M364 282 L378 214 H422 L436 282 Z" fill="#D9C398" stroke="#8A6826" stroke-width="2"/>
        <path d="M352 240 Q322 275 316 392 M448 240 Q478 275 484 392" fill="none" stroke="#8EB2C6" stroke-width="2" stroke-dasharray="4 4"/>
      `;
  }
}

export function createSicilianArtworkSvgDataUrl(input: {
  categoria: CategoriaOpera;
  motif: ArtworkMotif;
  titolo: string;
  citta: string;
  anno: string;
}): string {
  const categoryUpper: Record<CategoriaOpera, string> = {
    monumento: "MONUMENTO",
    opera: "OPERA D'ARTE",
    reperto: "REPERTO ARCHEOLOGICO",
    documento: "DOCUMENTO D'ARCHIVIO",
  };

  const header = escapeXml(
    `${categoryUpper[input.categoria]} • ${input.citta.toUpperCase()}`,
  );
  const caption = escapeXml(
    truncateText(`${input.titolo} (${input.anno})`, 52),
  );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="parchment" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FAF6EE"/>
      <stop offset="65%" stop-color="#F2EBD9"/>
      <stop offset="100%" stop-color="#E7D8B8"/>
    </linearGradient>
    <radialGradient id="sunGlow" cx="50%" cy="38%" r="48%">
      <stop offset="0%" stop-color="#FFFDF8" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#E5D0A1" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="goldLeaf" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#D9BC82"/>
      <stop offset="50%" stop-color="#B89045"/>
      <stop offset="100%" stop-color="#8A6826"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#parchment)"/>
  <rect width="800" height="600" fill="url(#sunGlow)"/>
  <path d="M0 468 Q200 456 400 470 T800 466 L800 600 L0 600 Z" fill="#E6D7B9"/>
  <path d="M0 478 Q240 490 520 475 T800 484" fill="none" stroke="#B89045" stroke-opacity="0.45" stroke-width="1.5"/>
  ${renderMotifIllustration(input.motif)}
  <rect x="22" y="22" width="756" height="556" fill="none" stroke="#B89045" stroke-opacity="0.45" stroke-width="1.5"/>
  <rect x="30" y="30" width="740" height="540" fill="none" stroke="#B89045" stroke-opacity="0.22" stroke-width="1"/>
  <text x="400" y="72" text-anchor="middle" fill="#8A6826" font-family="Georgia, serif" font-size="15" letter-spacing="5">${header}</text>
  <text x="400" y="544" text-anchor="middle" fill="#4A3A28" font-family="Georgia, serif" font-size="21" font-style="italic">${caption}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
