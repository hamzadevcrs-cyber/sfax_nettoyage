import fs from 'fs';
import path from 'path';

console.log('Build process started...');

const publicDir = path.join(process.cwd(), 'public');
const indexPath = path.join(publicDir, 'index.html');
const serverPath = path.join(process.cwd(), 'server.js');
const envPath = path.join(process.cwd(), '.env');
const pkgPath = path.join(process.cwd(), 'package.json');

let hasErrors = false;

if (!fs.existsSync(indexPath)) {
  console.error('Error: Frontend file not found at', indexPath);
  hasErrors = true;
} else {
  console.log('✓ Frontend file found');
}

if (!fs.existsSync(serverPath)) {
  console.error('Error: Server file not found at', serverPath);
  hasErrors = true;
} else {
  console.log('✓ Server file found');
}

if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found at', envPath);
  hasErrors = true;
} else {
  console.log('✓ .env file found');
}

if (!fs.existsSync(pkgPath)) {
  console.error('Error: package.json not found at', pkgPath);
  hasErrors = true;
} else {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  if (!pkg.dependencies || !pkg.dependencies.express || !pkg.dependencies['@supabase/supabase-js']) {
    console.error('Error: Missing required dependencies in package.json');
    hasErrors = true;
  } else {
    console.log('✓ Dependencies configured');
  }
}

if (hasErrors) {
  console.error('\nBuild failed with errors!');
  process.exit(1);
}

console.log('\nBuild completed successfully!');
