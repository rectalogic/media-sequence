// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { EffectInfo } from './schema/Effect.js';
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

  static {
    // We should be able to declare custom @property in each transitions CSS, but this is broken in all browsers
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1883979
    // https://issues.chromium.org/issues/40779474
    // https://wpt.live/css/css-properties-values-api/at-property-shadow.html
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      @property --mediafx-angle {
        syntax: "<angle>";
        inherits: false;
        initial-value: 0deg;
      }
    `);
    document.adoptedStyleSheets.push(sheet);
  }

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
      sheet.replaceSync(targetStyle);
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
  public targetEffect(
    targetType: TargetType,
    targetElement: HTMLElement,
  ): Transition | undefined {
    if (
      this._preset &&
      Object.prototype.hasOwnProperty.call(Transitions, this._preset)
    ) {
      const transitionPreset = Transitions[this._preset];
      if (targetType in transitionPreset) {
        return this.buildTransition(
          targetType,
          targetElement,
          transitionPreset[targetType]?.effects,
          transitionPreset[targetType]?.style,
        );
      }
    }
    return undefined;
  }

  public get duration(): number {
    return this._duration;
  }

  public get preset(): string | undefined {
    return this._preset;
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
        this._preset = newValue;
        break;
      default:
    }
  }
}
