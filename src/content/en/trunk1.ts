// SPDX-License-Identifier: GPL-3.0-or-later
// Content (en): sound, the staff, treble clef and basic rhythm.
import { type LessonTexts, P, TIP, EX, Q } from "../types";

/** Lesson text for reading a note in treble clef. */
function trebleNote(n: string, where: string, tip: string, extraKnown: string): LessonTexts[string] {
  return {
    title: `${n} in treble clef`,
    body: [
      P(`This is **${n[0]}** (${n}). ${where}`),
      EX({ notes: `${extraKnown} ${n}`.trim(), clef: "treble", labels: true }, `The notes you already know, plus the new one: ${n[0]}.`),
      TIP(tip),
    ],
  };
}

export const TRUNK1: LessonTexts = {
  "t.sound": {
    title: "High or low?",
    body: [
      P("Every musical sound has a **pitch**: it can be **high** (thin, like a little bird) or **low** (thick, like thunder or an electric bass)."),
      EX({ play: "C6 C3" }, "First a high sound, then a low one."),
      P("Ear training starts right here: hearing two sounds and noticing which one is **higher**. When the guitar solo in *Comfortably Numb* climbs, what's rising is the pitch."),
      EX({ play: "C4 E4 G4 C5" }, "These sounds go up: each one is higher than the one before."),
      TIP("Don't worry about names yet: just listen for whether it goes up or down."),
    ],
  },
  "t.notes": {
    title: "The seven notes",
    body: [
      P("Western music uses **seven names** for pitches: **C D E F G A B**. Each one is called a **[[t.notes|note]]**."),
      EX({ play: "C4 D4 E4 F4 G4 A4 B4" }, "C, D, E, F, G, A, B."),
      P("In many countries the same notes are called **Do, Re, Mi, Fa, Sol, La, Si** (solfège): C = Do, D = Re, E = Mi, F = Fa, G = Sol, A = La, B = Si."),
      TIP("After G the letters start again at A: ... E F G A B C ..."),
      P("After B comes C again. In Settings you can choose to see the names as C D E or as Do Re Mi."),
    ],
    quiz: [
      Q("How many note names are there?", "Seven", "Five", "Twelve", "Eight"),
      Q("What is Sol in letters?", "G", "S", "F", "A"),
      Q("Which note comes after G?", "A", "H", "B", "C"),
    ],
  },
  "t.octave": {
    title: "The octave",
    body: [
      P("If you keep going up after B, C appears again, but **higher**. The distance from one C to the next C is called an **[[t.octave|octave]]**."),
      EX({ play: "C4 C5" }, "Two Cs: the second is one octave higher."),
      P("Two notes an octave apart sound **very similar**, as if they were the same note in another register. That's why they share a name."),
      P("To tell them apart we add a number: **C4** is the C in the middle of the piano; **C5** is one octave higher; **C3**, one octave lower."),
      EX({ play: "A3 A4 A5" }, "A3, A4 and A5: three As in different octaves."),
    ],
    quiz: [
      Q("C4 and C5 are...", "one octave apart", "one note apart", "two octaves apart", "seven octaves apart"),
      Q("Which note is one octave above E4?", "E5", "F4", "E3", "E4"),
    ],
  },
  "t.staff": {
    title: "The staff",
    body: [
      P("To write notes we use the **[[t.staff|staff]]**: five horizontal lines with four spaces between them."),
      EX({ notes: "E4 F4 G4 A4 B4 C5 D5 E5 F5", hideClef: true }, "Notes on lines and in spaces, from bottom to top."),
      P("Lines and spaces are counted **from the bottom up**: the bottom line is the 1st, the top line is the 5th."),
      P("The **higher** a note sits on the staff, the **higher** it sounds."),
      TIP("A note is **on a line** if the line runs through its middle; it's **in a space** if it sits between two lines."),
    ],
    quiz: [
      Q("How many lines does the staff have?", "Five", "Four", "Six", "Seven"),
      Q("How many spaces are between the lines?", "Four", "Five", "Three", "Six"),
      Q("If a note is higher on the staff...", "it sounds higher", "it sounds lower", "it sounds louder", "it lasts longer"),
    ],
  },
  "clef.treble": {
    title: "The treble clef",
    body: [
      P("The staff alone doesn't say which note each line is. That's what the **clef** is for. The **[[clef.treble|treble clef]]** (G clef) is drawn at the start, and its curl wraps around the **2nd line**."),
      EX({ emptyStaff: true, clef: "treble" }, "The treble clef curls around the 2nd line."),
      P("That line becomes **G** (the G in the middle, G4). From there, every line and space is the next note, up or down."),
      TIP("The treble clef is used for the piano's right hand, the guitar, the voice and most high instruments."),
    ],
    quiz: [
      Q("Which line does the treble clef mark?", "The 2nd", "The 1st", "The 3rd", "The 4th"),
      Q("In treble clef, the note on the 2nd line is...", "G", "C", "F", "A"),
      Q("What is the clef for?", "To know which note each line and space is", "To know how loud to play", "To know how fast to play", "Nothing, it's decorative"),
    ],
  },
  "read.treble.G4": {
    title: "G4 in treble clef",
    body: [
      P("We start with the note the clef gives us: **G** (G4), on the **2nd line**."),
      EX({ notes: "G4", clef: "treble", labels: true }, "G."),
      TIP("Look where the clef curls: that's G."),
    ],
  },
  "read.treble.A4": trebleNote("A4", "It sits in the **2nd space**, right above G.", "Moving from a line to the space above is moving to the next note: G → A.", "G4"),
  "read.treble.F4": trebleNote("F4", "It sits in the **1st space**, right below G.", "Moving from a line to the space below is moving to the previous note: G → F.", "G4 A4"),
  "read.treble.B4": trebleNote("B4", "It sits on the **3rd line**, the middle one.", "B is right in the center of the staff.", "F4 G4 A4"),
  "read.treble.E4": trebleNote("E4", "It sits on the **1st line**, the bottom one.", "E, G, B: the first three lines skip one note each time.", "F4 G4 A4 B4"),
  "read.treble.C5": trebleNote("C5", "It sits in the **3rd space**, above B.", "The spaces from bottom to top read F, A, C... and one more to come.", "E4 F4 G4 A4 B4"),
  "read.treble.D4": trebleNote("D4", "It sits **below** the 1st line, hanging from the staff.", "D is just under E, without a line of its own.", "E4 F4 G4 A4 B4 C5"),
  "read.treble.C4": {
    title: "Middle C (C4)",
    body: [
      P("Below D there's a note that needs its own little line: it's **C4**, **[[read.treble.C4|middle C]]**. That short line is called a **[[read.treble.C4|ledger line]]**: it extends the staff just for that note."),
      EX({ notes: "C4 D4 E4 F4 G4", clef: "treble", labels: true }, "C, D, E, F, G: five notes in a row."),
      P("It's called middle C because it's in the middle of the piano keyboard. From here you can read whole melodies."),
    ],
    quiz: [
      Q("What is the short line through C4 called?", "A ledger line", "A slur", "A clef", "A stem"),
      Q("Where is C4 in treble clef?", "On a ledger line below the staff", "On the 1st line", "In the 3rd space", "On the 5th line"),
    ],
  },
  "read.treble.D5": trebleNote("D5", "It sits on the **4th line**.", "The lines from bottom to top: E, G, B, D... (one left).", "C4 D4 E4 F4 G4 A4 B4 C5"),
  "read.treble.E5": trebleNote("E5", "It sits in the **4th space**, the top one.", "The spaces from bottom to top spell the word **F-A-C-E**.", "G4 A4 B4 C5 D5"),
  "read.treble.F5": trebleNote("F5", "It sits on the **5th line**, the top one.", "The lines from bottom to top: **E, G, B, D, F** (\"Every Good Boy Does Fine\").", "A4 B4 C5 D5 E5"),
  "read.treble.G5": trebleNote("G5", "It sits **above** the 5th line, resting on top of the staff.", "G4 and G5 are an octave apart: one on the 2nd line, the other on top.", "G4 B4 D5 E5 F5"),

  // ---------------- Rhythm ----------------
  "t.pulse": {
    title: "The beat",
    body: [
      P("When you tap your foot to a song, you're following the **[[t.pulse|beat]]**: an even, regular pulse that never stops."),
      EX({ play: "C5 C5 C5 C5", instrument: "drums" }, "Four even beats."),
      P("In Queen's *We Will Rock You* the beat is crystal clear: stomp, stomp, clap... always the same distance apart."),
      P("The device that keeps the beat is called a **[[t.pulse|metronome]]**. The app has one under Tools."),
    ],
    quiz: [
      Q("The beat is...", "an even, regular pulse", "a high sound", "the name of a note", "the volume of the music"),
    ],
  },
  "rh.q": {
    title: "The quarter note",
    body: [
      P("To write how long a sound **lasts** we use **note values**. The first is the **[[rh.q|quarter note]]**: a filled head with a vertical line (the *stem*)."),
      EX({ rhythm: "q q q q" }, "Four quarter notes: one per beat."),
      P("A quarter note lasts **one beat**. If the beat goes at 60 per minute, each quarter note lasts one second."),
      TIP("For rhythm reading, all notes are written on a single line for now: what matters is how long they last."),
    ],
    quiz: [Q("How many beats does a quarter note last?", "1", "2", "4", "Half")],
  },
  "rh.h": {
    title: "The half note",
    body: [
      P("The **[[rh.h|half note]]** has a hollow head and a stem. It lasts **two beats**: the same as two quarter notes."),
      EX({ rhythm: "h h q q h" }, "Half, half, quarter, quarter, half."),
      TIP("While a half note sounds, count \"one-two\" out loud and hold the sound."),
    ],
    quiz: [Q("A half note lasts as long as...", "two quarter notes", "one quarter note", "four quarter notes", "half a quarter note")],
  },
  "rh.w": {
    title: "The whole note",
    body: [
      P("The **[[rh.w|whole note]]** is a hollow head with no stem. It lasts **four beats**: two half notes or four quarter notes."),
      EX({ rhythm: "w h h q q q q" }, "A whole note, two half notes and four quarter notes: each group lasts the same."),
    ],
    quiz: [
      Q("How many quarter notes fit in a whole note?", "4", "2", "3", "8"),
      Q("How many half notes fit in a whole note?", "2", "4", "1", "3"),
    ],
  },
  "rest.q": {
    title: "The quarter rest",
    body: [
      P("Music is also made of **silence**. The **[[rest.q|quarter rest]]** is a zigzag squiggle and is worth **one beat of silence**."),
      EX({ rhythm: "q qr q qr" }, "Note, rest, note, rest."),
      TIP("During a rest the beat keeps going: count it anyway, silently."),
    ],
    quiz: [Q("A quarter rest lasts...", "one beat", "two beats", "nothing", "four beats")],
  },
  "t.measure": {
    title: "Bar lines and bars",
    body: [
      P("To make reading easier, music is split into groups of beats separated by **vertical lines** (bar lines). Each group is called a **[[t.measure|bar]]** (or measure)."),
      EX({ rhythm: "q q q q | h h | w" }, "Three bars of four beats each."),
      P("Within a song, all bars usually have the **same number of beats**. A double bar line marks the end of the piece."),
      P("The first beat of each bar usually feels **stronger**: it's the one you stamp hardest with your foot."),
    ],
    quiz: [
      Q("What separates one bar from the next?", "A vertical bar line", "A clef", "A rest", "A note"),
      Q("Which beat of the bar usually feels strongest?", "The first", "The last", "All the same", "The second"),
    ],
  },
  "ts.4/4": {
    title: "4/4 time",
    body: [
      P("At the start of the music there are two numbers, one above the other: the **time signature**. In **4/4** the top number says there are **four beats** per bar and the bottom number says each beat is a **quarter note**."),
      EX({ rhythm: "q q q q | h q q | w", ts: "4/4" }, "4/4: four quarter notes per bar."),
      P("It's the most common time signature in rock: *Back in Black*, *Let It Be* and *De música ligera* are all in 4/4."),
    ],
    quiz: [
      Q("In 4/4, how many beats are in each bar?", "4", "3", "2", "8"),
      Q("In 4/4, which note value is one beat?", "The quarter note", "The half note", "The whole note", "None"),
    ],
  },
  "rest.h": {
    title: "The half rest",
    body: [
      P("The **half rest** is a small block **sitting on** the line (like a hat). It's worth **two beats** of silence."),
      EX({ rhythm: "q q hr | hr h", ts: "4/4" }, "Half rests."),
    ],
    quiz: [Q("A half rest is worth...", "two beats", "one beat", "four beats", "half a beat")],
  },
  "rest.w": {
    title: "The whole rest",
    body: [
      P("The **whole rest** is a small block **hanging below** the line. It's used for a whole bar of silence."),
      EX({ rhythm: "w | wr | h h", ts: "4/4" }, "A full bar of silence in the middle."),
      TIP("To tell them apart: the whole rest is heavier, so it hangs; the half rest is lighter and sits on top."),
    ],
    quiz: [Q("Which one hangs from the line?", "The whole rest", "The half rest", "The quarter rest", "None")],
  },
  "ts.3/4": {
    title: "3/4 time",
    body: [
      P("In **3/4** there are **three** quarter-note beats per bar: **STRONG, weak, weak**. It's waltz time."),
      EX({ rhythm: "q q q | h q | h q", ts: "3/4" }, "3/4: three quarter notes per bar."),
      P("Many rock ballads use this swaying feel. Listen to how the accent falls every three beats."),
    ],
    quiz: [Q("In 3/4, how many quarter notes fit in a bar?", "3", "4", "2", "6")],
  },
  "ts.2/4": {
    title: "2/4 time",
    body: [
      P("In **2/4** there are **two** quarter-note beats per bar: **STRONG, weak**. It's the time of marches and many dance rhythms."),
      EX({ rhythm: "q q | h | q q", ts: "2/4" }, "2/4: two quarter notes per bar."),
    ],
    quiz: [Q("Which single note value fills a bar of 2/4?", "A half note", "A whole note", "A quarter note", "Two half notes")],
  },
  "rh.8": {
    title: "The eighth note",
    body: [
      P("The **[[rh.8|eighth note]]** is like a quarter note with a little flag. It lasts **half a beat**: two eighth notes fit in one quarter note."),
      EX({ rhythm: "8 8 8 8 q q | 8 8 q h", ts: "4/4" }, "When they're grouped, eighth notes are joined with a beam."),
      P("Count them as **\"1 and 2 and 3 and 4 and\"**: the number falls on the beat and the **and** in between. The drums in almost every rock song play eighth notes."),
    ],
    quiz: [
      Q("How many eighth notes fit in a quarter note?", "2", "1", "4", "3"),
      Q("How many eighth notes fit in a bar of 4/4?", "8", "4", "6", "16"),
    ],
  },
  "rest.8": {
    title: "The eighth rest",
    body: [
      P("The **eighth rest** looks like a 7 with a little ball. It's worth **half a beat** of silence."),
      EX({ rhythm: "8r 8 8r 8 q q", ts: "4/4" }, "Silence on the beat and a note on the \"and\": it sounds offbeat."),
      TIP("Playing on the \"and\" (between beats) is what gives a rhythm its swing."),
    ],
    quiz: [Q("An eighth rest lasts...", "half a beat", "one beat", "two beats", "a quarter of a beat")],
  },
  "rh.dot": {
    title: "The dot",
    body: [
      P("A **dot** to the right of a note value **adds half** of its value. A note with a dot is called **[[rh.dot|dotted]]**."),
      P("Dotted half note = 2 + 1 = **3 beats**. Dotted quarter note = 1 + ½ = **one and a half beats**."),
      EX({ rhythm: "h. q | q. 8 h", ts: "4/4" }, "A dotted half note and a dotted quarter note."),
      TIP("A dotted quarter is almost always followed by an eighth note, which completes the two beats."),
    ],
    quiz: [
      Q("How long does a dotted half note last?", "3 beats", "2 beats", "2 and a half beats", "4 beats"),
      Q("How long does a dotted quarter note last?", "One and a half beats", "Two beats", "One beat", "Half a beat"),
    ],
  },
  "rh.tie": {
    title: "The tie",
    body: [
      P("A **[[rh.tie|tie]]** is a curve joining two notes **of the same pitch**: the second one isn't played again, its length is just **added** to the first."),
      EX({ rhythm: "q~ q h | h~ q q", ts: "4/4" }, "A quarter tied to a quarter sounds like a half note."),
      P("It's mainly used to hold a sound across a bar line, which can't be written with a single note value."),
    ],
    quiz: [Q("Two tied quarter notes last...", "two beats, without replaying", "one beat", "two beats, playing twice", "four beats")],
  },
  "ear.rhythm": {
    title: "Rhythmic dictation",
    body: [
      P("Now you'll **write** what you hear. First you get one bar of metronome to count in, then the rhythm."),
      P("Build it by choosing note values in order. Count the beats quietly while you listen: \"1 and 2 and 3 and 4 and\"."),
      EX({ rhythm: "q 8 8 h", ts: "4/4" }, "Example: quarter, two eighths, half."),
      TIP("You can listen as many times as you want."),
    ],
  },
  "t.tempo": {
    title: "Tempo",
    body: [
      P("**[[t.tempo|Tempo]]** is the speed of the beat. It's measured in **BPM**: beats per minute. 60 BPM = one beat per second."),
      P("Italian words are also used: **Largo** (very slow), **Adagio** (slow), **Andante** (walking pace), **Moderato**, **Allegro** (fast) and **Presto** (very fast)."),
      EX({ rhythm: "q q q q", ts: "4/4", tempo: 60 }, "60 BPM."),
      EX({ rhythm: "q q q q", ts: "4/4", tempo: 140 }, "140 BPM."),
      P("*Wish You Were Here* is around 60 BPM; AC/DC's *Highway to Hell*, around 116."),
    ],
    quiz: [
      Q("What does 120 BPM mean?", "120 beats per minute", "120 notes per bar", "120 bars", "120 seconds"),
      Q("Which of these tempos is fastest?", "Allegro", "Adagio", "Largo", "Andante"),
      Q("At 60 BPM, how long does each beat last?", "One second", "Half a second", "Two seconds", "One minute"),
    ],
  },
  "t.dynamics": {
    title: "Loud and soft (dynamics)",
    body: [
      P("**Dynamics** tell you how loud to play: **p** (piano, soft), **f** (forte, loud), **mf** (mezzo-forte, medium loud), **pp** and **ff** (very soft, very loud)."),
      P("A **crescendo** (<) goes from soft to loud; a **decrescendo** (>) goes from loud to soft. *Stairway to Heaven* is one big eight-minute crescendo."),
    ],
    quiz: [
      Q("What does f mean?", "Loud", "Fine", "Finish", "Fast"),
      Q("What does p mean?", "Soft", "Pause", "Pulse", "Presto"),
      Q("A crescendo is...", "going from soft to loud", "going from fast to slow", "going from high to low", "a long rest"),
    ],
  },
  "rh.16": {
    title: "The sixteenth note",
    body: [
      P("The **[[rh.16|sixteenth note]]** has two flags (or two beams when grouped). It lasts **a quarter of a beat**: four fit in a quarter note."),
      EX({ rhythm: "16 16 16 16 q 8 16 16 q", ts: "4/4" }, "Groups of sixteenth notes."),
      P("Count them as **\"1 e and a, 2 e and a...\"**. Red Hot Chili Peppers' funk lives on sixteenth notes."),
    ],
    quiz: [
      Q("How many sixteenth notes fit in a quarter note?", "4", "2", "8", "3"),
      Q("How many sixteenth notes fit in an eighth note?", "2", "4", "1", "3"),
    ],
  },
  "rest.16": {
    title: "The sixteenth rest",
    body: [
      P("The **sixteenth rest** is like the eighth rest but with **two** little balls. It's worth a quarter of a beat."),
      EX({ rhythm: "16 16r 16 16 8 8 q h", ts: "4/4" }, "Keep counting \"1 e and a\" even when there are rests."),
    ],
    quiz: [Q("A sixteenth rest is worth...", "a quarter of a beat", "half a beat", "one beat", "two beats")],
  },
};
