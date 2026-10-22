// SPDX-License-Identifier: GPL-3.0-or-later
import type { LessonTexts } from "../types";
import { TRUNK1 } from "./trunk1";
import { TRUNK2 } from "./trunk2";
import { TRUNK3 } from "./trunk3";
import { TRUNK4 } from "./trunk4";
import { PIANO } from "./piano";
import { GUITAR } from "./guitar";
import { BASS, DRUMS } from "./bassdrums";

export const ES_AR: LessonTexts = { ...TRUNK1, ...TRUNK2, ...TRUNK3, ...TRUNK4, ...PIANO, ...GUITAR, ...BASS, ...DRUMS };
