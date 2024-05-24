// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import createMedia from './MediaFactory.js';
import { Media } from './Media.js';
import { MediaClip, processMediaClipArray } from './MediaClip.js';

export class MediaSequence extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['playlist', 'width', 'height'];
  }

  private sheet: CSSStyleSheet;

  private activeMedia?: Media;

  private loadingMedia?: Media;

  private playlist?: ReadonlyArray<MediaClip>;

  private mediaClips?: MediaClip[];

  private resizeObserver: ResizeObserver;

  // XXX handle video/img onerror, set error property and fire error event, also set/fire for playlist issues

  // styling canvas just stretches content, width/height are the real size
  // video is different, it object-fits video into the styled element (or used w/h or native size)
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#sizing_the_canvas_using_css_versus_html
  // so just use w/h and force it

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    this.sheet = new CSSStyleSheet();
    this.updateSize();
    shadow.adoptedStyleSheets.push(this.sheet);

    this.resizeObserver = new ResizeObserver(entries => {
      if (!(this.activeMedia || this.loadingMedia)) return;
      for (const entry of entries) {
        if (entry.target === this) {
          const size = entry.contentBoxSize[0];
          if (this.activeMedia)
            this.activeMedia.resize(size.inlineSize, size.blockSize);
          if (this.loadingMedia)
            this.loadingMedia.resize(size.inlineSize, size.blockSize);
        }
      }
    });
    this.resizeObserver.observe(this, { box: 'content-box' });
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
    this.playlist = undefined;
    this.mediaClips = undefined;
    this.activeMedia = undefined;
    this.stop();
    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.dispatchEvent(
          new ErrorEvent('error', {
            message: `Failed to fetch playlist ${url}`,
            error: response,
          }),
        );
      }

      const json = await response.json();

      this.playlist = processMediaClipArray(json);
      this.mediaClips = [...this.playlist];

      this.initialize();
    } catch (error) {
      this.playlist = undefined;
      this.mediaClips = undefined;
      this.activeMedia = undefined;

      this.dispatchEvent(
        new ErrorEvent('error', {
          message: 'Failed to parse playlist contents',
          error: error as any,
        }),
      );
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
    if (this.activeMedia && !this.activeMedia.playing) {
      this.activeMedia.play();
      requestAnimationFrame(this.onAnimationFrame);
    }
  }

  public pause() {
    if (this.activeMedia && this.activeMedia.playing) {
      this.activeMedia.pause();
    }
  }

  public stop() {
    if (this.activeMedia) {
      MediaSequence.disposeMedia(this.activeMedia);
      this.shadowRoot?.removeChild(this.activeMedia.element);
      this.activeMedia = undefined;
    }
    if (this.loadingMedia) {
      MediaSequence.disposeMedia(this.loadingMedia);
      this.loadingMedia = undefined;
    }
    if (this.playlist) {
      this.mediaClips = [...this.playlist];
      this.initialize();
    } else {
      this.mediaClips = undefined;
    }
  }

  private createMedia(mediaClip: MediaClip): Media {
    const media = createMedia(mediaClip, this.onError);
    media.resize(this.offsetWidth, this.offsetHeight);
    return media;
  }

  private static disposeMedia(media: Media): undefined {
    media.dispose();
    return undefined;
  }

  private onError = (event: ErrorEvent) => {
    this.stop();
    this.dispatchEvent(event);
  };

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
      if (this.activeMedia && this.activeMedia.playing)
        requestAnimationFrame(this.onAnimationFrame);
    }
  };

  private initialize() {
    if (!this.mediaClips) return;
    this.activeMedia = this.createMedia(this.mediaClips[0]);
    this.activeMedia.show();
    this.shadowRoot?.appendChild(this.activeMedia.element);

    if (this.mediaClips.length > 1) {
      this.loadingMedia = this.createMedia(this.mediaClips[1]);
    }
  }

  private nextVideo() {
    if (!this.mediaClips || !this.activeMedia) return;

    if (this.loadingMedia) {
      const currentMedia = this.activeMedia;
      this.activeMedia = this.loadingMedia;
      this.activeMedia.show();
      currentMedia.element.replaceWith(this.activeMedia.element);
      MediaSequence.disposeMedia(currentMedia);
      this.mediaClips.shift();
      this.activeMedia.play();

      if (this.mediaClips.length > 1) {
        this.loadingMedia = this.createMedia(this.mediaClips[1]);
      } else {
        this.loadingMedia = undefined;
      }
    } else {
      this.stop();
    }
  }
}
