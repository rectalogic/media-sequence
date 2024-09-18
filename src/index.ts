// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import './mediafx-effect.js';
import './mediafx-video.js';
import './mediafx-image.js';
import './mediafx-transition.js';
import './mediafx-sequence.js';
import { addCustomTransition } from './Transitions.js';
import { addCustomEffect, addCustomTransformEffect } from './Effects.js';

declare global {
  interface Window {
    addCustomTransition: typeof addCustomTransition;
    addCustomEffect: typeof addCustomEffect;
    addCustomTransformEffect: typeof addCustomTransformEffect;
  }
}
window.addCustomTransition = addCustomTransition;
window.addCustomEffect = addCustomEffect;
window.addCustomTransformEffect = addCustomTransformEffect;
