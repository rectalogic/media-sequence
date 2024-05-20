// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { MediaClip } from './MediaClip.js';
import Resizable from './Resizable.js';

// XXX will need to handle the case where we are transitioning video and video/image and one of them stalls/buffers - need to pause the other so they stay in sync?

export abstract class Media implements Resizable {
  protected _mediaClip: MediaClip;

  constructor(mediaClip: MediaClip) {
    this._mediaClip = mediaClip;
  }

  public get mediaClip() {
    return this._mediaClip;
  }

  public abstract get element():
    | HTMLVideoElement
    | HTMLImageElement
    | HTMLCanvasElement;

  public abstract isValidTexture(): boolean;

  public abstract resize(width: number, height: number): void;

  public abstract get intrinsicWidth(): number;

  public abstract get intrinsicHeight(): number;

  public abstract get currentTime(): number;

  // eslint-disable-next-line class-methods-use-this, no-empty-function
  public set animationTime(timestamp: number) {}

  public abstract get ended(): boolean;

  public abstract play(): void;

  public abstract pause(): void;

  public abstract stop(): void;
}
