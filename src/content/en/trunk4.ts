// SPDX-License-Identifier: GPL-3.0-or-later
// Content (en): harmony, pentatonics, blues, modes, advanced rhythm and clefs.
import { type LessonTexts, P, TIP, EX, Q } from "../types";

function mode(name: string, formula: string, notes: string, color: string, ref: string): LessonTexts[string] {
  return {
    title: `The ${name} mode`,
    body: [P(`The **${name} mode**: ${formula}`), EX({ notes, clef: "treble", labels: true }, `${name} mode.`), P(color), TIP(ref)],
  };
}

export const TRUNK4: LessonTexts = {
  // ---------------- Harmony ----------------
  "h.field": {
    title: "Diatonic chords",
    body: [
      P("If you build a triad on **every note** of a major scale, using only notes from that scale, you get seven chords: the **[[h.field|diatonic chords]]** of the key (the harmonized scale)."),
      EX({ chords: ["C", "Dm", "Em", "F", "G", "Am", "Bdim"] }, "Diatonic chords of C major: C Dm Em F G Am B°."),
      P("The pattern is the same in every major key: **major, minor, minor, major, major, minor, diminished**."),
      TIP("Almost every rock song mainly uses the diatonic chords of its key."),
    ],
    quiz: [
      Q("What is the chord pattern of the harmonized major scale?", "Major, minor, minor, major, major, minor, diminished", "Major, major, minor, minor, major, minor, diminished", "All major", "Minor, major, major, minor, minor, major, augmented"),
      Q("In C major, which chord is built on A?", "Am", "A", "Adim", "A7"),
      Q("In G major, which chord is built on D?", "D", "Dm", "Ddim", "D+"),
    ],
  },
  "h.roman": {
    title: "Roman numeral degrees",
    body: [
      P("To talk about chords independently of the key, they're numbered with **Roman numerals**: **I ii iii IV V vi vii°**. Uppercase = major, lowercase = minor, ° = diminished."),
      EX({ chords: ["G", "C", "D", "G"] }, "In G major: I – IV – V – I."),
      P("So \"I – V – vi – IV\" describes the same progression in C (C G Am F), in G (G D Em C) or in any key."),
    ],
    quiz: [Q("In C major, which chord is V?", "G", "F", "Am", "Dm")],
  },
  "h.function": {
    title: "Functions: tonic, subdominant and dominant",
    body: [
      P("Chords have **functions**: **tonic** (T, rest: I, vi, iii), **[[h.function|subdominant]]** (SD, moving away: IV, ii) and **dominant** (D, tension that wants to return: V, vii°)."),
      EX({ chords: ["C", "F", "G", "C"] }, "T – SD – D – T: the basic journey of tonal music."),
      P("V is the dominant chord: it contains the leading tone (the 7th degree, a half step below the tonic), which pulls strongly toward I."),
    ],
    quiz: [
      Q("What function does V have?", "Dominant", "Tonic", "Subdominant", "None"),
      Q("What function does IV have?", "Subdominant", "Dominant", "Tonic", "Leading tone"),
      Q("vi can replace I because...", "it shares the tonic function", "it's a dominant", "it's diminished", "it has the leading tone"),
    ],
  },
  "ear.prog": {
    title: "Hearing progressions",
    body: [
      P("You'll hear short progressions and name their degrees. Start by finding **I** (rest), then **V** (tension) and finally **IV** (which feels like \"moving away\")."),
      EX({ chords: ["C", "G", "C"] }, "I – V – I."),
      EX({ chords: ["C", "F", "C"] }, "I – IV – I."),
      TIP("Sing the lowest note of each chord: C-G-C or C-F-C. That bass line gives you the answer."),
    ],
  },
  "h.cadence": {
    title: "Cadences",
    body: [
      P("A **[[h.cadence|cadence]]** is how a phrase ends. The four basic ones:"),
      P("**Authentic** (V → I): full closure. **Plagal** (IV → I): soft closure, the \"amen\". **Half cadence** (something → V): left hanging. **Deceptive** (V → vi): it seems to close and tricks you."),
      EX({ chords: ["C", "F", "G", "C"] }, "Authentic cadence."),
      EX({ chords: ["C", "F", "G", "Am"] }, "Deceptive cadence."),
    ],
  },
  "h.prog": {
    title: "Famous progressions",
    body: [
      P("Some chord sequences are used in hundreds of songs. **I – V – vi – IV** (C G Am F) is the most famous in pop-rock: *Let It Be* uses it in its verse."),
      EX({ chords: ["C", "G", "Am", "F"] }, "I – V – vi – IV."),
      P("**I – vi – IV – V** (C Am F G) is the 1950s doo-wop progression. **I – IV – V** is the foundation of rock and roll."),
      EX({ chords: ["C", "Am", "F", "G"] }, "I – vi – IV – V."),
    ],
    quiz: [Q("In G major, I – V – vi – IV is...", "G D Em C", "G C D G", "G Em C D", "G D C Em")],
  },
  "h.field7": {
    title: "Diatonic seventh chords",
    body: [
      P("If you add the scale's seventh to each diatonic triad, you get: **Imaj7 – ii7 – iii7 – IVmaj7 – V7 – vi7 – viiø7**."),
      EX({ chords: ["Cmaj7", "Dm7", "Em7", "Fmaj7", "G7", "Am7", "Bm7b5"] }, "In C major."),
      P("Only **V** gets a dominant seventh (7): that's why it's the chord with the most tension."),
    ],
    quiz: [Q("Which degree of the harmonized major scale is a dominant 7 chord?", "V", "I", "IV", "ii")],
  },
  "h.iiVI": {
    title: "The ii – V – I",
    body: [
      P("The **ii7 – V7 – Imaj7** progression is the heart of jazz and bossa nova: Dm7 – G7 – Cmaj7. ii prepares V, which resolves to I."),
      EX({ chords: ["Dm7", "G7", "Cmaj7"] }, "ii – V – I in C."),
      TIP("Notice how the bass moves in fifths: D → G → C."),
    ],
  },
  "h.field.minor": {
    title: "Diatonic chords in minor",
    body: [
      P("In natural minor the pattern is: **i – ii° – III – iv – v – VI – VII** (Am Bdim C Dm Em F G in A minor)."),
      EX({ chords: ["Am", "Dm", "Em", "Am"] }, "i – iv – v – i: it sounds modal, without strong tension."),
      P("To get a strong dominant, harmonic minor is used: v becomes major **V** (E instead of Em)."),
      EX({ chords: ["Am", "Dm", "E", "Am"] }, "i – iv – V – i: now there's tension and resolution."),
    ],
    quiz: [
      Q("In A natural minor, which chord is VI?", "F", "Fm", "D", "G"),
      Q("Why is a major V often used in minor?", "To get a leading tone and more pull toward the tonic", "Because it sounds sadder", "Because v doesn't exist", "Because of the key signature"),
    ],
  },
  "h.secdom": {
    title: "Secondary dominants",
    body: [
      P("You can \"borrow\" the power of V to reach **any** diatonic chord: the **V7 of that chord**. In C, to go to Dm you use **A7** (V7/ii)."),
      EX({ chords: ["C", "A7", "Dm", "G7", "C"] }, "C – A7 (V7/ii) – Dm – G7 – C."),
      P("They're called **[[h.secdom|secondary dominants]]** and show up constantly in the Beatles and Argentine rock."),
    ],
  },
  "h.borrowed": {
    title: "Modal interchange (borrowed chords)",
    body: [
      P("In a major key you can take chords from the **parallel minor** (same tonic): in C major, **Fm** (iv), **B♭** (♭VII) or **A♭** (♭VI). This is **[[h.borrowed|modal interchange]]**."),
      EX({ chords: ["C", "F", "Fm", "C"] }, "IV – iv: the famous switch to minor that sounds nostalgic."),
      EX({ chords: ["C", "Bb", "F", "C"] }, "♭VII – IV – I: pure rock (Beatles, Stones, AC/DC)."),
    ],
  },
  "h.tritone": {
    title: "Tritone substitution",
    body: [
      P("A 7 chord can be replaced by another 7 chord a **tritone** away: instead of G7, **D♭7**. They share the inner tritone (B–F)."),
      EX({ chords: ["Dm7", "Db7", "Cmaj7"] }, "ii – subV – I: the bass walks down chromatically D–D♭–C."),
      P("It's a jazz device you can hear in the music of Spinetta and Charly García."),
    ],
  },
  "h.modulation": {
    title: "Modulation",
    body: [
      P("To **[[h.modulation|modulate]]** is to change key within a song. The most common moves: going up a whole or half step for the last chorus, or moving to a neighboring key on the circle of fifths."),
      EX({ chords: ["C", "G", "C", "D7", "G"] }, "From C major to G major using D7 (the V of G)."),
      P("The classic way: use the V7 of the new key as a bridge."),
    ],
    quiz: [
      Q("To modulate is...", "to change key", "to change time signature", "to change tempo", "to change instrument"),
      Q("To modulate from C to G, which chord works as a bridge?", "D7", "F", "Am", "Bdim"),
    ],
  },
  "h.analysis": {
    title: "Harmonic analysis",
    body: [
      P("Analyzing means giving each chord its Roman numeral and function, and spotting what is **not** diatonic (secondary dominants, borrowed chords, substitutions)."),
      EX({ chords: ["C", "E7", "Am", "F", "Fm", "C"] }, "I – V7/vi – vi – IV – iv (borrowed) – I."),
      P("With this analysis you understand **why** a song sounds the way it does, and you can play it in any key."),
    ],
    quiz: [
      Q("In C major, E7 is...", "V7/vi (a secondary dominant)", "iii", "a borrowed chord", "I"),
      Q("In C major, Fm is...", "iv borrowed from C minor", "IV", "V/V", "vii°"),
    ],
  },

  // ---------------- Rock: pentatonics, blues and modes ----------------
  "sc.pentMinor": {
    title: "The minor pentatonic scale",
    body: [
      P("The minor **[[sc.pentMinor|pentatonic]]** has **five notes**: the minor scale without the 2nd and 6th degrees. A minor pentatonic: A C D E G."),
      EX({ notes: "A4 C5 D5 E5 G5", clef: "treble", labels: true }, "A minor pentatonic."),
      P("It's THE rock solo scale: Jimmy Page, Angus Young, Pappo, Gilmour. It almost never sounds wrong over a rock song in A."),
    ],
  },
  "sc.pentMajor": {
    title: "The major pentatonic scale",
    body: [
      P("The **major pentatonic** is the major scale without the 4th and 7th degrees: C D E G A."),
      EX({ notes: "C4 D4 E4 G4 A4", clef: "treble", labels: true }, "C major pentatonic."),
      P("It sounds bright, country, folk. It has the same notes as A minor pentatonic: they're relatives."),
    ],
  },
  "sc.blues": {
    title: "The blues scale",
    body: [
      P("The **blues scale** is the minor pentatonic plus one extra note: the **diminished fifth** (the *blue note*). In A: A C D **E♭** E G."),
      EX({ notes: "A4 C5 D5 Eb5 E5 G5", clef: "treble", labels: true }, "A blues."),
      P("That chromatic passing note is the sound of Hendrix, Pappo and Led Zeppelin's *Rock and Roll*."),
    ],
  },
  "h.blues12": {
    title: "The 12-bar blues",
    body: [
      P("The most famous form in blues and rock and roll: **12 bars** with three chords (I, IV and V), all with sevenths."),
      P("**I7 I7 I7 I7 | IV7 IV7 I7 I7 | V7 IV7 I7 V7**."),
      EX({ chords: ["A7", "D7", "A7", "E7"] }, "In A: A7 – D7 – A7 – E7, the four key moments."),
      TIP("Led Zeppelin's *Rock and Roll* and thousands of Pappo songs use this form."),
    ],
    quiz: [
      Q("How many bars does the classic blues form have?", "12", "8", "16", "4"),
      Q("Which degrees does the 12-bar blues use?", "I, IV and V", "I, ii and V", "I, vi and IV", "Only I"),
      Q("In a blues in A, which chord is IV7?", "D7", "E7", "A7", "G7"),
    ],
  },
  "mode.intro": {
    title: "The modes",
    body: [
      P("If you play the notes of C major but treat **another note as the tonic**, new colors appear: the **[[mode.intro|modes]]**. From C it's **Ionian** (the major scale), from D **Dorian**, from E **Phrygian**, from F **Lydian**, from G **Mixolydian**, from A **Aeolian** (natural minor) and from B **Locrian**."),
      EX({ notes: "D4 E4 F4 G4 A4 B4 C5 D5", clef: "treble", labels: true }, "Same white keys, but starting on D: the Dorian mode."),
      P("Each mode has a **characteristic note** that sets it apart. You'll meet them one by one."),
    ],
    quiz: [
      Q("The Ionian mode is the same as...", "the major scale", "natural minor", "the pentatonic", "the blues scale"),
      Q("The Aeolian mode is the same as...", "the natural minor scale", "the major scale", "harmonic minor", "the Dorian mode"),
      Q("If you play the white keys from G to G, which mode is it?", "Mixolydian", "Lydian", "Dorian", "Phrygian"),
    ],
  },
  "mode.dorian": mode("Dorian", "minor with a **major 6th**. D Dorian: D E F G A **B** C.", "D4 E4 F4 G4 A4 B4 C5 D5", "It's minor but not as dark: it has a bright, \"cool\" touch.", "Reference: *Oye Como Va* (Santana) and many Gilmour solos sound Dorian."),
  "mode.mixolydian": mode("Mixolydian", "major with a **minor 7th**. G Mixolydian: G A B C D E **F**.", "G4 A4 B4 C5 D5 E5 F5 G5", "It's the sound of classic rock: major but without the leading tone, with the swagger of a 7 chord.", "Reference: *Norwegian Wood* (Beatles) and lots of AC/DC riffs."),
  "mode.phrygian": mode("Phrygian", "minor with a **minor 2nd**. E Phrygian: E **F** G A B C D.", "E4 F4 G4 A4 B4 C5 D5 E5", "Dark and \"Spanish\": that half step above the tonic is its signature. Very common in metal.", "Reference: many Metallica riffs play with E–F on the low string."),
  "mode.lydian": mode("Lydian", "major with an **augmented 4th**. F Lydian: F G A **B** C D E.", "F4 G4 A4 B4 C5 D5 E5 F5", "Magical, floating, cinematic. The brightest of the modes.", "Reference: *The Simpsons* theme and many sci-fi soundtracks."),
  "mode.locrian": mode("Locrian", "with a **minor 2nd and a diminished 5th**. E Locrian: E **F** G A **B♭** C D.", "E4 F4 G4 A4 Bb4 C5 D5 E5", "Unstable: its tonic chord is diminished. Rarely used, and mostly in metal.", "It's the mode built on the 7th degree of the major scale."),

  // ---------------- Advanced rhythm ----------------
  "ts.6/8": {
    title: "6/8 time",
    body: [
      P("In **6/8** there are six eighth notes per bar, grouped in **threes**: it's felt in **two beats** of a dotted quarter. It's **compound time**."),
      EX({ rhythm: "8 8 8 8 8 8 | q 8 q 8 | q. q.", ts: "6/8" }, "Count: ONE-two-three, TWO-two-three."),
      P("It has a characteristic sway: *We Are the Champions* (Queen) and many ballads use it."),
    ],
    quiz: [
      Q("In 6/8, how many beats are felt per bar?", "2", "6", "3", "4"),
      Q("In 6/8, which note value lasts one beat?", "A dotted quarter", "A quarter", "An eighth", "A half"),
    ],
  },
  "rh.triplet": {
    title: "The triplet",
    body: [
      P("A **[[rh.triplet|triplet]]** is **three** notes in the space of **two**. Three triplet eighths take up one quarter-note beat (instead of two eighths)."),
      EX({ rhythm: "8t 8t 8t 8t 8t 8t q q", ts: "4/4" }, "Two triplet groups and two quarter notes."),
      TIP("Count \"tri-pl-et, tri-pl-et\": three syllables per beat."),
    ],
    quiz: [Q("A triplet of eighth notes takes up...", "one quarter-note beat", "half a beat", "two beats", "one and a half beats")],
  },
  "rh.sync": {
    title: "Syncopation",
    body: [
      P("**[[rh.sync|Syncopation]]** is an accent on a **weak** spot (for example, on the \"and\") that carries over the strong beat. It makes the rhythm \"push\"."),
      EX({ rhythm: "8 q 8 q q", ts: "4/4" }, "Eighth – quarter – eighth: the quarter starts on the \"and\" of 1."),
      P("It's all over funk, reggae and rock: the riff of *Back in Black* lives on syncopation."),
    ],
    quiz: [
      Q("Syncopation is...", "an accent on a weak beat that carries over", "a long rest", "a bar of 3 beats", "a very high note"),
      Q("In eighth–quarter–eighth, where does the quarter start?", "On the \"and\" of the first beat", "On the second beat", "On the first beat", "On the third beat"),
    ],
  },
  "ts.12/8": {
    title: "12/8 time",
    body: [
      P("**12/8**: twelve eighth notes in **four groups of three**. It feels like 4/4 where each beat is divided into three."),
      EX({ rhythm: "q. q. q. q. | 8 8 8 8 8 8 8 8 8 8 8 8", ts: "12/8" }, "Four dotted-quarter beats."),
      P("It's the time of slow blues: Led Zeppelin's *Since I've Been Loving You* is in 12/8."),
    ],
    quiz: [Q("How many beats are felt in 12/8?", "4", "12", "6", "3")],
  },
  "ts.9/8": {
    title: "9/8 time",
    body: [
      P("**9/8**: nine eighth notes in **three groups of three**. It's felt in three dotted-quarter beats."),
      EX({ rhythm: "q. q. q. | 8 8 8 8 8 8 8 8 8", ts: "9/8" }, "Three compound beats."),
    ],
    quiz: [Q("How many beats are felt in 9/8?", "3", "9", "4", "2")],
  },
  "rh.swing": {
    title: "Swing and shuffle",
    body: [
      P("In **swing** (or **shuffle**) eighth notes aren't played evenly: the first lasts longer than the second, like a triplet quarter + eighth. It's written as normal eighths marked *swing*."),
      EX({ rhythm: "qt 8t qt 8t qt 8t qt 8t", ts: "4/4" }, "This is how it sounds: long-short, long-short."),
      P("It's the lilt of blues and boogie, and of many Pappo songs."),
    ],
    quiz: [
      Q("In swing, two eighth notes sound...", "long-short", "even", "short-long", "like sixteenths"),
      Q("What is the swing subdivision similar to?", "A triplet", "A double dot", "Two sixteenths", "A whole note"),
    ],
  },
  "ts.5/4": {
    title: "5/4 time",
    body: [
      P("**5/4**: five quarter notes per bar. It's felt as **3 + 2** (or 2 + 3). It's an **odd meter**."),
      EX({ rhythm: "q q q q q | q q q h", ts: "5/4" }, "ONE-two-three FOUR-five: 3 + 2."),
      P("*Take Five* (Dave Brubeck) is the classic; in rock, Jethro Tull's *Living in the Past*."),
    ],
    quiz: [Q("How is 5/4 usually grouped?", "3 + 2 or 2 + 3", "5 + 0", "4 + 1", "Always 1 + 1 + 1 + 1 + 1")],
  },
  "ts.7/8": {
    title: "7/8 time",
    body: [
      P("**7/8**: seven eighth notes, in groups like **2 + 2 + 3** or **3 + 2 + 2**. It sounds \"limping\", with a beat that arrives early."),
      EX({ rhythm: "8 8 8 8 8 8 8 | q q q.", ts: "7/8" }, "2 + 2 + 3."),
      P("Common in progressive rock and Balkan music. Spinetta used it in several songs."),
    ],
    quiz: [Q("A possible grouping of 7/8 is...", "2 + 2 + 3", "4 + 4", "3 + 3", "2 + 2 + 2")],
  },
  "ts.2/2": {
    title: "2/2 time (cut time)",
    body: [
      P("**2/2**: two **half-note** beats per bar. It's written like 4/4 but felt in two. Sometimes it's marked with a slashed C."),
      EX({ rhythm: "h h | q q q q", ts: "2/2" }, "Two half-note beats."),
      P("It's used for fast music: two long beats are easier to read than four short ones."),
    ],
    quiz: [Q("In 2/2, which note value lasts one beat?", "The half note", "The quarter note", "The whole note", "The eighth note")],
  },
  "ts.odd": {
    title: "Other odd meters",
    body: [
      P("There are many more: **7/4**, **11/8**, **13/8**... They're always read by grouping into blocks of 2 and 3."),
      EX({ rhythm: "q q q q q q q", ts: "7/4" }, "7/4: the meter of the bass riff in *Money* (Pink Floyd)."),
      P("The trick is to find the grouping (for example 4 + 3) and count out loud."),
    ],
    quiz: [
      Q("Pink Floyd's *Money* is in...", "7/4", "4/4", "6/8", "3/4"),
      Q("To read an odd meter it helps to...", "group it into blocks of 2 and 3", "count straight through", "ignore the time signature", "play faster"),
    ],
  },
  "rh.tuplet": {
    title: "Tuplets (quintuplets, sextuplets)",
    body: [
      P("Like the triplet, there are **quintuplets** (5 in the space of 4), **sextuplets** (6 in the space of 4) and others. They're marked with a number over the group."),
      P("They're common in fast guitar solos and drum fills."),
    ],
    quiz: [
      Q("A sixteenth-note quintuplet is...", "5 sixteenths in the space of 4", "5 eighths in a bar", "5 beats", "a bar of 5/4"),
      Q("How is a tuplet marked?", "With a number over the group", "With a dot", "With a tie", "With a clef"),
    ],
  },
  "rh.ddot": {
    title: "The double dot",
    body: [
      P("Two dots add half **and** a quarter of the value: a double-dotted half note = 2 + 1 + ½ = **three and a half beats**."),
      EX({ rhythm: "h.. 8 | w", ts: "4/4" }, "A double-dotted half note + an eighth."),
    ],
    quiz: [
      Q("How long does a double-dotted quarter note last?", "1 and three quarters beats", "1 and a half beats", "2 beats", "3 beats"),
      Q("How long does a double-dotted half note last?", "3 and a half beats", "3 beats", "4 beats", "2 and a half beats"),
    ],
  },
  "rh.32": {
    title: "The thirty-second note",
    body: [
      P("The **[[rh.32|thirty-second note]]** has three flags (or three beams). It lasts **an eighth of a beat**: eight fit in a quarter note."),
      EX({ rhythm: "32 32 32 32 32 32 32 32 q h", ts: "4/4" }, "Eight thirty-seconds = one quarter note."),
    ],
    quiz: [Q("How many thirty-second notes fit in an eighth note?", "4", "2", "8", "3")],
  },
  "rh.poly": {
    title: "Polyrhythm",
    body: [
      P("A **polyrhythm** is two different divisions of the same time sounding together. The most common: **3 against 2** (a triplet in one hand and two eighths in the other)."),
      P("A phrase to practice it: \"*nice cup of tea*\" fits 3 against 2. In rock it's used by Tool, Meshuggah... and Charly García in his most experimental periods."),
    ],
    quiz: [
      Q("A 3-against-2 polyrhythm is...", "three notes against two in the same time", "a bar of 3/2", "three bars and two rests", "a single triplet"),
      Q("What do you need to play a polyrhythm?", "Independence between hands or voices", "To play louder", "An odd meter", "Only a metronome"),
    ],
  },

  // ---------------- Clefs and registers ----------------
  "read.treble.high": {
    title: "High notes with ledger lines",
    body: [
      P("Above G5 the staff extends with **ledger lines**: **A5** (on the 1st ledger line), **B5** (above it), **C6** (on the 2nd ledger line)."),
      EX({ notes: "G5 A5 B5 C6", clef: "treble", labels: true }, "G5, A5, B5 and C6."),
      TIP("Count ledger lines outward, just like the lines of the staff."),
    ],
  },
  "read.treble.low": {
    title: "Low notes in treble clef",
    body: [
      P("Below middle C come **B3**, **A3** (on its own ledger line, the 2nd) and **G3**."),
      EX({ notes: "C4 B3 A3 G3", clef: "treble", labels: true }, "C4, B3, A3 and G3."),
    ],
  },
  "read.bass.high": {
    title: "High notes in bass clef",
    body: [
      P("Above middle C, in bass clef, come **D4** and **E4** (on the 2nd ledger line)."),
      EX({ notes: "C4 D4 E4", clef: "bass", labels: true }, "C4, D4 and E4 in bass clef."),
    ],
  },
  "read.bass.low": {
    title: "Low notes in bass clef",
    body: [
      P("Below E2 come **D2** and **C2** (on the 2nd ledger line). These are notes in the electric bass's range."),
      EX({ notes: "E2 D2 C2", clef: "bass", labels: true }, "E2, D2 and C2."),
    ],
  },
  "t.octaveClef": {
    title: "The treble clef with an 8 (guitar)",
    body: [
      P("The guitar sounds **an octave lower** than written. To show this, a treble clef with a **small 8 below** is used."),
      P("The same goes for the electric bass in bass clef: it sounds an octave lower. This avoids piles of ledger lines."),
    ],
    quiz: [
      Q("A treble clef with an 8 below means...", "it sounds an octave lower", "it sounds an octave higher", "play it 8 times", "it's a bar of 8"),
      Q("Which instrument is written this way?", "The guitar", "The drums", "The piano", "The flute"),
    ],
  },
  "clef.alto": {
    title: "The alto clef (C clef on the 3rd line)",
    body: [
      P("The **[[clef.alto|C clef]]** marks where **middle C** is. On the **3rd line** (alto clef) it's used by the viola."),
      EX({ notes: "C4 D4 E4 F4 G4", clef: "alto", labels: true }, "C4 on the middle line."),
      P("Reading it is a great mental workout: everything shifts compared to the clefs you already know."),
    ],
    quiz: [
      Q("In alto clef, which note is on the 3rd line?", "C4", "G4", "F3", "A4"),
      Q("Which instrument uses the alto clef?", "The viola", "The piano", "The guitar", "The drums"),
    ],
  },
  "clef.tenor": {
    title: "The tenor clef (C clef on the 4th line)",
    body: [
      P("On the **4th line** the C clef (tenor clef) is used for high passages on the cello, bassoon and trombone."),
      EX({ notes: "C4 D4 E4", clef: "tenor", labels: true }, "C4 on the 4th line."),
    ],
    quiz: [
      Q("In tenor clef, where is C4?", "On the 4th line", "On the 3rd line", "On the 1st line", "Above the staff"),
      Q("A C clef always shows...", "where C4 is", "where G4 is", "where F3 is", "the time signature"),
    ],
  },
};
