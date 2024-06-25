// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import createMedia from './MediaFactory.js';
import { Media } from './Media.js';
import { MediaClip, Transition, processMediaClipArray } from './MediaClip.js';

interface Playable {
  play(): void;
  pause(): void;
  cancel(): void;
}

export class MediaSequence extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['width', 'height'];
  }

  private shadow: ShadowRoot;

  private sheet: CSSStyleSheet;

  private activeMedia?: Media;

  private loadingMedia?: Media;

  private playables: Playable[] = [];

  private loadingMediaPromise?: Promise<unknown>;

  private _playlist?: ReadonlyArray<MediaClip>;

  private mediaClips?: MediaClip[];

  private eventLoop?: Promise<void>;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.sheet = new CSSStyleSheet();
    this.onSizeAttributesChanged();
    this.shadow.adoptedStyleSheets.push(this.sheet);
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
    this.playables = [];
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
        display: inline-grid;
        grid-template-areas: "media";
        width: ${width !== null ? `${width}px` : 'auto'};
        height: ${height !== null ? `${height}px` : 'auto'};
      }
      .media {
        grid-area: media;
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
    this.mediaClips = undefined;
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

  private static createTransitionAnimations(
    element: HTMLElement,
    transitions: Transition[],
    overlap: number,
  ) {
    return transitions.map(transition => {
      const effect = new KeyframeEffect(element, transition.keyframes, {
        duration: overlap / (transition.iterations || 1),
        composite: transition.composite,
        fill: transition.fill,
        easing: transition.easing,
        iterations: transition.iterations,
        iterationComposite: transition.iterationComposite,
      });
      const animation = new Animation(effect);
      animation.pause();
      return animation;
    });
  }

  private async runEventLoop() {
    while (this.activeMedia !== undefined) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.activeMedia.finished;
        if (this.loadingMedia && this.activeMedia.mediaClip.transition) {
          // eslint-disable-next-line no-await-in-loop
          await this.loadingMediaPromise;
          this.shadow.insertBefore(
            this.loadingMedia.renderableElement,
            this.activeMedia.renderableElement,
          );
          const transitions = [
            ...MediaSequence.createTransitionAnimations(
              this.activeMedia.renderableElement,
              this.activeMedia.mediaClip.transition.source,
              this.activeMedia.mediaClip.transition.overlap,
            ),
            ...MediaSequence.createTransitionAnimations(
              this.loadingMedia.renderableElement,
              this.activeMedia.mediaClip.transition.dest,
              this.activeMedia.mediaClip.transition.overlap,
            ),
          ];
          this.playables = [
            this.loadingMedia,
            this.activeMedia,
            ...transitions,
          ];
          this.play();

          // eslint-disable-next-line no-await-in-loop
          await Promise.all(transitions.map(t => t.finished));
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
    if (!this.mediaClips || !this.activeMedia) return false;

    if (this.loadingMedia) {
      const currentMedia = this.activeMedia;
      await this.loadingMediaPromise;
      this.activeMedia = this.loadingMedia;
      this.mediaClips.shift();
      this.activeMedia.play();
      this.playables = [this.activeMedia];
      this.shadow.replaceChildren(this.activeMedia.renderableElement);
      currentMedia.cancel();

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
      this.playables = [this.activeMedia];

      this.eventLoop = this.runEventLoop();
    } catch (error) {
      this.dispatchError('Media load error', error);
    }
  }
}
