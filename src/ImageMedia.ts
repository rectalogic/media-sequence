// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { Media } from './Media.js';
import { MediaClip } from './MediaClip.js';

export class ImageMedia extends Media<HTMLImageElement> {
  private static DEFAULT_DURATION = 5000;

  constructor(mediaClip: MediaClip) {
    super(mediaClip, document.createElement('img'));
    this.element.loading = 'eager';
    this.element.crossOrigin = 'anonymous';
  }

  public load() {
    return new Promise((resolve, reject) => {
      this.element.onerror = event =>
        reject(new Error('Image error', { cause: event }));
      this.element.onload = () => {
        try {
          this.onLoad();
          resolve(this);
        } catch (error) {
          reject(error);
        }
      };
      this.element.src = this.mediaClip.src;
    });
  }

  public get intrinsicWidth() {
    return this.element.naturalWidth;
  }

  public get intrinsicHeight() {
    return this.element.naturalHeight;
  }

  public get duration() {
    return this.mediaClip.endTime === undefined
      ? ImageMedia.DEFAULT_DURATION
      : this.mediaClip.endTime - this.mediaClip.startTime;
  }

  public override play() {
    this.startClock();
  }

  public override pause() {
    this.pauseClock();
  }

  public override dispose() {
    super.dispose();
    this.pause();
    this.element.removeAttribute('src');
  }
}
