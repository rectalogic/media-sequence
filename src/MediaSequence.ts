// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import createMedia from './MediaFactory.js';
import { Media } from './Media.js';
import { MediaClip, processMediaClipArray } from './MediaClip.js';

const delay = async (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

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

  private playbackLoopRunning: boolean = false;

  private _playlist?: ReadonlyArray<MediaClip>;

  private mediaClips?: MediaClip[];

  private resizeObserver: ResizeObserver;

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
    this._playlist = undefined;
    this.mediaClips = undefined;
    this.activeMedia = undefined;

    if (data !== undefined) {
      this._playlist = processMediaClipArray(data);
      this.mediaClips = [...this._playlist];

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
      this.playbackLoopRunning = true;
      this.activeMedia.play();
      this.playbackLoop();
    }
  }

  public pause() {
    if (this.activeMedia !== undefined && this.activeMedia.playing) {
      this.playbackLoopRunning = false;
      this.activeMedia.pause();
    }
  }

  public async stop() {
    this.playbackLoopRunning = false;
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
    if (this.playlist) {
      this.mediaClips = [...this.playlist];
      await this.initialize();
    } else {
      this.mediaClips = undefined;
    }
  }

  private dispatchError(message: string, error: unknown) {
    if (error instanceof Error)
      this.dispatchEvent(new ErrorEvent(error.message, { error: error.cause }));
    else this.dispatchEvent(new ErrorEvent(message, { error }));
  }

  //XXX we only need rAF for rendering video to canvas, can just use setTimeout for other timing stuff - animation kind of jumpy though
  private async playbackLoop() {
    const rate = 50;
    while (this.playbackLoopRunning && this.activeMedia !== undefined) {
      const frameBeginTime = performance.now();
      this.activeMedia.animationTime = frameBeginTime;
      if (this.activeMedia.ended) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await this.nextMedia();
        } catch (error) {
          this.dispatchError('Media load error', error);
          return; //XXX cleanup state? stop()?
        }
      }
      const frameDelayTime = rate - (performance.now() - frameBeginTime);
      if (frameDelayTime > 0)
        // eslint-disable-next-line no-await-in-loop
        await delay(frameDelayTime);
    }
    //XXX cleanup state/stop()? if this.activeMedia undefined
  }

  private async nextMedia() {
    if (!this.mediaClips || !this.activeMedia) return;

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
    } else {
      this.stop();
    }
  }

  private async initialize() {
    if (!this.mediaClips) return;
    try {
      this.activeMedia = createMedia(this.mediaClips[0]);
      await this.activeMedia.load();
      this.shadow.replaceChildren(this.activeMedia.renderableElement);

      if (this.mediaClips.length > 1) {
        this.loadingMedia = createMedia(this.mediaClips[1]);
        this.loadingMediaPromise = this.loadingMedia.load();
      }
    } catch (error) {
      this.dispatchError('Media load error', error);
    }
  }
}
