// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { fromError } from 'zod-validation-error';
import { Effect } from './schema/Effect.js';
import { transformSchema } from './schema/Transform.js';

const template = document.createElement('template');
template.innerHTML = `<template><slot></slot></template>`;

export class MediaFXTransform extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['startoffset', 'endoffset'];
  }

  private shadow: ShadowRoot;

  private _startOffset?: number;

  private _endOffset?: number;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
  }

  public effect(): Effect {
    try {
      const transform = transformSchema.parse(this.textContent);
      return {
        keyframes: transform.keyframes.map(kf => ({
          offset: kf.offset,
          easing: kf.easing,
          transform: `translate(${
            kf.translateX !== undefined ? kf.translateX * 100 : 0
          }%, ${kf.translateY !== undefined ? kf.translateY * 100 : 0}%) scale(${
            kf.scale !== undefined ? kf.scale : 1
          }) rotate(${kf.rotate !== undefined ? kf.rotate : 0}deg)`,
        })),
      };
    } catch (error) {
      throw fromError(error);
    }
  }

  public set startOffset(value: number) {
    this._startOffset = value;
  }

  public get startOffset(): number | undefined {
    return this._startOffset;
  }

  public set endOffset(value: number) {
    this._endOffset = value;
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
        this.startOffset = parseFloat(newValue);
        break;
      case 'endoffset':
        this.endOffset = parseFloat(newValue);
        break;
      default:
    }
  }
}
