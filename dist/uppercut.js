// Each profile references only the fighter's existing full-body artwork.
 // [style, authored frame indices, duration, range, actor rise, opponent lift]
const RAW = {
  "owl": [
    "rising hook",
    [
      20,
      12,
      13,
      14,
      9,
      15,
      0
    ],
    0.52,
    225,
    285,
    575
  ],
  "coupe": [
    "rising cross",
    [
      20,
      12,
      14,
      15,
      9,
      12,
      0
    ],
    0.55,
    228,
    255,
    580
  ],
  "karate": [
    "dragon fist",
    [
      20,
      12,
      13,
      14,
      10,
      15,
      0
    ],
    0.48,
    218,
    340,
    620
  ],
  "snitchy": [
    "quick rising jab",
    [
      20,
      12,
      13,
      14,
      9,
      15,
      0
    ],
    0.49,
    218,
    320,
    590
  ],
  "getit": [
    "upward palm",
    [
      20,
      12,
      13,
      14,
      9,
      15,
      0
    ],
    0.51,
    220,
    275,
    575
  ],
  "loudbull": [
    "power hook",
    [
      20,
      12,
      14,
      15,
      9,
      12,
      0
    ],
    0.61,
    232,
    225,
    640
  ],
  "fatboi": [
    "heavy rising blow",
    [
      20,
      12,
      13,
      14,
      9,
      15,
      0
    ],
    0.65,
    238,
    185,
    655
  ],
  "icespice": [
    "rising palm",
    [
      20,
      12,
      14,
      13,
      9,
      15,
      0
    ],
    0.53,
    218,
    295,
    575
  ],
  "hehaw": [
    "rising palm strike",
    [
      20,
      12,
      13,
      14,
      10,
      15,
      0
    ],
    0.54,
    224,
    305,
    590
  ],
  "dr-no-bunnies": [
    "rising slap",
    [
      20,
      12,
      13,
      14,
      9,
      15,
      0
    ],
    0.56,
    232,
    240,
    600
  ],
  "cantrap": [
    "rising hook",
    [
      6,
      4,
      5,
      5,
      3,
      4,
      0
    ],
    0.54,
    223,
    265,
    590
  ],
  "smackprince": [
    "rising slap",
    [
      7,
      4,
      5,
      6,
      2,
      4,
      0
    ],
    0.53,
    228,
    280,
    595
  ],
  "babybigfists": [
    "big fist launcher",
    [
      7,
      4,
      5,
      6,
      3,
      4,
      0
    ],
    0.59,
    230,
    275,
    650
  ],
  "mooja": [
    "rising slap",
    [
      7,
      4,
      5,
      6,
      2,
      4,
      0
    ],
    0.51,
    219,
    300,
    575
  ],
  "cranes": [
    "sweeping uppercut",
    [
      7,
      4,
      5,
      6,
      3,
      4,
      0
    ],
    0.56,
    224,
    260,
    595
  ],
  "demon": [
    "rising cross",
    [
      7,
      4,
      5,
      6,
      2,
      4,
      0
    ],
    0.54,
    225,
    290,
    595
  ],
  "ocrrrrr": [
    "rising nail swipe",
    [
      7,
      4,
      5,
      6,
      3,
      4,
      0
    ],
    0.5,
    230,
    300,
    580
  ],
  "president": [
    "measured uppercut",
    [
      7,
      4,
      5,
      6,
      2,
      4,
      0
    ],
    0.57,
    224,
    240,
    595
  ],
  "owhinny": [
    "upward palm",
    [
      7,
      4,
      5,
      6,
      2,
      4,
      0
    ],
    0.6,
    230,
    220,
    615
  ],
  "roboking": [
    "mechanical uppercut",
    [
      7,
      4,
      5,
      6,
      3,
      4,
      0
    ],
    0.56,
    235,
    265,
    630
  ],
  "quickfast": [
    "rising headbutt",
    [
      7,
      4,
      5,
      6,
      3,
      2,
      0
    ],
    0.45,
    218,
    355,
    600
  ],
  "sassyt": [
    "rising slap",
    [
      7,
      4,
      5,
      6,
      3,
      4,
      0
    ],
    0.49,
    220,
    315,
    575
  ],
  "jminors": [
    "power uppercut",
    [
      7,
      4,
      5,
      6,
      3,
      4,
      0
    ],
    0.55,
    228,
    300,
    620
  ],
  "bigmumble": [
    "heavy rising headbutt",
    [
      7,
      4,
      5,
      6,
      2,
      4,
      0
    ],
    0.66,
    242,
    185,
    660
  ],
  "djbeigey": [
    "rising hook",
    [
      7,
      4,
      5,
      6,
      2,
      4,
      0
    ],
    0.54,
    223,
    265,
    595
  ],
  "nobuttons": [
    "rising cross",
    [
      7,
      4,
      5,
      6,
      3,
      4,
      0
    ],
    0.57,
    225,
    245,
    605
  ],
  "eynakeast": [
    "rising fist",
    [
      7,
      4,
      5,
      6,
      2,
      4,
      0
    ],
    0.56,
    226,
    270,
    605
  ],
  "goat": [
    "rising hook",
    [
      7,
      4,
      5,
      6,
      3,
      4,
      0
    ],
    0.58,
    229,
    250,
    615
  ],
  "taytay": [
    "rising palm",
    [
      7,
      4,
      5,
      6,
      3,
      4,
      0
    ],
    0.5,
    218,
    310,
    575
  ],
  "czr": [
    "rising slap",
    [
      7,
      4,
      5,
      6,
      2,
      4,
      0
    ],
    0.5,
    224,
    300,
    580
  ],
  "shannondull": [
    "power hook",
    [
      7,
      4,
      5,
      6,
      3,
      4,
      0
    ],
    0.61,
    236,
    235,
    645
  ],
  "smokelord": [
    "boxing uppercut",
    [
      7,
      4,
      5,
      6,
      3,
      4,
      0
    ],
    0.48,
    224,
    325,
    610
  ],
  "redrolls": [
    "rising bottle swing",
    [
      7,
      4,
      5,
      6,
      2,
      4,
      0
    ],
    0.59,
    232,
    245,
    620
  ],
  "charles": [
    "rising swipe",
    [
      5,
      8,
      9,
      10,
      4,
      8,
      0
    ],
    0.54,
    227,
    265,
    595
  ],
  "fuedfam": [
    "rising hook",
    [
      5,
      8,
      9,
      10,
      4,
      8,
      0
    ],
    0.58,
    230,
    245,
    615
  ],
  "ooousaber": [
    "rising swipe",
    [
      5,
      8,
      9,
      10,
      4,
      8,
      0
    ],
    0.49,
    235,
    320,
    610
  ],
  "treeyawl": [
    "rising slap",
    [
      5,
      8,
      9,
      10,
      4,
      8,
      0
    ],
    0.55,
    227,
    260,
    600
  ],
  "trinigold": [
    "upward chain whip",
    [
      5,
      8,
      9,
      10,
      4,
      8,
      0
    ],
    0.58,
    255,
    235,
    620
  ],
  "boat": [
    "bouncing uppercut",
    [
      5,
      8,
      9,
      10,
      4,
      8,
      0
    ],
    0.49,
    220,
    350,
    595
  ],
  "yungsnow": [
    "rising snow fist",
    [
      5,
      8,
      9,
      10,
      4,
      8,
      0
    ],
    0.54,
    232,
    285,
    620
  ],
  "queenbee": [
    "rising sting",
    [
      0,
      0,
      4,
      4,
      6,
      0,
      0
    ],
    0.48,
    221,
    315,
    580
  ],
  "breezy": [
    "krump rising strike",
    [
      12,
      12,
      13,
      13,
      9,
      11,
      15
    ],
    0.48,
    224,
    355,
    605
  ],
  "joosie": [
    "rising swing",
    [
      8,
      12,
      13,
      13,
      9,
      11,
      0
    ],
    0.51,
    222,
    295,
    590
  ],
  "justginger": [
    "wild rising swing",
    [
      6,
      10,
      11,
      12,
      7,
      9,
      17
    ],
    0.53,
    232,
    310,
    625
  ],
  "miketyson": [
    "gloved rising strike",
    [
      23,
      8,
      9,
      10,
      12,
      11,
      0
    ],
    0.47,
    225,
    340,
    650
  ],
  "damedash": [
    "rising hook",
    [
      4,
      4,
      5,
      5,
      9,
      8,
      0
    ],
    0.56,
    224,
    260,
    600
  ],
  "diddy": [
    "rising bottle strike",
    [
      51,
      14,
      15,
      16,
      22,
      27,
      0
    ],
    0.61,
    228,
    235,
    610
  ],
  "guccimane": [
    "rising slap",
    [
      8,
      4,
      5,
      5,
      9,
      6,
      1
    ],
    0.56,
    232,
    260,
    620
  ],
  "nickiminaj": [
    "rising purse slap",
    [
      34,
      15,
      17,
      17,
      35,
      38,
      19
    ],
    0.54,
    226,
    300,
    600
  ]
};
export const UPPERCUT_PROFILES = Object.freeze(Object.fromEntries(Object.entries(RAW).map(([key,[style,frames,duration,range,rise,lift]])=>[key,Object.freeze({style,frames:Object.freeze(frames),duration,range,rise,lift})])));
export function uppercutPose(f) {
 const profile=UPPERCUT_PROFILES[f.type];
 if(!profile)return null;
 const p=Math.max(0,Math.min(1,f.attackProgress||0));
 const i=p<.12?0:p<.27?1:p<.40?2:p<.55?3:p<.74?4:p<.89?5:6;
 return {key:f.type,index:profile.frames[i]};
}
