import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const appOutput = path.join(repositoryRoot, ".next/server/app");
const appSource = path.join(repositoryRoot, "src/app");

function findHtmlFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(entryPath));
    } else if (entry.name.endsWith(".html")) {
      files.push(entryPath);
    }
  }
  return files;
}

function findPageSourceFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findPageSourceFiles(entryPath));
    } else if (/^page\.(?:js|jsx|ts|tsx)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
}

function expectedHtmlForSource(file) {
  const relativeDirectory = path.relative(appSource, path.dirname(file));
  const segments = relativeDirectory === "" ? [] : relativeDirectory.split(path.sep);
  const unsupportedSegment = segments.find(
    (segment) => segment.startsWith("@") || segment.includes("[") || segment.includes("]"),
  );
  if (unsupportedSegment) {
    return { unsupportedSegment };
  }

  const routeSegments = segments.filter(
    (segment) => !(segment.startsWith("(") && segment.endsWith(")")),
  );
  const outputName =
    routeSegments.length === 0 ? "index.html" : `${routeSegments.join("/")}.html`;
  return { outputPath: path.join(appOutput, outputName) };
}

const htmlFiles = findHtmlFiles(appOutput);
const pageSourceFiles = findPageSourceFiles(appSource);
const errors = [];

function attributeValue(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:["']([^"']*)["']|([^\\s>]+))`, "i"),
  );
  return match?.[1] ?? match?.[2];
}

if (htmlFiles.length === 0) {
  errors.push("No rendered HTML files were found under .next/server/app.");
}

if (pageSourceFiles.length === 0) {
  errors.push("No App Router page sources were found under src/app.");
}

for (const sourceFile of pageSourceFiles) {
  const relativeSource = path
    .relative(repositoryRoot, sourceFile)
    .replaceAll(path.sep, "/");
  const expected = expectedHtmlForSource(sourceFile);
  if (expected.unsupportedSegment) {
    errors.push(
      `${relativeSource}: dynamic or parallel routes are prohibited in preview builds`,
    );
  } else if (!existsSync(expected.outputPath)) {
    errors.push(
      `${relativeSource}: route was not emitted as static HTML and cannot be safety-scanned`,
    );
  }
}

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const relative = path.relative(repositoryRoot, file).replaceAll(path.sep, "/");
  const robotDirectives = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .filter(
      ([tag]) => attributeValue(tag, "name")?.toLowerCase() === "robots",
    )
    .flatMap(([tag]) =>
      (attributeValue(tag, "content") ?? "")
        .toLowerCase()
        .split(",")
        .map((directive) => directive.trim()),
    );

  if (
    !["noindex", "nofollow", "noarchive"].every((token) =>
      robotDirectives.includes(token),
    )
  ) {
    errors.push(`${relative}: missing noindex, nofollow, or noarchive metadata`);
  }
  if (/<form\b/i.test(html) || /data-netlify|form-name/i.test(html)) {
    errors.push(`${relative}: preview renders a data-collection form`);
  }
  if (/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/i.test(html)) {
    errors.push(`${relative}: preview renders a canonical link`);
  }
  if (/application\/ld\+json/i.test(html)) {
    errors.push(`${relative}: preview renders structured business data`);
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.map((error) => `ERROR ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Preview verification passed (${htmlFiles.length} rendered page${
      htmlFiles.length === 1 ? "" : "s"
    }).\n`,
  );
}
