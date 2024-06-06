// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { MediaClip } from './MediaClip.js';

// XXX will need to handle the case where we are transitioning video and video/image and one of them stalls/buffers - need to pause the other so they stay in sync?

export abstract class Media<E extends HTMLElement = HTMLElement> {
  private _mediaClock: Animation;

  private _element: E;

  private _transformAnimation?: Animation;

  private _container: HTMLElement;

  private _mediaClip: MediaClip;

  private _disposed: boolean = false;

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

    const effect = new KeyframeEffect(null, null);
    this._mediaClock = new Animation(effect);
  }

  public abstract load(): Promise<unknown>;

  protected onLoad() {
    if (this.disposed) return;

    // No-op animation that provides our master clock
    this._mediaClock.effect?.updateTiming({
      delay: this.mediaClip.startTime,
      duration: this.duration,
    });
    this._mediaClock.currentTime = this.mediaClip.startTime;

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
        delay: this.mediaClip.startTime + startOffset,
        duration: this.duration - (startOffset + endOffset),
        fill: 'forwards',
      });
      this._transformAnimation = new Animation(effect);
      this._transformAnimation.pause();
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

  public get width() {
    return this._element.offsetWidth;
  }

  public get height() {
    return this._element.offsetHeight;
  }

  public abstract get intrinsicWidth(): number;

  public abstract get intrinsicHeight(): number;

  public get finished() {
    return this._mediaClock.finished;
  }

  protected startClock() {
    this._mediaClock.play();
    if (this._transformAnimation) this._transformAnimation.play();
  }

  protected pauseClock() {
    this._mediaClock.pause();
    if (this._transformAnimation) this._transformAnimation.pause();
  }

  //XXX sync all animations
  protected synchronizeClock(time: number) {
    this._mediaClock.currentTime = time;
    if (this._transformAnimation) this._transformAnimation.currentTime = time;
  }

  public get currentTime() {
    // CSSNumberish should always be number for our usecase
    // https://github.com/microsoft/TypeScript/issues/54496
    return this._mediaClock.currentTime !== null
      ? (this._mediaClock.currentTime as number)
      : this.mediaClip.startTime; //XXX this is ms, make everything ms now?
  }

  public abstract get duration(): number;

  //XXX hmm, can MediaSequence just "await media.finished" (i.e. animation.finished promise?)
  public abstract get ended(): boolean;

  public get playing() {
    return this._mediaClock.playState === 'running';
  }

  public abstract play(): void;

  public abstract pause(): void;

  public dispose(): void {
    this._disposed = true;
    this._mediaClock.cancel();
    if (this._transformAnimation !== undefined)
      this._transformAnimation.cancel();
  }

  protected get disposed() {
    return this._disposed;
  }

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
