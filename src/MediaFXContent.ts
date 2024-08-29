// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

const template = document.createElement('template');
// Wrap contents in <script> to avoid FOUC
template.innerHTML = `
  <style>
    :host { display: none; }
  </style>
  <script type="application/mediafx-content">
    <slot></slot>
  </script>`;

export default class MediaFXContent extends HTMLElement {
  private _src?: string;

  private _type?: string;

  static get observedAttributes(): string[] {
    return ['src', 'type'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }

  public async content() {
    if (this.src) {
      const response = await fetch(this.src);
      return response.text();
    }
    return this.textContent;
  }

  public set src(value: string) {
    this._src = value;
  }

  public get src(): string | undefined {
    return this._src;
  }

  public set type(value: string) {
    this._type = value;
  }

  public get type(): string | undefined {
    return this._type;
  }

  public attributeChangedCallback(
    attr: string,
    _oldValue: string,
    newValue: string,
  ) {
    switch (attr) {
      case 'src':
        this._src = newValue;
        break;
      case 'type':
        this._type = newValue;
        break;
      default:
    }
  }
}
