// Ember Court — entrypoint (Node 22, standard library only).
// The game is plain static files under game/ (index.html + ES modules, no
// network requests). This program hands it in: it copies game/ and
// screenshots/ next to this file into /output and writes /output/dossier.json,
// the summary the judge reads, using the vendored make.fun library.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The grader reads /output as a different user, and cpSync keeps the
// repository's group-only modes (660/2770): make everything it will read
// world-readable. Never chmod outDir itself — the grader's user can write
// into it but cannot chmod it.
function makeReadable(dir) {
  chmodSync(dir, 0o755);
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      makeReadable(path);
    } else {
      chmodSync(path, 0o644);
    }
  }
}
makeReadable(join(outDir, 'game'));
makeReadable(join(outDir, 'screenshots'));

// Caps from the competition gate: 4 screenshots at most 256 KiB each,
// game/ at most 993 files and 48 MiB, paths at most 1000 bytes,
// dossier text at most 160 KiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(dossierPath, dossier);
chmodSync(dossierPath, 0o644);
