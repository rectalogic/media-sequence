// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { Media } from './Media.js';
import { MediaClip } from './MediaClip.js';

export class VideoMedia extends Media {
  private _element: HTMLVideoElement;

  constructor(mediaClip: MediaClip) {
    super(mediaClip);
    const video = document.createElement('video');
    video.className = 'video';
    video.style.visibility = 'hidden';
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
    // XXX this can throw
    // DOMException: The media resource indicated by the src attribute or assigned media provider object was not suitable
    // XXX need to catch and call error callback
    this._element.play();
  }

  public pause() {
    this._element.pause();
  }

  public stop() {
    this.pause();
    this._element.style.visibility = 'hidden';
    this._element.removeAttribute('src');
    this._element.load();
  }
}
