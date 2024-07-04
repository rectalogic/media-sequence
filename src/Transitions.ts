// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { TransitionInfo } from './schema/index.js';

interface TransitionsMap {
  [key: string]: TransitionInfo;
}

export const Transitions: TransitionsMap = {
  crossFade: {
    source: {
      style: { 'mix-blend-mode': 'plus-lighter' },
      animations: [{ keyframes: [{ opacity: 1 }, { opacity: 0 }] }],
    },
    dest: {
      animations: [
        {
          keyframes: [{ opacity: 0 }, { opacity: 1 }],
        },
      ],
    },
  },
} as const;
