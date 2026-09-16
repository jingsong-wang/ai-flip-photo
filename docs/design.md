# AI Flip Photo — accepted design

User approved the proposed image-scaling playground and GitHub publication on 2026-09-16. Deliver an independent static repository/site, with no inference service or image uploads to a server. This is a new project in an isolated directory; existing Flylab files stay untouched.

Art direction: warm off-white editorial science exhibit, vermilion accents, oversized Chinese headline, paired image stages, precise small monospace specimen labels. Mobile uses stacked stages and native accessible controls.

Construct one 1024×1024 RGBA image. For every 8×8 block, replace the central 2×2 pixels with one pixel from a 128×128 target. A center-aligned nearest-neighbor or bilinear sampler without antialiasing recovers the target at 128×128. Box-area averaging includes the other pixels and mostly retains the cover. The three samplers are explicit, independently implemented functions; output always comes from the same constructed image, never a swapped source image. This is a deliberately simple demonstration, not universal behavior of all image libraries or a model jailbreak.

Features: instant cat/dog demo; second text-reveal preset; output-size slider and critical-resolution shortcut; nearest/bilinear/area selection; measured changed-pixel fraction and target pixel error; before/after download card; original lossless PNG export and JSON metadata; custom cover/target uploads with center crop and size checks; explanation and source links. Uploaded photos remain local. No analytics, remote fonts, API keys, or model downloads.

Acceptance: exact target recovery at designed size, area sampling resists this construction, source buffers unmodified, invalid inputs rejected, 390px viewport has no horizontal overflow, keyboard controls, presets/uploads/downloads work, GitHub Actions tests and Pages deployment succeed, public page visually verified.
