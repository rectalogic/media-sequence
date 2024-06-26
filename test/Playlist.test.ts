// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT
import { expect } from '@open-wc/testing';
import { processMediaInfoArray } from '../src/Playlist.js';

describe('MediaInfo', () => {
  it('rejects bad MediaInfo', () => {
    const bad = [{ type: 'image' }];

    expect(() => processMediaInfoArray(bad)).to.throw();
  });
  it('accepts good MediaInfo', () => {
    const good = [{ type: 'video', src: 'video.mp4' }];

    expect(processMediaInfoArray(good)).to.eql([
      { type: 'video', src: 'video.mp4', startTime: 0, objectFit: 'contain' },
    ]);
  });
});
