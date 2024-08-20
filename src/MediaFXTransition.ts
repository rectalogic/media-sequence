// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

// XXX need <mediafx-json> child and optional <mediafx-style> which is just the styles with no selector, and use ::slotted(.source)/::slotted(.dest) as selectors
// XXX hmm, use <mediafx-target type="source">/<mediafx-target type="dest"> to contain the above
// XXX need to support canned transitions too
//XXX make <mediafx-json> support src attribute and load the json - use in Effect too

import { fromError } from 'zod-validation-error';
import { effectSchema, EffectInfo } from './schema/Effect.js';
import MediaFXContent from './MediaFXContent.js';

type TargetType = 'source' | 'dest';
type TransitionInfo = {
  style?: CSSStyleSheet;
  animation?: Animation;
};

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: none; }
  </style>
  <slot></slot>`;

export class MediaFXTransition extends HTMLElement {
  private _duration: number = 0;

  static get observedAttributes(): string[] {
    return ['duration'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }

  public async targetEffect(
    targetType: TargetType,
    targetElement: HTMLElement,
  ): Promise<TransitionInfo | null> {
    try {
      const target = this.shadowRoot?.querySelector(
        `:scope > mediafx-target[type="${targetType}"`,
      );
      if (target) {
        const targetJson = await target
          .querySelector<MediaFXContent>(
            ':scope > mediafx-content[type="application/json"]',
          )
          ?.content();
        const targetStyle = await target
          .querySelector<MediaFXContent>(
            ':scope > mediafx-content[type="text/css"]',
          )
          ?.content();
        const result: TransitionInfo = {};
        if (targetJson) {
          const effect = effectSchema.parse(targetJson);
          const options = {
            ...effect.options,
            duration: this.duration / (effect.options?.iterations || 1),
          };
          result.animation = new Animation(
            new KeyframeEffect(targetElement, effect.keyframes, options),
          );
          result.animation.pause();
        }
        if (targetStyle) {
          const sheet = new CSSStyleSheet();
          sheet.insertRule(`::slotted(.${targetType}) { ${targetStyle} }`);
          result.style = sheet;
        }
        return result;
      }
      return null;
    } catch (error) {
      throw fromError(error);
    }
  }

  public get duration(): number {
    return this._duration;
  }

  public attributeChangedCallback(
    attr: string,
    _oldValue: string,
    newValue: string,
  ) {
    switch (attr) {
      case 'duration':
        this._duration = parseFloat(newValue);
        break;
      default:
    }
  }
}
