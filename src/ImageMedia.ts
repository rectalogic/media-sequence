// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { Media } from './Media.js';
import { MediaClip } from './MediaClip.js';

export class ImageMedia extends Media {
  private _element: HTMLImageElement;

  constructor(mediaClip: MediaClip) {
    super(mediaClip);
    const image = document.createElement('img');
    image.className = 'image';
    image.style.visibility = 'hidden';
    image.loading = 'eager';
    image.crossOrigin = 'anonymous';
    image.src = this.mediaClip.src;
    // XXX need to compute time, also simulated ended?
    // XXX image.currentTime = this.mediaClip.startTime || 0;

    this._element = image;
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

  public get currentTime() {
    return 0; // XXX this._element.currentTime;
  }

  public get ended() {
    return true; // XXX
  }

  public play() {
    // this._element.play();
  }

  public pause() {
    // this._element.pause();
  }

  public stop() {
    this.pause();
    this._element.style.visibility = 'hidden';
    this._element.removeAttribute('src');
  }
}
