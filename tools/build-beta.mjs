#!/usr/bin/env node
// Génère beta/index.html à partir de beta/versions.json (page statique, sans JavaScript nécessaire hors bascule de langue, sans cookie, sans service extérieur).
// Usage : node tools/build-beta.mjs            (écrit beta/index.html)
//         node tools/build-beta.mjs --check    (échoue si beta/index.html n'est pas à jour ou si un enregistrement est incohérent)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(ROOT, 'beta/versions.json'), 'utf8'));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const SHA = /^[0-9a-f]{64}$/;
const FP = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;
const problems = [];

/** Les informations affichées sont contrôlées avant d'être publiées : une empreinte mal formée ou un lien hors du dépôt des versions n'est jamais affiché. */
for (const [key, app] of Object.entries(data.apps)) {
  if (app.releases.length && !FP.test(app.certSha256)) problems.push(`${key} : empreinte du certificat absente ou mal formée`);
  for (const r of app.releases) {
    if (!SHA.test(r.sha256)) problems.push(`${key} ${r.version} : SHA-256 du fichier mal formé`);
    if (!/^[A-Za-z0-9._-]+\.apk$/.test(r.file)) problems.push(`${key} ${r.version} : nom de fichier invalide`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) problems.push(`${key} ${r.version} : date invalide`);
    if (!Number.isInteger(r.versionCode) || r.versionCode < 1) problems.push(`${key} ${r.version} : versionCode invalide`);
  }
}
const url = (key, r) => `https://github.com/${data.repo}/releases/download/${key}-${r.version}/${r.file}`;
const mb = (n) => `${(n / 1048576).toFixed(0)} Mo`;
const spaced = (h) => h.match(/.{1,8}/g).join(' ');

const T = {
  fr: {
    lang: 'fr', title: 'Télécharger les applications — SYFA Carnet+ bêta',
    desc: 'Téléchargement des applications Android SYFA Carnet+ de la bêta fermée (décembre 2026), avec la marche à suivre pour les installer.',
    eyebrow: 'Bêta fermée · Android', h1: 'Télécharger l\'application',
    lead: 'Pendant la bêta, les applications ne sont pas sur le Play Store : on les installe depuis cette page. Elles sont réservées aux testeurs invités. Tout le contenu médical est fictif.',
    only: 'Ne téléchargez cette application que depuis cette page, jamais depuis un fichier reçu par message ou depuis un autre site.',
    soon: (e) => `Pas encore disponible. Ouverture prévue ${e}.`,
    download: 'Télécharger', version: 'Version', date: 'Publiée le', size: 'Taille', min: (v) => `Android ${v} ou plus récent`,
    verifyTitle: 'Vérifier le fichier (facultatif)', fileSha: 'Empreinte SHA-256 du fichier', certSha: 'Empreinte SHA-256 du certificat de signature',
    older: 'Versions précédentes',
    installTitle: 'Installer pas à pas',
    steps: [
      'Ouvrez cette page avec le navigateur de votre téléphone (par exemple Chrome).',
      'Touchez « Télécharger ». Le téléphone peut prévenir que ce type de fichier peut être dangereux : c\'est normal pour une application hors Play Store. Touchez « Télécharger quand même » ou « OK ».',
      'Quand le téléchargement est terminé, touchez « Ouvrir » (ou ouvrez le fichier dans le dossier « Téléchargements »).',
      'Si le téléphone dit que l\'installation d\'applications inconnues est bloquée, touchez « Paramètres », puis activez « Autoriser depuis cette source » pour votre navigateur. Revenez ensuite en arrière.',
      'Touchez « Installer ».',
      'Si un message de Google « Play Protect » dit que l\'application n\'est pas reconnue, c\'est normal : elle n\'est pas sur le Play Store. Touchez « Plus de détails », puis « Installer quand même ». Faites-le seulement pour le fichier téléchargé sur cette page.',
      'Touchez « Ouvrir » pour lancer l\'application.',
      'Pour votre sécurité, retournez ensuite dans les paramètres et retirez l\'autorisation « Autoriser depuis cette source » donnée au navigateur.',
    ],
    updateTitle: 'Mettre à jour', update: 'Il n\'y a pas de mise à jour automatique. Quand l\'équipe vous prévient d\'une nouvelle version, revenez sur cette page, téléchargez la nouvelle version et installez-la par-dessus l\'ancienne, sans désinstaller : vos informations sont conservées. Si le téléphone refuse (« application non installée »), désinstallez l\'ancienne version puis installez la nouvelle : les données de la bêta sont fictives.',
    removeTitle: 'Désinstaller à la fin de la bêta', remove: 'À la fin de la bêta : Paramètres > Applications > SYFA Carnet+ > Désinstaller. L\'équipe efface de son côté les comptes et les données de la bêta dans les 30 jours qui suivent la fin de la bêta.',
    helpTitle: 'Un problème ?', help: 'Écrivez à',
    note: 'Cette page est statique : elle n\'utilise ni cookie, ni outil de mesure d\'audience, ni service extérieur. Les fichiers sont hébergés sur GitHub.',
    privacy: 'Confidentialité', home: 'Accueil',
  },
  en: {
    lang: 'en', title: 'Download the apps — SYFA Carnet+ beta',
    desc: 'Download of the SYFA Carnet+ Android apps for the closed beta (December 2026), with installation instructions.',
    eyebrow: 'Closed beta · Android', h1: 'Download the app',
    lead: 'During the beta, the apps are not on the Play Store: they are installed from this page. They are for invited testers only. All medical content is fictional.',
    only: 'Only download this app from this page, never from a file received by message or from another website.',
    soon: (e) => `Not available yet. Expected ${e}.`,
    download: 'Download', version: 'Version', date: 'Published on', size: 'Size', min: (v) => `Android ${v} or newer`,
    verifyTitle: 'Check the file (optional)', fileSha: 'SHA-256 fingerprint of the file', certSha: 'SHA-256 fingerprint of the signing certificate',
    older: 'Previous versions',
    installTitle: 'Install step by step',
    steps: [
      'Open this page in your phone\'s browser (for example Chrome).',
      'Tap "Download". The phone may warn that this type of file can be harmful: this is normal for an app outside the Play Store. Tap "Download anyway" or "OK".',
      'When the download is finished, tap "Open" (or open the file from the "Downloads" folder).',
      'If the phone says installing unknown apps is blocked, tap "Settings", then turn on "Allow from this source" for your browser. Then go back.',
      'Tap "Install".',
      'If a Google "Play Protect" message says the app is not recognised, this is normal: it is not on the Play Store. Tap "More details", then "Install anyway". Only do this for the file downloaded on this page.',
      'Tap "Open" to start the app.',
      'For your safety, go back to the settings afterwards and remove the "Allow from this source" permission you gave the browser.',
    ],
    updateTitle: 'Updating', update: 'There is no automatic update. When the team tells you about a new version, come back to this page, download the new version and install it over the old one, without uninstalling: your information is kept. If the phone refuses ("app not installed"), uninstall the old version and then install the new one: beta data is fictional.',
    removeTitle: 'Uninstalling at the end of the beta', remove: 'At the end of the beta: Settings > Apps > SYFA Carnet+ > Uninstall. The team erases the beta accounts and data on its side within 30 days after the end of the beta.',
    helpTitle: 'A problem?', help: 'Write to',
    note: 'This page is static: it uses no cookie, no analytics and no external service. The files are hosted on GitHub.',
    privacy: 'Privacy', home: 'Home',
  },
};

function card(t, key, app) {
  const latest = app.releases[0];
  const head = `<h2>${esc(app.name)}</h2>`;
  if (!latest) return `<section class="dl" data-app="${key}">${head}<p>${esc(t.soon(app.expected[t.lang]))}</p></section>`;
  const older = app.releases.slice(1).map((r) => `<li><a href="${esc(url(key, r))}">${esc(app.name)} ${esc(r.version)}</a> · ${esc(r.date)}</li>`).join('');
  return `<section class="dl" data-app="${key}">${head}
    <p class="meta">${esc(t.version)} ${esc(latest.version)} · ${esc(t.date)} ${esc(latest.date)} · ${esc(mb(latest.sizeBytes))} · ${esc(t.min(app.minAndroid))}</p>
    <p><a class="button" href="${esc(url(key, latest))}" download>${esc(t.download)} ${esc(app.name)}</a></p>
    <details><summary>${esc(t.verifyTitle)}</summary>
      <dl><dt>${esc(t.fileSha)}</dt><dd><code>${esc(spaced(latest.sha256))}</code></dd>
      <dt>${esc(t.certSha)}</dt><dd><code>${esc(app.certSha256)}</code></dd></dl></details>
    ${older ? `<details><summary>${esc(t.older)}</summary><ul>${older}</ul></details>` : ''}</section>`;
}

function main(t) {
  const apps = Object.entries(data.apps).map(([k, a]) => card(t, k, a)).join('\n  ');
  return `<main id="${t.lang}" lang="${t.lang}">
  <section class="hero"><p class="eyebrow">${esc(t.eyebrow)}</p><h1>${esc(t.h1)}</h1><p class="lead">${esc(t.lead)}</p><p class="small"><strong>${esc(t.only)}</strong></p></section>
  ${apps}
  <section><h2>${esc(t.installTitle)}</h2><ol class="steps">${t.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></section>
  <section><h2>${esc(t.updateTitle)}</h2><p>${esc(t.update)}</p></section>
  <section><h2>${esc(t.removeTitle)}</h2><p>${esc(t.remove)}</p></section>
  <section><h2>${esc(t.helpTitle)}</h2><p>${esc(t.help)} <a href="mailto:contact@syfacarnet.org">contact@syfacarnet.org</a>.</p><p class="small">${esc(t.note)} <a href="../confidentialite.html">${esc(t.privacy)}</a> · <a href="../">${esc(t.home)}</a></p></section>
</main>`;
}

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(T.fr.title)}</title>
<meta name="description" content="${esc(T.fr.desc)} / ${esc(T.en.desc)}">
<meta name="robots" content="noindex">
<link rel="icon" href="../logo.svg" type="image/svg+xml">
<link rel="stylesheet" href="../style.css">
<style>
.button { display: inline-block; background: var(--green); color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; min-height: 44px; }
.button:focus-visible { outline: 3px solid color-mix(in srgb, var(--green) 40%, white); outline-offset: 3px; }
.dl { background: #fff; border: 1px solid var(--line); border-radius: 9px; padding: 8px 20px 16px; margin: 16px 0; }
.meta { color: var(--muted); margin: 0 0 12px; }
.steps li { margin: 10px 0; }
details { margin-top: 8px; } code { word-break: break-all; font-size: 13px; }
</style>
</head>
<body>
<header class="top">
  <a class="brand" href="../"><img src="../logo.svg" alt="" width="36" height="36"><span>SYFA Carnet+</span></a>
  <nav aria-label="Langue / Language"><a href="#fr" data-lang="fr">Français</a><a href="#en" data-lang="en">English</a></nav>
</header>

${main(T.fr)}

${main(T.en)}

<footer>
  <p>© 2026 SYFA Carnet+ · <a href="../confidentialite.html">Confidentialité / Privacy</a> · <a href="mailto:contact@syfacarnet.org">contact@syfacarnet.org</a></p>
</footer>
<script>
  // Français par défaut ; « #en » ou le bouton English affiche l'anglais. Sans JavaScript, les deux langues sont affichées l'une sous l'autre.
  (function () {
    function show(l) { document.documentElement.lang = l; document.getElementById('fr').hidden = l !== 'fr'; document.getElementById('en').hidden = l !== 'en'; }
    function pick() { show(/^#en/.test(location.hash) ? 'en' : 'fr'); }
    window.addEventListener('hashchange', pick); pick();
    var links = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < links.length; i++) links[i].addEventListener('click', function (e) { e.preventDefault(); history.replaceState(null, '', '#' + this.getAttribute('data-lang')); show(this.getAttribute('data-lang')); });
  })();
</script>
</body>
</html>
`;

if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
const out = join(ROOT, 'beta/index.html');
if (process.argv.includes('--check')) {
  let current = '';
  try { current = readFileSync(out, 'utf8'); } catch { /* absent */ }
  if (current !== html) { console.error('beta/index.html n\'est pas à jour : relancer node tools/build-beta.mjs'); process.exit(1); }
  console.log('beta/index.html à jour');
} else { writeFileSync(out, html); console.log('beta/index.html écrit'); }
