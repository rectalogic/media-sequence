// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { Media, MediaLoadCallback, MediaErrorCallback } from './Media.js';
import { MediaClip } from './MediaClip.js';

export class VideoMedia extends Media {
  private _element: HTMLVideoElement;

  constructor(
    mediaClip: MediaClip,
    onLoad: MediaLoadCallback,
    onError: MediaErrorCallback,
  ) {
    super(mediaClip);
    const video = document.createElement('video');
    video.addEventListener('error', () => onError('Video error', video.error));
    video.addEventListener('canplay', () => {
      this.loaded = true;
      onLoad(this);
    });
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    // Use media fragments https://www.w3.org/TR/media-frags/
    if (
      this.mediaClip.startTime !== 0 ||
      this.mediaClip.endTime !== undefined
    ) {
      const t = [this.mediaClip.startTime];
      if (this.mediaClip.endTime !== undefined) {
        t.push(this.mediaClip.endTime);
      }
      video.src = new URL(`#t=${t.join()}`, this.mediaClip.src).toString();
    } else {
      video.src = this.mediaClip.src;
    }
    video.load();
    this._element = video;
  }

  public get element() {
    return this._element;
  }

  // XXX endTime could be > duration

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

  public get duration() {
    return (
      (this.mediaClip.endTime === undefined
        ? this.element.duration
        : this.mediaClip.endTime) - this.mediaClip.startTime
    );
  }

  public get ended() {
    return this._element.ended;
  }

  public get playing(): boolean {
    return !this._element.paused && !this._element.ended;
  }

  public play() {
    this._element.play();
  }

  public pause() {
    this._element.pause();
  }

  public dispose() {
    this.pause();
    this._element.removeAttribute('src');
  }
}
