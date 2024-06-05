// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { Media } from './Media.js';
import { MediaClip } from './MediaClip.js';

export class ImageMedia extends Media<HTMLImageElement> {
  private static DEFAULT_DURATION = 5;

  private _playing: boolean = false;

  private lastTimestamp?: number;

  private currentTimestamp?: number;

  private _currentTime: number;

  constructor(mediaClip: MediaClip) {
    super(mediaClip, document.createElement('img'));
    this.element.loading = 'eager';
    this.element.crossOrigin = 'anonymous';
    this._currentTime = mediaClip.startTime;
  }

  public load() {
    return new Promise((resolve, reject) => {
      this.element.onerror = event =>
        reject(new Error('Image error', { cause: event }));
      this.element.onload = () => {
        this.onLoad();
        resolve(this);
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

  public override set animationTime(timestamp: number) {
    this.currentTimestamp = timestamp;
    super.animationTime = timestamp;
  }

  public get currentTime() {
    if (!this.playing || this.currentTimestamp === undefined)
      return this._currentTime;
    if (this.lastTimestamp === undefined)
      this.lastTimestamp = this.currentTimestamp;
    this._currentTime += (this.currentTimestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = this.currentTimestamp;
    return this._currentTime;
  }

  public get duration() {
    return this.mediaClip.endTime === undefined
      ? ImageMedia.DEFAULT_DURATION
      : this.mediaClip.endTime - this.mediaClip.startTime;
  }

  public get ended() {
    return (
      this.currentTime >=
      (this.mediaClip.endTime ||
        this.mediaClip.startTime + ImageMedia.DEFAULT_DURATION)
    );
  }

  public get playing(): boolean {
    return this._playing;
  }

  public play() {
    this._playing = true;
    this.currentTimestamp = undefined;
    this.lastTimestamp = undefined;
  }

  public pause() {
    this._playing = false;
    this.currentTimestamp = undefined;
    this.lastTimestamp = undefined;
  }

  public override dispose() {
    super.dispose();
    this.pause();
    this.element.removeAttribute('src');
  }
}
