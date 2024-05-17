// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { Media } from './Media.js';
import { MediaClip } from './MediaClip.js';

enum State {
  Paused,
  Playing,
}

export class ImageMedia extends Media {
  private static DEFAULT_DURATION = 5;

  private _element: HTMLImageElement;

  private state: State = State.Paused;

  private lastTimestamp = 0;

  private currentTimestamp = 0;

  private _currentTime: number;

  constructor(mediaClip: MediaClip) {
    super(mediaClip);
    const image = document.createElement('img');
    image.className = 'image';
    image.style.visibility = 'hidden';
    image.loading = 'eager';
    image.crossOrigin = 'anonymous';
    image.src = this.mediaClip.src;
    this._element = image;
    this._currentTime = mediaClip.startTime || 0;
  }

  public get element() {
    return this._element;
  }

  public get intrinsicWidth() {
    return this._element.naturalWidth;
  }

  public get intrinsicHeight() {
    return this._element.naturalHeight;
  }

  public override set animationTime(timestamp: number) {
    this.currentTimestamp = timestamp;
  }

  public get currentTime() {
    if (this.state === State.Paused) return this._currentTime;
    this._currentTime += (this.currentTimestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = this.currentTimestamp;
    return this._currentTime;
  }

  public get ended() {
    return (
      this.currentTime >=
      (this.mediaClip.endTime || ImageMedia.DEFAULT_DURATION)
    );
  }

  public play() {
    this.state = State.Playing;
    this.lastTimestamp = this.currentTimestamp;
  }

  public pause() {
    this.state = State.Paused;
    this.lastTimestamp = this.currentTimestamp;
  }

  public stop() {
    this.pause();
    this._element.style.visibility = 'hidden';
    this._element.removeAttribute('src');
  }
}
