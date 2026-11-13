# Arabic automatic editing entry point

The authenticated hosted pilot now exposes an Arabic-first upload workflow at `/auto`.

## Flow
1. The browser creates/selects an OpenKatana project.
2. Audio, raw clips and an optional reference are uploaded through the existing bounded `/api/upload` route.
3. Assets are imported with `import_media`; an optional reference is analyzed with `analyze_reference`.
4. `plan_edit` creates a validated first-cut timeline from the selected clips. The audio asset is attached as the timeline soundtrack.
5. `save_timeline` saves the edit and `start_render` renders it. The existing Studio Review page is used to watch/download the export.

## Current limitations
- The first cut follows the uploaded clip order and an OpenKatana recipe. It does not yet semantically match every sentence in the supplied script to the best footage.
- The supplied script is stored as project metadata/creative brief; timed captions require word-level timings and are not fabricated.
- Reference analysis reports visual/cut/cadence/texture/transition characteristics. It does not automatically guarantee an exact style clone.
- Render execution requires a correctly deployed hosted worker with FFmpeg, Chromium and the documented sandbox. This code does not provision a VPS, DNS, TLS, OAuth, worker or model service.
- Respect the operator's upload/workspace limits. Do not raise them without storage and resource benchmarks.

## Route and assets
- `openkatana/hosted/app.py`: authenticated `/auto` route.
- `openkatana/web/auto-editor.html`, `auto-editor.css`, `auto-editor.js`: same-origin UI and API client.
