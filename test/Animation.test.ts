// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT
import { expect } from '@open-wc/testing';
import { Animation } from '../src/Animation.js';

describe('Animation', () => {
  it('interpolates', () => {
    interface Props {
      x?: number;
      y?: number;
    }
    const animation = new Animation.Timeline<Props>([
      { offset: 0, properties: { x: 1 } },
      { offset: 0.5, properties: { y: 1 } },
      { offset: 1, properties: { x: 2, y: 2 } },
    ]);

    console.log(animation.tick(0));
    console.log(animation.tick(0.25));
    console.log(animation.tick(0.5));
    console.log(animation.tick(0.75));
    console.log(animation.tick(1.0));
  });
});
