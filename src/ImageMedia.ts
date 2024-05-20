// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { Media } from './Media.js';
import { MediaClip } from './MediaClip.js';

const enum State {
  Paused,
  Playing,
}

export class ImageMedia extends Media {
  private static DEFAULT_DURATION = 5;

  private _element: HTMLImageElement;

  private state: State = State.Paused;

  private lastTimestamp?: number;

  private currentTimestamp?: number;

  private _currentTime: number;

  constructor(mediaClip: MediaClip) {
    super(mediaClip);
    const image = document.createElement('img');
    image.loading = 'eager';
    image.crossOrigin = 'anonymous';
    image.src = this.mediaClip.src;
    this._element = image;
    this._currentTime = mediaClip.startTime || 0;
  }

  public get element() {
    return this._element;
  }

  public override isValidTexture() {
    return this._element.complete;
  }

  public resize(width: number, height: number) {
    // XXX resize filters? or dump Resizable
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
    if (this.state === State.Paused || this.currentTimestamp === undefined)
      return this._currentTime;
    if (this.lastTimestamp === undefined)
      this.lastTimestamp = this.currentTimestamp;
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
    this.currentTimestamp = undefined;
    this.lastTimestamp = undefined;
  }

  public stop() {
    this.pause();
    this._element.removeAttribute('src');
  }
}
