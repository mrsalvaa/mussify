// SPDX-License-Identifier: GPL-3.0-or-later
// Content (en): bass clef, melodic dictation, accidentals and intervals.
import { type LessonTexts, P, TIP, EX, Q } from "../types";

function bassNote(n: string, where: string, tip: string, known: string): LessonTexts[string] {
  return {
    title: `${n} in bass clef`,
    body: [
      P(`This is **${n}**. ${where}`),
      EX({ notes: `${known} ${n}`.trim(), clef: "bass", labels: true }, `What you already read in bass clef, plus the new one: ${n[0]}.`),
      TIP(tip),
    ],
  };
}

function interval(title: string, semis: number, desc: string, ref: string, ex: string): LessonTexts[string] {
  return {
    title,
    body: [
      P(`**${title}**: ${semis} [[t.semitone|half steps]]. ${desc}`),
      EX({ play: ex }, "Listen to it going up."),
      EX({ play: ex, harmonic: true }, "And both notes together."),
      TIP(ref),
    ],
    quiz: [Q(`How many half steps are in a ${title.toLowerCase()}?`, String(semis), String(semis + 1), String(semis - 1), String(semis + 2))],
  };
}

export const TRUNK2: LessonTexts = {
  "clef.bass": {
    title: "The bass clef",
    body: [
      P("For low notes (the piano's left hand, the bass, the cello) we use the **[[clef.bass|bass clef]]** (F clef). Its two dots surround the **4th line**, which becomes **F** (F3)."),
      EX({ emptyStaff: true, clef: "bass" }, "Bass clef: the two dots surround the 4th line."),
      P("That F3 sits just below middle C. Everything reads the same as in treble clef: only the starting point changes."),
      TIP("Treble clef for high notes, bass clef for low notes. The piano uses both at once."),
    ],
    quiz: [
      Q("Which line does the bass clef mark?", "The 4th", "The 2nd", "The 3rd", "The 1st"),
      Q("The bass clef is used for...", "low notes", "high notes", "rhythm", "drums"),
      Q("In bass clef, the 4th line is...", "F", "G", "C", "D"),
    ],
  },
  "read.bass.F3": bassNote("F3", "It sits on the **4th line**, the one the clef marks.", "The clef's two dots point right at this note.", ""),
  "read.bass.G3": bassNote("G3", "It sits in the **4th space**, above F.", "Moving up one place (line to space) is moving up one note.", "F3"),
  "read.bass.E3": bassNote("E3", "It sits in the **3rd space**, below F.", "E, F, G: three places in a row.", "F3 G3"),
  "read.bass.A3": bassNote("A3", "It sits on the **5th line**, the top one.", "The top lines in bass clef: F and A.", "E3 F3 G3"),
  "read.bass.D3": bassNote("D3", "It sits on the **3rd line**, the middle one.", "D is right in the center of the bass-clef staff.", "E3 F3 G3 A3"),
  "read.bass.C4": bassNote("C4", "It's **middle C**! In bass clef it's written on a **ledger line** above the staff.", "It's the same C4 you read below the treble staff: the meeting point of both clefs.", "D3 E3 F3 G3 A3"),
  "read.bass.B3": bassNote("B3", "It sits **above** the 5th line, resting on the staff.", "B3 lies between A3 (5th line) and C4 (ledger line).", "D3 E3 F3 G3 A3 C4"),
  "read.bass.C3": bassNote("C3", "It sits in the **2nd space**.", "C3 is one octave below middle C.", "D3 E3 F3 G3 A3 B3 C4"),
  "read.bass.B2": bassNote("B2", "It sits on the **2nd line**.", "The lines from bottom to top: G, B, D, F, A (one left to learn).", "C3 D3 E3 F3 G3"),
  "read.bass.A2": bassNote("A2", "It sits in the **1st space**.", "The bass-clef spaces from bottom to top: **A, C, E, G** (\"All Cows Eat Grass\").", "B2 C3 D3 E3"),
  "read.bass.G2": bassNote("G2", "It sits on the **1st line**, the bottom one.", "Bass-clef lines: **G, B, D, F, A** (\"Good Boys Do Fine Always\").", "A2 B2 C3 D3"),
  "read.bass.F2": bassNote("F2", "It sits **below** the 1st line.", "F2 and F3 are an octave apart: one at the very bottom, the other on the clef's line.", "G2 A2 B2 C3 F3"),
  "read.bass.E2": bassNote("E2", "It sits on a **ledger line** below the staff.", "E2 is the sound of the guitar's lowest string.", "F2 G2 A2 B2"),
  "ear.melodic": {
    title: "Melodic dictation",
    body: [
      P("You'll hear a short melody that **always starts on C**. Your job: write which notes you heard, in order."),
      EX({ notes: "C4 D4 E4 D4 C4", clef: "treble", labels: true }, "Example: C, D, E, D, C."),
      TIP("Sing along in your head: does the next note go up or down? A step or a leap?"),
    ],
  },

  // ---------------- Accidentals ----------------
  "t.keyboardMap": {
    title: "The keyboard as a map",
    body: [
      P("The piano keyboard is the best map for understanding notes. It has **white** and **black** keys; the black ones come in groups of **two** and **three**."),
      EX({ keyboard: "C4 D4 E4 F4 G4 A4 B4" }, "The white keys are the seven notes: C D E F G A B."),
      P("**C** is the white key just to the left of a group of **two** black keys. From there the white keys go D, E, F, G, A, B and back to C."),
      TIP("You don't need to play piano to use this map: you'll use it to understand distances between notes."),
    ],
    quiz: [
      Q("Where is C on the keyboard?", "Left of the group of two black keys", "Left of the group of three black keys", "On any black key", "Always in the middle"),
      Q("How are the black keys grouped?", "In twos and threes", "In fours", "All together", "One at a time"),
      Q("Which notes are the white keys?", "C D E F G A B", "Only C", "The high notes", "None"),
    ],
  },
  "t.semitone": {
    title: "Whole steps and half steps",
    body: [
      P("The smallest distance between two neighboring keys (skipping none, white or black) is called a **[[t.semitone|half step]]** (or semitone). Two half steps make a **whole step** (a tone)."),
      EX({ keyboard: "C4 C#4" }, "C and the black key next to it: a half step."),
      EX({ keyboard: "C4 D4" }, "C and D: a whole step (there's a black key in between)."),
      P("Careful: there's no black key between **E and F** or between **B and C**. Those notes are a **half step** apart; every other pair of neighboring white keys is a whole step apart."),
    ],
    quiz: [
      Q("How many half steps make a whole step?", "2", "1", "3", "12"),
      Q("What's the distance between E and F?", "A half step", "A whole step", "Two whole steps", "None"),
      Q("What's the distance between F and G?", "A whole step", "A half step", "Three half steps", "An octave"),
      Q("How many half steps are in an octave?", "12", "7", "8", "10"),
    ],
  },
  "acc.sharp": {
    title: "The sharp ♯",
    body: [
      P("A **[[acc.sharp|sharp]]** (♯) **raises** a note by a half step. F♯ is the black key just to the right of F."),
      EX({ notes: "F4 F#4 C5 C#5", clef: "treble", labels: true }, "F and F♯, C and C♯."),
      P("On the staff the ♯ goes **to the left** of the note, on the same line or space. It lasts **for the whole bar**: if that note comes back before the bar line, it's still sharp."),
      TIP("On the keyboard, a note's sharp is almost always the black key to its right. The exceptions are E♯ and B♯, which land on white keys (F and C)."),
    ],
    quiz: [
      Q("A sharp...", "raises the note a half step", "lowers the note a half step", "raises it a whole step", "leaves it unchanged"),
      Q("Where is the sharp written?", "To the left of the note", "To the right of the note", "Above the staff", "At the end of the bar"),
      Q("A sharp written early in a bar applies...", "until the next bar line", "only to that note", "to the whole piece", "to every note"),
    ],
  },
  "acc.flat": {
    title: "The flat ♭",
    body: [
      P("A **[[acc.flat|flat]]** (♭) **lowers** a note by a half step. B♭ is the black key just to the left of B."),
      EX({ notes: "B4 Bb4 E4 Eb4", clef: "treble", labels: true }, "B and B♭, E and E♭."),
      P("Just like the sharp: it goes to the left of the note and lasts until the bar line."),
      TIP("B♭ and E♭ show up all the time in rock: *Smoke on the Water* has a B♭ in its riff."),
    ],
    quiz: [
      Q("A flat...", "lowers the note a half step", "raises the note a half step", "lowers it a whole step", "makes it louder"),
      Q("Which key is B♭?", "The black key left of B", "The black key right of B", "C", "The white key left of B"),
    ],
  },
  "acc.natural": {
    title: "The natural sign ♮",
    body: [
      P("The **[[acc.natural|natural sign]]** (♮) **cancels** an earlier sharp or flat: the note goes back to natural (a white key)."),
      EX({ notes: "F#4:q F4:q G4:h", clef: "treble", ts: "4/4" }, "F♯, then F natural with a natural sign, and G."),
      TIP("After the bar line, accidentals reset on their own; no natural sign needed."),
    ],
    quiz: [Q("The natural sign...", "cancels the previous accidental", "raises a half step", "lowers a half step", "lengthens the note")],
  },
  "t.enharmonic": {
    title: "Enharmonics: two names, one sound",
    body: [
      P("C♯ and D♭ are **the same key** and sound the same. Two different names for the same sound are called **[[t.enharmonic|enharmonic]]**."),
      EX({ notes: "C#4 Db4", clef: "treble", labels: true }, "C♯ and D♭: same sound, different name."),
      P("Why have both? Because depending on the context one name fits better; you'll see why soon."),
      TIP("Also E♯ = F and B♯ = C, though they're rarely used."),
    ],
    quiz: [
      Q("Which note is enharmonic to F♯?", "G♭", "F♭", "G♯", "E"),
      Q("Two enharmonic notes...", "sound the same and are written differently", "sound different and are written the same", "are an octave apart", "are always white keys"),
    ],
  },
  "acc.double": {
    title: "Double sharps and flats",
    body: [
      P("Sometimes an already altered note needs another alteration. The **double sharp** (𝄪) raises **two** half steps and the **double flat** (𝄫) lowers **two**."),
      EX({ notes: "F##4 G4", clef: "treble", labels: true }, "F𝄪 sounds the same as G."),
      P("They appear in pieces with lots of accidentals. For now, recognizing them is enough."),
    ],
    quiz: [
      Q("A double sharp raises...", "two half steps", "one half step", "an octave", "three half steps"),
      Q("F𝄪 sounds the same as...", "G", "F♯", "E", "A"),
      Q("B𝄫 sounds the same as...", "A", "B♭", "C", "G"),
    ],
  },

  // ---------------- Intervals ----------------
  "t.interval": {
    title: "What is an interval?",
    body: [
      P("An **[[t.interval|interval]]** is the distance between two notes. First you measure it by counting **note names, including both ends**: from C to E you have C-D-E, three names → a **third**."),
      EX({ notes: "C4 E4", clef: "treble" }, "C–E: a third."),
      P("So: C–D is a **second**, C–F a **fourth**, C–G a **fifth**, C–A a **sixth**, C–B a **seventh** and C–C an **octave**."),
      P("Then it gets a quality (**major, minor, perfect**...) depending on how many half steps it contains. We'll see them one at a time."),
    ],
    quiz: [
      Q("What interval is D to F?", "A third", "A second", "A fourth", "A fifth"),
      Q("What interval is C to G?", "A fifth", "A fourth", "A sixth", "A third"),
      Q("What interval is E to E (an octave up)?", "An octave", "A seventh", "A sixth", "A ninth"),
      Q("When naming an interval, the two end notes...", "are counted", "aren't counted", "only the first is counted", "it doesn't matter"),
    ],
  },
  "iv.P8": {
    title: "Perfect octave",
    body: [
      P("You already know it: the **perfect octave** goes from a note to the next one with the same name. It has **12 half steps**."),
      EX({ play: "C4 C5" }, "C4 → C5."),
      TIP("To remember it: the start of *Somewhere Over the Rainbow* (\"Some-where\") leaps an octave."),
    ],
    quiz: [Q("How many half steps are in a perfect octave?", "12", "8", "7", "10")],
  },
  "iv.P5": interval("Perfect fifth", 7, "It sounds firm, open, stable: it's the foundation of countless rock riffs (C–G, E–B, A–E).", "Reference: the *Star Wars* theme opens with a perfect fifth going up.", "C4 G4"),
  "t.harmonic": {
    title: "Melodic and harmonic intervals",
    body: [
      P("An interval can sound in two ways: **melodic** (one note after the other) or **harmonic** (both **at once**)."),
      EX({ notes: "C4 G4 [C4 G4]", clef: "treble" }, "C–G melodic, then harmonic: on the staff, simultaneous notes are written one above the other."),
      TIP("To recognize a harmonic interval, try to hear the top note and the bottom note separately."),
    ],
    quiz: [
      Q("A harmonic interval is...", "two notes at once", "two notes in a row", "a single note", "a rhythm"),
      Q("On the staff, two simultaneous notes are written...", "one above the other", "side by side", "on different staves", "they can't be written"),
    ],
  },
  "iv.M3": interval("Major third", 4, "It sounds bright and happy. C–E, F–A, G–B are major thirds.", "Reference: *When the Saints Go Marching In* starts with a major third (C–E).", "C4 E4"),
  "iv.m3": interval("Minor third", 3, "It sounds darker, melancholic. D–F, E–G, A–C are minor thirds.", "Reference: the riff of *Smoke on the Water* opens with a minor third.", "A3 C4"),
  "iv.P4": interval("Perfect fourth", 5, "It sounds open and a bit \"in suspense\". C–F, D–G, E–A.", "Reference: the *Bridal Chorus* (\"Here Comes the Bride\") starts with a perfect fourth.", "C4 F4"),
  "iv.M2": interval("Major second", 2, "It's a **whole step**: C–D, D–E, F–G.", "Reference: sing \"Do-Re\" and you have it.", "C4 D4"),
  "iv.m2": interval("Minor second", 1, "It's a **half step**: E–F, B–C. It sounds tense, unsettling.", "Reference: the *Jaws* theme alternates two notes a minor second apart. *Für Elise* starts by stepping down one.", "E4 F4"),
  "iv.M6": interval("Major sixth", 9, "It sounds sweet and wide. C–A, F–D, G–E.", "Trick: it's an octave minus a minor third.", "C4 A4"),
  "iv.m6": interval("Minor sixth", 8, "It sounds nostalgic. E–C, A–F, B–G.", "Trick: it's an octave minus a major third.", "E4 C5"),
  "iv.m7": interval("Minor seventh", 10, "It sounds open but restless, it wants to move. G–F, D–C, A–G.", "Reference: the original *Star Trek* theme starts with a minor seventh.", "G3 F4"),
  "iv.M7": interval("Major seventh", 11, "It sounds very tense, almost an octave but \"a half step short\". C–B, F–E.", "Trick: think of the octave and go down a half step.", "C4 B4"),
  "iv.TT": interval("Tritone", 6, "It's **three whole steps** (an augmented fourth or diminished fifth). F–B, C–F♯. It's the most tense interval: in the Middle Ages it was called *diabolus in musica*.", "Reference: the riff of *Black Sabbath* (the song) is built on a tritone. So are *Purple Haze* and *The Simpsons* theme.", "F4 B4"),
  "iv.inversion": {
    title: "Inverting intervals",
    body: [
      P("To **invert** an interval, move the bottom note up an octave. C–E (a third) inverted is E–C (a sixth)."),
      EX({ notes: "C4 E4 E4 C5", clef: "treble" }, "C–E and E–C: major third and minor sixth."),
      P("Two rules: the **numbers add up to 9** (3rd ↔ 6th, 2nd ↔ 7th, 4th ↔ 5th) and the **quality flips**: major ↔ minor, augmented ↔ diminished; **perfect stays perfect**."),
    ],
    quiz: [
      Q("What does inverting a perfect fourth give?", "A perfect fifth", "A diminished fifth", "A perfect fourth", "A major sixth"),
      Q("When you invert an interval, the numbers add up to...", "9", "8", "7", "12"),
      Q("An inverted major second is...", "a minor seventh", "a major seventh", "a minor second", "a major sixth"),
    ],
  },
};
