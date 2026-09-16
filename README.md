# AI Flip Photo · MISREAD LAB

A playful, browser-local image-scaling security exhibit. One constructed image resembles a cat at full view but reconstructs a dog when sampled at a deliberately chosen resolution. No AI model, API key, backend inference or image upload service is involved.

**Live:** https://jingsong-wang.github.io/ai-flip-photo/

## Run

Node 24, no installation required:

```sh
node --test tests/*.test.mjs
node server.mjs
```

Open http://127.0.0.1:4175 . `PORT` overrides the preview port. GitHub Actions tests and publishes `dist/` on pushes to main. Enable Settings → Pages → GitHub Actions.

## What is actually happening?

The browser center-crops the cover to 1024×1024 and the target to 128×128. Each 8×8 source block has its central 2×2 RGB pixels replaced by one target pixel. At most 6.25% of source pixels change. Source arrays are not mutated.

All three resamplers read the same constructed RGBA buffer:

- **Nearest:** source coordinate `floor((destination + 0.5) * scale)`.
- **Bilinear, no antialiasing:** interpolate four neighbors around `(destination + 0.5) * scale - 0.5`.
- **Area:** average all intersecting source pixels, weighted by exact pixel overlap area.

At 1024→128, nearest and bilinear hit the modified central pixels and reproduce the target exactly. Area integrates the unmodified majority and weakens this particular construction. Other sizes and preprocessing conventions can behave differently. This is not a claim that all libraries use these implementations or that area sampling blocks all attacks. Averaging is applied to sRGB bytes, not linear-light values.

The left stage is an actual area-filtered 512×512 preview of the constructed image, not the untouched cover. CSS may further scale/crop both previews for layout. Downloaded original PNG retains the exact 1024×1024 array. The magnifier shows its center 32×32 source pixels. The right stage is the actual computed output, enlarged for visibility. Its target RGB mean absolute error is shown only at matching 128×128 dimensions; it is not model confidence.

## Features and privacy

Two presets, arbitrary output size 64–1024, three algorithms, pixel magnifier, local photo pair upload, original PNG export, current comparison card and parameter JSON. Uploads support JPEG/PNG/WebP up to 12 MiB and 40 megapixels each. Files are center-cropped; alpha is composited over the page background. No analytics, remote fonts or runtime third-party requests. Photos are processed in memory and are not persisted by the app.

Preserve PNG pixels for reproduction: JPEG compression, screenshots, social media processing, and a different resize library may destroy the effect. Download cards illustrate the result but do not preserve the original construction. The default photos are CC0; details in [asset credits](dist/assets/README.md).

## Research and boundaries

Inspired by Quiring et al., **Adversarial Preprocessing: Understanding and Preventing Image-Scaling Attacks in Machine Learning**, USENIX Security 2020: https://www.usenix.org/conference/usenixsecurity20/presentation/quiring . This is an independently implemented, simple educational construction, not a full paper reproduction or a measured jailbreak against an AI model.

Unit tests use hand-derived pixel fixtures to check unchanged source data, exact hidden-target recovery, fractional area weights, identity, RGB error and validation. Browser checks cover desktop/mobile presentation, real sampling, custom uploads and exports.
