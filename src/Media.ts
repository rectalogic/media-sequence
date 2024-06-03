// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { MediaClip } from './MediaClip.js';

// XXX will need to handle the case where we are transitioning video and video/image and one of them stalls/buffers - need to pause the other so they stay in sync?

export abstract class Media<E extends HTMLElement = HTMLElement> {
  private _element: E;

  private _transformAnimation?: Animation;

  private _container: HTMLElement;

  private _mediaClip: MediaClip;

  private _loaded: boolean = false;

  constructor(mediaClip: MediaClip, element: E) {
    this._element = element;
    this._element.style.width = '100%';
    this._element.style.height = '100%';
    this._element.style.objectFit = mediaClip.objectFit;
    this._mediaClip = mediaClip;
    this._container = document.createElement('div');
    this._container.style.width = '100%';
    this._container.style.height = '100%';
    this._container.style.overflow = 'hidden';
    this._container.appendChild(element);
  }

  protected onLoad() {
    if (this.mediaClip.transform) {
      const keyframes = this.mediaClip.transform.keyframes.map(kf => ({
        offset: kf.offset,
        easing: kf.easing,
        transform: `translate(${
          kf.translateX !== undefined ? kf.translateX * 100 : 0
        }%, ${kf.translateY !== undefined ? kf.translateY * 100 : 0}%) scale(${
          kf.scale !== undefined ? kf.scale : 1
        }) rotate(${kf.rotate !== undefined ? kf.rotate : 0}deg)`,
      }));

      const startOffset =
        this.mediaClip.transform.startOffset !== undefined
          ? this.mediaClip.transform.startOffset
          : 0;
      const endOffset =
        this.mediaClip.transform.endOffset !== undefined
          ? this.mediaClip.transform.endOffset
          : 0;
      const effect = new KeyframeEffect(this.element, keyframes, {
        delay: (this.mediaClip.startTime + startOffset) * 1000,
        duration: (this.duration - (startOffset + endOffset)) * 1000,
      });
      this._transformAnimation = new Animation(effect, null);
      this._transformAnimation.play();
    }
  }

  public get mediaClip() {
    return this._mediaClip;
  }

  public get renderableElement() {
    // XXX return div container or canvas depending on how we need to render
    return this._container;
  }

  protected get element() {
    return this._element;
  }

  public get loaded(): boolean {
    return this._loaded;
  }

  protected set loaded(value: boolean) {
    this._loaded = value;
  }

  public get width() {
    return this._element.offsetWidth;
  }

  public get height() {
    return this._element.offsetHeight;
  }

  public abstract get intrinsicWidth(): number;

  public abstract get intrinsicHeight(): number;

  public abstract get currentTime(): number;

  public abstract get duration(): number;

  public set animationTime(timestamp: number) {
    if (this._transformAnimation)
      this._transformAnimation.currentTime = this.currentTime * 1000;
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
