export class MediaSequence extends HTMLElement {

  static get observedAttributes(): string[] {
    return ["color", "size"];
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    const div = document.createElement("div");
    const style = document.createElement("style");
    shadow.appendChild(style);
    shadow.appendChild(div);
  }

  public connectedCallback(): void {
    console.log("Custom media-sequence element added to page.");
    this.updateStyle();
  }

  public attributeChangedCallback(attr: string, oldValue: string, newValue: string): void {
    console.log("Custom media-sequence element attributes changed.");
    this.updateStyle();
  }

  private updateStyle(): void {
    const style = this.shadowRoot?.querySelector("style");
    if (style)
      style.textContent = `
      div {
        width: ${this.getAttribute("size")}px;
        height: ${this.getAttribute("size")}px;
        background-color: ${this.getAttribute("color")};
      }
    `;
  }
}
