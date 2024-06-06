// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import createMedia from './MediaFactory.js';
import { Media } from './Media.js';
import { MediaClip, processMediaClipArray } from './MediaClip.js';

export class MediaSequence extends HTMLElement {
  // XXX make playlist an api, user can fetch if they need to - see https://web.dev/articles/custom-elements-best-practices
  static get observedAttributes(): string[] {
    return ['width', 'height'];
  }

  private shadow: ShadowRoot;

  private sheet: CSSStyleSheet;

  private activeMedia?: Media;

  private loadingMedia?: Media;

  private loadingMediaPromise?: Promise<unknown>;

  private _playlist?: ReadonlyArray<MediaClip>;

  private mediaClips?: MediaClip[];

  private resizeObserver: ResizeObserver;

  private eventLoop?: Promise<void>;

  // XXX handle video/img onerror, set error property and fire error event, also set/fire for playlist issues

  // styling canvas just stretches content, width/height are the real size
  // video is different, it object-fits video into the styled element (or used w/h or native size)
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#sizing_the_canvas_using_css_versus_html
  // so just use w/h and force it

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.sheet = new CSSStyleSheet();
    this.onSizeAttributesChanged();
    this.shadow.adoptedStyleSheets.push(this.sheet);
    this.resizeObserver = new ResizeObserver(() => {
      //if (this.activeMedia) this.updateCanvasSize(this.activeMedia);
      // XXX resize both medias since they may have canvases
    });
    this.resizeObserver.observe(this, { box: 'content-box' });
  }

  public connectedCallback() {
    console.log('Custom media-sequence element added to page.');
  }

  public attributeChangedCallback(
    attr: string,
    _oldValue: string,
    _newValue: string,
  ) {
    console.log(`Custom media-sequence attributeChangedCallback ${attr}`);
    switch (attr) {
      case 'width':
      case 'height':
        this.onSizeAttributesChanged();
        break;
      default:
    }
  }

  public async setPlaylist(data: unknown) {
    this.stop();
    await this.eventLoop;
    this._playlist = undefined;
    this.mediaClips = undefined;
    this.activeMedia = undefined;

    if (data !== undefined) {
      this._playlist = processMediaClipArray(data);
      await this.initialize();
    }
  }

  public get playlist(): ReadonlyArray<MediaClip> | undefined {
    return this._playlist;
  }

  private onSizeAttributesChanged() {
    const width = this.getAttribute('width');
    const height = this.getAttribute('height');
    this.sheet.replaceSync(`
      :host([hidden]) {
        display: none;
      }
      :host {
        display: inline-block;
        width: ${width !== null ? `${width}px` : 'auto'};
        height: ${height !== null ? `${height}px` : 'auto'};
      }
    `);
  }

  public play() {
    if (this.activeMedia !== undefined && !this.activeMedia.playing) {
      this.activeMedia.play();
    }
  }

  public pause() {
    if (this.activeMedia?.playing) {
      this.activeMedia.pause();
    }
  }

  public stop() {
    this.mediaClips = undefined;
    if (this.activeMedia) {
      this.activeMedia.dispose();
      this.shadow.removeChild(this.activeMedia.renderableElement);
      this.activeMedia = undefined;
    }
    if (this.loadingMedia) {
      this.loadingMedia.dispose();
      this.loadingMedia = undefined;
      this.loadingMediaPromise = undefined;
    }
  }

  private dispatchError(message: string, error: unknown) {
    if (error instanceof Error)
      this.dispatchEvent(new ErrorEvent(error.message, { error: error.cause }));
    else this.dispatchEvent(new ErrorEvent(message, { error }));
  }

  //XXX we only need rAF for rendering video to canvas
  private async runEventLoop() {
    while (this.activeMedia !== undefined) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.activeMedia.finished;
      } catch (error) {
        // Return if animation cancelled
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        this.stop();
        this.eventLoop = undefined;
        this.dispatchError('Media playback error', error);
        return;
      }
      try {
        // Finished sequence, reinitialize and return
        // eslint-disable-next-line no-await-in-loop
        if (!(await this.nextMedia())) {
          this.stop();
          // Unset eventLoop since initialize will await it
          this.eventLoop = undefined;
          this.initialize();
          return;
        }
      } catch (error) {
        this.stop();
        this.eventLoop = undefined;
        this.dispatchError('Media load error', error);
        return;
      }
    }
  }

  private async nextMedia() {
    if (!this.mediaClips || !this.activeMedia) return false;

    if (this.loadingMedia) {
      const currentMedia = this.activeMedia;
      await this.loadingMediaPromise;
      this.activeMedia = this.loadingMedia;
      this.shadow.replaceChildren(this.activeMedia.renderableElement);

      currentMedia.dispose();
      this.mediaClips.shift();
      this.activeMedia.play();

      if (this.mediaClips.length > 1) {
        this.loadingMedia = createMedia(this.mediaClips[1]);
        this.loadingMediaPromise = this.loadingMedia.load();
      } else {
        this.loadingMedia = undefined;
        this.loadingMediaPromise = undefined;
      }
      return true;
    }
    return false;
  }

  private async initialize() {
    if (!this._playlist) return;
    await this.eventLoop;
    this.mediaClips = [...this._playlist];
    try {
      if (this.mediaClips.length > 1) {
        this.loadingMedia = createMedia(this.mediaClips[1]);
        this.loadingMediaPromise = this.loadingMedia.load();
      }

      this.activeMedia = createMedia(this.mediaClips[0]);
      await this.activeMedia.load();
      this.shadow.replaceChildren(this.activeMedia.renderableElement);

      this.eventLoop = this.runEventLoop();
    } catch (error) {
      this.dispatchError('Media load error', error);
    }
  }
}
