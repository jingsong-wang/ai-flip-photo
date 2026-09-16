# AI Flip Photo Implementation Plan

**Goal:** Publish a polished browser-local image-scaling experiment in a separate GitHub repository.
**Architecture:** Pure pixel functions in core.mjs, worker for construction/resizing, canvas presentation and local uploads in app.mjs. Static HTML/CSS/assets published by GitHub Pages.
**Tech stack:** ES modules, Canvas 2D, Web Workers, Node built-in test runner. No npm dependencies.
**Spec:** design.md

- [ ] Core: first write tests using hand-calculated 8×8 and 2×2 fixtures. Verify test failure, implement construct/resize/error, then verify exact recovery, area behavior and input validation. Files: dist/core.mjs, tests/core.test.mjs.
- [ ] Interface: create index.html/style.css, worker.mjs/app.mjs and licensed local photo assets. Pair image stages with dimensions and algorithm controls. Upload errors retain current state. Export the actual constructed pixels as PNG.
- [ ] Validate: run Node tests and syntax checks; browser-check live sampling, custom files, exports, responsive layout, and errors; request independent review and resolve significant findings.
- [ ] Publish: create jingsong-wang/ai-flip-photo, upload reviewed source, enable GitHub Actions Pages deployment, inspect CI and public page. Preserve source licenses and document exact sampler conventions.
