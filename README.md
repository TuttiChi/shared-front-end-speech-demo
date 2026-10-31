# Shared front-end audio demo

Static, portable research demo for **Real-time and efficient multi-target speech extraction via target-direction-agnostic feature extraction and late steering-vector fusion**.

**[Listen to the demo](https://tuttichi.github.io/shared-front-end-speech-demo/)** · [Repository](https://github.com/TuttiChi/shared-front-end-speech-demo)

Paper, model code and checkpoints: **Coming soon**. The public page displays availability notices in place of download and citation controls. This repository hosts the demo website.

## Local preview

From this folder, run:

```sh
node preview.mjs
```

Open <http://127.0.0.1:8765>. No dependencies or build step are required. The local server supports byte-range requests so WAV seeking and synchronized comparisons work. Stop it with Ctrl+C. `DEMO_PORT` can override the port.

Do not open `dist/index.html` directly with a `file://` URL: the page loads local JSON using fetch. A basic server that ignores Range requests may reset audio seeks. For hosting, upload the **contents of `dist/`** to a static host that supports byte ranges, such as GitHub Pages or a conventional static web server. `preview.mjs` is only a local preview server.

## Listening examples

Two comparison groups provide six favorable, curated examples. They are illustrative selections, not random samples or estimates of average performance. Every compared model and both requested targets are retained within each scene.

| Comparison | Separation | Array SNR | Steering |
|---|---:|---:|---|
| All paper models | 120° | 15 dB | True DOA |
| All paper models | 75° | 0 dB | True DOA |
| Matched Early/Late | 45° | 10 dB | True DOA |
| Matched Early/Late | 120° | 10 dB | True DOA |
| Matched Early/Late | 35° | 10 dB | 10° toward interferer |
| Matched Early/Late | 30° | 15 dB | True DOA; distinct unseen readers |

The paper comparison includes **DISF, original JNF-SSF, JNF-SSF (shared), EaBNet (shared), TaylorBeamformer (shared), and Lightweight (shared)**. Each of these two scenes has 15 WAVs: one microphone-0 mixture, two target references, and six methods for each target. The four matched Early/Late scenes have seven WAVs each. All **58 files** are complete **31-second, 16 kHz, mono PCM16** recordings. No cropping or per-track normalization is applied; tracks within each scene share one playback gain (1.0 for these scenes).

Both paper-comparison scenes and the first three matched Early/Late scenes contain different utterances by the same original test reader. The final matched example contains two distinct readers, both absent from training and validation. The interface explicitly discloses these conditions in the scene details.

The six paper models use archived outputs from the manuscript comparison; their delivered audio, metadata, hashes and per-target scores are in `dist/data/baseline-examples.json`. The matched corrected Early/Late models use the verified best checkpoints from epochs 31 and 96; they are separate from the archived Lightweight (shared) model. Their hashes, angles, reader information and provenance are in `dist/data/selection-manifest.json`, with player data in `dist/data/examples.json`. Scores beside the players are full-recording SI-SDR recomputed on the delivered WAVs. No listening-preference study is claimed.

## Measurements and scope

- The page clearly marks the audio as prerecorded evaluation outputs, not browser inference or measured streaming-quality outputs.
- Computational figures compare matched Lightweight Early/Late configurations at one, two, and three requested targets.
- The 24.27 ms figure is the independently measured P95 software output delay for three targets with 10 ms packets on one CPU thread. Buffering, packet-processing P95, and exclusions are described on the page; separately measured percentiles are not added.
- The page shows the paper-comparison aggregate SI-SDR table separately from the matched Early/Late means (3.82/4.20 dB), retains the close-angle limitation, and does not claim every quality metric improves.
- DISF and both JNF-SSF configurations are noncausal. The matched Lightweight runtime measurements are not assigned to the archived multi-backbone audio outputs.
- Array SNR uses summed fully reverberant speech and additive noise across the microphone array, not a fixed per-target TNR.

## Files and hosting

- `dist/index.html`, `styles.css`, `app.js`: presentation and synchronized player.
- `dist/assets/audio/`: 28 matched Early/Late WAVs, plus 30 paper-comparison WAVs in `paper-baselines/`.
- `dist/assets/method-architecture.svg` and `.pdf`: the manuscript's original Figure 1, exported as vector SVG and provided as the unchanged source PDF.
- `dist/data/`: public example metadata, measurement facts, and selection manifest.
- `preview.mjs`: local static server with WAV byte-range support.

GitHub Pages deploys the contents of `dist/` using `.github/workflows/pages.yml`. Pushing to `main` updates the live demo automatically. The standalone static files can also be hosted elsewhere without accounts, external fonts, or runtime dependencies. Internal selection logs, private provenance, and previous hosting credentials/configuration are excluded from this clean repository. The original manuscript and experimental results were not modified.
