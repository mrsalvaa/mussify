// SPDX-License-Identifier: GPL-3.0-or-later
// Content (en): piano branch.
import { type LessonTexts, P, TIP, EX, Q } from "../types";

function keyLesson(letter: string, where: string, prev: string): LessonTexts[string] {
  return {
    title: `${letter} on the keyboard`,
    body: [
      P(`**${letter}** ${where}`),
      EX({ keyboard: `${letter}3 ${letter}4 ${letter}5`, keyboardRange: [48, 83] }, `Every ${letter} on the keyboard: it repeats every octave.`),
      TIP(prev),
    ],
  };
}

export const PIANO: LessonTexts = {
  "pn.keyboard": {
    title: "Meet the keyboard",
    body: [
      P("The piano has **white** and **black** keys. The black keys come in groups of **two** and **three**, and that pattern repeats across the whole keyboard: it's your map."),
      EX({ keyboard: "C#4 D#4 F#4 G#4 A#4", keyboardRange: [60, 71] }, "A group of two black keys and a group of three."),
      P("Toward the **right** the sound gets **higher**; toward the **left**, **lower**."),
      TIP("Sit facing the middle of the keyboard, back straight, elbows slightly higher than the keys."),
    ],
    quiz: [
      Q("How are the black keys grouped?", "In twos and threes", "In fours", "All in a row", "One by one"),
      Q("Toward the right of the keyboard, the sound gets...", "higher", "lower", "louder", "softer"),
      Q("How often does the black-key pattern repeat?", "Every seven white keys", "Every three keys", "Never", "Every two keys"),
    ],
  },
  "pn.key.C": keyLesson("C", "is the white key **just left of the group of two black keys**.", "Find every group of two black keys: to the left of each one there's a C."),
  "pn.key.D": keyLesson("D", "is the white key **in the middle of the group of two black keys**.", "D sits \"trapped\" between the two black keys."),
  "pn.key.E": keyLesson("E", "is the white key **just right of the group of two black keys**.", "C, D, E: the three white keys around the group of two."),
  "pn.key.F": keyLesson("F", "is the white key **just left of the group of three black keys**.", "F is to the group of three what C is to the group of two."),
  "pn.key.G": keyLesson("G", "is the white key **between the 1st and 2nd black keys of the group of three**.", "F, G, A, B surround the group of three."),
  "pn.key.A": keyLesson("A", "is the white key **between the 2nd and 3rd black keys of the group of three**.", "The A in the middle of the keyboard (A4) is the tuning note: 440 Hz."),
  "pn.key.B": keyLesson("B", "is the white key **just right of the group of three black keys**.", "After B comes C again: a new octave begins."),
  "pn.middleC": {
    title: "Middle C",
    body: [
      P("**[[pn.middleC|Middle C]]** (C4) is the C roughly in the middle of the keyboard, in front of your belly button. In treble clef it's written on a ledger line below the staff."),
      EX({ keyboard: "C4" }, "C4: middle C."),
      P("From now on, when you see a note on the staff you'll play it **in its exact octave**."),
    ],
  },
  "pn.fingers": {
    title: "Finger numbers",
    body: [
      P("On the piano, fingers are numbered **1 to 5** on each hand: **1 = thumb**, 2 = index, 3 = middle, 4 = ring, 5 = pinky."),
      P("Piano scores sometimes show small numbers above the notes: that's the **fingering**, which finger to use."),
      TIP("Curve your fingers as if holding a small ball; play with the fingertip, not the nail."),
    ],
    quiz: [
      Q("Which number is the thumb?", "1", "5", "0", "2"),
      Q("Which number is the pinky?", "5", "1", "4", "6"),
      Q("What do the small numbers above notes in a piano score mean?", "Which finger to use", "How long the note lasts", "How loud to play", "The octave"),
    ],
  },
  "pn.pos.C": {
    title: "C position (right hand)",
    body: [
      P("Place your right hand with the **thumb (1) on C4** and each finger on the next white key: 2 on D, 3 on E, 4 on F, 5 on G. This is **C position**."),
      EX({ notes: "C4 D4 E4 F4 G4", clef: "treble", labels: true }, "The five notes of C position."),
      P("Without moving your hand you can play lots of melodies. Read the note, find the finger, play."),
      EX({ notes: "E4:q D4:q C4:q D4:q E4:q E4:q E4:h", clef: "treble" }, "A melody in C position."),
    ],
  },
  "pn.lh": {
    title: "The left hand in C position",
    body: [
      P("The left hand goes an octave lower: **pinky (5) on C3**, 4 on D, 3 on E, 2 on F and **thumb (1) on G3**. It's read in **bass clef**."),
      EX({ notes: "C3 D3 E3 F3 G3", clef: "bass", labels: true }, "Left-hand C position."),
      TIP("Careful: on the left hand the numbers run the opposite way: the thumb is on the right."),
    ],
  },
  "pn.extend": {
    title: "Beyond C position",
    body: [
      P("To reach A, B and C5 with the right hand, your hand **moves**: you can stretch the pinky or shift the whole hand."),
      EX({ notes: "C4 E4 G4 A4 B4 C5", clef: "treble", labels: true }, "From C4 to C5."),
      TIP("Before playing, look at the whole melody and find its highest and lowest notes: that tells you where to place your hand."),
    ],
    quiz: [
      Q("If a melody goes from C4 to C5, what's best?", "Check the range first and place your hand", "Play it all with one finger", "Play only the first notes", "Skip the high notes"),
      Q("In C position, which finger plays G4?", "5", "1", "3", "4"),
    ],
  },
  "pn.black": {
    title: "The black keys",
    body: [
      P("Now that you know sharps and flats: each black key has **two names**. The one between C and D is **C♯** or **D♭**."),
      EX({ keyboard: "C#4 D#4 F#4 G#4 A#4" }, "The five black keys of an octave."),
      TIP("To play black keys, move your hand slightly toward the back of the keyboard."),
    ],
  },
  "pn.ch.maj": {
    title: "Major chords on the piano",
    body: [
      P("To play a major chord with the right hand, use fingers **1, 3 and 5**: root, third and fifth. C = C-E-G."),
      EX({ keyboard: "C4 E4 G4", harmonic: true }, "C: C, E, G."),
      EX({ keyboard: "F4 A4 C5", harmonic: true }, "F: F, A, C."),
      TIP("Quick shape: from the root count **4 half steps** to the third and **3 more** to the fifth."),
    ],
  },
  "pn.ch.min": {
    title: "Minor chords on the piano",
    body: [
      P("A minor chord is like the major one but with the **third a half step lower**. Am = A-C-E."),
      EX({ keyboard: "A4 C5 E5", harmonic: true }, "Am."),
      EX({ keyboard: "C4 Eb4 G4", harmonic: true }, "Cm: E drops to E♭."),
      TIP("From the root: **3 half steps** to the third and **4** to the fifth (the reverse of major)."),
    ],
  },
  "pn.inv": {
    title: "Inversions on the piano",
    body: [
      P("Playing chords in inversion saves you from jumping around. C – F – G in root position forces you to move your whole hand; with inversions you barely move:"),
      EX({ keyboard: "C4 E4 G4", harmonic: true }, "C in root position (C-E-G)."),
      EX({ keyboard: "C4 F4 A4", harmonic: true }, "F in 2nd inversion (C-F-A): the thumb stays on C."),
      EX({ keyboard: "B3 D4 G4", harmonic: true }, "G in 1st inversion (B-D-G)."),
    ],
  },
  "pn.scale": {
    title: "Scales with the thumb crossing",
    body: [
      P("To play an 8-note scale with 5 fingers, the **thumb passes under**: in C major with the right hand, 1-2-3 (C D E), the thumb crosses to F, then 1-2-3-4-5 (F G A B C)."),
      EX({ notes: "C4 D4 E4 F4 G4 A4 B4 C5", clef: "treble", labels: true }, "Fingering: 1 2 3 1 2 3 4 5."),
      TIP("Prepare the thumb early: while you play E with finger 3, the thumb is already traveling to F."),
    ],
  },
  "pn.hands": {
    title: "Hands together",
    body: [
      P("The simplest accompaniment pattern: the **left hand plays the root** (one low note) and the **right hand plays the chord**."),
      EX({ chords: ["C", "F", "G", "C"] }, "Left: C, F, G, C. Right: the chords."),
      TIP("Practice each hand alone first, then together and slowly. Speed comes by itself."),
    ],
    quiz: [
      Q("In basic accompaniment, what does the left hand play?", "The root of the chord", "The melody", "Nothing", "The full chord"),
      Q("How should you practice hands together?", "Each hand alone first, then together and slowly", "Straight away, fast", "Right hand only", "Without looking at the score"),
    ],
  },
  "pn.accomp": {
    title: "Accompaniment patterns",
    body: [
      P("With the same chords you can play in many ways: **block** (all notes at once), **arpeggiated** (one at a time) or **rhythmic** (repeating the chord in quarters or eighths)."),
      EX({ chords: ["C", "G", "Am", "F"] }, "I – V – vi – IV as block chords: the basis of *Let It Be*."),
      P("For ballads like *Let It Be*, block chords in quarter notes work great; for something softer, arpeggios."),
    ],
    quiz: [
      Q("Playing an arpeggiated chord means...", "playing its notes one at a time", "playing them all together", "playing only the root", "playing it louder"),
      Q("Which pattern sounds softest for a slow ballad?", "Arpeggios", "Fast eighth-note chords", "Bass only", "Silence"),
    ],
  },
  "pn.ch.dimaug": {
    title: "Diminished and augmented on the piano",
    body: [
      P("**Diminished**: two minor thirds (3 + 3 half steps). **Augmented**: two major thirds (4 + 4)."),
      EX({ keyboard: "B4 D5 F5", harmonic: true }, "B°: B-D-F."),
      EX({ keyboard: "C4 E4 G#4", harmonic: true }, "C+: C-E-G♯."),
    ],
  },
  "pn.ch.7": {
    title: "Seventh chords on the piano",
    body: [
      P("Four notes: you need fingers **1, 2, 3 and 5** or, more commonly, the root in the left hand and the other three in the right."),
      EX({ keyboard: "G4 B4 D5 F5", harmonic: true }, "G7."),
      EX({ keyboard: "C4 E4 G4 B4", harmonic: true }, "Cmaj7."),
      EX({ keyboard: "D4 F4 A4 C5", harmonic: true }, "Dm7."),
    ],
  },
  "pn.ch.sus": {
    title: "Suspended chords on the piano",
    body: [
      P("You move **a single finger**: the third goes up to the fourth (sus4) or down to the second (sus2)."),
      EX({ keyboard: "D4 G4 A4", harmonic: true }, "Dsus4."),
      EX({ keyboard: "D4 E4 A4", harmonic: true }, "Dsus2."),
      TIP("Try D → Dsus4 → D: that move is in hundreds of rock songs."),
    ],
  },
  "pn.blues": {
    title: "Blues on the piano",
    body: [
      P("Left hand: the **boogie** (root and fifth, then root and sixth, alternating). Right hand: the **blues scale** or the seventh chords."),
      EX({ chords: ["C7", "F7", "C7", "G7"] }, "The four moments of a blues in C."),
      TIP("Boogie in C: C-G, C-A, C-G, C-A..."),
    ],
    quiz: [
      Q("The left-hand boogie alternates...", "fifth and sixth over the root", "major and minor thirds", "octaves", "full chords"),
      Q("In a blues in C, IV7 is...", "F7", "G7", "C7", "D7"),
    ],
  },
  "pn.voicing": {
    title: "Voicings: chords that sound good",
    body: [
      P("A **voicing** is how you spread out a chord's notes. The pro trick: **left hand plays root and seventh**, **right hand plays third and ninth/fifth**."),
      EX({ chords: ["Dm7", "G7", "Cmaj7"] }, "ii – V – I with close voicings."),
      P("When moving from one chord to the next, move each voice **as little as possible**: this is called **voice leading**."),
    ],
    quiz: [
      Q("What is voice leading?", "Moving each note as little as possible between chords", "Singing while playing", "Playing the melody louder", "Playing in octaves"),
      Q("In a typical left-hand voicing you play...", "root and seventh", "only the fifth", "every note", "third and fifth"),
    ],
  },
};
