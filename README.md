# Shared front-end audio demo

Static, portable research demo for **Real-time and efficient multi-target speech extraction via target-direction-agnostic feature extraction and late steering-vector fusion**.

**[Listen to the demo](https://tuttichi.github.io/shared-front-end-speech-demo/)** · [Repository](https://github.com/TuttiChi/shared-front-end-speech-demo)

## Local preview

From this folder, run:

```sh
node preview.mjs
```

Open <http://127.0.0.1:8765>. No dependencies or build step are required. The local server supports byte-range requests so WAV seeking and synchronized comparisons work. Stop it with Ctrl+C. `DEMO_PORT` can override the port.

Do not open `dist/index.html` directly with a `file://` URL: the page loads local JSON using fetch. A basic server that ignores Range requests may reset audio seeks. For hosting, upload the **contents of `dist/`** to a static host that supports byte ranges, such as GitHub Pages or a conventional static web server. `preview.mjs` is only a local preview server.

## Listening examples

Four favorable, curated examples are provided. They are illustrative selections, not random samples or estimates of average performance.

| Scene | Separation | Array SNR | Steering |
|---|---:|---:|---|
| Two directions, one scene | 45° | 10 dB | True DOA |
| Clearer separation | 120° | 10 dB | True DOA |
| When direction is imperfect | 35° | 10 dB | 10° toward interferer |
| Beyond the training voices | 30° | 15 dB | True DOA; distinct unseen readers |

Each scene has seven WAV files: microphone-0 mixture, two target references, two Early outputs, and two Late outputs. All 28 files are complete **31-second, 16 kHz, mono PCM16** recordings. No cropping or per-track normalization is applied. All seven tracks in a scene share one playback gain (1.0 for these scenes).

The first three examples contain different utterances by the same original test reader; the final example contains two distinct readers, both absent from training and validation. Both targets are retained. The interface explicitly discloses these conditions in the scene details.

The matched corrected Early/Late models use the verified best checkpoints from epochs 31 and 96. Audio and waveform hashes, angles, reader information, and selection provenance are in `dist/data/selection-manifest.json`. `dist/data/examples.json` contains the player data. Scores shown beside the players are full-recording SI-SDR recomputed on the delivered WAVs. No listening-preference study is claimed.

## Measurements and scope

- The page clearly marks the audio as prerecorded evaluation outputs, not browser inference or measured streaming-quality outputs.
- Computational figures compare matched Lightweight Early/Late configurations at one, two, and three requested targets.
- The 24.27 ms figure is the independently measured P95 software output delay for three targets with 10 ms packets on one CPU thread. Buffering, packet-processing P95, and exclusions are described on the page; separately measured percentiles are not added.
- Aggregate SI-SDR means (3.82/4.20 dB) provide context beyond the curated examples. The page retains the close-angle limitation and does not claim every quality metric improves.
- Array SNR uses summed fully reverberant speech and additive noise across the microphone array, not a fixed per-target TNR.

## Files and hosting

- `dist/index.html`, `styles.css`, `app.js`: presentation and synchronized player.
- `dist/assets/audio/`: the 28 demonstration WAVs.
- `dist/assets/manuscript.pdf`: a copy of the current manuscript PDF.
- `dist/data/`: public example metadata, measurement facts, and selection manifest.
- `preview.mjs`: local static server with WAV byte-range support.

GitHub Pages deploys the contents of `dist/` using `.github/workflows/pages.yml`. Pushing to `main` updates the live demo automatically. The standalone static files can also be hosted elsewhere without accounts, external fonts, or runtime dependencies. Internal selection logs, private provenance, and previous hosting credentials/configuration are excluded from this clean repository. The original manuscript and experimental results were not modified.
