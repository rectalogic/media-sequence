// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { fromError } from 'zod-validation-error';
import { effectSchema, EffectInfo } from './schema/Effect.js';

const template = document.createElement('template');
template.innerHTML = '<slot></slot>';

export default class MediaFXEffect extends HTMLElement {
  private _startOffset?: number;

  private _endOffset?: number;

  static get observedAttributes(): string[] {
    return ['startoffset', 'endoffset'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }

  public get effectInfo(): EffectInfo {
    try {
      return effectSchema.parse(this.textContent);
    } catch (error) {
      throw fromError(error);
    }
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
      case 'starttime':
        this._startOffset = parseFloat(newValue);
        break;
      case 'endtime':
        this._endOffset = parseFloat(newValue);
        break;
      default:
    }
  }
}
