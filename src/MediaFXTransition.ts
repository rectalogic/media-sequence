// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

// XXX need <mediafx-json> child and optional <mediafx-style> which is just the styles with no selector, and use ::slotted(.source)/::slotted(.dest) as selectors
// XXX hmm, use <mediafx-target type="source">/<mediafx-target type="dest"> to contain the above
// XXX need to support canned transitions too

import { fromError } from 'zod-validation-error';
import { effectSchema, EffectInfo } from './schema/Effect.js';
import MediaFXContent from './MediaFXContent.js';
import { Transitions } from './Transitions.js';

type TargetType = 'source' | 'dest';
export type Transition = {
  style?: CSSStyleSheet;
  animations?: Animation[];
};

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: none; }
  </style>
  <slot></slot>`;

export default class MediaFXTransition extends HTMLElement {
  private _duration: number = 0;

  private _preset?: string;

  static get observedAttributes(): string[] {
    return ['duration', 'preset'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }

  private buildTransition(
    targetType: TargetType,
    targetElement: HTMLElement,
    targetEffects?: EffectInfo[],
    targetStyle?: string | null,
  ) {
    let animations;
    let style;
    if (targetEffects) {
      animations = targetEffects.map(effect => {
        const options = {
          ...effect.options,
          duration: this.duration / (effect.options?.iterations || 1),
        };
        const animation = new Animation(
          new KeyframeEffect(targetElement, effect.keyframes, options),
        );
        animation.pause();
        return animation;
      });
    }

    if (targetStyle) {
      const sheet = new CSSStyleSheet();
      sheet.insertRule(`::slotted(.${targetType}) { ${targetStyle} }`);
      style = sheet;
    }

    if (animations || style) {
      const transition: Transition = {};
      if (animations) transition.animations = animations;
      if (style) transition.style = style;
      return transition;
    }
    return undefined;
  }

  // XXX cache effects and style, rebuild on slotchange
  public async targetEffect(
    targetType: TargetType,
    targetElement: HTMLElement,
  ): Promise<Transition | undefined> {
    if (this._preset) {
      const transition = Transitions[this._preset];
      if (!(targetType in transition)) return undefined;
      return this.buildTransition(
        targetType,
        targetElement,
        transition[targetType]?.effects,
        transition[targetType]?.style,
      );
    }

    try {
      const target = this.shadowRoot?.querySelector(
        `:scope > mediafx-target[type="${targetType}"`,
      );
      if (target) {
        const targetStyle = await target
          .querySelector<MediaFXContent>(
            ':scope > mediafx-content[type="text/css"]',
          )
          ?.content();
        const targetJson = await Promise.all(
          Array.from(
            target.querySelectorAll<MediaFXContent>(
              ':scope > mediafx-content[type="application/json"]',
            ),
          ).map(async tj => tj.content()),
        );
        let effects;
        if (targetJson.length > 0) {
          effects = targetJson.map(tj => effectSchema.parse(tj));
        }
        return this.buildTransition(
          targetType,
          targetElement,
          effects,
          targetStyle,
        );
      }
      return undefined;
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
      case 'preset':
        if (newValue in Transitions) this._preset = newValue;
        else throw new Error(`Invalid preset ${newValue}`);
        break;
      default:
    }
  }
}
