#!/usr/bin/env node

/**
 * Verify shared-core mini bundle and prepare for WeChat「构建 npm」.
 *
 * WeChat reads workspace package via node_modules/@looma/shared-core
 * and uses package.json "miniprogram" field → dist/mini/index.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const FRONTEND_ROOT = path.resolve(__dirname, "../../..");
const SHARED_CORE = path.join(FRONTEND_ROOT, "packages/shared-core");
const MINIPROGRAM = path.join(FRONTEND_ROOT, "packages/miniprogram");
const BUNDLE = path.join(SHARED_CORE, "dist/mini/index.js");
const LINKED_PKG = path.join(MINIPROGRAM, "node_modules/@looma/shared-core");

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: FRONTEND_ROOT, stdio: "inherit" });
}

function main() {
  console.log("🔨 Step 1: build shared-core mini bundle (esbuild)");
  run("pnpm --filter @looma/shared-core build:mini");

  if (!fs.existsSync(BUNDLE)) {
    console.error(`❌ Missing bundle: ${BUNDLE}`);
    process.exit(1);
  }

  const js = fs.readFileSync(BUNDLE, "utf8");
  const forbidden = ["fetch(", "localStorage", "ReadableStream", "FormData(", "AbortController"];
  const hits = forbidden.filter((t) => js.includes(t));
  if (hits.length > 0) {
    console.error("❌ Bundle contains Web-only APIs:", hits.join(", "));
    process.exit(1);
  }

  const stat = fs.statSync(BUNDLE);
  console.log(`✅ Bundle OK (${(stat.size / 1024).toFixed(1)} KB): ${BUNDLE}`);

  console.log("\n📦 Step 2: verify workspace link");
  if (!fs.existsSync(LINKED_PKG)) {
    console.warn("⚠️  node_modules/@looma/shared-core not found — run: pnpm install (in frontend/)");
  } else {
    const pkg = JSON.parse(fs.readFileSync(path.join(LINKED_PKG, "package.json"), "utf8"));
    console.log(`   linked package miniprogram field → ${pkg.miniprogram || "(none)"}`);
  }

  console.log("\n📋 Step 3: WeChat DevTools");
  console.log("   1. Open frontend/packages/miniprogram in 微信开发者工具");
  console.log("   2. 工具 → 构建 npm");
  console.log("   3. 确认 miniprogram_npm/@looma/shared-core 已生成");
  console.log("   4. 模拟器启动，无 module not defined 报错");
}

main();
