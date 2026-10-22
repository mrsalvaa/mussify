// SPDX-License-Identifier: GPL-3.0-or-later
// Content (en): scales, keys, key signatures and chords.
import { type LessonTexts, P, TIP, EX, Q } from "../types";

function keyLesson(fifths: number, name: string, accs: string, scale: string, extra: string): LessonTexts[string] {
  const kind = fifths > 0 ? "sharp" : "flat";
  const n = Math.abs(fifths);
  return {
    title: `${name} major (${n} ${kind}${n === 1 ? "" : "s"})`,
    body: [
      P(`The **${name} major** scale needs **${accs}** to keep the W W H W W W H pattern: ${scale}.`),
      EX({ emptyStaff: true, clef: "treble", key: fifths }, `${name} major key signature.`),
      P(`Instead of writing those accidentals on every note, they're written **once** at the start of each line: that's the **[[ks.1|key signature]]**. They apply to **every** note with that name, in any octave.`),
      TIP(extra),
    ],
    quiz: [Q(`How many ${kind}s does the ${name} major key signature have?`, String(n), String(n + 1), String(Math.max(0, n - 1)), String(n + 2))],
  };
}

export const TRUNK3: LessonTexts = {
  "sc.major": {
    title: "The major scale",
    body: [
      P("A **[[sc.major|scale]]** is a series of notes in order, going up (or down) step by step. The most important one is the **major scale**. **C major** is the white keys from C to C."),
      EX({ notes: "C4 D4 E4 F4 G4 A4 B4 C5", clef: "treble", labels: true }, "C major scale."),
      P("Its secret is in the distances: **W W H W W W H** (whole, whole, half, whole, whole, whole, half). Any scale that follows that pattern sounds \"major\", wherever it starts."),
      P("Each note of the scale is called a **degree**: C is the 1st, D the 2nd... up to B, the 7th."),
      TIP("Sing Do-Re-Mi-Fa-Sol-La-Ti-Do: that feeling of \"arriving home\" at the end is the major scale."),
    ],
    quiz: [
      Q("What is the step pattern of the major scale?", "W W H W W W H", "W H W W H W W", "W W W H W W H", "H W W W H W W"),
      Q("Between which degrees of the major scale are the half steps?", "3rd-4th and 7th-8th", "1st-2nd and 5th-6th", "2nd-3rd and 6th-7th", "Between all of them"),
    ],
  },
  "t.key": {
    title: "Key and tonic",
    body: [
      P("When a song uses the notes of a major scale and feels like one note is \"home\", we say it's in that **[[t.key|key]]**. The home note is called the **[[t.key|tonic]]**."),
      EX({ notes: "E4 D4 C4 D4 E4 E4 E4", clef: "treble" }, "This melody uses notes from C major and rests on C: it's in C major."),
      P("*Let It Be* is in C major: the whole song revolves around C and ends there. *Wish You Were Here* is in G major."),
      TIP("To find the tonic, sing the note where the melody seems to \"end\" or rest."),
    ],
    quiz: [
      Q("The tonic is...", "the \"home\" note of the key", "the highest note", "the last note of the scale", "a sharp note"),
      Q("A song in C major mostly uses...", "the notes of the C major scale", "only the note C", "black keys", "random notes"),
    ],
  },
  "ks.1": keyLesson(1, "G", "F♯", "G A B C D E **F♯** G", "Trick: the last sharp in the key signature is a half step below the tonic (F♯ → G)."),
  "ks.-1": keyLesson(-1, "F", "B♭", "F G A **B♭** C D E F", "Trick: with a single flat, the key is F major. Memorize it."),
  "ks.2": keyLesson(2, "D", "F♯ and C♯", "D E **F♯** G A B **C♯** D", "The last sharp is C♯: a half step above it is D, the tonic."),
  "ks.-2": keyLesson(-2, "B♭", "B♭ and E♭", "**B♭** C D **E♭** F G A B♭", "Trick: with two or more flats, the **second-to-last** flat is the tonic (B♭, E♭ → B♭ major)."),
  "ks.3": keyLesson(3, "A", "F♯, C♯ and G♯", "A B **C♯** D E **F♯** **G♯** A", "Last sharp G♯ → tonic A."),
  "ks.-3": keyLesson(-3, "E♭", "B♭, E♭ and A♭", "**E♭** F G **A♭** **B♭** C D E♭", "Second-to-last flat: E♭ → E♭ major."),
  "ks.4": keyLesson(4, "E", "F♯, C♯, G♯ and D♯", "E **F♯** **G♯** A B **C♯** **D♯** E", "Lots of guitar rock is in E: it makes the most of the open E and A strings."),
  "ks.-4": keyLesson(-4, "A♭", "B♭, E♭, A♭ and D♭", "**A♭** **B♭** C **D♭** **E♭** F G A♭", "Second-to-last flat: A♭ → A♭ major."),
  "ks.far": {
    title: "Key signatures with 5, 6 and 7 accidentals",
    body: [
      P("The more distant keys use many accidentals: **B major** (5♯), **F♯ major** (6♯), **C♯ major** (7♯), **D♭ major** (5♭), **G♭ major** (6♭) and **C♭ major** (7♭)."),
      EX({ emptyStaff: true, clef: "treble", key: 5 }, "B major: five sharps."),
      EX({ emptyStaff: true, clef: "treble", key: -5 }, "D♭ major: five flats."),
      P("The usual tricks still work: last sharp + a half step = tonic; second-to-last flat = tonic."),
      TIP("F♯ major (6♯) and G♭ major (6♭) sound the same: they're enharmonic keys."),
    ],
    quiz: [
      Q("How many sharps does B major have?", "5", "4", "6", "2"),
      Q("How many flats does D♭ major have?", "5", "3", "6", "4"),
    ],
  },
  "t.circle5": {
    title: "The circle of fifths",
    body: [
      P("If you order the keys going up by **perfect fifths** (C → G → D → A → E...), each one has **one more sharp**. Going down by fifths (C → F → B♭ → E♭...), each one adds **one flat**. That cycle is called the **[[t.circle5|circle of fifths]]**."),
      P("The order of sharps is **F C G D A E B**; the order of flats is the reverse: **B E A D G C F**."),
      EX({ emptyStaff: true, clef: "treble", key: 4 }, "E major: F♯ C♯ G♯ D♯, always in that order."),
      TIP("Neighboring keys on the circle share almost all their notes: that's why it's easy to move between them."),
    ],
    quiz: [
      Q("What is the order of sharps?", "F C G D A E B", "C D E F G A B", "B E A D G C F", "G D A E B F C"),
      Q("Going up a fifth from D major you reach...", "A major (3♯)", "G major (1♯)", "E major (4♯)", "F major (1♭)"),
      Q("What is the first flat to appear in a key signature?", "B♭", "F♭", "E♭", "A♭"),
    ],
  },
  "sc.minor": {
    title: "The natural minor scale",
    body: [
      P("The **natural minor scale** has a different pattern: **W H W W H W W**. It sounds darker, more melancholic. **A minor** is the white keys from A to A."),
      EX({ notes: "A4 B4 C5 D5 E5 F5 G5", clef: "treble", labels: true }, "A natural minor scale."),
      P("The key difference from major is the **third**: in minor, the 3rd degree is a minor third above the tonic."),
      TIP("*Stairway to Heaven* is in A minor."),
    ],
    quiz: [
      Q("What is the step pattern of the natural minor scale?", "W H W W H W W", "W W H W W W H", "W W W H W W H", "H W W H W W W"),
      Q("The A natural minor scale uses...", "only white keys", "one sharp", "one flat", "all black keys"),
    ],
  },
  "t.relative": {
    title: "Relative keys",
    body: [
      P("C major and A minor use **exactly the same notes** and the same key signature (no accidentals). They're **[[t.relative|relative]]** keys."),
      P("The relative minor is **a minor third below** the major: G major ↔ E minor (1♯), F major ↔ D minor (1♭)."),
      EX({ emptyStaff: true, clef: "treble", key: 1 }, "One key signature, two possible keys: G major or E minor."),
      TIP("To tell which one it is, notice which note the melody rests on, especially at the end."),
    ],
    quiz: [
      Q("What is the relative minor of C major?", "A minor", "C minor", "E minor", "D minor"),
      Q("What is the relative major of E minor?", "G major", "E major", "C major", "A major"),
    ],
  },
  "sc.harmonicMinor": {
    title: "The harmonic minor scale",
    body: [
      P("The **harmonic minor** is the natural minor with the **7th degree raised** a half step. In D minor: D E F G A B♭ **C♯** D."),
      EX({ notes: "D4 E4 F4 G4 A4 Bb4 C#5 D5", clef: "treble", labels: true }, "D harmonic minor."),
      P("That leap between B♭ and C♯ (a step and a half) gives it an \"Arabic\" or \"Spanish\" color, widely used in neoclassical metal."),
    ],
    quiz: [Q("What does harmonic minor change compared to natural minor?", "It raises the 7th degree", "It lowers the 3rd degree", "It raises the 3rd degree", "It removes the 7th degree")],
  },
  "sc.melodicMinor": {
    title: "The melodic minor scale",
    body: [
      P("The **melodic minor** raises the **6th and 7th** degrees. In D minor: D E F G A **B C♯** D. This smooths out the harmonic minor's leap."),
      EX({ notes: "D4 E4 F4 G4 A4 B4 C#5 D5", clef: "treble", labels: true }, "D melodic minor (ascending)."),
      TIP("In classical music it returns to natural minor when descending; in jazz it's used the same both ways."),
    ],
    quiz: [Q("Which degrees does melodic minor raise?", "The 6th and 7th", "Only the 7th", "The 3rd and 7th", "The 2nd and 6th")],
  },

  // ---------------- Chords ----------------
  "ch.maj": {
    title: "The major chord",
    body: [
      P("A **[[ch.maj|chord]]** is three or more notes sounding together. The most basic is the major **[[ch.maj|triad]]**: a note (the **root**), its **major third** and its **perfect fifth**."),
      EX({ notes: "[C4 E4 G4] [F4 A4 C5] [G4 B4 D5]", clef: "treble" }, "C major (C-E-G), F major (F-A-C) and G major (G-B-D)."),
      P("In songs it's written with the root's letter: **C** = C major, **F** = F major, **G** = G major. This way of writing chords is called a **[[ch.maj|chord symbol]]**."),
      EX({ chords: ["C", "F", "G", "C"] }, "C – F – G – C."),
      TIP("Trick: a major chord skips every other note of the scale: C-(D)-E-(F)-G."),
    ],
    quiz: [
      Q("Which notes make up a C major chord?", "C E G", "C D E", "C F A", "C E♭ G"),
      Q("A major triad has...", "a root, a major 3rd and a perfect 5th", "a root, a minor 3rd and a perfect 5th", "a root and a 5th", "four notes"),
    ],
  },
  "t.cifrado": {
    title: "Letter and solfège chord symbols",
    body: [
      P("There are two ways to write chords: **letter symbols** use letters (**C D E F G A B**) and **solfège symbols**, common in Spanish- and Italian-speaking countries, use the names (**Do Re Mi Fa Sol La Si**)."),
      EX({ chords: ["G", "D", "C"] }, "G – D – C = Sol – Re – Do."),
      P("Most songbooks and chord sheets online use letters, but many method books from Latin America and Europe use solfège. You can choose which one to see in Settings."),
    ],
    quiz: [
      Q("How is Sol major written with letters?", "G", "S", "Sol", "D"),
      Q("Which chord is A in solfège?", "La", "Re", "Do", "Mi"),
    ],
  },
  "ch.min": {
    title: "The minor chord",
    body: [
      P("The **minor triad** changes just one thing: the third is **minor**. Root + minor 3rd + perfect 5th. A minor = A-C-E."),
      EX({ notes: "[A4 C5 E5] [D4 F4 A4] [E4 G4 B4]", clef: "treble" }, "A minor, D minor and E minor."),
      P("In chord symbols you add a lowercase **m**: **Am**, **Dm**, **Em**."),
      EX({ chords: ["C", "Am", "C", "Am"] }, "Major and minor: hear the change of color."),
      TIP("Major sounds bright, minor sounds melancholic. It's the first difference the ear learns."),
    ],
  },
  "ch.dim": {
    title: "The diminished chord",
    body: [
      P("The **diminished chord** stacks two minor thirds: root + minor 3rd + **diminished 5th**. B diminished = B-D-F."),
      EX({ notes: "[B4 D5 F5]", clef: "treble" }, "B diminished."),
      P("It's written **dim** or **°**: B° or Bdim. It sounds tense and unstable; it wants to resolve to another chord."),
    ],
  },
  "ch.aug": {
    title: "The augmented chord",
    body: [
      P("The **augmented chord** stacks two major thirds: root + major 3rd + **augmented 5th**. C augmented = C-E-G♯."),
      EX({ notes: "[C4 E4 G#4]", clef: "treble" }, "C augmented."),
      P("It's written **aug** or **+**: C+ or Caug. It sounds mysterious, dreamy or suspenseful."),
    ],
  },
  "ch.inv": {
    title: "Chord inversions",
    body: [
      P("A chord's notes can be stacked in different orders. What changes the **[[ch.inv|inversion]]** is **which note ends up at the bottom** (in the bass):"),
      EX({ notes: "[C4 E4 G4] [E4 G4 C5] [G4 C5 E5]", clef: "treble" }, "C major in root position, 1st inversion and 2nd inversion."),
      P("**Root position**: the root at the bottom. **1st inversion**: the third at the bottom. **2nd inversion**: the fifth at the bottom."),
      TIP("Inversions let you move from chord to chord with little finger movement, and they subtly change the color."),
    ],
  },
  "ch.sus": {
    title: "Suspended chords (sus2 and sus4)",
    body: [
      P("In a **suspended** chord the third is replaced: **sus4** uses the perfect fourth and **sus2** the major second. With no third, it's neither major nor minor."),
      EX({ notes: "[D4 G4 A4] [D4 F#4 A4] [D4 E4 A4]", clef: "treble" }, "Dsus4, D and Dsus2."),
      P("They sound open, \"up in the air\". In rock it's very common to decorate a chord by moving through sus4 and back."),
    ],
  },
  "ch.5": {
    title: "The power chord (fifth chord)",
    body: [
      P("The **[[ch.5|power chord]]** is just the root and the **perfect fifth** (sometimes with the octave). It's written with a **5**: E5, A5, G5."),
      EX({ notes: "[E4 B4] [G4 D5] [A4 E5]", clef: "treble" }, "E5, G5 and A5."),
      P("With no third, it's neither major nor minor: that's why it sounds so good with distortion. AC/DC, Metallica and La Renga use it all the time."),
    ],
  },
  "ch.7": {
    title: "The seventh chord (dominant)",
    body: [
      P("You can add a **minor seventh** to a major chord: G-B-D-**F**. This is the **dominant seventh**, written **G7**."),
      EX({ notes: "[G4 B4 D5 F5]", clef: "treble" }, "G7."),
      EX({ chords: ["G7", "C"] }, "G7 wants to resolve to C: hear the tension and the release."),
      TIP("It's the sound of the blues and rock and roll: many songs use only seventh chords."),
    ],
  },
  "ch.maj7": {
    title: "The major seventh chord (maj7)",
    body: [
      P("Major + **major seventh**: C-E-G-**B**. It's written **Cmaj7** (or **C△7**)."),
      EX({ notes: "[C4 E4 G4 B4]", clef: "treble" }, "Cmaj7."),
      P("It sounds soft, dreamy, sophisticated. Very common in harmonically rich rock (Spinetta, Charly García) and in bossa nova."),
    ],
  },
  "ch.m7": {
    title: "The minor seventh chord (m7)",
    body: [
      P("Minor + **minor seventh**: A-C-E-**G**. It's written **Am7**."),
      EX({ notes: "[A4 C5 E5 G5]", clef: "treble" }, "Am7."),
      P("Softer and \"jazzier\" than a plain minor chord. It's one of the most used chords in ballads."),
    ],
  },
  "ch.m7b5": {
    title: "The half-diminished chord (m7♭5)",
    body: [
      P("Diminished + **minor seventh**: E-G-B♭-**D**. It's written **Em7♭5** or **Eø**."),
      EX({ notes: "[E4 G4 Bb4 D5]", clef: "treble" }, "Em7♭5."),
      P("It appears on the 7th degree of the major scale and is key in jazz minor progressions."),
    ],
  },
  "ch.dim7": {
    title: "The diminished seventh chord (dim7)",
    body: [
      P("Three stacked minor thirds: C♯-E-G-**B♭**. It's written **C♯°7** or **C♯dim7**. All its notes are the same distance apart (3 half steps)."),
      EX({ notes: "[C#4 E4 G4 Bb4]", clef: "treble" }, "C♯°7."),
      TIP("It's the chord of old horror movies: symmetrical, tense and ambiguous."),
    ],
  },
  "ch.6": {
    title: "Sixth chords (6 and m6)",
    body: [
      P("You can add the **major sixth** to a triad: C-E-G-**A** = **C6**. In minor: A-C-E-**F♯** = **Am6**."),
      EX({ notes: "[C4 E4 G4 A4] [A4 C5 E5 F#5]", clef: "treble" }, "C6 and Am6."),
      P("C6 has a retro flavor, 1950s rock and roll and the Beatles."),
    ],
  },
  "ch.add9": {
    title: "add9 chords",
    body: [
      P("**add9** adds the **ninth** (the second, an octave up) to a triad, with no seventh: C-E-G-**D** = **Cadd9**."),
      EX({ notes: "[C4 E4 G4 D5]", clef: "treble" }, "Cadd9."),
      P("It sounds bright and modern; a classic of acoustic guitar in pop-rock."),
    ],
  },
  "ch.ext": {
    title: "Extensions: 9, 11 and 13",
    body: [
      P("On top of a seventh chord you can keep stacking thirds: the **ninth (9)**, the **eleventh (11)** and the **thirteenth (13)**. C9 = C-E-G-B♭-**D**."),
      EX({ notes: "[C4 E4 G4 Bb4 D5]", clef: "treble" }, "C9."),
      P("In practice not every note is played: the fifth is usually left out (and sometimes the root, which the bass plays)."),
      TIP("7♭9 and 7♯9 alter the ninth: 7♯9 is the famous \"Hendrix chord\" from *Purple Haze*."),
    ],
  },
  "ch.slash": {
    title: "Slash chords",
    body: [
      P("**G/B** reads \"G over B\": a G chord with the note B in the bass. The slash shows **which note goes at the bottom**."),
      EX({ chords: ["C", "G/B", "Am"] }, "C – G/B – Am: the bass walks down C–B–A, very smoothly."),
      P("It's used to write inversions (G/B is G's 1st inversion) or bass notes that aren't in the chord (C/D)."),
    ],
    quiz: [
      Q("What does D/F♯ mean?", "A D chord with F♯ in the bass", "A D chord, then F♯", "D minor", "D seventh"),
      Q("C/E is...", "C major in 1st inversion", "C major in root position", "E minor", "C major in 2nd inversion"),
      Q("In G/B, which note does the bass play?", "B", "G", "D", "A"),
    ],
  },
};
