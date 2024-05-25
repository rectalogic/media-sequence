// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { MediaClip } from './MediaClip.js';
import Resizable from './Resizable.js';

// XXX will need to handle the case where we are transitioning video and video/image and one of them stalls/buffers - need to pause the other so they stay in sync?

export type ErrorCallback = (event: ErrorEvent) => void;

export abstract class Media implements Resizable {
  private _mediaClip: MediaClip;

  constructor(mediaClip: MediaClip) {
    this._mediaClip = mediaClip;
  }

  public get mediaClip() {
    return this._mediaClip;
  }

  public hide() {
    this.element.style.display = 'none';
  }

  public show() {
    this.element.style.display = 'block';
  }

  public abstract get element(): HTMLElement;

  public abstract resize(width: number, height: number): void;

  public abstract get width(): number;

  public abstract get height(): number;

  public abstract get intrinsicWidth(): number;

  public abstract get intrinsicHeight(): number;

  public abstract get currentTime(): number;

  // eslint-disable-next-line class-methods-use-this, no-empty-function
  public set animationTime(timestamp: number) {}

  public abstract get ended(): boolean;

  public abstract get playing(): boolean;

  public abstract play(): void;

  public abstract pause(): void;

  public abstract dispose(): void;
}
