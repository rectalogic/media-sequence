// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

// XXX will need to handle the case where we are transitioning video and video/image and one of them stalls/buffers - need to pause the other so they stay in sync?

import MediaFXEffect from './MediaFXEffect.js';
import MediaFXTransform from './MediaFXTransform.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      overflow: hidden;
    }
    .media {
      width: 100%;
      height: 100%;
      object-position: var(--mediafx-object-position);
      object-fit: var(--mediafx-object-fit);
    }
  </style>
  <slot></slot>`;

export default abstract class Media<
  E extends HTMLElement = HTMLElement,
> extends HTMLElement {
  private _src?: string;

  private _mediaClock?: Animation;

  private _element?: E;

  private _animations: Animation[] = [];

  private _startTime: number = 0;

  private _endTime?: number;

  static get observedAttributes(): string[] {
    return ['src'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }

  public attributeChangedCallback(
    attr: string,
    _oldValue: string,
    newValue: string,
  ) {
    switch (attr) {
      case 'src':
        this.src = newValue;
        break;
      default:
    }
  }

  public set src(value: string) {
    this._src = value;
  }

  public get src(): string | undefined {
    return this._src;
  }

  public set startTime(value: number) {
    this._startTime = value;
  }

  public get startTime(): number {
    return this._startTime;
  }

  public set endTime(value: number) {
    this._endTime = value;
  }

  public get endTime(): number | undefined {
    return this._endTime;
  }

  public load(transitionOverlap: number) {
    this._element = this.createElement();
    this._element.className = 'media';
    this.shadowRoot?.appendChild(this._element);
    this._mediaClock = new Animation(new KeyframeEffect(this._element, null));

    return new Promise((resolve, reject) => {
      const handleResolve = (value: unknown) => {
        try {
          this.configureAnimations(transitionOverlap);
          resolve(value);
        } catch (error) {
          reject(error);
        }
      };
      this.handleLoad(handleResolve, reject);
    });
  }

  protected abstract createElement(): E;

  protected abstract handleLoad(
    resolve: (value: unknown) => void,
    reject: (reason?: any) => void,
  ): void;

  // Positive offset is from startTime, negative is from endTime
  private computeAnimationDelayDuration(
    startOffset?: number,
    endOffset?: number,
  ) {
    let startTime;
    if (startOffset === undefined) startTime = this.startTime;
    else if (startOffset >= 0) startTime = this.startTime + startOffset;
    // Subtract offset from duration
    else startTime = this.startTime + (this.duration + startOffset);

    const mediaEndTime =
      this.endTime === undefined
        ? this.startTime + this.duration
        : this.endTime;
    let endTime;
    if (endOffset === undefined) {
      endTime = mediaEndTime;
    } else if (endOffset >= 0) endTime = this.startTime + endOffset;
    // Subtract offset from duration
    else endTime = this.startTime + (this.duration + endOffset);

    if (startTime < this.startTime || endTime > mediaEndTime)
      throw new Error('Out of range animation offsets', {
        cause: this,
      });

    return {
      delay: startTime,
      duration: endTime - startTime,
    };
  }

  private configureAnimations(transitionOverlap: number) {
    const { element } = this;
    if (element === undefined || this._mediaClock === undefined) return;

    // No-op animation that provides our master clock
    this._mediaClock.effect?.updateTiming({
      delay: this.startTime,
      duration: this.duration - transitionOverlap,
    });
    this._mediaClock.currentTime = this.startTime || 0;

    this._animations.push(
      ...Array.from(
        this.querySelectorAll<MediaFXTransform>('> mediafx-transform'),
      ).map(mediafxTransform => {
        const { effectInfo } = mediafxTransform;
        const effect = new KeyframeEffect(element, effectInfo.keyframes, {
          ...this.computeAnimationDelayDuration(
            mediafxTransform.startOffset,
            mediafxTransform.endOffset,
          ),
          ...effectInfo.options,
        });
        const animation = new Animation(effect);
        animation.currentTime = this.startTime || 0;
        animation.pause();
        return animation;
      }),
    );

    this._animations.push(
      ...Array.from(
        this.querySelectorAll<MediaFXEffect>('> mediafx-effect'),
      ).map(mediafxEffect => {
        const timing = this.computeAnimationDelayDuration(
          mediafxEffect.startOffset,
          mediafxEffect.endOffset,
        );
        const { effectInfo } = mediafxEffect;
        // Make all iterations play within our duration
        timing.duration /=
          effectInfo.options?.iterations === undefined
            ? 1
            : effectInfo.options.iterations;

        const effect = new KeyframeEffect(this, effectInfo.keyframes, {
          ...timing,
          ...effectInfo.options,
        });
        const animation = new Animation(effect);
        animation.currentTime = this.startTime || 0;
        animation.pause();
        return animation;
      }),
    );
  }

  // XXX now this is just 'this'
  public get renderableElement() {
    return this;
  }

  protected get element() {
    return this._element;
  }

  private async awaitFinished() {
    if (this._mediaClock === undefined) throw new Error('media not loaded');
    await this._mediaClock.finished;
    // Update timing in case we are accounting for transition overlap
    this._mediaClock.effect?.updateTiming({ duration: this.duration });
  }

  public get finished() {
    return this.awaitFinished();
  }

  protected startClock() {
    if (this._mediaClock === undefined) throw new Error('media not loaded');
    this._mediaClock.play();
    for (const animation of this._animations) animation.play();
  }

  protected pauseClock() {
    if (this._mediaClock === undefined) throw new Error('media not loaded');
    this._mediaClock.pause();
    for (const animation of this._animations) animation.pause();
  }

  protected synchronizeClock(time: number) {
    if (this._mediaClock === undefined) throw new Error('media not loaded');
    this._mediaClock.currentTime = time;
    for (const animation of this._animations) animation.currentTime = time;
  }

  public get currentTime() {
    if (this._mediaClock === undefined) return this.startTime;
    // CSSNumberish should always be number for our usecase
    // https://github.com/microsoft/TypeScript/issues/54496
    return this._mediaClock.currentTime !== null
      ? (this._mediaClock.currentTime as number)
      : this.startTime;
  }

  public abstract get duration(): number;

  public get playing() {
    return this._mediaClock?.playState === 'running';
  }

  public abstract play(): void;

  public abstract pause(): void;

  public cancel(): void {
    this.pause();
    this.element?.remove();
    this.element?.removeAttribute('src');
    this._element = undefined;
    this._mediaClock?.cancel();
    this._mediaClock = undefined;
    for (const animation of this._animations) animation.cancel();
    this._animations = [];
  }
}
