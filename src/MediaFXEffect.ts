// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { fromError } from 'zod-validation-error';
import { effectSchema, Effect } from './schema/Effect.js';

const template = document.createElement('template');
template.innerHTML = `<template><slot></slot></template>`;

export class MediaFXEffect extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['starttime', 'endtime'];
  }

  private shadow: ShadowRoot;

  private _startTime?: number;

  private _endTime?: number;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
  }

  public effect(): Effect {
    try {
      return effectSchema.parse(this.textContent);
    } catch (error) {
      throw fromError(error);
    }
  }

  public set startTime(value: number) {
    this._startTime = value;
  }

  public get startTime(): number | undefined {
    return this._startTime;
  }

  public set endTime(value: number) {
    this._endTime = value;
  }

  public get endTime(): number | undefined {
    return this._endTime;
  }

  public attributeChangedCallback(
    attr: string,
    _oldValue: string,
    newValue: string,
  ) {
    switch (attr) {
      case 'starttime':
        this.startTime = parseFloat(newValue);
        break;
      case 'endtime':
        this.endTime = parseFloat(newValue);
        break;
      default:
    }
  }
}
