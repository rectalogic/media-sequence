// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import Media from './Media.js';
import MediaFXTransition, { Transition } from './MediaFXTransition.js';

interface Playable {
  play(): void;
  pause(): void;
  cancel(): void;
}

interface MediaItem {
  media: Media;
  transition?: MediaFXTransition;
}

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host([hidden]) {
      display: none;
    }
    :host {
      display: inline-grid;
    }
  </style>
  <slot></slot>`;

export default class MediaFXSequence extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['width', 'height'];
  }

  private sheet: CSSStyleSheet;

  private activeMedia?: MediaItem;

  private loadingMedia?: MediaItem;

  private playables: Playable[] = [];

  private loadingMediaPromise?: Promise<unknown>;

  private mediaItems?: ReadonlyArray<MediaItem>;

  private currentMediaItems?: MediaItem[];

  private eventLoop?: Promise<void>;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
    this.sheet = new CSSStyleSheet();
    this.updateStyleSheet();
    this.shadowRoot?.adoptedStyleSheets.push(this.sheet);

    //XXX add slotchanged handler to invoke processMediaItems
  }

  public connectedCallback() {
    console.log('mediafx-sequence connected'); //XXX
    this.processMediaItems();
  }

  public attributeChangedCallback(
    attr: string,
    _oldValue: string,
    _newValue: string,
  ) {
    console.log(`Custom mediafx-sequence attributeChangedCallback ${attr}`);
    switch (attr) {
      case 'width':
      case 'height':
        this.updateStyleSheet();
        break;
      default:
    }
  }

  private async processMediaItems() {
    this.stop();
    await this.eventLoop;

    const mediaItems = [];
    let currentItem: MediaItem | undefined;
    for (const element of this.querySelectorAll(
      ':scope > mediafx-video, :scope > mediafx-image, :scope > mediafx-transition',
    )) {
      if (element instanceof Media) {
        currentItem = { media: element };
        mediaItems.push(currentItem);
      } else if (element instanceof MediaFXTransition) {
        if (currentItem === undefined || currentItem.transition)
          throw new Error('Unexpected transition', { cause: element });
        currentItem.transition = element;
      }
    }
    this.mediaItems = mediaItems;
    await this.initialize();
  }

  private updateStyleSheet() {
    const width = this.getAttribute('width');
    const height = this.getAttribute('height');
    this.sheet.replaceSync(`
      :host {
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
    this.currentMediaItems = undefined;
    for (const playable of this.playables) playable.cancel();
    this.playables = [];
    if (this.activeMedia) {
      this.activeMedia.media.cancel();
      this.activeMedia = undefined;
    }
    if (this.loadingMedia) {
      this.loadingMedia.media.cancel();
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
        let sourceTransitionPromise: Promise<Transition | undefined> | null =
          null;
        let destTransitionPromise: Promise<Transition | undefined> | null =
          null;
        if (this.loadingMedia && this.activeMedia.transition) {
          sourceTransitionPromise = this.activeMedia.transition.targetEffect(
            'source',
            this.activeMedia.media,
          );
          destTransitionPromise = this.activeMedia.transition.targetEffect(
            'dest',
            this.loadingMedia.media,
          );
        }

        // eslint-disable-next-line no-await-in-loop
        await this.activeMedia.media.finished;

        if (
          this.loadingMedia &&
          (sourceTransitionPromise || destTransitionPromise)
        ) {
          // eslint-disable-next-line no-await-in-loop
          const [, sourceTransition, destTransition] = await Promise.all([
            this.loadingMediaPromise,
            sourceTransitionPromise,
            destTransitionPromise,
          ]);
          this.loadingMedia.media.mountElement();

          // XXX deal with CSS

          const animations: Promise<Animation>[] = [];
          this.playables = [this.loadingMedia.media, this.activeMedia.media];
          if (sourceTransition?.animations) {
            this.playables.push(...sourceTransition.animations);
            animations.push(
              ...sourceTransition.animations.map(a => a.finished),
            );
          }
          if (destTransition?.animations) {
            this.playables.push(...destTransition.animations);
            animations.push(...destTransition.animations.map(a => a.finished));
          }
          this.play();

          // eslint-disable-next-line no-await-in-loop
          await Promise.all(animations);
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
    if (!this.currentMediaItems || !this.activeMedia) return false;

    if (this.loadingMedia) {
      const currentMedia = this.activeMedia;
      await this.loadingMediaPromise;
      this.activeMedia = this.loadingMedia;
      this.currentMediaItems.shift();
      this.activeMedia.media.play();
      this.playables = [this.activeMedia.media];
      this.activeMedia.media.mountElement();
      currentMedia.media.cancel();

      if (this.currentMediaItems.length > 1) {
        [, this.loadingMedia] = this.currentMediaItems;
        this.loadingMediaPromise = this.loadingMedia?.media.load();
      } else {
        this.loadingMedia = undefined;
        this.loadingMediaPromise = undefined;
      }
      return true;
    }
    return false;
  }

  private async initialize() {
    if (!this.mediaItems) return;
    await this.eventLoop;
    this.currentMediaItems = [...this.mediaItems];

    try {
      if (this.currentMediaItems.length > 1) {
        [, this.loadingMedia] = this.currentMediaItems;
        this.loadingMediaPromise = this.loadingMedia.media.load(
          this.loadingMedia.transition?.duration,
        );
      }

      [this.activeMedia] = this.currentMediaItems;
      await this.activeMedia.media.load(this.activeMedia.transition?.duration);
      this.activeMedia.media.mountElement();
      this.playables = [this.activeMedia.media];

      this.eventLoop = this.runEventLoop();
    } catch (error) {
      this.dispatchError('Media load error', error);
    }
  }
}
