// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import Media from './Media.js';

export default class MediaFXVideo extends Media<HTMLVideoElement> {
  static override get observedAttributes(): string[] {
    return [...Media.observedAttributes, 'starttime', 'endtime'];
  }

  public override attributeChangedCallback(
    attr: string,
    _oldValue: string,
    newValue: string,
  ) {
    switch (attr) {
      case 'starttime':
        this.startTime = parseFloat(newValue);
        break;
      case 'endtime':
        this.endTime = parseFloat(newValue);
        break;
      default:
        super.attributeChangedCallback(attr, _oldValue, newValue);
        break;
    }
  }

  protected override createElement() {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.disablePictureInPicture = true;
    video.ontimeupdate = this.onTimeUpdate;
    video.onplaying = this.onPlaying;
    video.onwaiting = this.onWaiting;
    video.onpause = this.onPause;

    // Clone any <source>/<track> elements into the video
    const childrenToClone =
      this.shadowRoot?.querySelectorAll('> source, > track');
    if (childrenToClone !== undefined) {
      video.replaceChildren(
        ...Array.from(childrenToClone).map(child => {
          const clone = child.cloneNode(true);
          if (clone instanceof HTMLSourceElement) {
            clone.setAttribute('src', this.appendMediaFragment(clone.src));
          }
          return clone;
        }),
      );
    }
    return video;
  }

  public override set src(value: string) {
    super.src = this.appendMediaFragment(value);
  }

  private appendMediaFragment(url: string): string {
    // Use media fragments https://www.w3.org/TR/media-frags/
    if (this.startTime !== 0 || this.endTime !== undefined) {
      const t = [this.startTime / 1000];
      if (this.endTime !== undefined) {
        t.push(this.endTime / 1000);
      }
      return new URL(`#t=${t.join()}`, url).toString();
    }
    return url;
  }

  protected handleLoad(
    resolve: (value: unknown) => void,
    reject: (reason?: any) => void,
  ) {
    const { element } = this;
    if (element === undefined) throw new Error('Media not created');
    element.onerror = () =>
      reject(new Error('Video error', { cause: element.error }));
    element.oncanplay = () => resolve(this);
    element.load();
  }

  // XXX endTime could be > duration

  public get duration() {
    return (
      (this.endTime === undefined
        ? this.element.duration * 1000
        : this.endTime) - this.startTime
    );
  }

  private onTimeUpdate = () => {
    this.synchronizeClock(this.element.currentTime * 1000);
  };

  private onPause = () => {
    this.pauseClock();
  };

  private onPlaying = () => {
    this.startClock();
  };

  private onWaiting = () => {
    this.pauseClock();
  };

  public play() {
    this.element?.play();
  }

  public pause() {
    this.element?.pause();
  }

  public override cancel() {
    // Remove any <source>/<track> children
    if (this.element !== undefined) this.element.textContent = '';
    super.cancel();
  }
}
