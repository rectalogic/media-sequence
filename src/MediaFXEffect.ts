// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { EffectInfo } from './schema/Effect.js';
import { Effects } from './Effects.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: none; }
  </style>
  <slot></slot>`;

export default class MediaFXEffect extends HTMLElement {
  private _startOffset?: number;

  private _endOffset?: number;

  private _preset?: string;

  static get observedAttributes(): string[] {
    return ['startoffset', 'endoffset', 'preset'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }

  public effectInfo(): EffectInfo {
    if (
      this._preset &&
      Object.prototype.hasOwnProperty.call(Effects, this._preset)
    ) {
      return Effects[this._preset];
    }
    throw new Error(`Invalid mediafx-effect preset ${this._preset}`);
  }

  public get startOffset(): number | undefined {
    return this._startOffset;
  }

  public get endOffset(): number | undefined {
    return this._endOffset;
  }

  public attributeChangedCallback(
    attr: string,
    _oldValue: string,
    newValue: string,
  ) {
    switch (attr) {
      case 'startoffset':
        this._startOffset = parseFloat(newValue);
        break;
      case 'endoffset':
        this._endOffset = parseFloat(newValue);
        break;
      case 'preset':
        this._preset = newValue;
        break;
      default:
    }
  }
}
