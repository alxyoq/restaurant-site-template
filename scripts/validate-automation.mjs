import {
  createHash,
  createPublicKey,
  verify as verifySignature,
} from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(scriptDirectory, "..");
const schemaPath = path.join(
  repositoryRoot,
  "automation",
  "build-packet.schema.json",
);
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

const ajv = new Ajv2020({
  allErrors: true,
  allowUnionTypes: false,
  coerceTypes: false,
  removeAdditional: false,
  strict: true,
});
addFormats(ajv);
const validateSchema = ajv.compile(schema);

const forbiddenDeploymentPaths = [
  ".openai/hosting.json",
  "vercel.json",
  "wrangler.toml",
  "wrangler.json",
  "wrangler.jsonc",
  "vinext.config.js",
  "vinext.config.cjs",
  "vinext.config.mjs",
  "vinext.config.ts",
  "open-next.config.js",
  "open-next.config.cjs",
  "open-next.config.mjs",
  "open-next.config.ts",
];

const forbiddenPackageNames = new Set([
  "vinext",
  "vercel",
  "wrangler",
  "@opennextjs/cloudflare",
  "@cloudflare/next-on-pages",
]);

const forbiddenScriptTerms = [
  /\bvinext\b/i,
  /\bvercel\b/i,
  /\bwrangler\b/i,
  /\bopen-?next\b/i,
  /\bnetlify\s+deploy\b/i,
];

const requiredGuardedScripts = {
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
};

const placeholderPatterns = [
  /\bREPLACE\b/,
  /Replace (?:this (?:paragraph|copy|file)|these placeholders|with (?:a|an|the|current|bread|greens|serving))/,
  /Restaurant Name/i,
  /example\.com/i,
  /555-0123/i,
  /Customer Name/i,
  /Review date/i,
  /Signature Breakfast/i,
  /Seasonal Pancakes/i,
  /House Burger/i,
  /Add a short, authentic customer quote/i,
];

const secretKeyPattern = /^(?:api[-_]?key|authorization|cookie|credential|password|private[-_]?key|secret|token)$/i;
const secretValuePatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[oprsu]_[A-Za-z0-9_]{20,}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
];

function escapeJsonPointer(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

function walk(value, visitor, pointer = "") {
  visitor(value, pointer);

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      walk(entry, visitor, `${pointer}/${index}`);
    });
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => {
      walk(entry, visitor, `${pointer}/${escapeJsonPointer(key)}`);
    });
  }
}

export function canonicalize(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Canonical JSON cannot contain a non-finite number.");
    }
    return Object.is(value, -0) ? "0" : JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map(
        (key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`,
      );
    return `{${entries.join(",")}}`;
  }

  throw new TypeError(`Unsupported canonical JSON value: ${typeof value}`);
}

export function hashApprovedPayload(payload) {
  return createHash("sha256").update(canonicalize(payload)).digest("hex");
}

export function approvalSigningMessage(packet) {
  const { approval } = packet;
  return canonicalize({
    schemaVersion: packet.schemaVersion,
    packetType: packet.packetType,
    packetId: packet.packetId,
    createdAt: packet.createdAt,
    status: approval.status,
    actor: approval.actor,
    approvalEventId: approval.approvalEventId,
    approvalEventReference: approval.approvalEventReference,
    approvedAt: approval.approvedAt,
    reviewedEvidenceIds: approval.reviewedEvidenceIds,
    approvedPayloadSha256: approval.approvedPayloadSha256,
    signatureAlgorithm: approval.signatureAlgorithm,
    signingKeyId: approval.signingKeyId,
  });
}

function loadTrustStore(root = repositoryRoot) {
  const trustedApproversPath = path.join(
    root,
    "automation/trusted-approvers.json",
  );
  if (!existsSync(trustedApproversPath)) {
    return { productionAutomationEnabled: false, keys: [] };
  }

  return JSON.parse(readFileSync(trustedApproversPath, "utf8"));
}

function checkApprovalSignature(packet, mode, trustStore, errors) {
  const trustedKeys = Array.isArray(trustStore?.keys) ? trustStore.keys : [];
  const key = trustedKeys.find(
    (candidate) => candidate.keyId === packet.approval.signingKeyId,
  );
  if (!key) {
    addError(
      errors,
      "/approval/signingKeyId",
      "is not present in the trusted approver key store",
    );
    return;
  }

  const expectedScope = mode === "fixture" ? "fixture" : "production";
  if (key.scope !== expectedScope || key.algorithm !== "ed25519") {
    addError(
      errors,
      "/approval/signingKeyId",
      `must reference a trusted ${expectedScope} Ed25519 key`,
    );
    return;
  }

  try {
    const valid = verifySignature(
      null,
      Buffer.from(approvalSigningMessage(packet)),
      key.publicKeyPem,
      Buffer.from(packet.approval.approvalSignature, "base64"),
    );
    if (!valid) {
      addError(
        errors,
        "/approval/approvalSignature",
        "does not authenticate the approved payload and approval event",
      );
    }
  } catch {
    addError(
      errors,
      "/approval/approvalSignature",
      "could not be verified with the trusted approver key",
    );
  }
}

function addError(errors, pointer, message) {
  errors.push({ pointer: pointer || "/", message });
}

function formatSchemaError(error) {
  const pointer = error.instancePath || "/";
  if (error.keyword === "additionalProperties") {
    const property = escapeJsonPointer(error.params.additionalProperty);
    return {
      pointer: `${pointer === "/" ? "" : pointer}/${property}` || "/",
      message: "property is not allowed",
    };
  }
  return { pointer, message: error.message ?? "is invalid" };
}

function isPrivateIpv4(hostname) {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) {
    return false;
  }

  const octets = match.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) {
    return true;
  }

  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isPrivateIpLiteral(hostname) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (isPrivateIpv4(normalized)) {
    return true;
  }
  if (!normalized.includes(":")) {
    return false;
  }

  if (
    normalized === "::" ||
    normalized === "::1" ||
    normalized === "0:0:0:0:0:0:0:1"
  ) {
    return true;
  }
  if (/^(?:fc|fd)[0-9a-f]{2}:/i.test(normalized)) {
    return true;
  }
  if (/^fe[89ab][0-9a-f]:/i.test(normalized)) {
    return true;
  }

  const mappedIpv4 = normalized.match(/:(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  return Boolean(mappedIpv4 && isPrivateIpv4(mappedIpv4));
}

function inspectUrl(value, pointer, packetType, errors) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    addError(errors, pointer, "must be a valid URL or URN");
    return;
  }

  if (parsed.protocol === "urn:") {
    return;
  }

  if (parsed.protocol !== "https:") {
    addError(errors, pointer, "external references must use HTTPS");
    return;
  }

  if (parsed.username || parsed.password) {
    addError(errors, pointer, "must not contain embedded credentials");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    isPrivateIpLiteral(hostname)
  ) {
    addError(errors, pointer, "must not target localhost or a private network");
  }

  if (
    packetType !== "fixture" &&
    [".invalid", ".example", ".test"].some((suffix) =>
      hostname.endsWith(suffix),
    )
  ) {
    addError(errors, pointer, "reserved test domains are allowed only in fixtures");
  }
}

function collectPacketFacts(packet, errors) {
  const evidence = new Map();
  const facts = new Map();
  const referencedEvidence = new Set();
  const payload = packet.approvedPayload;

  for (const [index, entry] of payload.evidence.entries()) {
    if (evidence.has(entry.evidenceId)) {
      addError(
        errors,
        `/approvedPayload/evidence/${index}/evidenceId`,
        "evidence ID must be unique",
      );
    } else {
      evidence.set(entry.evidenceId, entry);
    }
  }

  walk(payload, (value, pointer) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return;
    }

    if (typeof value.factId === "string") {
      if (facts.has(value.factId)) {
        addError(errors, `${pointer}/factId`, "fact ID must be unique");
      } else {
        facts.set(value.factId, value);
      }

      if (value.state === "verified") {
        const hasDirectEvidence = value.evidenceRefs?.some(
          (evidenceId) => evidence.get(evidenceId)?.support === "direct",
        );
        if (!hasDirectEvidence) {
          addError(
            errors,
            `${pointer}/evidenceRefs`,
            "a verified fact requires at least one direct evidence reference",
          );
        }
      }
    }

    for (const key of ["evidenceRefs", "rightsEvidenceRefs"]) {
      if (!Array.isArray(value[key])) {
        continue;
      }
      value[key].forEach((evidenceId, index) => {
        referencedEvidence.add(evidenceId);
        if (!evidence.has(evidenceId)) {
          addError(
            errors,
            `${pointer}/${key}/${index}`,
            `references missing evidence ID ${evidenceId}`,
          );
        }
      });
    }
  });

  payload.content.approvedClaims.forEach((claim, claimIndex) => {
    claim.basisFactIds.forEach((factId, factIndex) => {
      const fact = facts.get(factId);
      if (!fact) {
        addError(
          errors,
          `/approvedPayload/content/approvedClaims/${claimIndex}/basisFactIds/${factIndex}`,
          `references missing fact ID ${factId}`,
        );
      } else if (fact.state !== "verified") {
        addError(
          errors,
          `/approvedPayload/content/approvedClaims/${claimIndex}/basisFactIds/${factIndex}`,
          "approved claims may reference verified facts only",
        );
      }
    });
  });

  const reviewed = new Set(packet.approval.reviewedEvidenceIds);
  for (const evidenceId of evidence.keys()) {
    if (!reviewed.has(evidenceId)) {
      addError(
        errors,
        "/approval/reviewedEvidenceIds",
        `does not include packet evidence ID ${evidenceId}`,
      );
    }
  }
  for (const evidenceId of reviewed) {
    if (!evidence.has(evidenceId)) {
      addError(
        errors,
        "/approval/reviewedEvidenceIds",
        `contains missing evidence ID ${evidenceId}`,
      );
    }
  }

  payload.evidence.forEach((entry, index) => {
    if (!referencedEvidence.has(entry.evidenceId)) {
      addError(
        errors,
        `/approvedPayload/evidence/${index}/evidenceId`,
        "evidence must be referenced by at least one approved payload field",
      );
    }
  });

  return { evidence, facts, referencedEvidence };
}

function hasDirectEvidence(evidenceRefs, evidence, predicate = () => true) {
  return evidenceRefs?.some((evidenceId) => {
    const entry = evidence.get(evidenceId);
    return entry?.support === "direct" && predicate(entry);
  });
}

function requireDirectEvidence(
  evidenceRefs,
  pointer,
  evidence,
  errors,
  predicate = () => true,
  message = "requires at least one suitable direct evidence reference",
) {
  if (!hasDirectEvidence(evidenceRefs, evidence, predicate)) {
    addError(errors, pointer, message);
  }
}

function checkRestaurantAndWebsite(payload, evidence, errors) {
  const category = payload.business.category.value;
  const restaurantCategory =
    /\b(?:restaurant|cafe|café|bakery|pizzeria|diner|bistro|taqueria|eatery|food truck|coffee shop|ice cream|grill|barbecue|bbq)\b/i;
  if (!restaurantCategory.test(category)) {
    addError(
      errors,
      "/approvedPayload/business/category/value",
      "must identify a restaurant or food-service business for this template",
    );
  }

  const assessment = payload.business.websiteAssessment;
  if (assessment.value !== "none_confirmed") {
    return;
  }

  const directWebChecks = assessment.evidenceRefs
    .map((evidenceId) => evidence.get(evidenceId))
    .filter(
      (entry) =>
        entry?.kind === "web_capture" && entry.support === "direct",
    );
  const hostnames = new Set(
    directWebChecks.map((entry) => new URL(entry.url).hostname.toLowerCase()),
  );
  if (directWebChecks.length < 2 || hostnames.size < 2) {
    addError(
      errors,
      "/approvedPayload/business/websiteAssessment/evidenceRefs",
      "none_confirmed requires direct web checks from at least two distinct sources",
    );
  }
}

function checkDirectContentEvidence(payload, evidence, errors) {
  if (payload.location.weeklyHours.state === "verified") {
    const days = payload.location.weeklyHours.value;
    assertUniqueValues(
      days.map((day) => day.day),
      "/approvedPayload/location/weeklyHours/value",
      "hours day",
      errors,
    );
    days.forEach((day, dayIndex) => {
      requireDirectEvidence(
        day.evidenceRefs,
        `/approvedPayload/location/weeklyHours/value/${dayIndex}/evidenceRefs`,
        evidence,
        errors,
      );
      if (day.closed === (day.intervals.length > 0)) {
        addError(
          errors,
          `/approvedPayload/location/weeklyHours/value/${dayIndex}/intervals`,
          day.closed
            ? "must be empty when the business is closed"
            : "must include at least one interval when the business is open",
        );
      }
    });
  }

  if (payload.menu.state === "verified") {
    payload.menu.sections.forEach((section, sectionIndex) => {
      requireDirectEvidence(
        section.evidenceRefs,
        `/approvedPayload/menu/sections/${sectionIndex}/evidenceRefs`,
        evidence,
        errors,
      );
      section.items.forEach((item, itemIndex) => {
        requireDirectEvidence(
          item.evidenceRefs,
          `/approvedPayload/menu/sections/${sectionIndex}/items/${itemIndex}/evidenceRefs`,
          evidence,
          errors,
        );
      });
    });
  }

  if (["link_only", "licensed_excerpts"].includes(payload.reviews.state)) {
    requireDirectEvidence(
      payload.reviews.evidenceRefs,
      "/approvedPayload/reviews/evidenceRefs",
      evidence,
      errors,
      (entry) => entry.kind === "web_capture" && entry.sourceClass === "review_platform",
      "requires direct evidence from the named review platform",
    );
  }

  if (payload.reviews.state === "licensed_excerpts") {
    payload.reviews.items.forEach((review, reviewIndex) => {
      requireDirectEvidence(
        review.evidenceRefs,
        `/approvedPayload/reviews/items/${reviewIndex}/evidenceRefs`,
        evidence,
        errors,
        (entry) => entry.kind === "web_capture" && entry.sourceClass === "review_platform",
        "requires direct evidence for the quoted review",
      );
      const rightsPredicate =
        review.rightsBasis === "platform_license"
          ? (entry) =>
              entry.sourceClass === "licensed_provider" &&
              ["web_capture", "document_capture"].includes(entry.kind)
          : (entry) =>
              entry.kind === "human_confirmation" ||
              (entry.kind === "document_capture" &&
                entry.sourceClass === "client_supplied");
      requireDirectEvidence(
        review.rightsEvidenceRefs,
        `/approvedPayload/reviews/items/${reviewIndex}/rightsEvidenceRefs`,
        evidence,
        errors,
        rightsPredicate,
        "requires direct rights evidence matching the declared rights basis",
      );
    });
  }

  const assetRights = {
    owner_confirmation: (entry) =>
      entry.kind === "human_confirmation" ||
      (entry.kind === "document_capture" && entry.sourceClass === "client_supplied"),
    commercial_license: (entry) =>
      entry.sourceClass === "licensed_provider" &&
      ["web_capture", "document_capture"].includes(entry.kind),
    generated_for_preview: (entry) => entry.kind === "human_confirmation",
    template_draft_only: (entry) =>
      entry.kind === "document_capture" && entry.sourceClass === "client_supplied",
  };
  const allowedAssetPairs = new Set([
    "owner_provided:owner_confirmation",
    "licensed_stock:commercial_license",
    "generated:generated_for_preview",
    "draft_placeholder:template_draft_only",
  ]);
  payload.assets.forEach((asset, assetIndex) => {
    requireDirectEvidence(
      asset.evidenceRefs,
      `/approvedPayload/assets/${assetIndex}/evidenceRefs`,
      evidence,
      errors,
    );
    requireDirectEvidence(
      asset.rightsEvidenceRefs,
      `/approvedPayload/assets/${assetIndex}/rightsEvidenceRefs`,
      evidence,
      errors,
      assetRights[asset.rightsBasis],
      "requires direct rights evidence matching the declared asset rights basis",
    );
    if (!allowedAssetPairs.has(`${asset.provenance}:${asset.rightsBasis}`)) {
      addError(
        errors,
        `/approvedPayload/assets/${assetIndex}/rightsBasis`,
        "must match the declared asset provenance",
      );
    }
    if (asset.draftOnly !== (asset.rightsBasis === "template_draft_only")) {
      addError(
        errors,
        `/approvedPayload/assets/${assetIndex}/draftOnly`,
        "must be true only for template-draft-only assets",
      );
    }
  });
}

function assertUniqueValues(values, pointer, label, errors) {
  const seen = new Set();
  values.forEach((value, index) => {
    if (seen.has(value)) {
      addError(errors, `${pointer}/${index}`, `${label} must be unique`);
    }
    seen.add(value);
  });
}

function checkFeatureCoherence(payload, evidence, errors) {
  const { pages, features } = payload.sitePlan;

  if (pages.menu && payload.menu.state !== "verified") {
    addError(
      errors,
      "/approvedPayload/sitePlan/pages/menu",
      "may be enabled only when the menu is verified",
    );
  }

  if (
    pages.reviews &&
    !["link_only", "licensed_excerpts"].includes(payload.reviews.state)
  ) {
    addError(
      errors,
      "/approvedPayload/sitePlan/pages/reviews",
      "may be enabled only for a verified review link or rights-cleared excerpts",
    );
  }

  if (
    pages.gallery &&
    !payload.assets.some((asset) => asset.role === "gallery")
  ) {
    addError(
      errors,
      "/approvedPayload/sitePlan/pages/gallery",
      "requires at least one rights-documented gallery asset",
    );
  }

  if (pages.catering) {
    const hasCateringClaim = payload.content.approvedClaims.some(
      (claim) => claim.claimType === "catering",
    );
    const hasContactMethod =
      payload.contact.phone.state === "verified" ||
      payload.contact.email.state === "verified";
    if (!hasCateringClaim || !hasContactMethod) {
      addError(
        errors,
        "/approvedPayload/sitePlan/pages/catering",
        "requires an approved catering claim and a verified contact method",
      );
    }
  }

  if (features.orderingCta && payload.contact.orderingUrl.state !== "verified") {
    addError(
      errors,
      "/approvedPayload/sitePlan/features/orderingCta",
      "requires a verified ordering URL",
    );
  }

  if (
    features.reservationCta &&
    payload.contact.reservationUrl.state !== "verified"
  ) {
    addError(
      errors,
      "/approvedPayload/sitePlan/features/reservationCta",
      "requires a verified reservation URL",
    );
  }

  assertUniqueValues(
    payload.social.map((profile) => profile.platform),
    "/approvedPayload/social",
    "social platform",
    errors,
  );
  assertUniqueValues(
    payload.assets.map((asset) => asset.assetId),
    "/approvedPayload/assets",
    "asset ID",
    errors,
  );
  assertUniqueValues(
    payload.assets.map((asset) => asset.targetPath),
    "/approvedPayload/assets",
    "asset target path",
    errors,
  );
  assertUniqueValues(
    payload.content.approvedClaims.map((claim) => claim.claimId),
    "/approvedPayload/content/approvedClaims",
    "claim ID",
    errors,
  );

  if (payload.menu.state === "verified") {
    assertUniqueValues(
      payload.menu.sections.map((section) => section.sectionId),
      "/approvedPayload/menu/sections",
      "menu section ID",
      errors,
    );
    const itemIds = payload.menu.sections.flatMap((section) =>
      section.items.map((item) => item.itemId),
    );
    assertUniqueValues(
      itemIds,
      "/approvedPayload/menu/sections",
      "menu item ID",
      errors,
    );
  }

  checkRestaurantAndWebsite(payload, evidence, errors);
  checkDirectContentEvidence(payload, evidence, errors);
}

function checkTimestamps(packet, errors) {
  const createdAt = Date.parse(packet.createdAt);
  const approvedAt = Date.parse(packet.approval.approvedAt);
  if (approvedAt > createdAt) {
    addError(
      errors,
      "/approval/approvedAt",
      "must not be later than packet creation time",
    );
  }

  const evidenceCutoff = approvedAt;
  packet.approvedPayload.evidence.forEach((entry, index) => {
    const timestamp =
      entry.accessedAt ?? entry.capturedAt ?? entry.confirmedAt ?? entry.observedAt;
    if (timestamp && Date.parse(timestamp) > evidenceCutoff) {
      addError(
        errors,
        `/approvedPayload/evidence/${index}`,
        "evidence timestamp must not be later than approval time",
      );
    }
  });

  walk(packet.approvedPayload, (value, pointer) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return;
    }
    for (const field of ["verifiedAt", "checkedAt"]) {
      if (typeof value[field] === "string" && Date.parse(value[field]) > approvedAt) {
        addError(
          errors,
          `${pointer}/${field}`,
          "must not be later than approval time",
        );
      }
    }
    if (typeof value.asOf === "string" && Date.parse(value.asOf) > approvedAt) {
      addError(errors, `${pointer}/asOf`, "must not be later than approval date");
    }
  });

  const websiteCheckedAt = Date.parse(
    packet.approvedPayload.business.websiteAssessment.checkedAt,
  );
  const maximumWebsiteCheckAge = 30 * 24 * 60 * 60 * 1000;
  if (approvedAt - websiteCheckedAt > maximumWebsiteCheckAge) {
    addError(
      errors,
      "/approvedPayload/business/websiteAssessment/checkedAt",
      "must be no more than 30 days old at approval time",
    );
  }
}

function checkSecretsAndUrls(packet, errors) {
  walk(packet, (value, pointer) => {
    const key = pointer.split("/").at(-1)?.replaceAll("~1", "/").replaceAll("~0", "~");
    if (key && secretKeyPattern.test(key)) {
      addError(errors, pointer, "secret-like fields are prohibited");
    }

    if (typeof value !== "string") {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        value.state === "verified" &&
        typeof value.value === "string" &&
        /^[a-z][a-z0-9+.-]*:/i.test(value.value)
      ) {
        inspectUrl(
          value.value,
          `${pointer}/value`,
          packet.packetType,
          errors,
        );
      }
      return;
    }

    if (secretValuePatterns.some((pattern) => pattern.test(value))) {
      addError(errors, pointer, "value resembles a credential or private key");
    }

    if (
      key &&
      (key === "url" ||
        key.endsWith("Url") ||
        key.endsWith("Uri") ||
        key.endsWith("Reference"))
    ) {
      inspectUrl(value, pointer, packet.packetType, errors);
    }
  });
}

export function validatePacket(
  packet,
  { mode = "production", trustStore = loadTrustStore(repositoryRoot) } = {},
) {
  const errors = [];
  const schemaValid = validateSchema(packet);
  if (!schemaValid) {
    return validateSchema.errors.map(formatSchemaError);
  }

  if (mode === "production" && packet.packetType !== "approved_draft_build") {
    addError(errors, "/packetType", "production validation rejects fixture packets");
  }
  if (mode === "fixture" && packet.packetType !== "fixture") {
    addError(errors, "/packetType", "fixture validation accepts fixture packets only");
  }

  const expectedHash = hashApprovedPayload(packet.approvedPayload);
  if (expectedHash !== packet.approval.approvedPayloadSha256) {
    addError(
      errors,
      "/approval/approvedPayloadSha256",
      "does not match the canonical approved payload",
    );
  }

  checkApprovalSignature(packet, mode, trustStore, errors);

  const { evidence } = collectPacketFacts(packet, errors);
  checkFeatureCoherence(packet.approvedPayload, evidence, errors);
  checkTimestamps(packet, errors);
  checkSecretsAndUrls(packet, errors);

  return errors;
}

function listTextFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const allowedExtensions = new Set([
    ".css",
    ".html",
    ".js",
    ".json",
    ".jsx",
    ".mdx",
    ".svg",
    ".ts",
    ".tsx",
    ".txt",
  ]);
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTextFiles(entryPath));
    } else if (allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(entryPath);
    }
  }

  return files;
}

export function checkGeneratedOutput(root, errors) {
  for (const directoryName of ["src", "public"]) {
    const directory = path.join(root, directoryName);
    for (const file of listTextFiles(directory)) {
      const contents = readFileSync(file, "utf8");
      const relative = path.relative(root, file).replaceAll(path.sep, "/");
      for (const pattern of placeholderPatterns) {
        if (pattern.test(contents)) {
          addError(
            errors,
            `/${relative}`,
            `generated client output still contains template sentinel ${pattern}`,
          );
        }
      }
    }
  }
}

function uncommentedToml(source) {
  return source
    .split(/\r?\n/)
    .filter((line) => !/^\s*#/.test(line))
    .join("\n");
}

function tomlArrayBlocks(source, tableName) {
  const blocks = [];
  const pattern = new RegExp(
    `\\[\\[${tableName.replaceAll(".", "\\\\.")}\\]\\]([\\s\\S]*?)(?=\\n\\s*\\[\\[|$)`,
    "g",
  );
  for (const match of source.matchAll(pattern)) {
    blocks.push(match[1]);
  }
  return blocks;
}

function tomlTableBlock(source, tableName) {
  const lines = source.split(/\r?\n/);
  const header = `[${tableName}]`;
  const start = lines.findIndex((line) => line.trim() === header);
  if (start === -1) {
    return "";
  }

  const block = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\s*\[/.test(line)) {
      break;
    }
    block.push(line);
  }
  return block.join("\n");
}

export function checkActivePacketAssets(root, packet, errors) {
  if (!Array.isArray(packet.approvedPayload?.assets)) {
    return;
  }

  for (const [index, asset] of packet.approvedPayload.assets.entries()) {
    const pointer = `/automation/build-packet.json/approvedPayload/assets/${index}`;
    const target = path.resolve(root, asset.targetPath);
    const rootPrefix = `${path.resolve(root)}${path.sep}`;
    if (!target.startsWith(rootPrefix)) {
      addError(errors, `${pointer}/targetPath`, "must stay inside the repository");
      continue;
    }
    if (!existsSync(target)) {
      addError(errors, `${pointer}/targetPath`, "approved asset file does not exist");
      continue;
    }

    const resolvedRoot = path.resolve(root);
    let currentPath = resolvedRoot;
    const pathParts = path.relative(resolvedRoot, target).split(path.sep);
    const symlinkedPart = pathParts.find((part) => {
      currentPath = path.join(currentPath, part);
      return lstatSync(currentPath).isSymbolicLink();
    });
    if (symlinkedPart) {
      addError(
        errors,
        `${pointer}/targetPath`,
        "must not traverse a symlinked file or directory",
      );
      continue;
    }

    const realRoot = realpathSync(resolvedRoot);
    const realTarget = realpathSync(target);
    if (!realTarget.startsWith(`${realRoot}${path.sep}`)) {
      addError(errors, `${pointer}/targetPath`, "must stay inside the real repository path");
      continue;
    }

    const fileStatus = lstatSync(target);
    if (fileStatus.isSymbolicLink() || !fileStatus.isFile()) {
      addError(errors, `${pointer}/targetPath`, "must be a regular, non-symlink file");
      continue;
    }
    if (fileStatus.size > 15 * 1024 * 1024) {
      addError(errors, `${pointer}/targetPath`, "approved asset exceeds 15 MB");
      continue;
    }

    const contents = readFileSync(target);
    const digest = createHash("sha256").update(contents).digest("hex");
    if (digest !== asset.sha256) {
      addError(errors, `${pointer}/sha256`, "does not match the committed asset bytes");
    }

    const extension = path.extname(target).toLowerCase();
    const textPrefix = contents.subarray(0, 4096).toString("utf8");
    const containsSvgRoot = /<svg(?:\s|>)/i.test(textPrefix);
    if (containsSvgRoot && extension !== ".svg") {
      addError(
        errors,
        `${pointer}/targetPath`,
        "SVG content must use the .svg extension so it can be sanitized",
      );
    }

    if (extension === ".svg") {
      const svg = contents.toString("utf8");
      if (!containsSvgRoot) {
        addError(errors, `${pointer}/targetPath`, "SVG assets must contain an SVG root element");
      }
      if (
        /<script\b/i.test(svg) ||
        /<foreignObject\b/i.test(svg) ||
        /<!DOCTYPE|<!ENTITY/i.test(svg) ||
        /\son[a-z]+\s*=/i.test(svg) ||
        /javascript\s*:/i.test(svg) ||
        /@import\b/i.test(svg) ||
        /url\(\s*["']?(?:https?:)?\/\//i.test(svg) ||
        /(?:href|xlink:href)\s*=\s*["'](?:https?:)?\/\//i.test(svg)
      ) {
        addError(errors, `${pointer}/targetPath`, "SVG assets must not contain active or remote content");
      }
    }
  }
}

export function validateRepositoryPolicy(root = repositoryRoot) {
  const errors = [];

  for (const relativePath of forbiddenDeploymentPaths) {
    if (existsSync(path.join(root, relativePath))) {
      addError(errors, `/${relativePath}`, "forbidden non-Netlify deployment file");
    }
  }

  for (const lockfile of ["bun.lock", "bun.lockb", "pnpm-lock.yaml", "yarn.lock"])
    if (existsSync(path.join(root, lockfile))) {
      addError(errors, `/${lockfile}`, "npm is the only allowed package manager");
    }

  const packageJsonPath = path.join(root, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const packageGroups = [
    packageJson.dependencies ?? {},
    packageJson.devDependencies ?? {},
    packageJson.optionalDependencies ?? {},
  ];
  for (const group of packageGroups) {
    for (const packageName of Object.keys(group)) {
      if (forbiddenPackageNames.has(packageName)) {
        addError(
          errors,
          `/package.json/${escapeJsonPointer(packageName)}`,
          "forbidden non-Netlify deployment dependency",
        );
      }
    }
  }
  for (const [scriptName, command] of Object.entries(packageJson.scripts ?? {})) {
    if (forbiddenScriptTerms.some((pattern) => pattern.test(command))) {
      addError(
        errors,
        `/package.json/scripts/${escapeJsonPointer(scriptName)}`,
        "forbidden non-Netlify deployment command",
      );
    }
  }
  for (const [scriptName, requiredCommand] of Object.entries(
    requiredGuardedScripts,
  )) {
    if (packageJson.scripts?.[scriptName] !== requiredCommand) {
      addError(
        errors,
        `/package.json/scripts/${escapeJsonPointer(scriptName)}`,
        `must remain ${JSON.stringify(requiredCommand)} for guarded preview builds`,
      );
    }
  }

  const previewPolicyPath = path.join(root, "src/config/preview-policy.json");
  if (!existsSync(previewPolicyPath)) {
    addError(errors, "/src/config/preview-policy.json", "preview policy is required");
  } else {
    const previewPolicy = JSON.parse(readFileSync(previewPolicyPath, "utf8"));
    const requiredPolicy = {
      mode: "unpublished_sales_preview",
      searchIndexing: "noindex_nofollow_noarchive",
      contactFormEnabled: false,
      newsletterEnabled: false,
      orderingEnabled: false,
      productionDeployAllowed: false,
      publicLaunchAllowed: false,
      requiresSeparateLaunchApproval: true,
    };
    const actualKeys = Object.keys(previewPolicy).sort();
    const expectedKeys = Object.keys(requiredPolicy).sort();
    if (canonicalize(actualKeys) !== canonicalize(expectedKeys)) {
      addError(
        errors,
        "/src/config/preview-policy.json",
        "must contain exactly the approved preview-policy keys",
      );
    }
    for (const [key, expectedValue] of Object.entries(requiredPolicy)) {
      if (previewPolicy[key] !== expectedValue) {
        addError(
          errors,
          `/src/config/preview-policy.json/${key}`,
          `must remain ${JSON.stringify(expectedValue)} for automated previews`,
        );
      }
    }
  }

  const netlifyPath = path.join(root, "netlify.toml");
  const netlify = uncommentedToml(
    existsSync(netlifyPath) ? readFileSync(netlifyPath, "utf8") : "",
  );
  if (/^\s*\[\[?context\./m.test(netlify)) {
    addError(
      errors,
      "/netlify.toml",
      "context-specific Netlify overrides are prohibited in Phase 1",
    );
  }
  const pluginBlocks = tomlArrayBlocks(netlify, "plugins");
  if (
    !pluginBlocks.some((block) =>
      /^\s*package\s*=\s*["']@netlify\/plugin-nextjs["']\s*$/m.test(block),
    )
  ) {
    addError(errors, "/netlify.toml", "must preserve an active Netlify Next.js plugin block");
  }
  const headerBlocks = tomlArrayBlocks(netlify, "headers");
  if (
    !headerBlocks.some(
      (block) =>
        /^\s*for\s*=\s*["']\/\*["']\s*$/m.test(block) &&
        /^\s*X-Robots-Tag\s*=\s*["']noindex, nofollow, noarchive["']\s*$/m.test(
          block,
        ),
    )
  ) {
    addError(errors, "/netlify.toml", "must send the active preview X-Robots-Tag header");
  }
  const buildBlock = tomlTableBlock(netlify, "build");
  if (!/^\s*command\s*=\s*["']npm run build:netlify["']\s*$/m.test(buildBlock)) {
    addError(errors, "/netlify.toml", "must run the guarded Netlify build command");
  }

  const robotsPath = path.join(root, "public/robots.txt");
  const robots = existsSync(robotsPath)
    ? readFileSync(robotsPath, "utf8").replaceAll("\r\n", "\n").trim()
    : "";
  if (robots !== "User-agent: *\nDisallow: /") {
    addError(errors, "/public/robots.txt", "must disallow indexing of the preview");
  }

  const workflowDirectory = path.join(root, ".github/workflows");
  if (existsSync(workflowDirectory)) {
    for (const entry of readdirSync(workflowDirectory, { withFileTypes: true })) {
      if (
        entry.isFile() &&
        [".yml", ".yaml"].includes(path.extname(entry.name).toLowerCase())
      ) {
        const workflow = readFileSync(path.join(workflowDirectory, entry.name), "utf8");
        if (/\bnetlify\s+deploy\b/i.test(workflow)) {
          addError(
            errors,
            `/.github/workflows/${entry.name}`,
            "workflow deployment commands are prohibited in the preview foundation",
          );
        }
      }
    }
  }

  let trustStore = { productionAutomationEnabled: false, keys: [] };
  const trustStorePath = path.join(root, "automation/trusted-approvers.json");
  if (!existsSync(trustStorePath)) {
    addError(errors, "/automation/trusted-approvers.json", "trusted approver store is required");
  } else {
    try {
      trustStore = loadTrustStore(root);
      const trustKeys = Array.isArray(trustStore.keys) ? trustStore.keys : [];
      const trustStoreKeys = Object.keys(trustStore).sort();
      if (
        canonicalize(trustStoreKeys) !==
        canonicalize(["keys", "productionAutomationEnabled", "schemaVersion"])
      ) {
        addError(
          errors,
          "/automation/trusted-approvers.json",
          "must contain exactly the approved trust-store keys",
        );
      }
      if (
        trustStore.schemaVersion !== "1.0.0" ||
        trustStore.productionAutomationEnabled !== false
      ) {
        addError(
          errors,
          "/automation/trusted-approvers.json",
          "Phase 1 must keep production automation explicitly disabled",
        );
      }
      assertUniqueValues(
        trustKeys.map((key) => key.keyId),
        "/automation/trusted-approvers.json/keys",
        "trusted key ID",
        errors,
      );
      trustKeys.forEach((key, index) => {
        const pointer = `/automation/trusted-approvers.json/keys/${index}`;
        if (
          canonicalize(Object.keys(key).sort()) !==
          canonicalize(["algorithm", "keyId", "publicKeyPem", "scope"])
        ) {
          addError(errors, pointer, "must contain exactly the approved public-key fields");
        }
        if (
          key.algorithm !== "ed25519" ||
          key.scope !== "fixture" ||
          typeof key.keyId !== "string" ||
          !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key.keyId)
        ) {
          addError(errors, pointer, "must define a fixture-scoped Ed25519 key");
        }
        try {
          if (
            typeof key.publicKeyPem !== "string" ||
            !/^-----BEGIN PUBLIC KEY-----\n/.test(key.publicKeyPem) ||
            !/\n-----END PUBLIC KEY-----\n?$/.test(key.publicKeyPem)
          ) {
            addError(
              errors,
              `${pointer}/publicKeyPem`,
              "must contain a public-key PEM block only",
            );
          } else if (
            createPublicKey(key.publicKeyPem).asymmetricKeyType !== "ed25519"
          ) {
            addError(errors, `${pointer}/publicKeyPem`, "must be an Ed25519 public key");
          }
        } catch {
          addError(errors, `${pointer}/publicKeyPem`, "must be a valid public key");
        }
      });
      if (trustKeys.some((key) => key.scope === "production")) {
        addError(
          errors,
          "/automation/trusted-approvers.json/keys",
          "Phase 1 must not trust any production signing key",
        );
      }
    } catch {
      addError(errors, "/automation/trusted-approvers.json", "must contain valid JSON");
    }
  }

  const activePacketPath = path.join(root, "automation/build-packet.json");
  if (existsSync(activePacketPath)) {
    addError(
      errors,
      "/automation/build-packet.json",
      "real build packets are disabled until production signing and deterministic output verification are implemented",
    );
    const fileSize = statSync(activePacketPath).size;
    if (fileSize > 2_000_000) {
      addError(errors, "/automation/build-packet.json", "packet exceeds 2 MB");
    } else {
      try {
        const packet = JSON.parse(readFileSync(activePacketPath, "utf8"));
        for (const error of validatePacket(packet, { mode: "production", trustStore })) {
          addError(
            errors,
            `/automation/build-packet.json${error.pointer === "/" ? "" : error.pointer}`,
            error.message,
          );
        }
        if (packet.packetType === "approved_draft_build") {
          checkGeneratedOutput(root, errors);
          checkActivePacketAssets(root, packet, errors);
        }
      } catch {
        addError(errors, "/automation/build-packet.json", "must contain valid JSON");
      }
    }
  }

  return errors;
}

function readPacketFile(file) {
  const size = statSync(file).size;
  if (size > 2_000_000) {
    throw new Error("packet exceeds 2 MB");
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

function formatResult(prefix, error) {
  return `${prefix}${error.pointer}: ${error.message}`;
}

async function main() {
  const args = process.argv.slice(2);
  const digestIndex = args.indexOf("--print-digest");
  if (digestIndex !== -1) {
    const file = args[digestIndex + 1];
    if (!file) {
      throw new Error("--print-digest requires a packet path");
    }
    const packet = readPacketFile(path.resolve(process.cwd(), file));
    process.stdout.write(`${hashApprovedPayload(packet.approvedPayload)}\n`);
    return;
  }

  const packetFiles = args.filter((arg) => !arg.startsWith("--"));
  if (packetFiles.length === 0) {
    packetFiles.push("automation/examples/build-packet.fixture.json");
  }

  const allErrors = [];
  const canonicalFixturePath = path.join(
    repositoryRoot,
    "automation/examples/build-packet.fixture.json",
  );
  for (const packetFile of packetFiles) {
    const absolutePath = path.resolve(process.cwd(), packetFile);
    try {
      const packet = readPacketFile(absolutePath);
      const mode = absolutePath === canonicalFixturePath ? "fixture" : "production";
      for (const error of validatePacket(packet, { mode })) {
        allErrors.push(formatResult(`${packetFile}`, error));
      }
    } catch (error) {
      allErrors.push(`${packetFile}/: ${error.message}`);
    }
  }

  for (const error of validateRepositoryPolicy(repositoryRoot)) {
    allErrors.push(formatResult("repository", error));
  }

  if (allErrors.length > 0) {
    process.stderr.write(`${allErrors.map((error) => `ERROR ${error}`).join("\n")}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `Automation validation passed (${packetFiles.length} packet${
      packetFiles.length === 1 ? "" : "s"
    }).\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`ERROR /: ${error.message}\n`);
    process.exitCode = 1;
  });
}
