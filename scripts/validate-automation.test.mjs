import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  checkActivePacketAssets,
  checkGeneratedOutput,
  hashApprovedPayload,
  repositoryRoot,
  validatePacket,
  validateRepositoryPolicy,
} from "./validate-automation.mjs";

const fixturePath = path.join(
  repositoryRoot,
  "automation/examples/build-packet.fixture.json",
);
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));

function copyFixture() {
  return structuredClone(fixture);
}

function resign(packet) {
  packet.approval.approvedPayloadSha256 = hashApprovedPayload(
    packet.approvedPayload,
  );
  return packet;
}

function messages(errors) {
  return errors.map((error) => `${error.pointer}: ${error.message}`).join("\n");
}

function createMinimalPolicyRepository(root) {
  mkdirSync(path.join(root, "automation"), { recursive: true });
  mkdirSync(path.join(root, "public"), { recursive: true });
  mkdirSync(path.join(root, "src/config"), { recursive: true });
  writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({
      scripts: {
        prebuild: "npm run validate:automation",
        build: "next build",
        postbuild: "npm run verify:preview",
        "build:netlify":
          "npm run audit:production && npm run test:automation && npm run check && npm run build",
        check: "biome check src && tsc --noEmit",
        "validate:automation": "node scripts/validate-automation.mjs",
        "test:automation": "node --test scripts/validate-automation.test.mjs",
        "verify:preview": "node scripts/verify-preview.mjs",
        "audit:production": "npm audit --omit=dev --audit-level=critical",
      },
      dependencies: {},
      devDependencies: {},
    }),
  );
  writeFileSync(
    path.join(root, "netlify.toml"),
    '[build]\n  command = "npm run build:netlify"\n[[plugins]]\n  package = "@netlify/plugin-nextjs"\n[[headers]]\n  for = "/*"\n  [headers.values]\n    X-Robots-Tag = "noindex, nofollow, noarchive"\n',
  );
  writeFileSync(path.join(root, "public/robots.txt"), "User-agent: *\nDisallow: /\n");
  writeFileSync(
    path.join(root, "src/config/preview-policy.json"),
    readFileSync(
      path.join(repositoryRoot, "src/config/preview-policy.json"),
      "utf8",
    ),
  );
  writeFileSync(
    path.join(root, "automation/trusted-approvers.json"),
    readFileSync(
      path.join(repositoryRoot, "automation/trusted-approvers.json"),
      "utf8",
    ),
  );
}

test("the committed fixture satisfies the contract", () => {
  assert.deepEqual(validatePacket(copyFixture(), { mode: "fixture" }), []);
});

test("payload tampering invalidates human approval", () => {
  const packet = copyFixture();
  packet.approvedPayload.business.displayName.value = "Changed after approval";

  assert.match(messages(validatePacket(packet)), /canonical approved payload/);
});

test("recomputing the payload digest cannot forge approval", () => {
  const packet = copyFixture();
  packet.approvedPayload.business.displayName.value = "Recomputed but unsigned";
  resign(packet);

  assert.match(
    messages(validatePacket(packet, { mode: "fixture" })),
    /does not authenticate/,
  );
});

test("missing approval is rejected by the schema", () => {
  const packet = copyFixture();
  delete packet.approval;

  assert.match(messages(validatePacket(packet)), /required property/);
});

test("orphan evidence references are rejected", () => {
  const packet = copyFixture();
  packet.approvedPayload.contact.phone.evidenceRefs = ["ev-missing-record"];
  resign(packet);

  assert.match(messages(validatePacket(packet)), /missing evidence ID/);
});

test("non-Netlify hosting is rejected", () => {
  const packet = copyFixture();
  packet.approvedPayload.template.hostingProvider = "vercel";
  resign(packet);

  assert.match(messages(validatePacket(packet)), /must be equal to constant/);
});

test("public launch authority cannot appear in a draft packet", () => {
  const packet = copyFixture();
  packet.approvedPayload.executionPolicy.publicLaunchAllowed = true;
  resign(packet);

  assert.match(messages(validatePacket(packet)), /must be equal to constant/);
});

test("fixtures are rejected in production mode", () => {
  assert.match(
    messages(validatePacket(copyFixture(), { mode: "production" })),
    /rejects fixture packets/,
  );
});

test("packet validation defaults to production mode", () => {
  assert.match(messages(validatePacket(copyFixture())), /rejects fixture packets/);
});

test("a menu page cannot be enabled without a verified menu", () => {
  const packet = copyFixture();
  packet.approvedPayload.sitePlan.pages.menu = true;
  resign(packet);

  assert.match(messages(validatePacket(packet)), /menu is verified/);
});

test("an ordering CTA requires a verified ordering URL", () => {
  const packet = copyFixture();
  packet.approvedPayload.sitePlan.features.orderingCta = true;
  resign(packet);

  assert.match(messages(validatePacket(packet)), /verified ordering URL/);
});

test("credential-like values are rejected without logging the value", () => {
  const packet = copyFixture();
  packet.approvedPayload.branding.creativeDirection.rationale =
    ["sk", "abcdefghijklmnopqrstuvwxyz123456"].join("-");
  resign(packet);

  assert.match(messages(validatePacket(packet)), /resembles a credential/);
});

test("verified URL values cannot target private networks", () => {
  const packet = copyFixture();
  packet.approvedPayload.contact.orderingUrl = {
    factId: "fact-ordering-url",
    state: "verified",
    value: "https://localhost/order",
    evidenceRefs: ["ev-fixture-listing"],
    verifiedAt: "2026-08-03T19:00:00Z",
  };
  resign(packet);

  assert.match(
    messages(validatePacket(packet, { mode: "fixture" })),
    /private network/,
  );
});

test("the restaurant template rejects unrelated business categories", () => {
  const packet = copyFixture();
  packet.approvedPayload.business.category.value = "Barbershop";
  resign(packet);

  assert.match(
    messages(validatePacket(packet, { mode: "fixture" })),
    /restaurant or food-service/,
  );
});

test("no-website findings require two distinct direct checks", () => {
  const packet = copyFixture();
  packet.approvedPayload.business.websiteAssessment.evidenceRefs = [
    "ev-fixture-listing",
  ];
  resign(packet);

  assert.match(
    messages(validatePacket(packet, { mode: "fixture" })),
    /two distinct sources/,
  );
});

test("verified menu content cannot rely on context-only evidence", () => {
  const packet = copyFixture();
  packet.approvedPayload.evidence.push({
    ...packet.approvedPayload.evidence[0],
    evidenceId: "ev-menu-context",
    support: "context",
    url: "https://menu.invalid/fixture-kitchen",
  });
  packet.approval.reviewedEvidenceIds.push("ev-menu-context");
  packet.approvedPayload.menu = {
    state: "verified",
    asOf: "2026-08-03",
    sections: [
      {
        sectionId: "fixture-section",
        title: "Fixture section",
        evidenceRefs: ["ev-menu-context"],
        items: [
          {
            itemId: "fixture-item",
            name: "Fixture item",
            evidenceRefs: ["ev-menu-context"],
          },
        ],
      },
    ],
  };
  resign(packet);

  assert.match(
    messages(validatePacket(packet, { mode: "fixture" })),
    /menu\/sections\/0\/evidenceRefs: requires at least one suitable direct evidence/,
  );
});

test("repository policy remains preview-only and npm-only", () => {
  assert.deepEqual(validateRepositoryPolicy(repositoryRoot), []);
});

test("repository policy locks the guarded build and preview commands", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "restaurant-script-policy-"));
  try {
    createMinimalPolicyRepository(root);
    const packageJsonPath = path.join(root, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    packageJson.scripts.postbuild = "true";
    writeFileSync(packageJsonPath, JSON.stringify(packageJson));

    assert.match(
      messages(validateRepositoryPolicy(root)),
      /postbuild.*guarded preview builds/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("repository policy keeps live ordering disabled", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "restaurant-ordering-policy-"));
  try {
    createMinimalPolicyRepository(root);
    const policyPath = path.join(root, "src/config/preview-policy.json");
    const policy = JSON.parse(readFileSync(policyPath, "utf8"));
    policy.orderingEnabled = true;
    writeFileSync(policyPath, JSON.stringify(policy));

    assert.match(
      messages(validateRepositoryPolicy(root)),
      /orderingEnabled.*false/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("commented Netlify safeguards do not satisfy repository policy", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "restaurant-netlify-policy-"));
  try {
    createMinimalPolicyRepository(root);
    writeFileSync(
      path.join(root, "netlify.toml"),
      '# [build]\n# command = "npm run build:netlify"\n# [[plugins]]\n# package = "@netlify/plugin-nextjs"\n# [[headers]]\n# for = "/*"\n# X-Robots-Tag = "noindex, nofollow, noarchive"\n',
    );

    assert.match(
      messages(validateRepositoryPolicy(root)),
      /active Netlify Next\.js plugin block|guarded Netlify build command/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Netlify contexts cannot override the guarded build", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "restaurant-netlify-context-"));
  try {
    createMinimalPolicyRepository(root);
    const netlifyPath = path.join(root, "netlify.toml");
    writeFileSync(
      netlifyPath,
      `${readFileSync(netlifyPath, "utf8")}\n[context.deploy-preview]\n  command = "npm run build"\n`,
    );

    assert.match(
      messages(validateRepositoryPolicy(root)),
      /context-specific Netlify overrides/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("robots policy requires an exact repository-wide disallow", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "restaurant-robots-policy-"));
  try {
    createMinimalPolicyRepository(root);
    writeFileSync(
      path.join(root, "public/robots.txt"),
      "User-agent: *\nDisallow: /some-path\n",
    );

    assert.match(messages(validateRepositoryPolicy(root)), /disallow indexing/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Phase 1 rejects production approver keys", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "restaurant-trust-policy-"));
  try {
    createMinimalPolicyRepository(root);
    const trustStore = JSON.parse(
      readFileSync(path.join(root, "automation/trusted-approvers.json"), "utf8"),
    );
    trustStore.keys.push({
      ...trustStore.keys[0],
      keyId: "production-approver",
      scope: "production",
    });
    writeFileSync(
      path.join(root, "automation/trusted-approvers.json"),
      JSON.stringify(trustStore),
    );

    assert.match(
      messages(validateRepositoryPolicy(root)),
      /must not trust any production signing key/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the trust store accepts public-key PEM blocks only", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "restaurant-public-key-policy-"));
  try {
    createMinimalPolicyRepository(root);
    const trustStorePath = path.join(root, "automation/trusted-approvers.json");
    const trustStore = JSON.parse(readFileSync(trustStorePath, "utf8"));
    trustStore.keys[0].publicKeyPem = trustStore.keys[0].publicKeyPem.replaceAll(
      "PUBLIC KEY",
      "PRIVATE KEY",
    );
    writeFileSync(trustStorePath, JSON.stringify(trustStore));

    assert.match(
      messages(validateRepositoryPolicy(root)),
      /public-key PEM block only/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("generated-output scanning ignores code methods but catches sentinels", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "restaurant-policy-"));
  try {
    mkdirSync(path.join(root, "public"), { recursive: true });
    mkdirSync(path.join(root, "src/app/menu"), { recursive: true });
    writeFileSync(
      path.join(root, "src/app/menu/page.tsx"),
      'const slug = "safe title".replace(/\\s+/g, "-");\nexport default slug;\n',
    );

    const safeErrors = [];
    checkGeneratedOutput(root, safeErrors);
    assert.deepEqual(safeErrors, []);

    writeFileSync(
      path.join(root, "src/app/menu/page.tsx"),
      'export default "REPLACE MENU CONTENT";\n',
    );
    const unsafeErrors = [];
    checkGeneratedOutput(root, unsafeErrors);
    assert.match(messages(unsafeErrors), /template sentinel/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("active packet assets must exist and match committed bytes", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "restaurant-assets-"));
  try {
    mkdirSync(path.join(root, "public/images/site"), { recursive: true });
    writeFileSync(path.join(root, "public/images/site/hero.txt"), "approved bytes");
    const packet = {
      approvedPayload: {
        assets: [
          {
            targetPath: "public/images/site/hero.txt",
            sha256: "0".repeat(64),
          },
          {
            targetPath: "public/images/site/missing.txt",
            sha256: "0".repeat(64),
          },
        ],
      },
    };
    const errors = [];
    checkActivePacketAssets(root, packet, errors);

    assert.match(messages(errors), /does not match the committed asset bytes/);
    assert.match(messages(errors), /approved asset file does not exist/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("active packet assets cannot escape through a symlinked directory", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "restaurant-asset-root-"));
  const outside = mkdtempSync(path.join(os.tmpdir(), "restaurant-asset-outside-"));
  try {
    mkdirSync(path.join(root, "public/images"), { recursive: true });
    writeFileSync(path.join(outside, "hero.png"), "outside bytes");
    symlinkSync(outside, path.join(root, "public/images/site"), "dir");
    const packet = {
      approvedPayload: {
        assets: [
          {
            targetPath: "public/images/site/hero.png",
            sha256: "0".repeat(64),
          },
        ],
      },
    };
    const errors = [];
    checkActivePacketAssets(root, packet, errors);

    assert.match(messages(errors), /must not traverse a symlinked/);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
