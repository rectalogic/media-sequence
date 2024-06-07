// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT
import { expect, assert } from '@open-wc/testing';
import { ImageMedia } from '../src/ImageMedia.js';

class TestImageMedia extends ImageMedia {
  public override set currentTime(time: number) {
    this.synchronizeClock(time);
  }
}

describe('ImageMedia', () => {
  it('delays transforms', async () => {
    const media = new TestImageMedia({
      type: 'image',
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
      startTime: 0,
      objectFit: 'contain',
      transform: {
        startOffset: 1000,
        keyframes: [{ translateY: 0 }, { translateY: 1 }],
      },
    });
    await media.load();
    const container = document.createElement('div');
    container.style.width = '100px';
    container.style.height = '100px';
    container.style.display = 'inline-block';
    container.appendChild(media.renderableElement);
    document.body.appendChild(container);

    const element = media.renderableElement.querySelector('img');
    assert(element);
    const liveStyle = getComputedStyle(element);
    media.play();

    const results = [
      { time: 0, transform: 'none' },
      { time: 500, transform: 'none' },
      { time: 1000, transform: 'matrix(1, 0, 0, 1, 0, 0)' },
      { time: 1500, transform: 'matrix(1, 0, 0, 1, 0, 12.5)' },
      { time: 2500, transform: 'matrix(1, 0, 0, 1, 0, 37.5)' },
      { time: 4500, transform: 'matrix(1, 0, 0, 1, 0, 87.5)' },
      { time: 5000, transform: 'matrix(1, 0, 0, 1, 0, 100)' },
    ];
    for (const { time, transform } of results) {
      media.currentTime = time;
      expect(liveStyle.transform).to.equal(transform, `currentTime ${time}`);
    }
  });
});
