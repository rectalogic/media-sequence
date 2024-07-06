// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { TransitionInfo } from './schema/index.js';

interface TransitionsMap {
  [key: string]: TransitionInfo;
}

const wipe = (direction: 'top' | 'bottom' | 'left' | 'right') => {
  let top = '0';
  let bottom = '0';
  let left = '0';
  let right = '0';
  switch (direction) {
    case 'top':
      top = '100%';
      break;
    case 'bottom':
      bottom = '100%';
      break;
    case 'left':
      left = '100%';
      break;
    case 'right':
      right = '100%';
      break;
    default:
  }
  return [
    {
      keyframes: [
        {
          clipPath: `inset(${top} ${right} ${bottom} ${left})`,
        },
        {
          clipPath: 'inset(0)',
        },
      ],
    },
  ];
};

export const Transitions: TransitionsMap = {
  get crossFade() {
    return {
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
    };
  },
  get wipeLeft() {
    return {
      source: {},
      dest: {
        animations: wipe('left'),
      },
    };
  },
  get wipeRight() {
    return {
      source: {},
      dest: {
        animations: wipe('right'),
      },
    };
  },
  get wipeTop() {
    return {
      source: {},
      dest: {
        animations: wipe('top'),
      },
    };
  },
  get wipeBottom() {
    return {
      source: {},
      dest: {
        animations: wipe('bottom'),
      },
    };
  },
} as const;
