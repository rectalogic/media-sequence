// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { Media, MediaLoadCallback, MediaErrorCallback } from './Media.js';
import { MediaClip } from './MediaClip.js';

export class ImageMedia extends Media {
  private static DEFAULT_DURATION = 5;

  private _element: HTMLImageElement;

  private _playing: boolean = false;

  private lastTimestamp?: number;

  private currentTimestamp?: number;

  private _currentTime: number;

  constructor(
    mediaClip: MediaClip,
    onLoad: MediaLoadCallback,
    onError: MediaErrorCallback,
  ) {
    super(mediaClip);
    const image = document.createElement('img');
    image.addEventListener('error', event => onError('Image error', event));
    image.addEventListener('load', () => {
      this.loaded = true;
      onLoad(this);
    });
    image.loading = 'eager';
    image.crossOrigin = 'anonymous';
    image.src = this.mediaClip.src;
    this._element = image;
    this._currentTime = mediaClip.startTime;
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

  public dispose() {
    this.pause();
    this._element.removeAttribute('src');
  }
}
