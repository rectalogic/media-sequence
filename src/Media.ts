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

  public computeObjectFitMatrix(
    containerWidth: number,
    containerHeight: number,
  ): DOMMatrix {
    let fit = this.mediaClip.objectFit;
    const contentWidth = this.intrinsicWidth;
    const contentHeight = this.intrinsicHeight;
    const containerRatio = containerWidth / containerHeight;
    const contentRatio = contentWidth / contentHeight;
    let scaleX = 1;
    let scaleY = 1;
    let tX = 0;
    let tY = 0;
    if (fit === 'scale-down') {
      if (contentWidth <= containerWidth && contentHeight <= containerHeight)
        fit = 'none';
      else fit = 'contain';
    }
    switch (fit) {
      case 'contain':
        if (contentRatio > containerRatio) {
          scaleX = scaleY = containerWidth / contentWidth;
          tY = (containerHeight - contentHeight * scaleY) / 2;
        } else {
          scaleX = scaleY = containerHeight / contentHeight;
          tX = (containerWidth - contentWidth * scaleX) / 2;
        }
        break;
      case 'cover':
        if (contentRatio > containerRatio) {
          scaleX = scaleY = containerHeight / contentHeight;
          tX = (containerWidth - contentWidth * scaleX) / 2;
        } else {
          scaleX = scaleY = containerWidth / contentWidth;
          tY = (containerHeight - contentHeight * scaleY) / 2;
        }
        break;
      case 'none':
        if (contentWidth > containerWidth)
          tX = -(contentWidth - containerWidth) / 2;
        else tX = (containerWidth - contentWidth) / 2;

        if (contentHeight > containerHeight)
          tY = -(contentHeight - containerHeight) / 2;
        else tY = (containerHeight - contentHeight) / 2;
        break;
      default:
    }
    const matrix = new DOMMatrix();
    matrix.translateSelf(tX, tY);
    matrix.scaleSelf(scaleX, scaleY);
    return matrix;
  }
}

export type MediaLoadCallback = (media: Media) => void;
export type MediaErrorCallback = (message: string, cause: any) => void;
