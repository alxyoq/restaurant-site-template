# Automation contract: Phase 1 fixture validation

Phase 1 validates the proposed contract with an authenticated synthetic fixture.
It does not accept a packet for a real prospect and does not authorize Codex to
build or deploy a real-business preview.

## Current trust boundary

Supported now:

- schema and semantic validation;
- an Ed25519-authenticated, fixture-scoped approval envelope;
- repository checks that preserve npm, Netlify, disabled forms, and noindex
  preview defaults;
- CI checks for the reusable template and synthetic fixture.

Intentionally disabled now:

- a production-scoped trusted signing key;
- acceptance of `automation/build-packet.json` for a real prospect;
- deterministic conversion of packet facts into site data, routes, links, copy,
  and assets;
- a real client repository, client build branch, draft client PR, or Netlify
  deploy preview;
- merge, production deployment, domain changes, customer contact, payments, and
  publication.

The fixture signature proves that the validator can authenticate its committed
test envelope. It is not production authority. No real build is authorized in
this phase.

## Planned production workflow

The intended pipeline retains three separate trust stages:

1. Qwen researches and ranks candidates. Its output is untrusted research and
   cannot authorize a build.
2. A human reviews the candidate and its evidence in the approval UI. A trusted
   orchestrator records that event, creates the production packet, and signs its
   approval envelope with a protected production key.
3. A deterministic generator converts only the signed packet into site output.
   Codex verifies that output, works on an isolated branch, and opens a draft PR
   for an unlisted Netlify preview.

Stage 2 production signing and all of Stage 3 remain disabled until the trusted
production key, generator, and exact packet-to-output verification are
implemented and separately approved. Even then, the draft packet will never
authorize merging or public launch.

## Future production packet

`build-packet.schema.json` uses JSON Schema Draft 2020-12. It requires:

- structured business, contact, location, website, menu, and review facts with
  evidence references;
- explicit unknown states instead of empty strings or plausible defaults;
- operating status, ownership, business category, and website assessment;
- evidence-reference fields for menu items, prices, hours, social links, and
  reviews;
- rights and provenance fields for review excerpts and assets;
- a human approval event, SHA-256 digest of the complete approved payload, and
  authenticated approval signature;
- Netlify-only, draft-PR-only, form-free, noindex preview policy.

The payload digest detects changes but cannot authenticate a human approval. In
production, the trusted orchestrator must sign the digest and approval envelope
with a protected production key, and the validator must trust the corresponding
production public key. This repository intentionally contains no trusted
production key yet.

Signature verification still does not bind the React/Next.js output to the
packet. Production remains disabled until a deterministic generator creates the
site from the authenticated packet and validation proves that generated copy,
links, routes, and assets match it.

To inspect a digest while developing the future orchestrator:

```bash
node scripts/validate-automation.mjs \
  --print-digest automation/build-packet.json
```

Printing or recomputing a digest does not approve a packet and must not be used
to start a real build.

To validate the repository and committed fixture:

```bash
npm run validate:automation
npm run test:automation
```

Do not add `automation/build-packet.json` in Phase 1. Real packet acceptance will
be enabled only after a production trust key and deterministic generator are in
place.

## Fixture

`examples/build-packet.fixture.json` uses reserved synthetic data and cannot be
accepted in production mode. Its fixture-scoped Ed25519 signature exercises the
schema, digest, signature, and semantic checks without storing information about
a real prospect or granting build authority.

## Separate launch gate

After production packet validation and deterministic generation are eventually
enabled, an accepted business will still require a later, explicit launch
approval. That separate workflow may update the domain, forms, indexing,
structured data, payment links, and deployment state. None of those actions are
authorized by this foundation or by a future draft packet.
