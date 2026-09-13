SHIPBUILDER WARMUP POC — BIG ARM CIRCLES

This version uses the approved skeletal 3D motion. Start a local web server in
this folder, then open it in a current version of Microsoft Edge, Google Chrome,
Firefox, or Safari. For example:

  python3 -m http.server 8765 --bind 127.0.0.1
  http://127.0.0.1:8765/index.html

A local server is required for the JavaScript modules. No installation or
internet connection is required; the Three.js renderer is included locally.

Controls
  Start / Pause / Resume   Begins or pauses the exercise
  Reverse                  Switches forward and backward circles
  Speed                    Cycles through 1.0x, 1.4x, and 0.6x
  Reset reps               Sets the counter to zero without stopping motion

Repetition behavior
  One repetition is counted after 360 degrees of uninterrupted travel in the
  current direction. Reversing keeps the exact visible pose but discards any
  partial-circle progress. Reset reps clears both the displayed count and any
  partial-circle progress without stopping or repositioning the animation.

3D motion
  The realistic athletic figure is animated by a 74-joint internal skeleton.
  Blended skin weights deform the connected anatomical surface at the shoulders,
  chest, and upper arms. The arms follow opposing circular paths while the
  shoulder girdle and torso participate in the movement. Drag the model to
  inspect it from another angle. Its appearance is adapted to match the original
  reference: CC0 short dark-brown men's hair, warm skin, a blue athletic tee,
  navy shorts, and CC0 white athletic trainers with socks.

Verification check
  In a browser console, await window.__warmupPOC.verifyMotion() checks that both
  shoulders contain blended arm-to-torso skinning, joint lengths remain stable,
  all bone transforms remain finite through 73 sampled poses, and the motion
  returns cleanly to its start. The integrated page was visually checked at the
  four quarter-circle positions and exercised in both directions.

Keyboard shortcuts
  Space   Start, pause, or resume
  R       Reverse direction
  F       Enter full screen (when permitted by the browser)

Files
  index.html             Full Shipbuilder interface
  app.js                 Exercise controls and 3D scene
  model.js               Realistic model integration and approved motion
  assets/exercise-model.glb
                         Embedded rigged exercise figure
  assets/exercise-model-license.md
                         Model source and CC0 license information
  assets/makehuman/      CC0 hairstyle, footwear, textures, and license notes
  vendor/                Local Three.js runtime and MIT license

The assets/model-sheet.png file is retained as a legacy source asset but is no
longer displayed. The demonstration does not retrieve external media.
