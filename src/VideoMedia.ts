// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { Media, MediaLoadCallback, MediaErrorCallback } from './Media.js';
import { MediaClip } from './MediaClip.js';

export class VideoMedia extends Media<HTMLVideoElement> {
  constructor(
    mediaClip: MediaClip,
    onLoad: MediaLoadCallback,
    onError: MediaErrorCallback,
  ) {
    super(mediaClip, document.createElement('video'));
    this.element.addEventListener('error', () =>
      onError('Video error', this.element.error),
    );
    this.element.addEventListener('canplay', () => {
      this.loaded = true;
      onLoad(this);
    });
    this.element.preload = 'auto';
    this.element.crossOrigin = 'anonymous';
    // Use media fragments https://www.w3.org/TR/media-frags/
    if (
      this.mediaClip.startTime !== 0 ||
      this.mediaClip.endTime !== undefined
    ) {
      const t = [this.mediaClip.startTime];
      if (this.mediaClip.endTime !== undefined) {
        t.push(this.mediaClip.endTime);
      }
      this.element.src = new URL(
        `#t=${t.join()}`,
        this.mediaClip.src,
      ).toString();
    } else {
      this.element.src = this.mediaClip.src;
    }
    this.element.load();
  }

  // XXX endTime could be > duration

  // XXX intrinsice size can change during playback, fires resize event. May need to listen for this to recompute aspect ratio

  public get intrinsicWidth() {
    return this.element.videoWidth;
  }

  public get intrinsicHeight() {
    return this.element.videoHeight;
  }

  public get currentTime() {
    return this.element.currentTime;
  }

  public get duration() {
    return (
      (this.mediaClip.endTime === undefined
        ? this.element.duration
        : this.mediaClip.endTime) - this.mediaClip.startTime
    );
  }

  public get ended() {
    return this.element.ended;
  }

  public get playing(): boolean {
    return !this.element.paused && !this.element.ended;
  }

  public play() {
    this.element.play();
  }

  public pause() {
    this.element.pause();
  }

  public dispose() {
    this.pause();
    this.element.removeAttribute('src');
  }
}
