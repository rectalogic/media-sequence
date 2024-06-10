// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { Media } from './Media.js';
import { MediaClip } from './MediaClip.js';

export class VideoMedia extends Media<HTMLVideoElement> {
  constructor(mediaClip: MediaClip) {
    super(mediaClip, document.createElement('video'));
    this.element.preload = 'auto';
    this.element.crossOrigin = 'anonymous';
    this.element.disablePictureInPicture = true;
    this.element.ontimeupdate = this.onTimeUpdate;
    this.element.onplaying = this.onPlaying;
    this.element.onwaiting = this.onWaiting;
    this.element.onpause = this.onPause;
  }

  public load() {
    return new Promise((resolve, reject) => {
      this.element.onerror = () =>
        reject(new Error('Video error', { cause: this.element.error }));
      this.element.oncanplay = () => {
        try {
          this.onLoad();
          resolve(this);
        } catch (error) {
          reject(error);
        }
      };
      // Use media fragments https://www.w3.org/TR/media-frags/
      if (
        this.mediaClip.startTime !== 0 ||
        this.mediaClip.endTime !== undefined
      ) {
        const t = [this.mediaClip.startTime / 1000];
        if (this.mediaClip.endTime !== undefined) {
          t.push(this.mediaClip.endTime / 1000);
        }
        this.element.src = new URL(
          `#t=${t.join()}`,
          this.mediaClip.src,
        ).toString();
      } else {
        this.element.src = this.mediaClip.src;
      }
      this.element.load();
    });
  }

  // XXX endTime could be > duration

  public get duration() {
    return (
      (this.mediaClip.endTime === undefined
        ? this.element.duration * 1000
        : this.mediaClip.endTime) - this.mediaClip.startTime
    );
  }

  private onTimeUpdate = () => {
    this.synchronizeClock(this.element.currentTime * 1000);
  };

  private onPause = () => {
    this.pauseClock();
  };

  private onPlaying = () => {
    this.startClock();
  };

  private onWaiting = () => {
    this.pauseClock();
  };

  public play() {
    this.element.play();
  }

  public pause() {
    this.element.pause();
  }

  public override dispose() {
    super.dispose();
    this.pause();
    this.element.removeAttribute('src');
  }
}
