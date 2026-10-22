// SPDX-License-Identifier: GPL-3.0-or-later
// Content (en): bass and drums branches.
import { type LessonTexts, P, TIP, EX, Q } from "../types";

const BSTR: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th" };

function bassString(n: number, name: string, tip: string): LessonTexts[string] {
  return {
    title: `Bass ${BSTR[n]} string: ${name}`,
    body: [
      P(`The bass's **${BSTR[n]} string**, open, sounds **${name}**.`),
      EX({ frets: `${n}:0`, bass: true }, `Open ${BSTR[n]} string.`),
      TIP(tip),
    ],
  };
}

function bassFret(s: number, f: number, name: string, tip: string): LessonTexts[string] {
  return {
    title: `${name} on the bass's ${BSTR[s]} string`,
    body: [
      P(`**${BSTR[s]} string, fret ${f}**: it sounds **${name}**.`),
      EX({ frets: `${s}:${f}`, bass: true }, `${name}.`),
      EX({ tab: `${s}:${f}`, bass: true }, "In bass tab."),
      TIP(tip),
    ],
  };
}

function drumPiece(id: string, name: string, desc: string, where: string): LessonTexts[string] {
  const cap = name[0].toUpperCase() + name.slice(1);
  return {
    title: cap,
    body: [
      P(desc),
      EX({ drums: `${id}:q ${id}:q ${id}:q ${id}:q` }, `${cap}: ${where}`),
    ],
  };
}

export const BASS: LessonTexts = {
  "bs.parts": {
    title: "Meet the bass",
    body: [
      P("The electric bass has **4 strings** (some have 5). It sounds **an octave lower** than the four low strings of the guitar."),
      P("Just like the guitar, the neck has **[[bs.parts|frets]]** and the part where your fingers press is the **[[bs.parts|fretboard]]**. Each fret raises the sound to the next closest note."),
      P("The **1st string is the thinnest** (highest) and the **4th the thickest** (lowest)."),
      TIP("Plucking hand: alternate index and middle fingers, resting your thumb on the pickup or on the string above."),
    ],
    quiz: [
      Q("How many strings does the most common bass have?", "4", "6", "5", "3"),
      Q("Which is the 4th string?", "The thickest and lowest", "The thinnest", "The middle one", "It doesn't exist"),
      Q("With the plucking hand it's best to...", "alternate index and middle fingers", "use only the thumb", "use a single finger", "strum"),
    ],
  },
  "bs.tab": {
    title: "Bass tab",
    body: [
      P("Bass **[[bs.tab|tab]]** has **4 lines**: the **top one is the 1st string** (the highest) and the bottom one the 4th. Numbers are **frets**; 0 is an open string."),
      TIP("It's like looking down at the bass neck from above."),
    ],
    quiz: [
      Q("How many lines does 4-string bass tab have?", "4", "6", "5", "3"),
      Q("In bass tab, the bottom line is...", "the 4th string (the lowest)", "the 1st string", "the tuning", "the 2nd string"),
      Q("What does a 3 on the bottom line mean?", "4th string, fret 3", "3rd string, fret 4", "Play 3 times", "The third time"),
    ],
  },
  "bs.str.4": bassString(4, "E", "It's the lowest E on the bass: the floor of almost all rock."),
  "bs.str.3": bassString(3, "A", "E, **A**... the bass strings are the same as the guitar's 4 low strings."),
  "bs.str.2": bassString(2, "D", "E, A, **D**..."),
  "bs.str.1": bassString(1, "G", "E, A, D, **G**: now you have all four."),
  "bs.pos.4.1": bassFret(4, 1, "F", "E and F are right next to each other: there's no note between them."),
  "bs.pos.4.3": bassFret(4, 3, "G", "4th string: E (0), F (1), G (3)."),
  "bs.pos.3.2": bassFret(3, 2, "B", "3rd string: A (0), B (2)."),
  "bs.pos.3.3": bassFret(3, 3, "C", "B and C are right next to each other: frets 2 and 3."),
  "bs.root": {
    title: "Playing the root of a chord",
    body: [
      P("Songs have **[[bs.root|chords]]**: groups of notes played by the guitar or keyboard. They're written with letters (**[[bs.root|chord symbols]]**): **C**, **G**, **A**, **E**..."),
      P("The most basic (and most important!) job of the bass is playing the note that gives the chord its name: the **root**. If it says **G**, you play **G**."),
      EX({ frets: "4:3 3:3", bass: true }, "G and C."),
      TIP("A line of just roots already sounds like a band. Think of *Let It Be*."),
    ],
  },
  "bs.pos.2.2": bassFret(2, 2, "E", "2nd string: D (0), E (2)."),
  "bs.pos.2.3": bassFret(2, 3, "F", "E and F side by side: frets 2 and 3."),
  "bs.pos.1.2": bassFret(1, 2, "A", "1st string: G (0), A (2)."),
  "bs.pos.1.4": bassFret(1, 4, "B", "1st string: G (0), A (2), B (4). The whole first position!"),
  "bs.eighths": {
    title: "Steady eighth notes: the engine of rock",
    body: [
      P("The most typical rock bass line: the **root in eighth notes**, nonstop, eight per bar."),
      EX({ tab: "3:0:8 3:0:8 3:0:8 3:0:8 3:0:8 3:0:8 3:0:8 3:0:8", bass: true, ts: "4/4" }, "A in eighth notes."),
      P("AC/DC, Ramones, The Clash: bass in eighth notes \"pushes\" the whole band."),
      TIP("Alternate fingers (index-middle) and keep every note even in volume and length."),
    ],
    quiz: [
      Q("How many eighth notes are in a bar of 4/4?", "8", "4", "16", "6"),
      Q("To play even eighth notes it's best to...", "alternate index and middle fingers", "use a single finger", "play louder and louder", "use the thumb"),
    ],
  },
  "bs.minor": {
    title: "Minor chords on the bass",
    body: [
      P("If the chord is **Am** (A minor), the root is still **A**. The \"m\" changes the guitar's chord, but your note is the same."),
      EX({ frets: "3:0", bass: true }, "Am → you play A."),
    ],
  },
  "bs.octave": {
    title: "The octave shape",
    body: [
      P("The same note **an octave higher** is always **two strings up and two frets ahead**. Root + octave is a classic disco and rock pattern."),
      EX({ frets: "4:1 2:3", bass: true }, "F (4th string, fret 1) and its octave (2nd string, fret 3)."),
      TIP("Finger 1 on the root, finger 3 or 4 on the octave."),
    ],
  },
  "bs.fifth": {
    title: "Root and fifth",
    body: [
      P("The **fifth** of a note is **one string up and two frets ahead**. Alternating root and fifth is the basis of country, folk and lots of rock."),
      EX({ frets: "4:1 3:3", bass: true }, "F and its fifth, C."),
    ],
  },
  "bs.chromatic": {
    title: "Sharps and flats on the bass",
    body: [
      P("Each fret is a **half step**. Between two naturals a whole step apart (two frets) there's an altered note: on the 4th string, fret 2 = F♯/G♭; fret 4 = G♯/A♭."),
      EX({ frets: "4:2 4:4 3:1 3:4", bass: true }, "F♯, G♯, A♯ and C♯."),
    ],
  },
  "bs.zone.5": {
    title: "The bass between frets 5 and 9",
    body: [
      P("The 5th fret of each string sounds the same as the next string open: 4th string fret 5 = A, 3rd string fret 5 = D, 2nd string fret 5 = G."),
      EX({ frets: "4:5 3:5 2:5", bass: true }, "Fret 5."),
      TIP("Playing at fret 5 instead of open gives you more control over the sound."),
    ],
  },
  "bs.zone.10": {
    title: "From fret 10 up",
    body: [
      P("At **fret 12** each string sounds an octave above open. From there on everything repeats."),
      EX({ frets: "4:12 1:12", bass: true }, "Fret 12."),
    ],
  },
  "bs.pent": {
    title: "The minor pentatonic on the bass",
    body: [
      P("The minor pentatonic is the source of rock bass riffs. In A: A, C, D, E, G, with the root on the 4th string fret 5."),
      EX({ frets: "4:5 4:8 3:5 3:7 2:5 2:7", bass: true }, "A minor pentatonic."),
      TIP("The *Another One Bites the Dust* riff comes from the E minor pentatonic."),
    ],
  },
  "bs.approach": {
    title: "Approach notes",
    body: [
      P("To reach the next chord in style, play **a half step below** (or above) its root just before the change. That's a **chromatic approach note**."),
      P("If you're going from C to G, on the last beat of C play **F♯** and land on **G**."),
    ],
    quiz: [
      Q("A chromatic approach note is...", "a half step before or after the target note", "an octave higher", "in another key", "always C"),
      Q("To reach G, which approach note from below would you use?", "F♯", "E", "A", "C"),
    ],
  },
  "bs.walk": {
    title: "Walking bass",
    body: [
      P("In **walking bass** you play one note per beat, **walking** toward the next chord: root, chord or scale notes, and an approach note at the end."),
      P("Over a ii–V–I (Dm7 G7 Cmaj7): D F A C♯ | G B D D♯ | E..."),
    ],
    quiz: [
      Q("In walking bass you play...", "one note per beat walking to the next chord", "only the root in whole notes", "full chords", "only on the last beat"),
      Q("Which note usually goes on the first beat of each chord?", "The root", "The seventh", "Any note", "A rest"),
    ],
  },
  "bs.str5": {
    title: "The 5-string bass",
    body: [
      P("The 5-string bass adds a **low 5th string: B**. It allows notes lower than E and lets you play more without moving your hand."),
      EX({ frets: "5:0 5:3", bass: true, fiveString: true }, "Low B and D on the 5th string."),
    ],
  },
  "bs.ghost": {
    title: "Ghost notes",
    body: [
      P("**Ghost notes** are \"phantom\" notes: you rest your finger on the string without pressing fully and pluck, producing a percussive hit with no pitch. They're written with an **x**."),
      P("They give funk lines their swing: Flea (RHCP) uses them all the time."),
    ],
    quiz: [
      Q("A ghost note sounds...", "like a hit with no definite pitch", "very high", "very long", "louder"),
      Q("How are ghost notes written in tab?", "With an x", "With a 0", "With an h", "They aren't written"),
    ],
  },
  "bs.slap": {
    title: "Slap and pop",
    body: [
      P("**Slap**: you strike the string with the side of your thumb against the frets. **Pop**: you hook a high string with your index finger and let it snap back."),
      P("It's the sound of funk: *Higher Ground* or *Can't Stop* by Red Hot Chili Peppers."),
    ],
    quiz: [
      Q("What do you slap with?", "The side of the thumb", "A pick", "The pinky", "The fretting hand"),
      Q("Popping consists of...", "hooking and releasing a high string", "hitting the bass body", "pressing harder", "playing chords"),
    ],
  },
};

export const DRUMS: LessonTexts = {
  "dr.kit": {
    title: "Meet the drum kit",
    body: [
      P("The drum kit has several pieces: the **[[dr.kit|bass drum]]** (the big one on the floor, with a pedal), the **[[dr.kit|snare]]** (the middle drum, with a dry crack), the **[[dr.kit|hi-hat]]** (two cymbals that open and close with a pedal), the **toms** and the **[[dr.kit|cymbals]]** (crash and ride)."),
      P("The basic rock pattern uses three: **bass drum, snare and hi-hat**."),
      TIP("The app has pads so you can hear each piece. You don't need to play perfectly: the goal is to understand and read."),
    ],
    quiz: [
      Q("Which piece is played with a pedal and sounds very low?", "The bass drum", "The hi-hat", "The crash", "The high tom"),
      Q("Which three pieces does the basic rock pattern use?", "Bass drum, snare and hi-hat", "Toms, crash and ride", "Only the bass drum", "Ride, crash and bass drum"),
      Q("The hi-hat is...", "two cymbals that open and close with a pedal", "a big drum", "a tom", "a bass drum pedal"),
    ],
  },
  "clef.percussion": {
    title: "The drum staff",
    body: [
      P("Drums are written on a staff with a **percussion clef** (two vertical lines). Each **line or space is a piece of the kit**, not a pitch."),
      P("**Drums** are written with normal noteheads; **cymbals**, with an **x**."),
      EX({ emptyStaff: true, clef: "percussion" }, "Percussion clef."),
    ],
    quiz: [
      Q("On the drum staff, each line or space indicates...", "a piece of the kit", "a pitch", "a speed", "a dynamic"),
      Q("Which notehead are cymbals written with?", "An x", "An empty circle", "A triangle", "No notehead"),
    ],
  },
  "dr.read.kick": drumPiece("kick", "the bass drum", "The **bass drum** (kick) is written in the **1st space** (bottom of the staff). It's played with the right foot.", "1st space."),
  "dr.read.snare": drumPiece("snare", "the snare", "The **snare** is written in the **3rd space**. It's the dry crack that marks beats 2 and 4 in rock.", "3rd space."),
  "dr.read.hhClosed": drumPiece("hhClosed", "the closed hi-hat", "The **closed hi-hat** is written with an **x** above the staff. It's played with the stick while the foot keeps it closed.", "x at the very top."),
  "dr.groove.q": {
    title: "Your first groove (in quarter notes)",
    body: [
      P("A **[[dr.groove.q|groove]]** is a pattern that repeats. The first one: **hi-hat on all 4 beats**, **bass drum on 1 and 3**, **snare on 2 and 4**."),
      EX({ groove: "dr.groove.q" }, "Kick-snare, kick-snare, with the hi-hat marking the beat."),
      P("That's the heartbeat of *We Will Rock You* (which is actually stomps and claps) and hundreds of songs."),
    ],
  },
  "dr.groove.8": {
    title: "The rock beat: hi-hat in eighth notes",
    body: [
      P("The quintessential **rock beat**: hi-hat in **eighth notes** (\"1 and 2 and 3 and 4 and\"), bass drum on **1 and 3**, snare on **2 and 4**."),
      EX({ groove: "dr.groove.8" }, "The rock beat."),
      P("*Back in Black*, *Highway to Hell*, *Billie Jean*: they all start from here."),
    ],
  },
  "dr.read.crash": drumPiece("crash", "the crash", "The **crash** is the cymbal that \"explodes\": it's written with an **x on the ledger line above**. It marks the start of sections, almost always together with the bass drum.", "x on the ledger line."),
  "dr.fill": {
    title: "Your first fill",
    body: [
      P("A **fill** is a short \"roll\" that announces a change of section. The simplest: **eighth notes on the snare** in the last bar, then **crash + bass drum** as the new section begins."),
      EX({ groove: "dr.fill" }, "Crash + bass drum and an eighth-note fill on the snare."),
    ],
  },
  "dr.read.tomHigh": drumPiece("tomHigh", "the high tom", "The **high tom** (tom 1) is written in the **4th space**.", "4th space."),
  "dr.read.tomMid": drumPiece("tomMid", "the mid tom", "The **mid tom** (tom 2) is written on the **4th line**.", "4th line."),
  "dr.read.tomFloor": drumPiece("tomFloor", "the floor tom", "The **floor tom** is written in the **2nd space**. It's the lowest tom.", "2nd space."),
  "dr.fill.toms": {
    title: "Fills around the toms",
    body: [
      P("The classic rock fill runs down the toms: **snare → high tom → mid tom → floor tom**, two eighth notes on each."),
      EX({ groove: "dr.fill.toms" }, "From high to low."),
      TIP("Think of the fill as a phrase falling toward beat 1 of the next bar."),
    ],
  },
  "dr.groove.kick": {
    title: "Bass drum variations",
    body: [
      P("Keeping the hi-hat in eighth notes and the snare on 2 and 4, you can move the **bass drum** to the \"ands\". That changes the whole character of the groove."),
      EX({ groove: "dr.groove.kick" }, "Bass drum on 1, the \"and\" of 2, and 3."),
    ],
  },
  "dr.read.hhOpen": drumPiece("hhOpen", "the open hi-hat", "The **open hi-hat** is written like the closed one but with a **small circle**: the foot lets up and the cymbals ring long.", "x with a circle."),
  "dr.read.ride": drumPiece("ride", "the ride", "The **ride** is the large cymbal that keeps time with a brighter, longer sound. It's written with an **x on the 5th line**.", "x on the 5th line."),
  "dr.groove.half": {
    title: "Half-time",
    body: [
      P("In **half-time** the snare lands only on **3**, giving a heavy \"half speed\" feel, even though the beat is the same."),
      EX({ groove: "dr.groove.half" }, "Half-time."),
      TIP("Very common in heavy ballad choruses and in metal."),
    ],
  },
  "dr.groove.16": {
    title: "Hi-hat in sixteenth notes",
    body: [
      P("With the hi-hat in **sixteenth notes** (\"1 e and a\") the groove becomes denser and funkier."),
      EX({ groove: "dr.groove.16" }, "Hi-hat in sixteenth notes."),
      TIP("For fast sixteenths, alternate hands on the hi-hat (right-left)."),
    ],
  },
  "dr.read.hhPedal": drumPiece("hhPedal", "the hi-hat with the foot", "The **foot hi-hat** (closing it by pressing the pedal) is written with an **x below** the staff.", "x below."),
  "dr.read.sideStick": drumPiece("sideStick", "the side stick", "The **side stick**: you lay the stick on the drumhead and strike the rim. It sounds like a woody \"tock\". It's written in the **3rd space** with a special notehead.", "3rd space, special notehead."),
  "dr.ghost": {
    title: "Ghost notes on the snare",
    body: [
      P("**Ghost notes** are **very soft** hits on the snare between the strong ones. They're written in parentheses."),
      P("They give the groove its swing: listen to Chad Smith (RHCP) or John Bonham."),
    ],
    quiz: [
      Q("A ghost note on the snare is...", "a very soft hit between the strong ones", "a hit on the rim", "a hit on the crash", "a rest"),
      Q("How are ghost notes usually written?", "In parentheses", "With an x", "With a circle", "In another color"),
    ],
  },
  "dr.shuffle": {
    title: "The shuffle",
    body: [
      P("The **shuffle** plays the hi-hat (or ride) with a **triplet** subdivision: long-short, long-short. It's the rhythm of blues and boogie."),
      P("The *Purdie shuffle* (Bernard Purdie) and the one Jeff Porcaro plays on *Rosanna* are the most famous; in Led Zeppelin, *Fool in the Rain*."),
    ],
    quiz: [
      Q("The shuffle uses a subdivision of...", "triplets (long-short)", "even sixteenths", "whole notes", "even eighths"),
      Q("In which styles is the shuffle typical?", "Blues and boogie", "Military march", "Electronic music", "Waltz"),
    ],
  },
  "dr.groove.68": {
    title: "Groove in 6/8",
    body: [
      P("In **6/8**: hi-hat on all six eighth notes, bass drum on **1** and snare on **4** (the start of the second group)."),
      EX({ groove: "dr.groove.68" }, "Groove in 6/8."),
    ],
  },
  "dr.odd": {
    title: "Grooves in odd meters",
    body: [
      P("In **7/8** or **5/4** the groove is built in **groups** (2 + 2 + 3, 3 + 2...). The snare usually marks the start of the last group."),
      P("Pink Floyd's *Money* has its drums in 7/4; progressive rock is full of examples."),
    ],
    quiz: [
      Q("To play in 7/8 it's best to...", "think in groups like 2 + 2 + 3", "play as in 4/4", "not use the bass drum", "count to 8"),
      Q("What meter are the drums of *Money* in?", "7/4", "4/4", "3/4", "6/8"),
    ],
  },
};
