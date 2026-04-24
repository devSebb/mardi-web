import type { MardiMood } from "./mardi-art";

/**
 * Mardi's voice: lowercase, dry, a little dark. He's been in the corner of
 * your screen too long. He loves you. He would not tell you that.
 *
 * Kept here as data so the character is easy to reuse / translate / swap.
 */
export const MARDI_LINES: Record<MardiMood, readonly string[]> = {
  idle: [
    "still here. unfortunately for both of us.",
    "nothing to remember? living dangerously.",
    "i'll be in the corner. where i always am.",
    "waiting. it's sort of my whole thing.",
    "the vault is quiet. suspiciously quiet.",
  ],
  summoned: [
    "oh. something worth keeping? bold of you.",
    "go on. hit me with your best url.",
    "yes? you rang? i was almost asleep.",
    "fine. dump it here. i've seen worse.",
    "let's add it to the pile. no judgement. mostly.",
  ],
  thinking: [
    "working on it. try not to close me.",
    "parsing. please hold your applause.",
    "tagging this. against my better judgement.",
    "thinking. this is the part where you blink.",
    "cross-referencing. existential dread. the usual.",
  ],
  success: [
    "saved. you're welcome. i guess.",
    "filed. in a little box. like all your hopes.",
    "done. try not to lose it this time.",
    "got it. it's yours to forget now.",
    "added. the vault grows. we grow with it.",
  ],
  error: [
    "that didn't work. shocking, honestly.",
    "no. try again — maybe with a different energy.",
    "error. i blame the universe. and you.",
    "the vault said no. i respect that.",
    "something broke. probably nothing. probably.",
  ],
  sleeping: [
    "if you need me, i won't be here.",
    "resting. dreaming of a tidier vault.",
    "low power mode. emotionally, mostly.",
    "shhh. let the fish sleep.",
    "zzz. the memories keep. don't worry.",
  ],
};
