export class MediaSequence extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['playlist', 'width', 'height'];
  }

  private sheet: CSSStyleSheet;

  private width: number | null = null;

  private height: number | null = null;

  private activeVideo: HTMLVideoElement | null = null;

  private inactiveVideo: HTMLVideoElement | null = null;

  private sequence = [
    {
      src: 'https://cdn.glitch.me/364f8e5a-f12f-4f82-a386-20e6be6b1046/bbb_sunflower_1080p_30fps_normal_10min.mp4?v=1715787973754',
      start: 100,
      end: 105,
    },
    {
      src: 'https://cdn.glitch.me/364f8e5a-f12f-4f82-a386-20e6be6b1046/elephants_dream_1280x720.mp4?v=1715789814855',
      start: 100,
      end: 105,
    },
    {
      src: 'https://cdn.glitch.me/364f8e5a-f12f-4f82-a386-20e6be6b1046/bbb_sunflower_1080p_30fps_normal_10min.mp4?v=1715787973754',
      start: 5,
      end: 10,
    },
    {
      src: 'https://cdn.glitch.me/364f8e5a-f12f-4f82-a386-20e6be6b1046/elephants_dream_1280x720.mp4?v=1715789814855',
      start: 200,
      end: 205,
    },
  ];
  // styling canvas just stretches content, width/height are the real size
  // video is different, it object-fits video into the styled element (or used w/h or native size)
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#sizing_the_canvas_using_css_versus_html
  // so just use w/h and force it

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    this.sheet = new CSSStyleSheet();
    this.updateSize();
    shadow.adoptedStyleSheets.push(this.sheet);
  }

  public connectedCallback(): void {
    console.log('Custom media-sequence element added to page.');
  }

  public attributeChangedCallback(
    attr: string,
    _oldValue: string,
    _newValue: string,
  ): void {
    if (attr === 'width') {
      this.width = parseInt(this.getAttribute('width') || '', 10);
      this.updateSize();
    } else if (attr === 'height') {
      this.height = parseInt(this.getAttribute('height') || '', 10);
      this.updateSize();
    }
  }

  private updateSize(): void {
    this.sheet.replaceSync(`
      :host {
        display: inline-block;
        width: ${this.width ? `${this.width}px` : 'auto'};
        height: ${this.height ? `${this.height}px` : 'auto'};
      }
    `);
    if (this.activeVideo) {
      if (this.width != null) this.activeVideo.width = this.width;
      if (this.height != null) this.activeVideo.height = this.height;
    }
    if (this.inactiveVideo) {
      if (this.width != null) this.inactiveVideo.width = this.width;
      if (this.height != null) this.inactiveVideo.height = this.height;
    }
  }

  public play(): void {
    this.nextVideo();
  }

  private createVideo(): HTMLVideoElement {
    const video = document.createElement('video');
    if (this.width) video.width = this.width;
    if (this.height) video.height = this.height;
    video.style.visibility = 'hidden';
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.addEventListener('timeupdate', this.onTimeUpdate);
    return video;
  }

  private destroyVideo(video: HTMLVideoElement): null {
    video.pause();
    video.style.visibility = 'hidden'; // eslint-disable-line no-param-reassign
    video.removeEventListener('timeupdate', this.onTimeUpdate);
    video.removeAttribute('src');
    video.load();
    return null;
  }

  private onTimeUpdate = (_event: Event): void => {
    // Check for activeVideo.ended too, we will stop getting updates when it ends
    if (
      this.activeVideo &&
      this.activeVideo.currentTime >= this.sequence[0].end
    ) {
      this.nextVideo();
    }
  };

  private nextVideo(): void {
    // First call, setup initial 2 videos
    if (!this.activeVideo) {
      this.activeVideo = this.createVideo();
      this.activeVideo.style.visibility = 'visible';
      this.activeVideo.src = this.sequence[0].src;
      this.activeVideo.currentTime = this.sequence[0].start;
      this.shadowRoot?.appendChild(this.activeVideo);
      this.activeVideo.play();

      if (this.sequence.length > 1) {
        this.inactiveVideo = this.createVideo();
        this.inactiveVideo.src = this.sequence[1].src;
        this.inactiveVideo.currentTime = this.sequence[1].start;
        this.inactiveVideo.load();
      }
    } else if (this.inactiveVideo) {
      const currentVideo = this.activeVideo;
      this.activeVideo = this.inactiveVideo;
      this.activeVideo.style.visibility = 'visible';
      currentVideo.replaceWith(this.activeVideo);
      this.destroyVideo(currentVideo);
      this.sequence.shift();
      // Chrome/Firefox seamless, Safari flashes background when replacing video - play() seems to cause the flash - adding small delay helps
      const playVideo = this.activeVideo;
      setTimeout(() => playVideo.play(), 20);

      if (this.sequence.length > 1) {
        this.inactiveVideo = this.createVideo();
        this.inactiveVideo.src = this.sequence[1].src;
        this.inactiveVideo.currentTime = this.sequence[1].start;
        this.inactiveVideo.load();
      } else {
        this.inactiveVideo = null;
      }
    } else {
      this.shadowRoot?.removeChild(this.activeVideo);
      this.activeVideo = this.destroyVideo(this.activeVideo);
    }
  }
}
