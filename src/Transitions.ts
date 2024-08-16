// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import * as animations from '@shoelace-style/animations';
import { TransitionInfo } from './schema/index.js';

// https://github.com/shoelace-style/animations/pull/4
declare module '@shoelace-style/animations' {
  export const bounceInDown: Animation;
  export const bounceOutDown: Animation;
  export const bounceInLeft: Animation;
  export const bounceOutLeft: Animation;
  export const bounceInRight: Animation;
  export const bounceOutRight: Animation;
  export const bounceInUp: Animation;
  export const bounceOutUp: Animation;
}

interface TransitionsMap {
  [key: string]: TransitionInfo;
}

const buildTransition = (source?: Keyframe[], dest?: Keyframe[]) => ({
  source: source ? { animations: [{ keyframes: source }] } : {},
  dest: dest
    ? {
        animations: [{ keyframes: dest }],
      }
    : {},
});

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
      clipPath: `inset(${top} ${right} ${bottom} ${left})`,
    },
    {
      clipPath: 'inset(0)',
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
    return buildTransition(undefined, wipe('left'));
  },
  get wipeRight() {
    return buildTransition(undefined, wipe('right'));
  },
  get wipeTop() {
    return buildTransition(undefined, wipe('top'));
  },
  get wipeBottom() {
    return buildTransition(undefined, wipe('bottom'));
  },
  get wipeFadeLeft() {
    //XXX we can't style pseudo element from JS via the element - add a way to insert additional html?
    //XXX or can we add the gradient as a background-image?
    // XXX just use mask-image and linear-gradient, and css variables in the gradient?
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
    //   .element:before {
    //     content: '';
    //     position: absolute;
    //     top: 0;
    //     right: 0;
    //     left: 0;
    //     height: 100%;
    //     background-image: linear-gradient(90deg, #000 0%, #fff 100%);
    // }
  },
  get bounceLeft() {
    return buildTransition(animations.bounceOutLeft, animations.bounceInRight);
  },
  get bounceRight() {
    return buildTransition(animations.bounceOutRight, animations.bounceInLeft);
  },
  get bounceUp() {
    return buildTransition(animations.bounceOutUp, animations.bounceInUp);
  },
  get bounceDown() {
    return buildTransition(animations.bounceOutDown, animations.bounceInDown);
  },
  get spotlight() {
    return {
      source: {},
      dest: {
        animations: [
          {
            keyframes: [
              { offset: 0, clipPath: 'circle(0% at 50% 50%)' },
              { offset: 0.25, clipPath: 'circle(20% at 80% 80%)' },
              { offset: 0.5, clipPath: 'circle(20% at 12% 84%)' },
              { offset: 0.75, clipPath: 'circle(20% at 93% 51%)' },
              { offset: 0.87, clipPath: 'circle(20% at 20% 20%)' },
              { offset: 1, clipPath: 'circle(100% at 50% 50%)' },
            ],
          },
        ],
      },
    };
  },
  get chevron() {
    return {
      source: {
        animations: [
          {
            keyframes: [
              {
                offset: 0,
                clipPath:
                  'polygon(100% 0%, 100% 50%, 100% 100%, 0% 100%, 0% 50%, 0% 0%)',
              },
              {
                offset: 0.25,
                clipPath:
                  'polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%, 0% 0%)',
              },
              {
                offset: 1,
                clipPath:
                  'polygon(175% 0%, 200% 50%, 175% 100%, 100% 100%, 125% 50%, 100% 0%)',
              },
            ],
          },
        ],
      },
      dest: {
        animations: [
          {
            keyframes: [
              {
                offset: 0,
                clipPath:
                  'polygon(-175% 0%, -200% 50%, -175% 100%, -100% 100%, -125% 50%, -100% 0%)',
              },
              {
                offset: 0.8,
                clipPath:
                  'polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%, 0% 0%)',
              },
              {
                offset: 1,
                clipPath:
                  'polygon(100% 0%, 100% 50%, 100% 100%, 0% 100%, 0% 50%, 0% 0%)',
              },
            ],
          },
        ],
      },
    };
  },
} as const;
