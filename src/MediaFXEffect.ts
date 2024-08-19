// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { fromError } from 'zod-validation-error';
import { effectSchema, EffectInfo } from './schema/Effect.js';
import MediaFXContent from './MediaFXContent.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: none; }
  </style>
  <slot></slot>`;

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

  protected async effectContent() {
    const content = this.querySelector<MediaFXContent>(
      ':scope > mediafx-content[type="application/json"',
    );
    return content?.textContent;
  }

  public async effectInfo(): Promise<EffectInfo> {
    try {
      return effectSchema.parse(await this.effectContent());
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
      case 'startoffset':
        this._startOffset = parseFloat(newValue);
        break;
      case 'endoffset':
        this._endOffset = parseFloat(newValue);
        break;
      default:
    }
  }
}
