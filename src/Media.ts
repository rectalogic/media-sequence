// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { MediaClip } from './MediaClip.js';
import { VideoMedia } from './VideoMedia.js';
import { ImageMedia } from './ImageMedia.js';
// XXX will need to handle the case where we are transitioning video and video/image and one of them stalls/buffers - need to pause the other so they stay in sync?

export abstract class Media {
  static create(mediaClip: MediaClip) {
    switch (mediaClip.type) {
      case 'video':
        return new VideoMedia(mediaClip);
      case 'image':
        return new ImageMedia(mediaClip);
      default:
        throw new TypeError(`Unimplemented media type ${mediaClip.type}`);
    }
  }

  protected _mediaClip: MediaClip;

  constructor(mediaClip: MediaClip) {
    this._mediaClip = mediaClip;
  }

  public get mediaClip() {
    return this._mediaClip;
  }

  public abstract get element(): HTMLElement;

  public abstract get intrinsicWidth(): number;

  public abstract get intrinsicHeight(): number;

  public abstract get currentTime(): number;

  public abstract get ended(): boolean;

  public abstract play(): void;

  public abstract pause(): void;

  public abstract stop(): void;
}
