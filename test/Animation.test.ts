// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT
import { expect } from '@open-wc/testing';
import { Animation } from '../src/Animation.js';

interface Props {
  x?: number;
  y?: number;
}

describe('Animation', () => {
  it('interpolates introducing new properties', () => {
    const animation = new Animation.Timeline<Props>([
      { offset: 0, properties: { x: 1 } },
      { offset: 0.5, properties: { y: 1 } },
      { offset: 1, properties: { x: 2, y: 2 } },
    ]);

    const results = [
      { t: 0, r: { x: 1 } },
      { t: 0.25, r: { x: 1.125 } },
      { t: 0.5, r: { y: 1, x: 1.5 } },
      { t: 0.75, r: { y: 1.25, x: 1.625 } },
      { t: 1, r: { x: 2, y: 2 } },
    ];
    for (const { t, r } of results) {
      expect(animation.tick(t)).to.eql(r);
    }
  });
  it('interpolates dropping existing properties', () => {
    const animation = new Animation.Timeline<Props>([
      { offset: 0, properties: { x: 1, y: 1 } },
      { offset: 0.5, properties: { y: 2 } },
      { offset: 1, properties: { y: 3 } },
    ]);

    const results = [
      { t: 0, r: { x: 1, y: 1 } },
      { t: 0.25, r: { x: 1, y: 1.25 } },
      { t: 0.5, r: { y: 2, x: 1 } },
      { t: 0.75, r: { y: 2.5, x: 1 } },
      { t: 1, r: { x: 1, y: 3 } },
    ];
    for (const { t, r } of results) {
      expect(animation.tick(t)).to.eql(r);
    }
  });
});
