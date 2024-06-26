// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { Media } from './Media.js';
import { MediaInfo } from './Playlist.js';

export class VideoMedia extends Media<HTMLVideoElement> {
  constructor(mediaInfo: MediaInfo) {
    super(mediaInfo, document.createElement('video'));
    this.element.preload = 'auto';
    this.element.crossOrigin = 'anonymous';
    this.element.disablePictureInPicture = true;
    this.element.ontimeupdate = this.onTimeUpdate;
    this.element.onplaying = this.onPlaying;
    this.element.onwaiting = this.onWaiting;
    this.element.onpause = this.onPause;
  }

  protected handleLoad(
    resolve: (value: unknown) => void,
    reject: (reason?: any) => void,
  ) {
    this.element.onerror = () =>
      reject(new Error('Video error', { cause: this.element.error }));
    this.element.oncanplay = () => resolve(this);

    // Use media fragments https://www.w3.org/TR/media-frags/
    if (
      this.mediaInfo.startTime !== 0 ||
      this.mediaInfo.endTime !== undefined
    ) {
      const t = [this.mediaInfo.startTime / 1000];
      if (this.mediaInfo.endTime !== undefined) {
        t.push(this.mediaInfo.endTime / 1000);
      }
      this.element.src = new URL(
        `#t=${t.join()}`,
        this.mediaInfo.src,
      ).toString();
    } else {
      this.element.src = this.mediaInfo.src;
    }
    this.element.load();
  }

  // XXX endTime could be > duration

  public get duration() {
    return (
      (this.mediaInfo.endTime === undefined
        ? this.element.duration * 1000
        : this.mediaInfo.endTime) - this.mediaInfo.startTime
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

  public override cancel() {
    super.cancel();
    this.pause();
    this.element.removeAttribute('src');
  }
}
