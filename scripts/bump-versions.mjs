#!/usr/bin/env node
/**
 * Bump package versions under packages/ (independent semver per package).
 *
 * Usage:
 *   node scripts/bump-versions.mjs 0.2.2              # all publishable packages
 *   node scripts/bump-versions.mjs 0.2.2 cache          # packages/cache only
 *   node scripts/bump-versions.mjs 0.2.2 @stambha/metrics
 */
import fs from "node:fs";
import path from "node:path";

const version = process.argv[2];
const selectors = process.argv.slice(3);

if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error("Usage: node scripts/bump-versions.mjs <semver> [package...]");
  console.error("  package: folder name (cache), or npm name (@stambha/metrics)");
  process.exit(1);
}

const root = process.cwd();
const packagesDir = path.join(root, "packages");

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function matchesSelector(dir, pkgName, selector) {
  const normalized = selector.replace(/^@stambha\//, "");
  return (
    dir === selector ||
    dir === normalized ||
    pkgName === selector ||
    pkgName === `@stambha/${normalized}`
  );
}

let bumped = 0;

for (const dir of fs.readdirSync(packagesDir)) {
  const pkgPath = path.join(packagesDir, dir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (pkg.private) continue;

  if (selectors.length > 0 && !selectors.some((s) => matchesSelector(dir, pkg.name, s))) {
    continue;
  }

  pkg.version = version;
  writeJson(pkgPath, pkg);
  console.log(`bumped ${pkg.name} → ${version}`);
  bumped++;
}

if (bumped === 0) {
  if (selectors.length > 0) {
    console.error(`No packages matched: ${selectors.join(", ")}`);
  } else {
    console.error("No publishable packages found under packages/");
  }
  process.exit(1);
}
