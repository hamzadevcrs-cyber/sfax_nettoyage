import fs from 'fs';
import path from 'path';

// Script d'export du projet vers le répertoire Windows
// Exécuter: node export-to-windows.js

const TARGET_DIR = process.argv[2] || 'D:\\BOLT\\app sfax_nettoyage';

const PROJECT_FILES = {
  'package.json': `{
  "name": "nettoyage-dashboard",
  "version": "1.0.0",
  "description": "Dashboard de suivi des activités de nettoyage - ولاية صفاقس",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "build": "node build.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@supabase/supabase-js": "^2.38.4",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}`,

  '.env': null, // Will be copied from existing

  '.gitignore': `node_modules/
.env
.DS_Store
*.log
`,

  'server.js': null, // Will be copied from existing

  'build.js': null, // Will be copied from existing

  'public/index.html': null, // Will be copied from existing
};

function copyFile(src, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`  ✓ ${path.relative(TARGET_DIR, dest)}`);
}

function writeFile(dest, content) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dest, content, 'utf-8');
  console.log(`  ✓ ${path.relative(TARGET_DIR, dest)}`);
}

console.log('='.repeat(60));
console.log('  EXPORT DU PROJET NETTOYAGE DASHBOARD');
console.log('='.repeat(60));
console.log(`\nRépertoire cible: ${TARGET_DIR}\n`);

// Create target directory
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
  console.log('✓ Répertoire créé');
}

const srcDir = process.cwd();

// Copy all project files
const filesToCopy = [
  'server.js',
  'build.js',
  'package.json',
  '.env',
  '.gitignore',
  'public/index.html',
  'public/sfax_nettoyage_dashboard_v4.html',
  'README.md',
  'QUICKSTART.md',
  'API_DOCUMENTATION.md',
  'DEPLOYMENT.md',
  'ARCHITECTURE.md',
  'PROJECT_SUMMARY.txt',
];

let copied = 0;
let skipped = 0;

filesToCopy.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(TARGET_DIR, file);

  if (fs.existsSync(srcPath)) {
    copyFile(srcPath, destPath);
    copied++;
  } else {
    console.log(`  ⚠ Fichier source introuvable: ${file}`);
    skipped++;
  }
});

// Create supabase directory with migration
const migrationDir = path.join(TARGET_DIR, 'supabase', 'migrations');
if (!fs.existsSync(migrationDir)) {
  fs.mkdirSync(migrationDir, { recursive: true });
}

const migrationSrc = path.join(srcDir, 'supabase', 'migrations');
if (fs.existsSync(migrationSrc)) {
  const migrationFiles = fs.readdirSync(migrationSrc);
  migrationFiles.forEach(f => {
    copyFile(
      path.join(migrationSrc, f),
      path.join(migrationDir, f)
    );
    copied++;
  });
}

console.log(`\n${'='.repeat(60)}`);
console.log(`  RÉSULTAT: ${copied} fichiers copiés, ${skipped} ignorés`);
console.log('='.repeat(60));

console.log(`\nPROCHAINES ÉTAPES:`);
console.log(`1. Ouvrir un terminal dans: ${TARGET_DIR}`);
console.log(`2. Exécuter: npm install`);
console.log(`3. Vérifier le fichier .env (identifiants Supabase)`);
console.log(`4. Exécuter: node server.js`);
console.log(`5. Ouvrir: http://localhost:3000`);
