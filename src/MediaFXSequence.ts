// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import createMedia from './MediaFactory.js';
import { Media } from './Media.js';
import { Transition } from './Transition.js';
import { Transitions } from './Transitions.js';
import { MediaInfo, processMediaInfoArray } from './schema/index.js';

interface Playable {
  play(): void;
  pause(): void;
  cancel(): void;
}

export class MediaFXSequence extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['width', 'height'];
  }

  private shadow: ShadowRoot;

  private sheet: CSSStyleSheet;

  private activeMedia?: Media;

  private loadingMedia?: Media;

  private playables: Playable[] = [];

  private loadingMediaPromise?: Promise<unknown>;

  private _playlist?: ReadonlyArray<MediaInfo>;

  private mediaInfos?: MediaInfo[];

  private eventLoop?: Promise<void>;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.sheet = new CSSStyleSheet();
    this.onSizeAttributesChanged();
    this.shadow.adoptedStyleSheets.push(this.sheet);
  }

  public connectedCallback() {
    console.log('Custom media-fx element added to page.');
  }

  public attributeChangedCallback(
    attr: string,
    _oldValue: string,
    _newValue: string,
  ) {
    console.log(`Custom media-fx attributeChangedCallback ${attr}`);
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
    this.playables = [];
    this.mediaInfos = undefined;
    this.activeMedia = undefined;

    if (data !== undefined) {
      this._playlist = processMediaInfoArray(data);
      await this.initialize();
    }
  }

  public get playlist(): ReadonlyArray<MediaInfo> | undefined {
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
        display: inline-grid;
        width: ${width !== null ? `${width}px` : 'auto'};
        height: ${height !== null ? `${height}px` : 'auto'};
      }
      .media {
        grid-area: 1 / 1;
        overflow: hidden;
      }
    `);
  }

  public play() {
    for (const playable of this.playables) playable.play();
  }

  public pause() {
    for (const playable of this.playables) playable.pause();
  }

  public stop() {
    this.mediaInfos = undefined;
    for (const playable of this.playables) playable.cancel();
    this.playables = [];
    if (this.activeMedia) {
      this.activeMedia.cancel();
      this.activeMedia = undefined;
    }
    if (this.loadingMedia) {
      this.loadingMedia.cancel();
      this.loadingMedia = undefined;
      this.loadingMediaPromise = undefined;
    }
  }

  private dispatchError(message: string, error: unknown) {
    if (error instanceof Error)
      this.dispatchEvent(new ErrorEvent(error.message, { error: error.cause }));
    else this.dispatchEvent(new ErrorEvent(message, { error }));
  }

  private async runEventLoop() {
    while (this.activeMedia !== undefined) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.activeMedia.finished;
        if (this.loadingMedia && this.activeMedia.mediaInfo.transition) {
          // eslint-disable-next-line no-await-in-loop
          await this.loadingMediaPromise;
          this.shadow.insertBefore(
            this.loadingMedia.renderableElement,
            this.activeMedia.renderableElement,
          );
          const transitionInfo = this.activeMedia.mediaInfo.transition;
          let transition;
          if ('name' in transitionInfo) {
            if (transitionInfo.name in Transitions) {
              transition = new Transition(
                this.activeMedia.mediaInfo.transition.duration,
                this.activeMedia.renderableElement,
                this.loadingMedia.renderableElement,
                Transitions[transitionInfo.name],
              );
            } else throw new Error('unreachable'); // Validation ensures name is in Transitions
          } else {
            transition = new Transition(
              this.activeMedia.mediaInfo.transition.duration,
              this.activeMedia.renderableElement,
              this.loadingMedia.renderableElement,
              transitionInfo.transition,
            );
          }

          this.playables = [this.loadingMedia, this.activeMedia, transition];
          this.play();

          // eslint-disable-next-line no-await-in-loop
          await transition.finished;
        }
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
    if (!this.mediaInfos || !this.activeMedia) return false;

    if (this.loadingMedia) {
      const currentMedia = this.activeMedia;
      await this.loadingMediaPromise;
      this.activeMedia = this.loadingMedia;
      this.mediaInfos.shift();
      this.activeMedia.play();
      this.playables = [this.activeMedia];
      this.shadow.replaceChildren(this.activeMedia.renderableElement);
      currentMedia.cancel();

      if (this.mediaInfos.length > 1) {
        this.loadingMedia = createMedia(this.mediaInfos[1]);
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
    this.mediaInfos = [...this._playlist];
    try {
      if (this.mediaInfos.length > 1) {
        this.loadingMedia = createMedia(this.mediaInfos[1]);
        this.loadingMediaPromise = this.loadingMedia.load();
      }

      this.activeMedia = createMedia(this.mediaInfos[0]);
      await this.activeMedia.load();
      this.shadow.replaceChildren(this.activeMedia.renderableElement);
      this.playables = [this.activeMedia];

      this.eventLoop = this.runEventLoop();
    } catch (error) {
      this.dispatchError('Media load error', error);
    }
  }
}
