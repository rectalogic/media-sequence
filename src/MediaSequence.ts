// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { MediaClip, isMediaClipArray } from './MediaClip.js';

export class MediaSequence extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['playlist', 'width', 'height'];
  }

  private sheet: CSSStyleSheet;

  private activeVideo?: HTMLVideoElement;

  private inactiveVideo?: HTMLVideoElement;

  private mediaClips?: MediaClip[];

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
    //XXX stop any existing playback (cleanup DOM) - need play/stop/reset APIs
    this.mediaClips = undefined;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(response);
        // XXX set error and fire error event
      }
      const json = await response.json();
      if (isMediaClipArray(json)) this.mediaClips = json;
      else {
        // XXX set error and fire error event
      }
    } catch (error) {
      console.error(`Download error: ${error}`);
      // XXX set error and fire error event
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
    this.nextVideo();
  }

  private createVideo(): HTMLVideoElement {
    const video = document.createElement('video');
    video.style.visibility = 'hidden';
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.addEventListener('timeupdate', this.onTimeUpdate);
    return video;
  }

  private destroyVideo(video: HTMLVideoElement): undefined {
    video.pause();
    video.style.visibility = 'hidden'; // eslint-disable-line no-param-reassign
    video.removeEventListener('timeupdate', this.onTimeUpdate);
    video.removeAttribute('src');
    video.load();
    return undefined;
  }

  private onTimeUpdate = (_event: Event) => {
    // Check for activeVideo.ended too, we will stop getting updates when it ends
    if (
      this.activeVideo &&
      this.mediaClips &&
      (this.activeVideo.ended ||
        (this.mediaClips[0].endTime &&
          this.activeVideo.currentTime >= this.mediaClips[0].endTime))
    ) {
      this.nextVideo();
    }
  };

  private nextVideo() {
    if (!this.mediaClips) return;
    // First call, setup initial 2 videos
    if (!this.activeVideo) {
      this.activeVideo = this.createVideo();
      this.activeVideo.style.visibility = 'visible';
      this.activeVideo.src = this.mediaClips[0].src;
      this.activeVideo.currentTime = this.mediaClips[0].startTime || 0;
      this.shadowRoot?.appendChild(this.activeVideo);
      this.activeVideo.play();

      if (this.mediaClips.length > 1) {
        this.inactiveVideo = this.createVideo();
        this.inactiveVideo.src = this.mediaClips[1].src;
        this.inactiveVideo.currentTime = this.mediaClips[1].startTime || 0;
        this.inactiveVideo.load();
      }
    } else if (this.inactiveVideo) {
      const currentVideo = this.activeVideo;
      this.activeVideo = this.inactiveVideo;
      this.activeVideo.style.visibility = 'visible';
      currentVideo.replaceWith(this.activeVideo);
      this.destroyVideo(currentVideo);
      this.mediaClips.shift();
      // Chrome/Firefox seamless, Safari flashes background when replacing video - play() seems to cause the flash - adding small delay helps
      setTimeout(() => this.activeVideo?.play(), 20);

      if (this.mediaClips.length > 1) {
        this.inactiveVideo = this.createVideo();
        this.inactiveVideo.src = this.mediaClips[1].src;
        this.inactiveVideo.currentTime = this.mediaClips[1].startTime || 0;
        this.inactiveVideo.load();
      } else {
        this.inactiveVideo = undefined;
      }
    } else {
      this.shadowRoot?.removeChild(this.activeVideo);
      this.activeVideo = this.destroyVideo(this.activeVideo);
    }
  }
}
