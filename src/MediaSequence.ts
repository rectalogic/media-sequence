// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import createMedia from './MediaFactory.js';
import { Media } from './Media.js';
import { MediaClip, isMediaClipArray } from './MediaClip.js';

enum MediaState {
  Uninitialized = 0,
  Initialized,
  Playing,
  Paused,
  Error,
}

export class MediaSequence extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['playlist', 'width', 'height'];
  }

  private sheet: CSSStyleSheet;

  private activeMedia?: Media;

  private loadingMedia?: Media;

  private mediaClips?: MediaClip[];

  private state = MediaState.Uninitialized;

  // XXX handle video/img onerror, set error property and fire error event, also set/fire for playlist issues

  // styling canvas just stretches content, width/height are the real size
  // video is different, it object-fits video into the styled element (or used w/h or native size)
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#sizing_the_canvas_using_css_versus_html
  // so just use w/h and force it

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    this.sheet = new CSSStyleSheet();
    const internalSheet = new CSSStyleSheet();
    internalSheet.replaceSync(`
      :host > video, img, canvas {
        width: 100%;
        height: 100%;
      }
    `);
    this.updateSize();
    shadow.adoptedStyleSheets.push(internalSheet, this.sheet);
  }

  public connectedCallback() {
    console.log('Custom media-sequence element added to page.');
  }

  public attributeChangedCallback(
    attr: string,
    _oldValue: string,
    newValue: string,
  ) {
    console.log(`Custom media-sequence attributeChangedCallback ${attr}`);
    switch (attr) {
      case 'width':
      case 'height':
        this.updateSize();
        break;
      case 'playlist':
        this.updatePlaylist(newValue);
        break;
      default:
    }
  }

  private async updatePlaylist(url: string) {
    this.stop();
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(response);
        this.state = MediaState.Error;
        // XXX set error and fire error event
      }
      const json = await response.json();
      if (isMediaClipArray(json)) {
        this.mediaClips = json;
        this.state = MediaState.Initialized;
      } else {
        // XXX set error and fire error event
        this.state = MediaState.Error;
      }
    } catch (error) {
      console.error(`Download error: ${error}`);
      // XXX set error and fire error event
      this.state = MediaState.Error;
    }
  }

  private updateSize() {
    const width = this.getAttribute('width');
    const height = this.getAttribute('height');
    this.sheet.replaceSync(`
      :host {
        display: inline-block;
        width: ${width !== null ? `${width}px` : 'auto'};
        height: ${height !== null ? `${height}px` : 'auto'};
      }
    `);
  }

  public play() {
    if (
      this.state !== MediaState.Initialized &&
      this.state !== MediaState.Paused
    )
      return;
    this.state = MediaState.Playing;
    this.nextVideo();
    requestAnimationFrame(this.onAnimationFrame);
  }

  public pause() {
    if (this.state === MediaState.Playing) {
      // XXX implement pausing
      this.state = MediaState.Paused;
    }
  }

  public stop() {
    if (this.activeMedia) {
      MediaSequence.destroyMedia(this.activeMedia);
      this.shadowRoot?.removeChild(this.activeMedia.element);
      this.activeMedia = undefined;
    }
    if (this.loadingMedia) {
      MediaSequence.destroyMedia(this.loadingMedia);
      this.loadingMedia = undefined;
    }
    this.mediaClips = undefined;
    this.state = MediaState.Uninitialized;
  }

  private static createMedia(mediaClip: MediaClip): Media {
    // XXX pass error callback
    return createMedia(mediaClip);
  }

  private static destroyMedia(media: Media): undefined {
    media.pause();
    media.element.style.visibility = 'hidden'; // eslint-disable-line no-param-reassign
    return undefined;
  }

  private onAnimationFrame = (timestamp: number) => {
    if (this.activeMedia && this.mediaClips) {
      this.activeMedia.animationTime = timestamp;
      if (
        this.activeMedia.ended ||
        (this.mediaClips[0].endTime &&
          this.activeMedia.currentTime >= this.mediaClips[0].endTime)
      ) {
        this.nextVideo();
      }
    }
    if (this.state === MediaState.Playing)
      requestAnimationFrame(this.onAnimationFrame);
  };

  private nextVideo() {
    if (!this.mediaClips) return;

    // First call, setup initial 2 videos
    if (!this.activeMedia) {
      this.activeMedia = MediaSequence.createMedia(this.mediaClips[0]);
      this.activeMedia.element.style.visibility = 'visible';
      this.shadowRoot?.appendChild(this.activeMedia.element);
      this.activeMedia.play();

      if (this.mediaClips.length > 1) {
        this.loadingMedia = MediaSequence.createMedia(this.mediaClips[1]);
      }
    } else if (this.loadingMedia) {
      const currentMedia = this.activeMedia;
      this.activeMedia = this.loadingMedia;
      this.activeMedia.element.style.visibility = 'visible';
      currentMedia.element.replaceWith(this.activeMedia.element);
      MediaSequence.destroyMedia(currentMedia);
      this.mediaClips.shift();
      // Chrome/Firefox seamless, Safari flashes background when replacing video - play() seems to cause the flash - adding small delay helps
      setTimeout(() => this.activeMedia?.play(), 20);

      if (this.mediaClips.length > 1) {
        this.loadingMedia = MediaSequence.createMedia(this.mediaClips[1]);
      } else {
        this.loadingMedia = undefined;
      }
    } else {
      this.shadowRoot?.removeChild(this.activeMedia.element);
      this.activeMedia = MediaSequence.destroyMedia(this.activeMedia);
    }
  }
}
