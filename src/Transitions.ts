// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { TransitionInfo } from './Playlist.js';

export const Transitions: Record<string, TransitionInfo> = Object.freeze({
  crossFade: {
    source: { animations: [{ keyframes: [{ opacity: 1 }, { opacity: 0 }] }] },
    dest: {
      animations: [
        {
          keyframes: [
            { opacity: 0, 'mix-blend-mode': 'plus-lighter' },
            { opacity: 1, 'mix-blend-mode': 'plus-lighter' },
          ],
        },
      ],
    },
  },
});
