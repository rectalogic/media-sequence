// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

// XXX will need to handle the case where we are transitioning video and video/image and one of them stalls/buffers - need to pause the other so they stay in sync?

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
    }
    img, video {
      width: 100%;
      height: 100%;
    }
  </style>
  <slot></slot>`;

export abstract class Media extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['object-position', 'object-fit'];
  }

  private objectPosition?: string;

  private objectFit?: string;

  private _mediaClock: Animation;

  private _element: E;

  private _animations: Animation[] = [];

  private _container: HTMLElement;

  private _mediaInfo: MediaInfo;

  private _disposed: boolean = false;

  constructor(mediaInfo: MediaInfo, element: E) {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));

    this._element = element;
    this._element.style.width = '100%';
    this._element.style.height = '100%';
    this._element.style.objectFit = mediaInfo.objectFit;
    this._mediaInfo = mediaInfo;
    this._container = document.createElement('div');
    this._container.className = 'media';
    this._container.appendChild(element);

    this._mediaClock = new Animation(new KeyframeEffect(element, null));
  }

  public connectedCallback() {
    console.log('Custom media-fx element added to page.');
    // XXX find mediafx-effect elements - could defer this to when we load the media
  }

  public attributeChangedCallback(
    attr: string,
    _oldValue: string,
    newValue: string,
  ) {
    //XXX update active element if we have one
    switch (attr) {
      case 'object-position':
        this.objectPosition = newValue;
        break;
      case 'object-fit':
        this.objectFit = newValue;
        break;
      default:
    }
  }

  public load() {
    return new Promise((resolve, reject) => {
      const handleResolve = (value: unknown) => {
        try {
          this.configureEffects();
          resolve(value);
        } catch (error) {
          reject(error);
        }
      };
      this.handleLoad(handleResolve, reject);
    });
  }

  protected abstract handleLoad(
    resolve: (value: unknown) => void,
    reject: (reason?: any) => void,
  ): void;

  // Positive offset is from startTime, negative is from endTime
  private computeEffectDelayDuration(startOffset?: number, endOffset?: number) {
    let startTime;
    if (startOffset === undefined) startTime = this.mediaInfo.startTime;
    else if (startOffset >= 0)
      startTime = this.mediaInfo.startTime + startOffset;
    // Subtract offset from duration
    else startTime = this.mediaInfo.startTime + (this.duration + startOffset);

    const mediaEndTime =
      this.mediaInfo.endTime === undefined
        ? this.mediaInfo.startTime + this.duration
        : this.mediaInfo.endTime;
    let endTime;
    if (endOffset === undefined) {
      endTime = mediaEndTime;
    } else if (endOffset >= 0) endTime = this.mediaInfo.startTime + endOffset;
    // Subtract offset from duration
    else endTime = this.mediaInfo.startTime + (this.duration + endOffset);

    if (startTime < this.mediaInfo.startTime || endTime > mediaEndTime)
      throw new Error('Out of range animation offsets', {
        cause: this.mediaInfo,
      });

    return {
      delay: startTime,
      duration: endTime - startTime,
    };
  }

  protected configureEffects() {
    if (this.disposed) return;

    const overlap = this.mediaInfo.transition?.duration || 0;
    // No-op animation that provides our master clock
    this._mediaClock.effect?.updateTiming({
      delay: this.mediaInfo.startTime,
      duration: this.duration - overlap,
    });
    this._mediaClock.currentTime = this.mediaInfo.startTime;

    if (this.mediaInfo.transform) {
      const keyframes = this.mediaInfo.transform.keyframes.map(kf => ({
        offset: kf.offset,
        easing: kf.easing,
        transform: `translate(${
          kf.translateX !== undefined ? kf.translateX * 100 : 0
        }%, ${kf.translateY !== undefined ? kf.translateY * 100 : 0}%) scale(${
          kf.scale !== undefined ? kf.scale : 1
        }) rotate(${kf.rotate !== undefined ? kf.rotate : 0}deg)`,
      }));

      const effect = new KeyframeEffect(this.element, keyframes, {
        ...this.computeEffectDelayDuration(
          this.mediaInfo.transform.startOffset,
          this.mediaInfo.transform.endOffset,
        ),
        fill: 'forwards',
      });
      const transform = new Animation(effect);
      transform.currentTime = this.mediaInfo.startTime;
      transform.pause();
      this._animations.push(transform);
    }

    if (this.mediaInfo.animations) {
      for (const animation of this.mediaInfo.animations) {
        const timing = this.computeEffectDelayDuration(
          animation.startOffset,
          animation.endOffset,
        );
        // Make all iterations play within our duration
        timing.duration /=
          animation.iterations === undefined ? 1 : animation.iterations;

        const effect = new KeyframeEffect(
          this.renderableElement,
          animation.keyframes,
          {
            ...timing,
            composite: animation.composite,
            fill: animation.fill,
            easing: animation.easing,
            iterations: animation.iterations,
            iterationComposite: animation.iterationComposite,
          },
        );
        const anim = new Animation(effect);
        anim.currentTime = this.mediaInfo.startTime;
        anim.pause();
        this._animations.push(anim);
      }
    }
  }

  public get mediaInfo() {
    return this._mediaInfo;
  }

  public get renderableElement() {
    return this._container;
  }

  protected get element() {
    return this._element;
  }

  private async awaitFinished() {
    await this._mediaClock.finished;
    if (this.mediaInfo.transition !== undefined) {
      this._mediaClock.effect?.updateTiming({ duration: this.duration });
    }
  }

  public get finished() {
    return this.awaitFinished();
  }

  protected startClock() {
    this._mediaClock.play();
    for (const animation of this._animations) animation.play();
  }

  protected pauseClock() {
    this._mediaClock.pause();
    for (const animation of this._animations) animation.pause();
  }

  protected synchronizeClock(time: number) {
    this._mediaClock.currentTime = time;
    for (const animation of this._animations) animation.currentTime = time;
  }

  public get currentTime() {
    // CSSNumberish should always be number for our usecase
    // https://github.com/microsoft/TypeScript/issues/54496
    return this._mediaClock.currentTime !== null
      ? (this._mediaClock.currentTime as number)
      : this.mediaInfo.startTime;
  }

  public abstract get duration(): number;

  public get playing() {
    return this._mediaClock.playState === 'running';
  }

  public abstract play(): void;

  public abstract pause(): void;

  public cancel(): void {
    this.renderableElement.parentNode?.removeChild(this.renderableElement);
    this._disposed = true;
    this._mediaClock.cancel();
    for (const animation of this._animations) animation.cancel();
  }

  protected get disposed() {
    return this._disposed;
  }
}
