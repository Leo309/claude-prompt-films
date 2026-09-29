// Pixel-art sprites for the LeBron film. Drawn from scratch from signature traits
// (headband, beard, #23) and the pre-game chalk-toss pose — not traced from any photo.
// No team colours, no brand or league marks: the headband and jersey are plain.

export const PAL = {
  h: "#17110E", // hair / beard
  s: "#7B4A2D", // skin
  S: "#5B331D", // skin shadow
  l: "#98603B", // skin light
  w: "#EFE9DE", // headband / shoes
  W: "#BDB6AA",
  k: "#0B0B0D", // pupils
  e: "#D9D2C6", // eye whites
  m: "#4A2416", // lips
  j: "#26252A", // jersey
  o: "#FF5A1F", // trim, in the film's signal orange
  n: "#EFE9DE", // number
};

// prettier-ignore
export const PORTRAIT = [
  "................................",
  "...........hhhhhhhhhh...........",
  ".........hhhhhhhhhhhhhh.........",
  "........hhhhhhhhhhhhhhhh........",
  "........WwwwwwwwwwwwwwwW........",
  "........WwwwwwwwwwwwwwwW........",
  "........slllllllllllllss........",
  "........SshhhllllllhhhsS........",
  ".......sSsekssllllsskesSs.......",
  ".......sSsssssslSssssssSs.......",
  "........SsssssSssSsssssS........",
  "........hhsshhhhhhhhsshh........",
  "........hhhhhmmmmmmhhhhh........",
  "........hhhhhhhhhhhhhhhh........",
  ".........hhhhhhhhhhhhhh.........",
  "..........hhhhhhhhhhhh..........",
  "...........hhhhhhhhhh...........",
  "............SSssssSS............",
  ".....sssssjjjSSSSSSjjjsssss.....",
  "....ssssssjjjoSSSSojjjssssss....",
  "....sssssjjjjjoooojjjjjsssss....",
  "...sssssjjjjjjjjjjjjjjjjsssss...",
  "...sssssjjjjjjjjjjjjjjjjsssss...",
  "...sssssjjjjnnnjjnnnjjjjsssss...",
  "...sssssjjjjjjnjjjjnjjjjsssss...",
  "...sssssjjjjnnnjjnnnjjjjsssss...",
  "...sssssjjjjnjjjjjjnjjjjsssss...",
  "...sssssjjjjnnnjjnnnjjjjsssss...",
  "...sssssjjjjjjjjjjjjjjjjsssss...",
  "...sssssjjjjjjjjjjjjjjjjsssss...",
  "...SSSSSjjjjjjjjjjjjjjjjSSSSS...",
  "...SSSSSjjjjjjjjjjjjjjjjSSSSS...",
];

// Same portrait with the eyes closed (row 8): used for a single blink.
export const PORTRAIT_BLINK = PORTRAIT.map((row, j) => (j === 8 ? row.replace(/[ek]/g, "S") : row));

// Arms up, head back: the chalk toss. The hands are the top two rows.
// prettier-ignore
export const CHALK = [
  "ss....................ss",
  "sss..................sss",
  ".sss................sss.",
  "..sss..............sss..",
  "...sss....hhhh....sss...",
  "....sss..wwwwww..sss....",
  ".....sss.ssssss.sss.....",
  "......ssshhhhhhsss......",
  ".......sjjSSSSjjs.......",
  "......sjjjjoojjjjs......",
  "......sjjjjjjjjjjs......",
  ".......jnnnjnnnjj.......",
  ".......jjjnjjjnjj.......",
  ".......jnnnjnnnjj.......",
  ".......jnjjjjjnjj.......",
  ".......jnnnjnnnjj.......",
  ".......jjjjjjjjjj.......",
  ".......oooooooooo.......",
  ".......jjjjjjjjjj.......",
  ".......jjjjjjjjjj.......",
  ".......jjjj..jjjj.......",
  ".......jjjj..jjjj.......",
  "........sss..sss........",
  "........sss..sss........",
  "........sss..sss........",
  "........sss..sss........",
  "........sss..sss........",
  ".......wwww..wwww.......",
];

for (const [name, rows] of [["PORTRAIT", PORTRAIT], ["CHALK", CHALK]]) {
  rows.forEach((r, i) => console.assert(r.length === rows[0].length, `${name} row ${i} is ${r.length} wide`));
}
