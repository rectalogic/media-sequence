// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { Media, ErrorCallback } from './Media.js';
import { MediaClip } from './MediaClip.js';

export class VideoMedia extends Media {
  private _element: HTMLVideoElement;

  constructor(mediaClip: MediaClip, onError: ErrorCallback) {
    super(mediaClip);
    const video = document.createElement('video');
    video.addEventListener('error', () =>
      onError(
        new ErrorEvent('error', { message: 'Video error', error: video.error }),
      ),
    );
    video.style.display = 'none';
    video.style.objectFit = 'contain'; // XXX make this configurable via MediaClip
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.src = this.mediaClip.src;
    video.currentTime = this.mediaClip.startTime || 0;
    video.load();
    this._element = video;
  }

  public get element() {
    return this._element;
  }

  // XXX endTime could be > duration

  public resize(width: number, height: number) {
    this._element.width = width;
    this._element.height = height;
  }

  // XXX intrinsice size can change during playback, fires resize event. May need to listen for this to recompute aspect ratio

  public get intrinsicWidth() {
    return this._element.videoWidth;
  }

  public get intrinsicHeight() {
    return this._element.videoHeight;
  }

  public get currentTime() {
    return this._element.currentTime;
  }

  public get ended() {
    return this._element.ended;
  }

  public play() {
    this._element.play();
  }

  public pause() {
    this._element.pause();
  }

  public dispose() {
    this.pause();
    this.hide();
    this._element.removeAttribute('src');
  }
}
