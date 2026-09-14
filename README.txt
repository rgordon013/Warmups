SHIPBUILDER WARMUP POC

This version includes Big Arm Circles, Y to W Raise, Squat, and Back Extension
on a shared exercise selection screen. Start a local web server in this folder,
then open it in a current browser. For example:

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

Y to W Raise
  The Y to W sequence follows the supplied Supervisor Ergo 5 PowerPoint: begin
  with both arms in a high Y, lower both elbows toward the back pockets while
  squeezing the shoulder blades into a W, then return to Y. One Y-W-Y cycle
  counts as one repetition. The exercise calls for 10 repetitions, twice.
  The controlled Y and W positions were cross-checked against the American
  Council on Exercise I-Y-T-W exercise guidance:
  https://www.acefitness.org/resources/everyone/exercise-library/237/shoulder-stability-mobility-series-i-y-t-w-formations/

Squat and Back Extension
  These sequences follow the supplied Supervisor Ergo 5 PowerPoint. The squat
  reaches the arms forward while the hips lower and the knees track with the
  toes. The standing back extension keeps the hands at the hips, leans backward
  through a gentle range, holds briefly, and returns to tall. Both call for 10
  repetitions, twice.

  Form references:
  https://www.acefitness.org/resources/everyone/exercise-library/135/bodyweight-squat/
  https://www2.gov.bc.ca/assets/gov/careers/all-employees/health-well-being-and-safety/safety/stretching_guide.pdf

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
  index.html             Exercise selection screen
  big-arm-circles.html   Approved Big Arm Circles exercise
  y-to-w-raise.html      Y to W Raise exercise
  app.js / model.js      Approved Big Arm Circles controls and motion
  y-to-w-app.js / y-to-w-model.js
                         Y to W controls and motion
  squat.html / squat-app.js / squat-model.js
                         Squat exercise, controls, and motion
  back-extension.html / back-extension-app.js / back-extension-model.js
                         Back Extension exercise, controls, and motion
  assets/exercise-model.glb
                         Embedded rigged exercise figure
  assets/exercise-model-license.md
                         Model source and CC0 license information
  assets/makehuman/      CC0 hairstyle, footwear, textures, and license notes
  vendor/                Local Three.js runtime and MIT license

The assets/model-sheet.png file is retained as a legacy source asset but is no
longer displayed. The demonstration does not retrieve external media.
