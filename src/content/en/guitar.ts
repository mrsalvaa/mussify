// SPDX-License-Identifier: GPL-3.0-or-later
// Content (en): guitar branch.
import { type LessonTexts, P, TIP, EX, Q } from "../types";

const STR_NAMES: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", 6: "6th" };

function openString(n: number, name: string, desc: string, tip: string): LessonTexts[string] {
  return {
    title: `${STR_NAMES[n]} string: ${name}`,
    body: [
      P(`The **${STR_NAMES[n]} string** ${desc} Open (nothing pressed) it sounds **${name}**.`),
      EX({ frets: `${n}:0` }, `Open ${STR_NAMES[n]} string: ${name}.`),
      TIP(tip),
    ],
  };
}

function fretNote(s: number, f: number, name: string, tip: string): LessonTexts[string] {
  return {
    title: `${name} on the ${STR_NAMES[s]} string`,
    body: [
      P(`Pressing the **${STR_NAMES[s]} string** at **fret ${f}** sounds **${name}**. Use finger ${f} of your fretting hand (1 = index).`),
      EX({ frets: `${s}:${f}` }, `${STR_NAMES[s]} string, fret ${f}: ${name}.`),
      EX({ tab: `${s}:${f}` }, "This is how it's written in tab: the number is the fret, the line is the string."),
      TIP(tip),
    ],
  };
}

function chord(id: string, name: string, how: string, tip: string, extra?: string): LessonTexts[string] {
  const body = [
    P(`**${name}** (${id}): ${how}`),
    EX({ diagram: id }, `${id} chord diagram. Numbers are fingers; an \"x\" is a string you don't play and an \"o\" an open string.`),
    TIP(tip),
  ];
  if (extra) body.splice(2, 0, P(extra));
  return { title: `The ${name} chord`, body };
}

function movable(id: string, title: string, how: string, diagramFret: number, tip: string): LessonTexts[string] {
  return {
    title,
    body: [
      P(how),
      EX({ diagram: `mv:${id}@${diagramFret}` }, "Movable shape: you can slide it all over the neck."),
      TIP(tip),
    ],
  };
}

export const GUITAR: LessonTexts = {
  "gt.parts": {
    title: "Meet the guitar",
    body: [
      P("The guitar has **6 strings**. They're numbered from the **thinnest** (the 1st, the highest, the one closest to the floor when you hold it) to the **thickest** (the 6th, the lowest)."),
      P("The neck has **[[gt.parts|frets]]**: the metal strips. Pressing a string **just behind** a fret shortens it and makes it sound higher. Each fret raises the sound to the next closest note."),
      P("The part of the neck where your fingers press is the **[[gt.parts|fretboard]]**. Frets are counted from the headstock: 1, 2, 3..."),
      TIP("The fretting hand presses the strings (fingers 1 index, 2 middle, 3 ring, 4 pinky) and the other hand plays them. If you're left-handed, it's the other way around: turn on left-handed mode in Settings."),
    ],
    quiz: [
      Q("Which is the 1st string?", "The thinnest and highest", "The thickest and lowest", "The middle one", "Any of them"),
      Q("How many strings does the guitar have?", "6", "4", "5", "7"),
      Q("When you press a string at a higher fret, the sound...", "goes up", "goes down", "stays the same", "stops"),
      Q("Which finger is number 1 on the fretting hand?", "The index", "The thumb", "The pinky", "The middle"),
    ],
  },
  "gt.tab": {
    title: "How to read tab",
    body: [
      P("**[[gt.tab|Tab]]** (tablature) is the most common way to write guitar music. It has **6 lines**, one per string: the **top line is the 1st string** (the highest) and the bottom one the 6th."),
      P("A **number** is written on each line: the **fret** to press. **0** means open string."),
      TIP("It's like looking down at the neck with the guitar resting on your lap."),
    ],
    quiz: [
      Q("In tab, the top line is...", "the 1st string (the highest)", "the 6th string (the lowest)", "the 3rd string", "the tuning"),
      Q("What does a 0 mean in tab?", "Open string", "Don't play", "Rest", "Fret 10"),
      Q("What does a 3 on the 2nd line mean?", "2nd string, fret 3", "3rd string, fret 2", "Play 3 times", "The third time"),
    ],
  },
  "gt.str.6": openString(6, "E", "is the thickest.", "It's the **low E**, the foundation of countless rock riffs."),
  "gt.str.1": openString(1, "E", "is the thinnest.", "High E: two octaves above the 6th. Both outer strings are E."),
  "gt.str.5": openString(5, "A", "is the one next to the 6th.", "To remember all six strings, from 6th to 1st: **E A D G B E** (\"Eddie Ate Dynamite, Good Bye Eddie\")."),
  "gt.str.4": openString(4, "D", "is in the middle, on the low side.", "E, A, **D**... you're halfway there."),
  "gt.str.3": openString(3, "G", "is in the middle, on the high side.", "E, A, D, **G**..."),
  "gt.str.2": openString(2, "B", "is the second thinnest.", "Now you have all six: **E A D G B E**."),
  "gt.ch.Em": {
    title: "Your first chord: E minor (Em)",
    body: [
      P("A **[[gt.ch.Em|chord]]** is several notes sounding at once. Chords have names like **Em** (\"E minor\"). This way of naming them is called a **[[gt.ch.Em|chord symbol]]**."),
      P("**Em** is the easiest: finger 2 on the 5th string fret 2, finger 3 on the 4th string fret 2. You strum **all 6 strings**."),
      EX({ diagram: "Em" }, "Em. \"o\" = open string."),
      P("\"Minor\" is a type of chord that sounds more **melancholic**. Listen to it."),
      TIP("Press with your fingertips, right next to the fret. If a string sounds muted, arch your fingers a little more."),
    ],
  },
  "gt.ch.E": chord("E", "E major", "like Em but adding **finger 1 on the 3rd string, fret 1**. Strum all 6 strings.", "Go from Em to E and listen: with a single finger the chord turns **major**, brighter.", "\"Major\" is the other big chord type: it sounds happy, open."),
  "gt.pos.1.1": fretNote(1, 1, "F", "E (open) and F (fret 1) are right next to each other: there's no note between them."),
  "gt.pos.1.3": fretNote(1, 3, "G", "E, F, G on the 1st string: open, fret 1, fret 3."),
  "gt.ch.Am": chord("Am", "A minor", "finger 1 on the 2nd string fret 1, finger 2 on the 4th fret 2, finger 3 on the 3rd fret 2. **Don't play the 6th string**.", "It's the same shape as E, moved one string over."),
  "gt.ch.A": chord("A", "A major", "fingers 1, 2 and 3 at fret 2 on strings 4, 3 and 2. **Don't play the 6th string**.", "The three fingers sit in a row: if they don't fit, angle them a little."),
  "gt.pos.2.1": fretNote(2, 1, "C", "B (open) and C (fret 1) are right next to each other, like E and F."),
  "gt.pos.2.3": fretNote(2, 3, "D", "2nd string: B, C, D → open, fret 1, fret 3."),
  "gt.strum": {
    title: "Strumming in quarter notes",
    body: [
      P("To accompany a song, your strumming hand **strums** the strings with a pick or fingers, **downward**, once per **beat** (in quarter notes)."),
      EX({ rhythm: "q q q q | q q q q", ts: "4/4" }, "One strum per beat: 1, 2, 3, 4."),
      P("Try Em for one bar and A for the next, without breaking the beat. If you're slow to change, don't stop: strum the open strings until you get there."),
      TIP("Move your arm from the elbow, relaxed, as if shaking water off your hand."),
    ],
    quiz: [
      Q("Strumming quarter notes in 4/4, how many strums per bar?", "4", "8", "2", "1"),
      Q("If you can't change chords in time...", "don't break the beat", "stop and start over", "play faster", "skip the bar"),
    ],
  },
  "gt.ch.D": chord("D", "D major", "finger 1 on the 3rd string fret 2, finger 2 on the 1st fret 2, finger 3 on the 2nd fret 3. Play only the **4 highest strings**.", "Triangle shape. It's the chord of hundreds of folk and rock songs."),
  "gt.pos.3.2": fretNote(3, 2, "A", "3rd string: G open, A at fret 2."),
  "gt.ch.G": chord("G", "G major", "finger 2 on the 6th fret 3, finger 1 on the 5th fret 2, finger 3 on the 1st fret 3. Strum all 6.", "It spans the whole neck: it's normal for it to feel hard at first."),
  "gt.pos.4.2": fretNote(4, 2, "E", "4th string: D open, E at fret 2."),
  "gt.pos.4.3": fretNote(4, 3, "F", "D, E, F: open, fret 2, fret 3. E and F are right next to each other."),
  "gt.ch.C": chord("C", "C major", "finger 3 on the 5th fret 3, finger 2 on the 4th fret 2, finger 1 on the 2nd fret 1. **Don't play the 6th string**.", "The little staircase: 3-2-1 going down. With G, D, Em and C you can already play tons of songs."),
  "gt.pos.5.2": fretNote(5, 2, "B", "5th string: A open, B at fret 2."),
  "gt.pos.5.3": fretNote(5, 3, "C", "B and C are right next to each other: fret 2 and fret 3."),
  "gt.ch.Dm": chord("Dm", "D minor", "finger 2 on the 3rd fret 2, finger 3 on the 2nd fret 3, finger 1 on the 1st fret 1. Only the 4 highest strings.", "Compare it with D: the 1st string changes and the chord turns minor."),
  "gt.pos.6.1": fretNote(6, 1, "F", "Same as on the 1st string: E open, F at fret 1."),
  "gt.pos.6.3": fretNote(6, 3, "G", "6th string: E, F, G → open, 1, 3. You now know the whole first position!"),
  "gt.change": {
    title: "Smooth chord changes",
    body: [
      P("The secret of fast changes: **anchor fingers** (that don't move between two chords) and **guide fingers** (that slide along the same string)."),
      EX({ diagram: "Am" }, "Am..."),
      EX({ diagram: "C" }, "...and C: fingers 1 and 2 stay in the same place."),
      TIP("Practice each change in pairs for a minute: Am ↔ C, G ↔ D, Em ↔ C."),
    ],
    quiz: [
      Q("An anchor finger is...", "a finger that doesn't move between two chords", "the pinky", "a finger that presses harder", "the pick"),
      Q("Between Am and C, which fingers stay still?", "1 and 2", "3 and 4", "None", "All of them"),
    ],
  },
  "gt.ch.E7": chord("E7", "E seventh", "like E but lifting finger 3: the 4th string rings open.", "The \"7\" adds tension: it wants to move to another chord. It's the sound of the blues."),
  "gt.ch.A7": chord("A7", "A seventh", "like A but with the 3rd string open.", "Ideal for blues in A: A7, D7, E7."),
  "gt.ch.D7": chord("D7", "D seventh", "finger 2 on the 3rd fret 2, finger 1 on the 2nd fret 1, finger 3 on the 1st fret 2.", "It's an \"upside-down\" D: the triangle flips."),
  "gt.ch.G7": chord("G7", "G seventh", "like G but with finger 1 on the 1st string, fret 1.", "G7 wants to resolve to C: try G7 → C."),
  "gt.ch.B7": chord("B7", "B seventh", "finger 2 on the 5th fret 2, finger 1 on the 4th fret 1, finger 3 on the 3rd fret 2, finger 4 on the 1st fret 2.", "It's the chord that leads to Em: B7 → Em sounds very Spanish."),
  "gt.strum8": {
    title: "Strumming in eighth notes (down-up)",
    body: [
      P("In eighth notes, the strumming hand goes **down** on every beat and **up** on every \"and\": down-up-down-up."),
      EX({ rhythm: "8 8 8 8 8 8 8 8", ts: "4/4" }, "1 and 2 and 3 and 4 and: ↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑."),
      P("The most famous folk-rock pattern: **↓ ↓↑ ↑↓ ↑** (down, down-up, up-down-up). The hand never stops moving: sometimes it passes without hitting the strings."),
      TIP("Your hand works like a pendulum: always down on the numbers and up on the \"ands\"."),
    ],
    quiz: [
      Q("When strumming eighth notes, the hand goes down...", "on every beat (the numbers)", "on every \"and\"", "only at the start", "never"),
      Q("How many strums are in a bar of 4/4 in eighth notes?", "8", "4", "16", "6"),
    ],
  },
  "gt.mv.power6": movable("power6", "Power chords on the 6th string", "A **[[gt.mv.power6|power chord]]** is two notes: the root on the **6th string** (finger 1) and two frets higher on the **5th** (finger 3). It's named with a 5: G5, A5...", 3, "It's the shape of distorted rock: AC/DC, Metallica, Nirvana. Finger 1 on the 6th string gives you the name."),
  "gt.mv.power5": movable("power5", "Power chords on the 5th string", "The same shape, but with the root on the **5th string** (finger 1) and two frets higher on the **4th** (finger 3).", 3, "Combining the 6th and 5th strings you can play almost any riff without moving your hand: *Smoke on the Water* comes out this way."),
  "gt.palm": {
    title: "Palm muting",
    body: [
      P("Rest the edge of your strumming-hand palm **on the strings, just above the bridge**, and play: the sound becomes short and \"chug-chug\". That's **palm muting**."),
      P("With power chords in eighth notes and palm muting you have the rhythmic engine of metal and punk."),
      TIP("Too far in and the strings won't ring; too far out and they won't mute. Find the sweet spot."),
    ],
    quiz: [
      Q("Where does the palm rest for palm muting?", "On the strings, near the bridge", "On the frets", "On the headstock", "Over the soundhole"),
      Q("How does palm muting sound?", "Short and muted", "Long and bright", "Higher", "Silent"),
    ],
  },
  "gt.chromatic": {
    title: "The sharps and flats of the first position",
    body: [
      P("Between the natural notes you already know are the altered ones: each fret raises the pitch a **half step**. On the 6th string: E (0), F (1), **F♯/G♭ (2)**, G (3), **G♯/A♭ (4)**."),
      EX({ frets: "6:2 6:4 5:1 5:4" }, "F♯, G♯, A♯ and C♯ on the 6th and 5th strings."),
      TIP("Rule: between two naturals a whole step apart (two frets) there's an altered note in the middle."),
    ],
  },
  "gt.ch.Am7": chord("Am7", "A minor seventh", "like Am but lifting finger 3: the 3rd string rings open.", "Softer than Am; very common in ballads."),
  "gt.ch.Em7": chord("Em7", "E minor seventh", "finger 1 on the 5th fret 2, finger 2 on the 4th fret 2, finger 4 on the 2nd fret 3.", "An acoustic guitar classic."),
  "gt.ch.Cadd9": chord("Cadd9", "C add nine", "like C but with finger 3 on the 5th and finger 4 on the 2nd at fret 3; the 1st string, also fret 3.", "Moving from G to Cadd9 almost without moving your hand is a trick used in hundreds of acoustic songs."),
  "gt.ch.Asus4": chord("Asus4", "A suspended fourth", "like A but with finger 4 on the 2nd string fret 3.", "A → Asus4 → A: the most rock'n'roll embellishment there is."),
  "gt.ch.Dsus4": chord("Dsus4", "D suspended fourth", "like D but with finger 4 on the 1st string fret 3.", "D → Dsus4 → D: try it and you'll recognize dozens of songs."),
  "gt.ch.Fmaj7": chord("Fmaj7", "F major seventh", "finger 3 on the 4th fret 3, finger 2 on the 3rd fret 2, finger 1 on the 2nd fret 1; 1st string open.", "An \"easy F\" that sounds dreamy."),
  "gt.mv.E": movable("E", "The barre: E shape", "With **finger 1 laid flat** across all the strings (the **[[gt.mv.E|barre]]**) and the E shape with the other fingers, you build a major chord **at any fret**. At fret 1 it's **F**; at 3, **G**; at 5, **A**.", 1, "Barre chords are hard for everyone. Press with the side of your index finger, not the pad, and bring your elbow closer to your body."),
  "gt.mv.Em": movable("Em", "Barre: E minor shape", "Like the major barre but lifting the finger on the 3rd string: a **minor** chord. Fret 1 = Fm, fret 2 = F♯m, fret 5 = Am.", 2, "The note on the 6th string gives the chord its name."),
  "gt.mv.A": movable("A", "Barre: A shape", "Barre on the **5th string** with the A shape: a major chord with its root on the 5th string. Fret 2 = B, fret 3 = C.", 2, "Many guitarists use just finger 3 laid flat for the three middle strings."),
  "gt.mv.Am": movable("Am", "Barre: A minor shape", "Barre on the 5th string with the Am shape: a minor chord. Fret 2 = Bm, fret 5 = Dm.", 2, "Barre Bm is the key to lots of songs in D and G."),
  "gt.mv.E7": movable("E7", "Barre: E seventh shape", "The E7 shape with a barre: seventh chords with the root on the 6th string.", 1, "Fret 5 = A7, fret 7 = B7: ideal for blues."),
  "gt.mv.A7": movable("A7", "Barre: A seventh shape", "The A7 shape with a barre on the 5th string: sevenths with the root on the 5th.", 2, "Fret 3 = C7, fret 5 = D7."),
  "gt.mv.Em7": movable("Em7", "Barre: E minor seventh shape", "The Em7 shape with a barre: minor sevenths from the 6th string.", 5, "Fret 5 = Am7. Sounds very funky played short."),
  "gt.mv.Am7": movable("Am7", "Barre: A minor seventh shape", "The Am7 shape with a barre: minor sevenths from the 5th string.", 5, "Fret 5 = Dm7. With these shapes you can already play a ii–V–I."),
  "gt.zone.5": {
    title: "The notes between frets 5 and 9",
    body: [
      P("Higher up the neck the notes repeat. A trick: the **5th fret** of each string sounds the same as the **next string open** (except the 3rd string, where it's fret 4). That's how you tune the guitar."),
      EX({ frets: "6:5 5:5 4:5" }, "6th string fret 5 = A, 5th string fret 5 = D, 4th string fret 5 = G."),
      TIP("The dots on the neck (frets 3, 5, 7, 9, 12) are your landmarks."),
    ],
  },
  "gt.zone.10": {
    title: "From fret 10 up",
    body: [
      P("At **fret 12** everything starts over: each string sounds **an octave higher** than open. From 12 up, it's the first position repeated."),
      EX({ frets: "6:12 1:12" }, "Fret 12: E an octave higher."),
    ],
  },
  "gt.pent": {
    title: "The minor pentatonic on the neck",
    body: [
      P("The minor pentatonic **box** is the most famous shape in rock guitar. In A minor it starts at **fret 5**: two notes per string, all within 4 frets."),
      EX({ frets: "6:5 6:8 5:5 5:7 4:5 4:7 3:5 3:7 2:5 2:8 1:5 1:8" }, "A minor pentatonic, first box."),
      TIP("Slide the whole box and you change key: fret 3 = G minor, fret 12 = E minor."),
    ],
  },
  "gt.legato": {
    title: "Legato: hammer-ons and pull-offs",
    body: [
      P("**Hammer-on**: you play a note and \"hammer\" a higher one on the same string without picking again. **Pull-off**: the opposite, you remove your finger with a slight pull on the string so the lower note sounds."),
      P("In tab they're written with **h** and **p**: 5h7 = fret 5 and hammer-on to 7."),
      TIP("They're the basis of fluid solos: try them inside the pentatonic box."),
    ],
    quiz: [
      Q("What is a hammer-on?", "Sounding a higher note by hammering without picking again", "Playing very loud", "Muting the string", "Picking upward"),
      Q("In tab, 7p5 means...", "pull-off from fret 7 to 5", "play 7 and 5 together", "hammer-on from 7 to 5", "fret 75"),
    ],
  },
  "gt.bend": {
    title: "Bends and vibrato",
    body: [
      P("In a **bend** you push the string up (or down) while it rings, so the note **goes up**: a half step or a whole step. **Vibrato** is wobbling it quickly."),
      P("It's the voice of the guitar: Gilmour in *Comfortably Numb* and B.B. King in any blues."),
      TIP("Use several fingers together to push, and check by ear that you reach the right pitch."),
    ],
    quiz: [
      Q("A bend makes the note...", "go up", "go down", "stop", "sound louder"),
      Q("A whole-step bend raises the note...", "a whole step (two frets)", "one fret", "an octave", "nothing"),
    ],
  },
  "gt.caged": {
    title: "The CAGED system",
    body: [
      P("The open shapes **C, A, G, E and D** can be turned into movable shapes. Linked together, they cover the whole neck for **one and the same chord**: that's the **CAGED** system."),
      P("For example, C major: C shape at fret 0, A shape at 3, G shape at 5, E shape at 8, D shape at 10."),
      TIP("Each shape has its root on a different string: learn to find it and you'll find any chord anywhere."),
    ],
    quiz: [
      Q("Which shapes make up the CAGED system?", "C, A, G, E and D", "A, B, C, D and E", "The barre chords", "Only E and A"),
      Q("What is the CAGED system for?", "Playing the same chord all over the neck", "Tuning", "Reading notation", "Rhythm"),
    ],
  },
  "gt.slash": {
    title: "Slash chords on the guitar",
    body: [
      P("A chord like **G/B** is played as G but with **B** as the lowest note. On guitar: finger 1 on the 5th string fret 2 (B) and you don't play the 6th."),
      P("Descending bass lines (C – G/B – Am) can be heard in lots of ballads."),
    ],
    quiz: [
      Q("In G/B, which note must be the lowest?", "B", "G", "D", "E"),
      Q("What do you do with the 6th string in G/B?", "Don't play it", "Play it open", "Press it at fret 3", "Tune it lower"),
    ],
  },
};
