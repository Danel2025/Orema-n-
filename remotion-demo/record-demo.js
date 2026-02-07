const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Configuration
const VIDEO_DIR = path.join(__dirname, 'videos');
// Résolution Full HD - viewport et recordVideo.size DOIVENT être IDENTIQUES
const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;
const BASE_URL = 'http://localhost:3000';

// Ensure video directory exists
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

// Custom cursor script
const CUSTOM_CURSOR_SCRIPT = `
  const existing = document.getElementById('custom-cursor');
  if (existing) existing.remove();
  const existingStyle = document.getElementById('custom-cursor-style');
  if (existingStyle) existingStyle.remove();

  const cursor = document.createElement('div');
  cursor.id = 'custom-cursor';
  cursor.innerHTML = \`
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 3.21V20.8C5.5 21.75 6.67 22.29 7.4 21.66L11.68 17.88C11.96 17.64 12.32 17.5 12.7 17.5H19.5C20.33 17.5 21 16.83 21 16V4C21 3.17 20.33 2.5 19.5 2.5H6.5C5.95 2.5 5.5 2.95 5.5 3.5V3.21Z" fill="#1a1a1a" stroke="white" stroke-width="2"/>
    </svg>
    <div id="cursor-ring"></div>
  \`;

  const style = document.createElement('style');
  style.id = 'custom-cursor-style';
  style.textContent = \`
    * { cursor: none !important; }
    #custom-cursor {
      position: fixed;
      pointer-events: none;
      z-index: 2147483647;
      transform: translate(-3px, -3px);
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
    }
    #custom-cursor svg { transition: transform 0.1s ease; }
    #custom-cursor.clicking svg { transform: scale(0.75); }
    #cursor-ring {
      position: absolute;
      top: 8px; left: 8px;
      width: 0; height: 0;
      border: 3px solid #f97316;
      border-radius: 50%;
      opacity: 0;
    }
    #custom-cursor.clicking #cursor-ring {
      animation: click-ring 0.6s ease-out forwards;
    }
    @keyframes click-ring {
      0% { width: 0; height: 0; opacity: 1; }
      100% { width: 60px; height: 60px; opacity: 0; transform: translate(-30px, -30px); }
    }
  \`;

  document.head.appendChild(style);
  document.body.appendChild(cursor);

  let targetX = window.innerWidth / 2, targetY = window.innerHeight / 2;
  let currentX = targetX, currentY = targetY;

  function updateCursor() {
    currentX += (targetX - currentX) * 0.15;
    currentY += (targetY - currentY) * 0.15;
    cursor.style.left = currentX + 'px';
    cursor.style.top = currentY + 'px';
    requestAnimationFrame(updateCursor);
  }
  updateCursor();

  document.addEventListener('mousemove', e => { targetX = e.clientX; targetY = e.clientY; });
  document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
  document.addEventListener('mouseup', () => setTimeout(() => cursor.classList.remove('clicking'), 250));

  window.__moveCursor = (x, y, duration = 800) => new Promise(resolve => {
    const startX = targetX, startY = targetY, startTime = Date.now();
    (function animate() {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      targetX = startX + (x - startX) * eased;
      targetY = startY + (y - startY) * eased;
      progress < 1 ? requestAnimationFrame(animate) : resolve();
    })();
  });
`;

const wait = ms => new Promise(r => setTimeout(r, ms));

async function injectCursor(page) {
  try {
    await page.evaluate(CUSTOM_CURSOR_SCRIPT);
  } catch (e) {}
}

async function smoothClick(page, selector, options = {}) {
  const { waitBefore = 500, waitAfter = 700, moveTime = 800 } = options;
  await wait(waitBefore);

  try {
    const el = await page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout: 10000 });
    const box = await el.boundingBox();
    if (!box) return false;

    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.evaluate(async ({x, y, d}) => window.__moveCursor && await window.__moveCursor(x, y, d), {x, y, d: moveTime});
    await wait(200);
    await page.mouse.move(x, y);
    await page.mouse.click(x, y);
    await wait(waitAfter);
    return true;
  } catch (e) {
    console.log(`   ⚠️ ${selector.substring(0, 40)}: ${e.message.split('\n')[0]}`);
    return false;
  }
}

async function smoothHover(page, selector, options = {}) {
  const { waitBefore = 300, waitAfter = 500, moveTime = 600 } = options;
  await wait(waitBefore);

  try {
    const el = await page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout: 8000 });
    const box = await el.boundingBox();
    if (!box) return false;

    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.evaluate(async ({x, y, d}) => window.__moveCursor && await window.__moveCursor(x, y, d), {x, y, d: moveTime});
    await wait(100);
    await page.mouse.move(x, y);
    await wait(waitAfter);
    return true;
  } catch (e) {
    return false;
  }
}

async function recordDemo() {
  console.log('🎬 Démarrage de l\'enregistrement sur Microsoft Edge...\n');

  // Utiliser Microsoft Edge
  const browser = await chromium.launch({
    headless: false,
    channel: 'msedge',
    args: [
      '--disable-infobars',
      '--window-position=0,0',
      `--window-size=${VIDEO_WIDTH},${VIDEO_HEIGHT + 150}` // +150 pour les barres du navigateur
    ]
  });

  // IMPORTANT: viewport et recordVideo.size doivent être IDENTIQUES
  const context = await browser.newContext({
    viewport: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT } // Même taille que viewport
    },
    colorScheme: 'light',
    deviceScaleFactor: 1 // Pas de mise à l'échelle
  });
  const page = await context.newPage();

  try {
    // ==========================================
    // SCÈNE 1: PAGE DE CONNEXION PIN
    // ==========================================
    console.log('📍 Scène 1: Page de connexion PIN...');
    await page.goto(`${BASE_URL}/login/pin`, { waitUntil: 'networkidle' });
    await wait(2500);
    await injectCursor(page);
    await wait(1500);

    // Saisie email
    console.log('   → Saisie email...');
    const emailInput = page.getByRole('textbox', { name: 'Email' });
    const emailBox = await emailInput.boundingBox();
    if (emailBox) {
      await page.evaluate(async ({x, y}) => window.__moveCursor && await window.__moveCursor(x, y, 600),
        {x: emailBox.x + emailBox.width/2, y: emailBox.y + emailBox.height/2});
      await wait(200);
    }
    await emailInput.fill('caissier@orema.ga');
    await wait(600);

    // Saisie PIN
    console.log('   → Saisie code PIN...');
    const pinInput = page.getByRole('textbox').nth(1);
    const pinBox = await pinInput.boundingBox();
    if (pinBox) {
      await page.evaluate(async ({x, y}) => window.__moveCursor && await window.__moveCursor(x, y, 500),
        {x: pinBox.x + pinBox.width/2, y: pinBox.y + pinBox.height/2});
      await wait(200);
    }
    await pinInput.click();
    await wait(300);

    for (const digit of ['2', '0', '0', '5']) {
      await page.keyboard.press(digit);
      await wait(250);
    }
    await wait(800);

    // Connexion
    console.log('   → Clic sur Connexion...');
    await smoothClick(page, 'button:has-text("Se connecter")', { waitAfter: 500 });

    // Attendre redirection
    console.log('   → Redirection vers caisse...');
    await page.waitForURL('**/caisse', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await wait(4000);
    await injectCursor(page);
    await wait(2000);

    // ==========================================
    // SCÈNE 2: INTERFACE CAISSE - VENTE DIRECTE
    // ==========================================
    console.log('\n📍 Scène 2: Interface Caisse - Vente directe...');

    // Présenter les modes de vente
    console.log('   → Survol des modes de vente...');
    await smoothHover(page, 'button:has-text("Vente directe")');
    await smoothHover(page, 'button:has-text("Service")');
    await smoothHover(page, 'button:has-text("Livraison")');
    await smoothHover(page, 'button:has-text("emporter")');
    await wait(800);

    // Vider panier si existant
    const viderBtn = page.locator('button:has-text("Vider")');
    if (await viderBtn.isVisible().catch(() => false)) {
      console.log('   → Vidage panier existant...');
      await smoothClick(page, 'button:has-text("Vider")', { waitAfter: 1000 });
    }

    // Parcourir les catégories
    console.log('   → Navigation dans les catégories...');
    await smoothClick(page, 'button:has-text("Bières")', { waitAfter: 800 });
    await smoothClick(page, 'button:has-text("Softs")', { waitAfter: 800 });
    await smoothClick(page, 'button:has-text("Plats Gabonais")', { waitAfter: 800 });
    await smoothClick(page, 'button:has-text("Grillades")', { waitAfter: 800 });
    await smoothClick(page, 'button:has-text("Bières")', { waitAfter: 800 });

    // Ajouter des produits
    console.log('   → Ajout de produits au panier...');
    await smoothClick(page, 'button:has-text("Heineken")', { waitAfter: 700 });
    await smoothClick(page, 'button:has-text("Corona")', { waitAfter: 700 });
    await smoothClick(page, 'button:has-text("Guinness")', { waitAfter: 700 });

    // Catégorie Grillades
    await smoothClick(page, 'button:has-text("Grillades")', { waitAfter: 800 });
    await smoothClick(page, 'button:has-text("Poulet")', { waitAfter: 800 });

    // Montrer le panier
    console.log('   → Visualisation du panier...');
    await wait(1500);

    // ==========================================
    // SCÈNE 3: MODAL D'ENCAISSEMENT
    // ==========================================
    console.log('\n📍 Scène 3: Modal d\'encaissement...');
    await smoothClick(page, 'button:has-text("Encaisser")', { waitAfter: 1500 });

    // Présenter les modes de paiement
    console.log('   → Présentation des modes de paiement...');
    await smoothHover(page, 'button:has-text("Espèces")', { waitAfter: 600 });
    await smoothHover(page, 'button:has-text("Carte")', { waitAfter: 600 });
    await smoothHover(page, 'button:has-text("Airtel")', { waitAfter: 600 });
    await smoothHover(page, 'button:has-text("Moov")', { waitAfter: 600 });

    // Sélectionner Espèces
    console.log('   → Sélection paiement Espèces...');
    await smoothClick(page, 'button:has-text("Espèces")', { waitAfter: 1500 });
    await wait(2000);

    // Fermer le modal
    console.log('   → Fermeture du modal...');
    await page.keyboard.press('Escape');
    await wait(1500);

    // ==========================================
    // SCÈNE 4: PAGE STOCKS
    // ==========================================
    console.log('\n📍 Scène 4: Page Stocks...');
    await smoothClick(page, 'a:has-text("Stocks")', { waitAfter: 1500 });
    await page.waitForLoadState('networkidle').catch(() => {});
    await wait(3000);
    await injectCursor(page);
    await wait(2000);

    // Explorer la page stocks
    console.log('   → Exploration de la page Stocks...');
    await smoothHover(page, 'input[placeholder*="Rechercher"]', { waitAfter: 500 });
    await wait(1500);

    // ==========================================
    // SCÈNE 5: PAGE EMPLOYÉS
    // ==========================================
    console.log('\n📍 Scène 5: Page Employés...');
    await smoothClick(page, 'a:has-text("Employés")', { waitAfter: 1500 });
    await page.waitForLoadState('networkidle').catch(() => {});
    await wait(3000);
    await injectCursor(page);
    await wait(2000);

    // Explorer la page employés
    console.log('   → Exploration de la page Employés...');
    await wait(2000);

    // ==========================================
    // SCÈNE 6: PAGE RAPPORTS
    // ==========================================
    console.log('\n📍 Scène 6: Page Rapports...');
    await smoothClick(page, 'a:has-text("Rapports")', { waitAfter: 1500 });
    await page.waitForLoadState('networkidle').catch(() => {});
    await wait(3000);
    await injectCursor(page);
    await wait(2000);

    // Explorer les rapports
    console.log('   → Exploration des rapports...');
    await smoothHover(page, 'button:has-text("Aujourd")', { waitAfter: 500 });
    await smoothHover(page, 'button:has-text("Semaine")', { waitAfter: 500 });
    await smoothHover(page, 'button:has-text("Mois")', { waitAfter: 500 });
    await wait(1500);

    // ==========================================
    // SCÈNE 7: MODE SOMBRE
    // ==========================================
    console.log('\n📍 Scène 7: Basculement en mode sombre...');
    await smoothClick(page, 'button[aria-label*="thème"], button:has-text("Basculer le thème")', { waitAfter: 2500 });

    // Montrer l'interface en mode sombre
    console.log('   → Interface en mode sombre...');
    await wait(2000);

    // ==========================================
    // SCÈNE 8: RETOUR À LA CAISSE EN MODE SOMBRE
    // ==========================================
    console.log('\n📍 Scène 8: Caisse en mode sombre...');
    await smoothClick(page, 'a:has-text("Caisse")', { waitAfter: 1500 });
    await page.waitForLoadState('networkidle').catch(() => {});
    await wait(3000);
    await injectCursor(page);
    await wait(2000);

    // Montrer la caisse en mode sombre
    console.log('   → Visualisation de la caisse en mode sombre...');
    await wait(2000);

    // ==========================================
    // SCÈNE 9: RETOUR EN MODE CLAIR
    // ==========================================
    console.log('\n📍 Scène 9: Retour en mode clair...');
    await smoothClick(page, 'button[aria-label*="thème"], button:has-text("Basculer le thème")', { waitAfter: 2500 });
    await wait(3000);

    console.log('\n✅ Enregistrement complet terminé!');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  }

  // Sauvegarde
  console.log('\n💾 Sauvegarde de la vidéo...');
  await page.close();
  await context.close();
  await browser.close();

  await wait(2000);
  const files = fs.readdirSync(VIDEO_DIR).filter(f => f.endsWith('.webm') && f !== 'demo-pos.webm');
  if (files.length > 0) {
    const latest = files.sort().pop();
    const oldPath = path.join(VIDEO_DIR, latest);
    const newPath = path.join(VIDEO_DIR, 'demo-pos.webm');
    try {
      if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
      fs.renameSync(oldPath, newPath);
      console.log(`\n🎥 Vidéo: ${newPath}`);
      console.log(`   Taille: ${(fs.statSync(newPath).size / 1024 / 1024).toFixed(2)} MB`);
    } catch (e) {
      console.log(`\n🎥 Vidéo: ${oldPath}`);
      console.log(`   Taille: ${(fs.statSync(oldPath).size / 1024 / 1024).toFixed(2)} MB`);
    }
  }

  console.log('\n🎬 Session terminée!');
}

recordDemo().catch(console.error);
