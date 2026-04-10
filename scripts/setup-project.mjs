import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DATABASE_URL',
  'DIRECT_URL'
];

function log(msg, type = 'info') {
  const colors = {
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m'
  };
  console.log(`${colors[type] || ''}${msg}${colors.reset}`);
}

async function setup() {
  log('🚀 Starting GymMitra ERP Migration Setup...', 'info');

  // 1. Check for .env file
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    log('❌ Error: .env file not found in the root directory.', 'error');
    log('Please create a .env file based on .env.example with your NEW project credentials.', 'warn');
    process.exit(1);
  }

  // 2. Validate Env Variables
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const missing = REQUIRED_VARS.filter(v => !envContent.includes(v));

  if (missing.length > 0) {
    log(`❌ Error: Missing required variables in .env: ${missing.join(', ')}`, 'error');
    process.exit(1);
  }
  log('✅ Environment variables validated.', 'success');

  // 3. Test Database Connectivity (Prisma Validate)
  try {
    log('📡 Validating Prisma Schema with new database...', 'info');
    execSync('npx prisma validate', { stdio: 'inherit' });
    log('✅ Prisma schema is valid.', 'success');
  } catch (e) {
    log('❌ Error: Prisma validation failed. Check your connection strings in .env.', 'error');
    process.exit(1);
  }

  // 4. Initialize Database (Prisma DB Push)
  try {
    log('🏗️  Initializing database schema (Prisma DB Push)...', 'info');
    log('This will create tables and indexes in your NEW Supabase project.', 'warn');
    execSync('npx prisma db push', { stdio: 'inherit' });
    log('✅ Database schema initialized successfully!', 'success');
  } catch (e) {
    log('❌ Error: Database initialization failed.', 'error');
    process.exit(1);
  }

  // 5. Generate Prisma Client
  try {
    log('⚙️  Generating Prisma Client...', 'info');
    execSync('npx prisma generate', { stdio: 'inherit' });
    log('✅ Prisma Client generated.', 'success');
  } catch (e) {
    log('❌ Error: Prisma Client generation failed.', 'error');
    process.exit(1);
  }

  log('\n' + '='.repeat(50), 'info');
  log('🎉 SETUP COMPLETE!', 'success');
  log('='.repeat(50) + '\n', 'info');

  log('Next Steps (Manual Dashboard Tasks):', 'info');
  log('1. SUPABASE AUTH:');
  log('   - Go to Authentication > URL Configuration');
  log('   - Set Site URL to your NEW Vercel URL.');
  log('   - Add Redirect URIs (localhost, preview URLs).');
  log('\n2. VERCEL DASHBOARD:');
  log('   - Go to your Vercel Project Settings > Environment Variables.');
  log('   - Copy all values from your local .env to the Dashboard.');
  log('   - Ensure NEXT_PUBLIC_SUPABASE_URL and KEYS are updated there too.');
  log('\n3. VERIFICATION:');
  log('   - Run `npm run dev` locally to test the new connection.');
  log('   - Deploy to Vercel and check the real URL.');

  log('\n🔐 SECURITY TIP:');
  log('Never share your .env file or commit it to Git. Use Vercel Dashboard for production secrets.', 'warn');
}

setup().catch(err => {
  log(`\n💥 Unexpected Error: ${err.message}`, 'error');
  process.exit(1);
});
