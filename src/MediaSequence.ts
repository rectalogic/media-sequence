// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import createMedia from './MediaFactory.js';
import { Media } from './Media.js';
import { MediaClip, processMediaClipArray } from './MediaClip.js';

export class MediaSequence extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['playlist', 'width', 'height'];
  }

  private shadow: ShadowRoot;

  private ctx2d: CanvasRenderingContext2D;

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
    this.shadow = this.attachShadow({ mode: 'open' });

    const canvas = document.createElement('canvas');
    canvas.className = 'canvas';
    this.shadow.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas 2d context');
    this.ctx2d = ctx;
    this.sheet = new CSSStyleSheet();
    this.onSizeAttributesChanged();
    const canvasSheet = new CSSStyleSheet();
    canvasSheet.replaceSync(`
      .canvas {
        position: relative;
        width: 100%;
        height: 100%;
      }
    `);
    this.shadow.adoptedStyleSheets.push(canvasSheet, this.sheet);

    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === this) {
          const size = entry.contentBoxSize[0];
          this.updateCanvasSize(
            size.inlineSize,
            size.blockSize,
            this.activeMedia,
          );
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
        this.onSizeAttributesChanged();
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

  private draw(media?: Media) {
    if (media)
      this.ctx2d.drawImage(
        media.element,
        0,
        0,
        this.ctx2d.canvas.width,
        this.ctx2d.canvas.height,
      );
  }

  private updateCanvasSize(width: number, height: number, media?: Media) {
    //XXX intrinsic may be 0
    this.ctx2d.canvas.width = Math.min(width * 2, media?.intrinsicWidth || 0);
    this.ctx2d.canvas.height = Math.min(
      height * 2,
      media?.intrinsicHeight || 0,
    );
  }

  private onSizeAttributesChanged() {
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
      this.disposeMedia(this.activeMedia);
      this.activeMedia = undefined;
    }
    if (this.loadingMedia) {
      this.disposeMedia(this.loadingMedia);
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
    const media = createMedia(mediaClip, this.onMediaLoad, this.onMediaError);
    return media;
  }

  private disposeMedia(media: Media): undefined {
    media.dispose();
    return undefined;
  }

  private onMediaLoad = (media: Media) => {
    if (media === this.activeMedia) {
      this.updateCanvasSize(this.offsetWidth, this.offsetHeight, media);
      this.draw(media);
    }
  };

  private onMediaError = (message: string, cause: any) => {
    this.stop();
    this.dispatchEvent(new ErrorEvent(message, { error: cause }));
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
      if (this.activeMedia && this.activeMedia.playing) {
        this.draw(this.activeMedia);
        requestAnimationFrame(this.onAnimationFrame);
      }
    }
  };

  private initialize() {
    if (!this.mediaClips) return;
    this.activeMedia = this.createMedia(this.mediaClips[0]);
    if (this.activeMedia.loaded) {
      this.updateCanvasSize(
        this.offsetWidth,
        this.offsetHeight,
        this.activeMedia,
      );
      this.draw(this.activeMedia);
    }

    if (this.mediaClips.length > 1) {
      this.loadingMedia = this.createMedia(this.mediaClips[1]);
    }
  }

  private nextVideo() {
    if (!this.mediaClips || !this.activeMedia) return;

    if (this.loadingMedia) {
      const currentMedia = this.activeMedia;
      this.activeMedia = this.loadingMedia;
      if (this.activeMedia.loaded) {
        this.updateCanvasSize(
          this.offsetWidth,
          this.offsetHeight,
          this.activeMedia,
        );
        this.draw(this.activeMedia);
      }
      this.disposeMedia(currentMedia);
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
