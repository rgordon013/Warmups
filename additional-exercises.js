export const ADDITIONAL_EXERCISES = Object.freeze({
  'active-chest-stretch': Object.freeze({
    id: 'active-chest-stretch',
    title: 'Active Chest Stretch',
    secondsPerRep: 4,
    direction: 'Open and relax',
    reverseDirection: 'Relax and open',
    description: 'Open the chest by drawing both elbows back while keeping the hands behind the head.',
    ariaLabel: 'Three-dimensional adult model demonstrating an active chest stretch',
    cues: [
      'Stand tall, raise both arms, and place your hands behind your head.',
      'Draw your elbows back and gently squeeze your shoulder blades together.',
      'Hold briefly, then relax without forcing the movement.'
    ]
  }),
  'high-knees': Object.freeze({
    id: 'high-knees',
    title: 'High Knees',
    secondsPerRep: 4,
    direction: 'Alternating knees',
    reverseDirection: 'Alternating knees',
    description: 'Lift each knee toward the chest in a controlled alternating pattern while staying tall.',
    ariaLabel: 'Three-dimensional adult model demonstrating alternating high knees',
    cues: [
      'Stand tall with your feet shoulder-width apart.',
      'Lift one knee toward your chest without leaning back.',
      'Lower the foot with control, then repeat with the other leg.'
    ]
  }),
  'heel-raises': Object.freeze({
    id: 'heel-raises',
    title: 'Heel Raises',
    secondsPerRep: 3,
    direction: 'Raise and lower',
    reverseDirection: 'Lower and raise',
    description: 'Rise onto the toes with straight knees, then lower the heels under control.',
    ariaLabel: 'Three-dimensional adult model demonstrating heel raises',
    cues: [
      'Stand tall and use a sturdy support if needed for balance.',
      'Rise onto your toes without bending your knees.',
      'Pause briefly, then lower your heels slowly.'
    ]
  }),
  'standing-trunk-rotation': Object.freeze({
    id: 'standing-trunk-rotation',
    title: 'Standing Trunk Rotation',
    secondsPerRep: 4,
    direction: 'Rotate left and right',
    reverseDirection: 'Rotate right and left',
    description: 'Rotate the upper body from side to side while the feet and hips remain forward.',
    ariaLabel: 'Three-dimensional adult model demonstrating standing trunk rotation',
    cues: [
      'Stand with your feet shoulder-width apart and soften your knees.',
      'Keep your hands supported at your hips.',
      'Rotate from side to side while your feet and hips face forward.'
    ]
  }),
  'neck-retraction': Object.freeze({
    id: 'neck-retraction', title: 'Neck Retraction', secondsPerRep: 4,
    direction: 'Draw chin straight back', reverseDirection: 'Draw chin straight back',
    description: 'Draw the head straight back while keeping the eyes level.',
    ariaLabel: 'Three-dimensional adult model demonstrating neck retraction',
    cues: ['Stand tall and look straight ahead.', 'Draw your head straight backward without tilting it.', 'Hold briefly, then return to neutral.']
  }),
  'chin-to-chest-neck-stretch': Object.freeze({
    id: 'chin-to-chest-neck-stretch', timed: true, title: 'Chin-to-Chest Neck Stretch',
    direction: 'Gentle neck flexion', reverseDirection: 'Gentle neck flexion',
    description: 'Lower the chin toward the chest in a comfortable range.',
    ariaLabel: 'Three-dimensional adult model demonstrating a chin-to-chest neck stretch',
    cues: ['Stand tall with your shoulders relaxed.', 'Lower your chin gently toward your chest; do not pull on your head.', 'Hold for the selected time, then return to neutral before changing sides.']
  }),
  'wrist-extensor-stretch': Object.freeze({
    id: 'wrist-extensor-stretch', timed: true, title: 'Wrist Extensor Stretch',
    direction: 'Palm down · fingers down', reverseDirection: 'Palm down · fingers down',
    description: 'Extend one arm, palm down, and gently bend the wrist downward.',
    ariaLabel: 'Three-dimensional adult model demonstrating a wrist extensor stretch',
    cues: ['Extend one arm forward with the elbow straight and palm down.', 'Point the fingers toward the floor.', 'Use the other hand to gently draw the fingers toward you; hold, then switch sides.']
  }),
  'wrist-flexor-stretch': Object.freeze({
    id: 'wrist-flexor-stretch', timed: true, title: 'Wrist Flexor Stretch',
    direction: 'Palm up · fingers down', reverseDirection: 'Palm up · fingers down',
    description: 'Extend one arm, palm up, and gently bend the wrist downward.',
    ariaLabel: 'Three-dimensional adult model demonstrating a wrist flexor stretch',
    cues: ['Extend one arm forward with the elbow straight and palm up.', 'Point the fingers toward the floor.', 'Use the other hand to gently draw the fingers toward you; hold, then switch sides.']
  }),
  'trunk-side-bend': Object.freeze({
    id: 'trunk-side-bend', timed: true, title: 'Trunk Side Bend',
    direction: 'Reach overhead and bend sideways', reverseDirection: 'Reach overhead and bend sideways',
    description: 'Reach one arm overhead and bend sideways without twisting forward.',
    ariaLabel: 'Three-dimensional adult model demonstrating a standing trunk side bend',
    cues: ['Stand with your feet shoulder-width apart.', 'Raise one arm overhead and slowly bend sideways, sliding the other hand down your leg.', 'Keep your chest facing forward. Hold for 10 seconds, then switch sides.']
  }),
  'standing-quad-stretch': Object.freeze({
    id: 'standing-quad-stretch', timed: true, title: 'Standing Quad Stretch',
    direction: 'Heel toward buttock', reverseDirection: 'Heel toward buttock',
    description: 'Bend one knee behind you and draw the heel toward the buttock.',
    ariaLabel: 'Three-dimensional adult model demonstrating a standing quadriceps stretch',
    cues: ['Stand near a sturdy support for balance.', 'Bend one knee behind you and hold the same-side ankle or shoe.', 'Keep your knees close and torso upright. Hold for 20 seconds, then switch sides.']
  }),
  'standing-inner-thigh-stretch': Object.freeze({
    id: 'standing-inner-thigh-stretch', timed: true, title: 'Standing Inner Thigh Stretch',
    direction: 'Shift weight to one side', reverseDirection: 'Shift weight to one side',
    description: 'Take a wide stance and bend one knee while the other stays straight.',
    ariaLabel: 'Three-dimensional adult model demonstrating a standing inner thigh stretch',
    cues: ['Stand with your feet wide apart and toes facing forward.', 'Shift your weight to one side and bend that knee, keeping the other leg straight.', 'Keep the opposite foot on the floor. Hold for 20 seconds, then switch sides.']
  }),
  'hamstring-stretch': Object.freeze({
    id: 'hamstring-stretch', timed: true, title: 'Hamstring Stretch',
    direction: 'Hinge forward over the straight leg', reverseDirection: 'Hinge forward over the straight leg',
    description: 'Place one heel in front with the knee straight and hinge forward at the hips.',
    ariaLabel: 'Three-dimensional adult model demonstrating a standing hamstring stretch',
    cues: ['Place one heel in front of you with that knee straight.', 'Bend the supporting knee slightly and hinge forward at the hips with a straight back.', 'Rest your hands on your thighs or hips. Hold for 20 seconds, then switch sides.']
  })
});
