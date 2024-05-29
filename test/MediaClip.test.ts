// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT
import { expect } from '@open-wc/testing';
import { processMediaClipArray } from '../src/MediaClip.js';

describe('MediaClips', () => {
  it('rejects bad MediaClips', () => {
    const bad = [{ type: 'image' }];

    expect(() => processMediaClipArray(bad)).to.throw();
  });
  it('accepts good MediaClips', () => {
    const good = [{ type: 'video', src: 'video.mp4' }];

    expect(processMediaClipArray(good)).to.eql([
      { type: 'video', src: 'video.mp4', startTime: 0, objectFit: 'contain' },
    ]);
  });
});
