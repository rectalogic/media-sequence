// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import Media from './Media.js';

export default class MediaFXImage extends Media<HTMLImageElement> {
  private static DEFAULT_DURATION = 5000;

  private _duration: number = MediaFXImage.DEFAULT_DURATION;

  static override get observedAttributes(): string[] {
    return [...Media.observedAttributes, 'duration'];
  }

  public override attributeChangedCallback(
    attr: string,
    _oldValue: string,
    newValue: string,
  ) {
    switch (attr) {
      case 'duration':
        this._duration = parseFloat(newValue);
        break;
      default:
        super.attributeChangedCallback(attr, _oldValue, newValue);
        break;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  protected override createElement() {
    const image = document.createElement('img');
    image.loading = 'eager';
    image.crossOrigin = 'anonymous';
    return image;
  }

  protected handleLoad(
    resolve: (value: unknown) => void,
    reject: (reason?: any) => void,
  ) {
    this.element.onerror = event =>
      reject(new Error('Image error', { cause: event }));
    this.element.onload = () => {
      resolve(this);
    };
    this.element.src = this.mediaInfo.src;
  }

  public get duration() {
    return this._duration;
  }

  public play() {
    this.startClock();
  }

  public pause() {
    this.pauseClock();
  }
}
