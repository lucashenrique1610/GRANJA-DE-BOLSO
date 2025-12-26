const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores para logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function getCommitHash() {
  try {
    // Tenta pegar do ambiente Vercel primeiro
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      return process.env.VERCEL_GIT_COMMIT_SHA;
    }
    // Fallback para git local
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (e) {
    return 'unknown';
  }
}

function getCommitMessage() {
  try {
    if (process.env.VERCEL_GIT_COMMIT_MESSAGE) {
      return process.env.VERCEL_GIT_COMMIT_MESSAGE;
    }
    return execSync('git log -1 --pretty=%B').toString().trim();
  } catch (e) {
    return 'No commit message';
  }
}

function main() {
  console.log(`${colors.blue}=== Iniciando Verificação de Deploy ===${colors.reset}`);

  // 1. Verificar Versão
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = require(packageJsonPath);
  const version = packageJson.version;
  const commitHash = getCommitHash();
  const commitMessage = getCommitMessage();

  console.log(`${colors.green}✔ Versão do App:${colors.reset} ${version}`);
  console.log(`${colors.green}✔ Commit SHA:${colors.reset} ${commitHash}`);
  console.log(`${colors.green}✔ Mensagem:${colors.reset} ${commitMessage}`);

  // 2. Gerar arquivo de build info (public/build-info.json)
  const buildInfo = {
    version,
    commitHash,
    commitMessage,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  fs.writeFileSync(
    path.join(publicDir, 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );

  console.log(`${colors.yellow}ℹ Arquivo public/build-info.json gerado.${colors.reset}`);
  console.log(`${colors.blue}=== Verificação Concluída ===${colors.reset}`);
}

main();
