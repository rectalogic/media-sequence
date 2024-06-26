// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { Media } from './Media.js';
import { MediaInfo } from './Playlist.js';

export class ImageMedia extends Media<HTMLImageElement> {
  private static DEFAULT_DURATION = 5000;

  constructor(mediaInfo: MediaInfo) {
    super(mediaInfo, document.createElement('img'));
    this.element.loading = 'eager';
    this.element.crossOrigin = 'anonymous';
  }

  protected handleLoad(
    resolve: (value: unknown) => void,
    reject: (reason?: any) => void,
  ) {
    this.element.onerror = event =>
      reject(new Error('Image error', { cause: event }));
    this.element.onload = () => {
      resolve(this);
    };
    this.element.src = this.mediaInfo.src;
  }

  public get duration() {
    return this.mediaInfo.endTime === undefined
      ? ImageMedia.DEFAULT_DURATION
      : this.mediaInfo.endTime - this.mediaInfo.startTime;
  }

  public play() {
    this.startClock();
  }

  public pause() {
    this.pauseClock();
  }

  public override cancel() {
    super.cancel();
    this.pause();
    this.element.removeAttribute('src');
  }
}
