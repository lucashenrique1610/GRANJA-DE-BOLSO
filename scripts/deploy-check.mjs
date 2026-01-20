import fs from "fs"
import path from "path"
import { execSync } from "child_process"

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
}

function getCommitHash() {
  try {
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      return process.env.VERCEL_GIT_COMMIT_SHA
    }
    return execSync("git rev-parse HEAD").toString().trim()
  } catch {
    return "unknown"
  }
}

function getCommitMessage() {
  try {
    if (process.env.VERCEL_GIT_COMMIT_MESSAGE) {
      return process.env.VERCEL_GIT_COMMIT_MESSAGE
    }
    return execSync("git log -1 --pretty=%B").toString().trim()
  } catch {
    return "No commit message"
  }
}

function main() {
  console.log(`${colors.blue}=== Iniciando Verificação de Deploy ===${colors.reset}`)

  const packageJsonPath = path.join(process.cwd(), "package.json")
  const packageJsonRaw = fs.readFileSync(packageJsonPath, "utf-8")
  const packageJson = JSON.parse(packageJsonRaw)
  const version = packageJson.version
  const commitHash = getCommitHash()
  const commitMessage = getCommitMessage()

  console.log(`${colors.green}✔ Versão do App:${colors.reset} ${version}`)
  console.log(`${colors.green}✔ Commit SHA:${colors.reset} ${commitHash}`)
  console.log(`${colors.green}✔ Mensagem:${colors.reset} ${commitMessage}`)

  const buildInfo = {
    version,
    commitHash,
    commitMessage,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  }

  const publicDir = path.join(process.cwd(), "public")
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir)
  }

  fs.writeFileSync(path.join(publicDir, "build-info.json"), JSON.stringify(buildInfo, null, 2))

  console.log(`${colors.yellow}ℹ Arquivo public/build-info.json gerado.${colors.reset}`)
  console.log(`${colors.blue}=== Verificação Concluída ===${colors.reset}`)
}

main()
