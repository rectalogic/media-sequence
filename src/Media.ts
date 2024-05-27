// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { MediaClip } from './MediaClip.js';

// XXX will need to handle the case where we are transitioning video and video/image and one of them stalls/buffers - need to pause the other so they stay in sync?

export abstract class Media {
  private _mediaClip: MediaClip;

  private _loaded: boolean = false;

  constructor(mediaClip: MediaClip) {
    this._mediaClip = mediaClip;
  }

  public get mediaClip() {
    return this._mediaClip;
  }

  public abstract get element(): HTMLVideoElement | HTMLImageElement;

  public get loaded(): boolean {
    return this._loaded;
  }

  protected set loaded(value: boolean) {
    this._loaded = value;
  }

  public abstract get intrinsicWidth(): number;

  public abstract get intrinsicHeight(): number;

  public abstract get currentTime(): number;

  public abstract get duration(): number;

  // eslint-disable-next-line class-methods-use-this, no-empty-function
  public set animationTime(timestamp: number) {
    // XXX update transform if any
  }

  public abstract get ended(): boolean;

  public abstract get playing(): boolean;

  public abstract play(): void;

  public abstract pause(): void;

  public abstract dispose(): void;
}

export type MediaLoadCallback = (media: Media) => void;
export type MediaErrorCallback = (message: string, cause: any) => void;
