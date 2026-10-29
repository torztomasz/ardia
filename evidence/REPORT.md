# Folder tiles: capture evidence, round 1

- **Code:** mantrakp04/ardia at `ad1daaea`.
  - **baseline** is `ad1daaea` as is.
  - **current** is `ad1daaea` plus the coordinator's patch: FolderPanel on `useHoverCardMotion`, `primeFolderPanel` on press-in, and FolderPeek kept while it leaves.
- **Machine:** 14" MacBook Pro (MacBookPro18,3), 3024x1964 Retina. `NSScreen.maximumFramesPerSecond` reports 120, and the display link ticked every 8.3 ms.
- **Instance:** hidden (`ARDIA_BACKGROUND=1`, `open -g -n`, scratch `ARDIA_DATA_DIR`), one 1280x800 window, sidebar layout.
  - Fixture: 5 Top Apps cells. Mail (red), Calendar (blue) and the folder **Work** are on row 1; Docs (green) and Music (orange) are on row 2.
  - **Work** holds Jira, GitHub, Figma and Slack (purple, teal, pink, yellow).
  - 3 list tabs: Alpha, Bravo, Charlie. **Alpha** is active, so the tile shows the 2x2 mosaic.
  - Favicons are solid-colour PNGs served by a local http server.
- **Clicks:** real AppKit events via `windows.dev mouse:down` / `mouse:up` at the tile centre (155, 74 pt), after `devSetPointer`.
  - The pointer arrives 150 ms before mouse-down.
  - **Mouse-down to mouse-up was 83–88 ms (median 83–84).**
  - The pointer stays where it clicked afterwards.
- **Coordinates:** all times are ms relative to mouse-up unless a column says "from mouse-down". Negative means before mouse-up.

## Screen lock and how the frames were captured

**The screen locked at about 13:36 local time, partway through my first baseline run, and was unlocked again by 13:58 at the latest.** The display sleeps after 10 minutes idle, and the lock follows.

1. **Pixel evidence, the PNG frames in `evidence/`**
   - These are ScreenCaptureKit frames of the instance's window, taken after the screen was unlocked again. I held `caffeinate -d` only while capturing, then stopped it.
   - Capture used a display filter that includes only the instance's window, at 120 fps max and 2x, cropped to window points (0, 0, 520, 600).
   - The crop covers the sidebar (190 pt wide) plus the area to its right where the folder's hover card (peek) appears.
   - ScreenCaptureKit only delivers a frame when the window's pixels change, so a static stretch has no files. The `-120.png` file is the last frame before that time (`"held": true` in `frames.json`).
   - Each `*-frames/` folder holds every delivered frame from −120 to +400 ms, `settled.png` (the last frame within +1200 ms), `frames.json` (exact ms of each frame) and `trial.json` (click timestamps, panel frame, JS mount/unmount times).
   - I widened the window from −50 to −120 ms because the baseline closes the panel on **mouse-down**, about 80 ms before mouse-up.
   - The window-only filter (`desktopIndependentWindow`) got only about 4 frames a second for a window behind the owner's apps, so I didn't use it.
2. **Timing, `measurements.json` (primary)**
   - The display-link tracker added to the clone's DevModule (`devTrackStart` / `devTrackTag` / `devTrackStop`) runs once per display tick.
   - On each tick it reads the folder panel view's effective opacity (the product of layer opacities up to the window content view) and its frame converted to window coordinates, which includes ancestor scale transforms.
   - It costs well under 1 ms per tick and works whether or not the screen is locked. These runs happened while it was locked.
   - A tick's timestamp is when the display-link callback fires. That frame reaches the glass about one refresh (8.3 ms) later.
   - 10 trials of each interaction per variant, dark appearance.
3. **Cross-check, `measurements-pixels.json`**
   - The same 10 trials of each interaction per variant, measured from ScreenCaptureKit pixels after the unlock.
   - The ROI is the panel's open frame.
   - Latency: the first frame whose ROI has more than 0.2% of pixels changed by more than 12/255.
   - Settle: the first frame after which every frame has less than 1% of ROI pixels off the last frame.
   - Pixel latency includes compositing, so it reads about 10–15 ms later than the tracker.
   - The pixel ROI includes the member rows, so a row's pressed highlight on mouse-down counts as a change. That is why pick-member pixel latency is about −55 ms.
4. **Not used as evidence.** Before the unlock I also tried an in-process `CALayer.render(in:)` sampler (`devSampleStart`). It takes about 60 ms per frame on the main thread, which delayed the panel's JS mount from about 33 ms to about 120 ms. It also renders the Metal backdrop and most tiles blank. I left those frames out of `evidence/`.

## Results (10 trials each, dark)

Tracker:

- **Latency** is the first tick where the panel's opacity or size changes, or where it mounts or unmounts while visible.
- **Settle** is the first tick after which opacity is within 0.01 of the end state and width within 1%.

| Interaction | Variant | Latency median / max | Settle median / max | Latency from mouse-down (median) | Settle from mouse-down (median) | JS mount/unmount (median, from mouse-up) |
|---|---|---|---|---|---|---|
| Open (click tile) | baseline | 46.7 / 61.8 | 103.0 / 111.8 | 132.6 | 186.9 | 33.5 |
| Open (click tile) | current | 62.2 / 70.9 | 158.2 / 174.5 | 145.2 | 241.5 | 33.0 |
| Close by clicking the tile | baseline | -62.8 / -62.3 | -62.8 / -62.3 | 20.2 | 20.2 | -74.0 |
| Close by clicking the tile | current | -41.8 / -29.2 | 52.3 / 62.4 | 43.0 | 135.6 | 58.5 |
| Close by clicking empty list space | baseline | -64.6 / -54.5 | -64.6 / -54.5 | 18.4 | 18.4 | -73.0 |
| Close by clicking empty list space | current | -45.5 / -37.5 | 46.3 / 59.7 | 37.7 | 129.4 | 58.0 |
| Pick 2nd member row | baseline | 62.2 / 78.1 | 62.2 / 78.1 | 145.7 | 145.7 | 40.0 |
| Pick 2nd member row | current | 70.5 / 86.8 | 162.4 / 178.5 | 154.2 | 246.2 | 174.5 |

| Interaction | Variant | Pixel latency median / max | Pixel settle median / max |
|---|---|---|---|
| Open (click tile) | baseline | 57.8 / 70.5 | 111.5 / 121.3 |
| Open (click tile) | current | 75.8 / 95.1 | 337.7 / 357.6 |
| Close by clicking the tile | baseline | -54.5 / -45.8 | -54.5 / -45.8 |
| Close by clicking the tile | current | -29.4 / -17.0 | 43.6 / 57.8 |
| Close by clicking empty list space | baseline | -54.0 / -46.6 | -54.0 / -46.6 |
| Close by clicking empty list space | current | -28.9 / -20.3 | 46.0 / 54.7 |
| Pick 2nd member row | baseline | -55.6 / -54.3 | 70.5 / 91.4 |
| Pick 2nd member row | current | -58.8 / -53.9 | 155.9 / 778.9 |

The pixel table is the ScreenCaptureKit cross-check.

**Pixel settle for current open (338 ms) is much longer than the tracker's 158 ms.** The scale spring overshoots to 1.002–1.003 and creeps back. Its edge pixels keep changing until about 350 ms, which the tracker's 1% width rule calls settled.

**Pick-member current trial 09 (779 ms) is an outlier unrelated to the folder.** The GitHub page finished loading late, so the whole crop re-tinted, and a list-row hover card appeared under the resting pointer at about +779 ms.

## What the numbers and frames show

1. **The baseline closes on mouse-down, instantly, with no exit animation.** This applies to both the tile click and the outside click.
   - `OutsidePressArea` fires on press-in, and the tile counts as outside the panel.
   - The panel unmounts about 13 ms after mouse-down, about 74 ms before mouse-up, and disappears in one frame.
   - The current variant keeps the close on mouse-down but fades and shrinks the panel toward the tile:
     - about 45 ms from mouse-down to the first change;
     - opacity 1 → 0 over about 100 ms;
     - scale 1 → 0.914;
     - unmount at about +58 ms after mouse-up.
2. **Open: the current variant becomes visible later than the baseline, though JS commits at the same time.**
   - JS mounts the panel at about +33 ms after mouse-up in both variants.
   - The baseline's very stiff spring (`SLIDE`, stiffness 8100) reaches about 50% opacity on its first visible tick (+47 ms median) and settles by about +103 ms.
   - The current variant spends two ticks mounted at opacity 0 and scale 0.92 (about +54 and +62 in trial 00). It starts fading at about +62 ms median and reaches full opacity at about +160 ms.
   - Its scale spring then overshoots slightly (1.002–1.003) and settles visually at about +340 ms.
   - Measured from mouse-down, the first visible panel pixel arrives at about 133 ms (baseline) vs 145 ms (current).
   - In both, about 85 ms of that is the mouse button being held. Nothing happens on press-in apart from the tile's pressed state.
3. **Scale origin.**
   - The baseline scales about the panel's own centre: x-centre stays at 95 pt while the top edge moves 104.8 → 101.
   - The current variant scales from the tile's bottom centre. Solving the tracked frames gives an origin of about (154, 95) pt, which is the tile's bottom-middle; the top edge stays at about 100.5. So the current panel grows out of the tile.
4. **First layout at the wrong origin, invisible.**
   - In both variants, the panel's first mounted tick has it at y ≈ 518–525 pt instead of 101, at opacity 0.
   - It moves into place on the next tick. I never saw it on screen, but it is a layout pass at a wrong origin.
5. **Hover card to panel hand-off** (`hover-then-click-frames`). Visibility comes from mean pixel difference in each card's region, 0 to 1, and is in `handoff-hover-then-click.json`.
   - **Baseline:**
     - The peek card holds at 100% until +13 ms and is gone by +38 ms with no fade (a hard cut).
     - The +38 ms frame shows **neither card** (a blank frame).
     - The panel fades in from +55 ms and reaches 1.0 at about +120 ms.
   - **Current:**
     - The peek card holds at 100% and the screen doesn't change between +29 and +71 ms.
     - From +71 ms the peek fades out while the panel fades in. **Both cards are visible together** from +71 to about +146 ms.
     - At +87 ms the peek is at 0.55 and the panel at 0.44.
     - The two cards don't overlap in space (peek to the right of the sidebar, panel under the tile), so this reads as a cross-fade between two cards, not a double card in one place.
6. **Pick member.**
   - The row's pressed highlight shows on mouse-down in both variants.
   - The baseline panel vanishes in one frame at about +62 ms after mouse-up.
   - The current variant fades it out from about +70 ms to about +160 ms.
   - The selected tab (GitHub) becomes active in both. The tile then shows GitHub's favicon with the folder glyph (`rest-open-member-active.png`).
7. **Stuck state, seen once, not reproduced.**
   - In one baseline pixel run, after about 18 trials, the tile stopped opening the panel. Three clicks in a row left nothing on screen, for 12 consecutive setups, until the instance was quit.
   - It didn't happen in four other baseline runs (about 160 more clicks) or in any current run.
   - I had no diagnostics in place then, and the rerun overwrote that run's frames, so I can't show it.
   - A plausible cause I haven't confirmed: the baseline `PanelBody` renders nothing until `controller.root.measureInWindow` answers. If `controller.root` is null, the store says open but nothing draws, and each click just toggles that invisible state.
   - The driver now saves a snapshot and the drag controller's state when this happens (`raw/<variant>/stuck/`), for later rounds.
8. **Not observed:**
   - flicker on open, other than the baseline hand-off's blank frame;
   - a jump of a visible panel;
   - a stuck hover card;
   - the peek reappearing while the panel is open, in either variant.
   - In the close-by-tile captures the pointer rests on the tile afterwards, and no peek reappears within 1.2 s.

## Per-frame tables

**Open, baseline** (tracker, trial 00; one row per display tick; frames after the last row are unchanged)

| ms from mouse-up | mounted | opacity | width pt | width px | scale vs settled | x pt | y pt |
|---|---|---|---|---|---|---|---|
| +36.8 | no | 0.0 | 0.0 | 0.0 | 0.0 | – | – |
| +49.0 | yes | 0.0 | 163.8 | 327.5 | 0.92 | 13.1 | 525.2 |
| +61.8 | yes | 0.482 | 170.6 | 341.2 | 0.959 | 9.7 | 104.8 |
| +70.1 | yes | 0.678 | 173.4 | 346.8 | 0.974 | 8.3 | 103.3 |
| +78.4 | yes | 0.81 | 175.3 | 350.6 | 0.985 | 7.4 | 102.4 |
| +86.8 | yes | 0.891 | 176.4 | 352.9 | 0.991 | 6.8 | 101.8 |
| +95.1 | yes | 0.943 | 177.2 | 354.4 | 0.995 | 6.4 | 101.4 |
| +103.4 | yes | 0.969 | 177.6 | 355.1 | 0.998 | 6.2 | 101.2 |
| +111.8 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |
| +120.1 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |
| +128.4 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |

**Open, current** (tracker, trial 00; one row per display tick; frames after the last row are unchanged)

| ms from mouse-up | mounted | opacity | width pt | width px | scale vs settled | x pt | y pt |
|---|---|---|---|---|---|---|---|
| +37.6 | no | 0.0 | 0.0 | 0.0 | 0.0 | – | – |
| +46.8 | yes | 0.0 | 178 | 356 | 1.0 | 6 | 518 |
| +54.3 | yes | 0.0 | 163.8 | 327.5 | 0.92 | 18.0 | 100.5 |
| +62.6 | yes | 0.0 | 163.8 | 327.5 | 0.92 | 18.0 | 100.5 |
| +70.9 | yes | 0.153 | 164.0 | 328.1 | 0.922 | 17.7 | 100.5 |
| +79.3 | yes | 0.302 | 164.7 | 329.4 | 0.925 | 17.2 | 100.6 |
| +87.6 | yes | 0.444 | 165.8 | 331.6 | 0.931 | 16.3 | 100.6 |
| +95.9 | yes | 0.578 | 167.0 | 334.0 | 0.938 | 15.2 | 100.6 |
| +104.3 | yes | 0.674 | 168.3 | 336.6 | 0.945 | 14.2 | 100.7 |
| +112.6 | yes | 0.77 | 169.6 | 339.2 | 0.953 | 13.1 | 100.7 |
| +120.9 | yes | 0.832 | 170.9 | 341.7 | 0.96 | 12.0 | 100.8 |
| +129.3 | yes | 0.894 | 172.1 | 344.1 | 0.967 | 11.0 | 100.8 |
| +137.6 | yes | 0.93 | 173.2 | 346.3 | 0.973 | 10.1 | 100.8 |
| +145.9 | yes | 0.966 | 174.1 | 348.3 | 0.978 | 9.2 | 100.9 |
| +154.3 | yes | 0.983 | 175.0 | 350.0 | 0.983 | 8.5 | 100.9 |
| +162.6 | yes | 0.999 | 175.7 | 351.4 | 0.987 | 7.9 | 100.9 |
| +170.9 | yes | 1.0 | 176.3 | 352.6 | 0.991 | 7.4 | 100.9 |
| +179.3 | yes | 1.0 | 176.9 | 353.7 | 0.994 | 7.0 | 101.0 |
| +187.6 | yes | 1.0 | 177.3 | 354.6 | 0.996 | 6.6 | 101.0 |
| +196.0 | yes | 1.0 | 177.6 | 355.3 | 0.998 | 6.3 | 101.0 |
| +204.3 | yes | 1.0 | 177.9 | 355.8 | 0.999 | 6.1 | 101.0 |
| +212.6 | yes | 1.0 | 178.1 | 356.2 | 1.0 | 5.9 | 101.0 |
| +220.9 | yes | 1.0 | 178.2 | 356.5 | 1.001 | 5.8 | 101.0 |
| +229.3 | yes | 1.0 | 178.3 | 356.6 | 1.002 | 5.7 | 101.0 |
| +237.6 | yes | 1.0 | 178.4 | 356.7 | 1.002 | 5.7 | 101.0 |
| +245.9 | yes | 1.0 | 178.4 | 356.8 | 1.002 | 5.7 | 101.0 |
| +254.3 | yes | 1.0 | 178.4 | 356.8 | 1.002 | 5.7 | 101.0 |
| +262.6 | yes | 1.0 | 178.4 | 356.8 | 1.002 | 5.7 | 101.0 |
| +271.0 | yes | 1.0 | 178.4 | 356.7 | 1.002 | 5.7 | 101.0 |
| +279.3 | yes | 1.0 | 178.3 | 356.7 | 1.002 | 5.7 | 101.0 |
| +287.6 | yes | 1.0 | 178.3 | 356.6 | 1.002 | 5.7 | 101.0 |
| +295.9 | yes | 1.0 | 178.3 | 356.5 | 1.001 | 5.8 | 101.0 |
| +304.3 | yes | 1.0 | 178.2 | 356.5 | 1.001 | 5.8 | 101.0 |
| +312.6 | yes | 1.0 | 178.2 | 356.4 | 1.001 | 5.8 | 101.0 |
| +320.9 | yes | 1.0 | 178.2 | 356.3 | 1.001 | 5.9 | 101.0 |
| +329.3 | yes | 1.0 | 178.1 | 356.3 | 1.001 | 5.9 | 101.0 |
| +337.6 | yes | 1.0 | 178.1 | 356.2 | 1.001 | 5.9 | 101.0 |
| +345.9 | yes | 1.0 | 178.1 | 356.2 | 1.0 | 5.9 | 101.0 |
| +354.3 | yes | 1.0 | 178.1 | 356.1 | 1.0 | 6.0 | 101.0 |

**Close by tile, baseline** (tracker, trial 00; one row per display tick; frames after the last row are unchanged)

| ms from mouse-up | mounted | opacity | width pt | width px | scale vs settled | x pt | y pt |
|---|---|---|---|---|---|---|---|
| -104.5 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |
| -96.1 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |
| -87.6 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |
| -73.6 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |
| -71.1 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |
| -62.8 | no | 0.0 | 0.0 | 0.0 | 0.0 | – | – |

**Close by tile, current** (tracker, trial 00; one row per display tick; frames after the last row are unchanged)

| ms from mouse-up | mounted | opacity | width pt | width px | scale vs settled | x pt | y pt |
|---|---|---|---|---|---|---|---|
| -104.8 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |
| -96.5 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |
| -88.2 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |
| -74.4 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |
| -71.5 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |
| -63.2 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |
| -54.9 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |
| -46.5 | yes | 1.0 | 178 | 356 | 1.0 | 6 | 101 |
| -38.1 | yes | 0.845 | 177.6 | 355.1 | 0.998 | 6.4 | 101.0 |
| -29.8 | yes | 0.688 | 176.4 | 352.8 | 0.991 | 7.3 | 100.9 |
| -21.5 | yes | 0.554 | 174.9 | 349.7 | 0.982 | 8.6 | 100.9 |
| -13.2 | yes | 0.424 | 173.1 | 346.2 | 0.973 | 10.1 | 100.8 |
| -4.9 | yes | 0.324 | 171.2 | 342.4 | 0.962 | 11.7 | 100.8 |
| +4.3 | yes | 0.228 | 169.4 | 338.8 | 0.952 | 13.2 | 100.7 |
| +11.8 | yes | 0.172 | 167.9 | 335.8 | 0.943 | 14.5 | 100.7 |
| +20.2 | yes | 0.106 | 166.4 | 332.8 | 0.935 | 15.8 | 100.6 |
| +28.5 | yes | 0.069 | 165.2 | 330.3 | 0.928 | 16.8 | 100.6 |
| +36.8 | yes | 0.037 | 164.3 | 328.6 | 0.923 | 17.5 | 100.5 |
| +45.2 | yes | 0.017 | 163.5 | 326.9 | 0.918 | 18.2 | 100.5 |
| +53.5 | yes | 0.001 | 163.0 | 326.0 | 0.916 | 18.6 | 100.5 |
| +61.8 | yes | 0.0 | 162.6 | 325.3 | 0.914 | 18.9 | 100.5 |
| +78.5 | no | 0.0 | 0.0 | 0.0 | 0.0 | – | – |

**Open, baseline** (pixels, ScreenCaptureKit, trial 00: opacity = panel-interior luminance between closed and open frames; width = visible span)

| ms from mouse-up | opacity | width px | of settled |
|---|---|---|---|
| -87.8 | -0.0 | 0 | 0.0 |
| -54.5 | -0.0 | 0 | 0.0 |
| -46.1 | -0.0 | 0 | 0.0 |
| -4.5 | -0.0 | 0 | 0.0 |
| +37.2 | -0.0 | 0 | 0.0 |
| +45.5 | -0.0 | 0 | 0.0 |
| +53.9 | -0.0 | 0 | 0.0 |
| +70.5 | 0.544 | 342 | 0.859 |
| +78.9 | 0.716 | 379 | 0.952 |
| +87.2 | 0.843 | 387 | 0.972 |
| +95.5 | 0.903 | 391 | 0.982 |
| +103.9 | 0.949 | 395 | 0.992 |
| +112.2 | 0.968 | 396 | 0.995 |
| +120.5 | 1.0 | 398 | 1.0 |
| +162.2 | 1.0 | 398 | 1.0 |
| +203.9 | 1.0 | 398 | 1.0 |
| +245.5 | 1.0 | 398 | 1.0 |
| +287.2 | 1.0 | 398 | 1.0 |
| +328.9 | 1.0 | 398 | 1.0 |
| +337.2 | 1.0 | 398 | 1.0 |
| +370.5 | 1.0 | 398 | 1.0 |

**Open, current** (pixels, ScreenCaptureKit, trial 00: opacity = panel-interior luminance between closed and open frames; width = visible span)

| ms from mouse-up | opacity | width px | of settled |
|---|---|---|---|
| -96.6 | -0.0 | 0 | 0.0 |
| -79.9 | -0.0 | 0 | 0.0 |
| -63.2 | -0.0 | 0 | 0.0 |
| -54.9 | -0.0 | 0 | 0.0 |
| -38.2 | -0.0 | 0 | 0.0 |
| -21.6 | -0.0 | 0 | 0.0 |
| -4.9 | -0.0 | 0 | 0.0 |
| +3.4 | -0.0 | 0 | 0.0 |
| +28.4 | -0.0 | 0 | 0.0 |
| +45.1 | -0.0 | 0 | 0.0 |
| +53.4 | -0.0 | 0 | 0.0 |
| +70.1 | -0.0 | 0 | 0.0 |
| +95.1 | 0.314 | 210 | 0.528 |
| +111.8 | 0.614 | 358 | 0.899 |
| +128.4 | 0.804 | 377 | 0.947 |
| +136.8 | 0.916 | 386 | 0.97 |
| +153.4 | 0.981 | 390 | 0.98 |
| +170.1 | 1.011 | 394 | 0.99 |
| +186.8 | 1.012 | 396 | 0.995 |
| +203.4 | 1.007 | 398 | 1.0 |
| +220.1 | 0.999 | 399 | 1.003 |
| +245.1 | 0.991 | 399 | 1.003 |
| +253.4 | 0.998 | 399 | 1.003 |
| +270.1 | 0.998 | 399 | 1.003 |
| +286.8 | 0.991 | 399 | 1.003 |
| +295.1 | 0.998 | 399 | 1.003 |
| +311.8 | 0.999 | 399 | 1.003 |
| +328.4 | 0.999 | 399 | 1.003 |
| +345.1 | 0.999 | 399 | 1.003 |
| +357.6 | 0.999 | 398 | 1.0 |
| +365.9 | 0.999 | 398 | 1.0 |
| +374.3 | 1.0 | 398 | 1.0 |
| +390.9 | 1.0 | 398 | 1.0 |
| +399.3 | 1.0 | 398 | 1.0 |

**Close by tile, baseline** (pixels, ScreenCaptureKit, trial 00: opacity = panel-interior luminance between closed and open frames; width = visible span)

| ms from mouse-up | opacity | width px | of settled |
|---|---|---|---|
| -54.3 | -0.0 | 0 | 0.0 |
| -37.6 | -0.0 | 0 | 0.0 |
| -4.3 | -0.0 | 0 | 0.0 |
| +87.4 | -0.0 | 0 | 0.0 |
| +112.4 | -0.0 | 0 | 0.0 |

**Close by tile, current** (pixels, ScreenCaptureKit, trial 00: opacity = panel-interior luminance between closed and open frames; width = visible span)

| ms from mouse-up | opacity | width px | of settled |
|---|---|---|---|
| -83.2 | 1.0 | 398 | 1.0 |
| -54.1 | 1.0 | 398 | 1.0 |
| -37.4 | 0.85 | 391 | 0.982 |
| -20.7 | 0.551 | 373 | 0.937 |
| -12.4 | 0.429 | 345 | 0.867 |
| +8.4 | 0.236 | 217 | 0.545 |
| +20.9 | 0.168 | 175 | 0.44 |
| +33.4 | 0.075 | 170 | 0.427 |
| +45.9 | 0.017 | 0 | 0.0 |
| +58.4 | -0.0 | 0 | 0.0 |
| +70.9 | -0.0 | 0 | 0.0 |
| +83.4 | -0.0 | 0 | 0.0 |


## Build notes (harness only, not part of either variant)

- **Engine:** no prebuilt engine matches `ad1daaea`'s `engine/` tree. It is 9 engine commits past `engine-2f172eb50b89`.
  - I built against that nearest prebuilt (`fetch-engine.sh --nearest`).
  - The one link gap is `ArdiaCorePageView`, which is new in those 9 commits and used for swipe and scroll hit-testing. I filled it with a no-op stub class in the clone (`packages/ardiacore/ios/FolderClimbEngineShim.mm`).
  - Nothing in the sidebar uses it.
- **Signing:** this Mac has no code-signing identity, so the clone's Debug config is ad hoc. In `project.pbxproj` I set `CODE_SIGN_IDENTITY "-"`, Manual style, no team, no entitlements and no hardened runtime, matching the repo's `AdHoc.xcconfig`. `Podfile.lock` changed from `pod install`.
- **DevModule:** the clone's `packages/shell/ios/DevModule.swift` gained the dev-only tracker and sampler described above, inside `#if DEBUG`.
- **JS:** both variants run the same JS from the clone's Metro, except for the patch.

## Files

- `evidence/{baseline,current}/{dark,light}/`:
  - `rest-closed.png`, `rest-open.png`, `rest-open-member-active.png`;
  - `open-frames/`, `close-tile-frames/`, `close-outside-frames/`, `pick-member-frames/`, `hover-then-click-frames/`.
- `evidence/measurements.json`: tracker, every trial, plus the per-frame tables.
- `evidence/measurements-pixels.json`: pixel cross-check.
- `evidence/handoff-hover-then-click.json`: per-frame visibility of the peek and the panel.
