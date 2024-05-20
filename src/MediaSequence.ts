// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import * as twgl from 'twgl.js';
import createMedia from './MediaFactory.js';
import { Media } from './Media.js';
import { MediaClip, isMediaClipArray } from './MediaClip.js';

const enum MediaState {
  Uninitialized = 0,
  Initialized,
  Playing,
  Paused,
  Error,
}

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
}
`;
const fragmentShader = `
precision highp float;

uniform sampler2D source;
varying vec2 vUv;

void main() {
    gl_FragColor.rgb = texture2D(source, vUv).rgb;
    gl_FragColor.a = 1.0;
}
`;

export class MediaSequence extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['playlist', 'width', 'height'];
  }

  private sheet: CSSStyleSheet;

  private gl: WebGLRenderingContext;

  private programInfo: twgl.ProgramInfo;

  private texture: WebGLTexture;

  private uniforms: { [key: string]: any };

  private bufferInfo: twgl.BufferInfo;

  private activeMedia?: Media;

  private loadingMedia?: Media;

  private mediaClips?: MediaClip[];

  private state = MediaState.Uninitialized;

  private resizeObserver: ResizeObserver;

  // XXX handle video/img onerror, set error property and fire error event, also set/fire for playlist issues

  // styling canvas just stretches content, width/height are the real size
  // video is different, it object-fits video into the styled element (or used w/h or native size)
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#sizing_the_canvas_using_css_versus_html
  // so just use w/h and force it

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const canvas = document.createElement('canvas');
    canvas.width = this.offsetWidth;
    canvas.height = this.offsetHeight;
    const gl = canvas.getContext('webgl2');
    // XXX bundle all the GL stuff up into a Renderer class, and invoke error listener in connectedCallback if no gl
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    shadow.appendChild(canvas);

    // Triangle that covers viewport, with UVs that still span 0 > 1 across viewport
    const arrays = {
      position: { numComponents: 2, data: [-1, -1, 3, -1, -1, 3] },
      uv: { numComponents: 2, data: [0, 0, 2, 0, 0, 2] },
    };
    this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, arrays);
    // 1x1 texture for before video is playing
    this.texture = twgl.createTexture(this.gl, {
      minMag: this.gl.LINEAR,
      src: [0, 0, 0, 0],
    });
    this.uniforms = {
      source: this.texture,
    };
    this.programInfo = twgl.createProgramInfo(this.gl, [
      vertexShader,
      fragmentShader,
    ]);
    twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo);

    this.sheet = new CSSStyleSheet();
    this.updateSize();
    shadow.adoptedStyleSheets.push(this.sheet);

    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === this) {
          const size = entry.contentBoxSize[0];
          this.gl.canvas.width = size.inlineSize;
          this.gl.canvas.height = size.blockSize;
          this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
          if (this.activeMedia)
            this.activeMedia.resize(size.inlineSize, size.blockSize);
          if (this.loadingMedia)
            this.loadingMedia.resize(size.inlineSize, size.blockSize);
        }
      }
    });
    this.resizeObserver.observe(this, { box: 'content-box' });
  }

  public connectedCallback() {
    console.log('Custom media-sequence element added to page.');
  }

  public attributeChangedCallback(
    attr: string,
    _oldValue: string,
    newValue: string,
  ) {
    console.log(`Custom media-sequence attributeChangedCallback ${attr}`);
    switch (attr) {
      case 'width':
      case 'height':
        this.updateSize();
        break;
      case 'playlist':
        this.updatePlaylist(newValue);
        break;
      default:
    }
  }

  private async updatePlaylist(url: string) {
    this.stop();
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(response);
        this.state = MediaState.Error;
        // XXX set error and fire error event
      }
      const json = await response.json();
      if (isMediaClipArray(json)) {
        this.mediaClips = json;
        this.state = MediaState.Initialized;
      } else {
        // XXX set error and fire error event
        this.state = MediaState.Error;
      }
    } catch (error) {
      console.error(`Download error: ${error}`);
      // XXX set error and fire error event
      this.state = MediaState.Error;
    }
  }

  private updateSize() {
    const width = this.getAttribute('width');
    const height = this.getAttribute('height');
    this.sheet.replaceSync(`
      :host {
        display: inline-block;
        width: ${width !== null ? `${width}px` : 'auto'};
        height: ${height !== null ? `${height}px` : 'auto'};
      }
    `);
  }

  public play() {
    if (
      this.state !== MediaState.Initialized &&
      this.state !== MediaState.Paused
    )
      return;
    this.state = MediaState.Playing;
    this.nextVideo();
    requestAnimationFrame(this.onAnimationFrame);
  }

  public pause() {
    if (this.state === MediaState.Playing) {
      // XXX implement pausing
      this.state = MediaState.Paused;
    }
  }

  public stop() {
    if (this.activeMedia) {
      MediaSequence.destroyMedia(this.activeMedia);
      this.activeMedia = undefined;
    }
    if (this.loadingMedia) {
      MediaSequence.destroyMedia(this.loadingMedia);
      this.loadingMedia = undefined;
    }
    this.mediaClips = undefined;
    this.state = MediaState.Uninitialized;
  }

  private createMedia(mediaClip: MediaClip): Media {
    // XXX pass error callback
    const media = createMedia(mediaClip);
    media.resize(this.offsetWidth, this.offsetHeight);
    return media;
  }

  private static destroyMedia(media: Media): undefined {
    media.pause();
    return undefined;
  }

  private onAnimationFrame = (timestamp: number) => {
    if (this.activeMedia && this.mediaClips) {
      if (this.activeMedia.isValidTexture()) {
        twgl.setTextureFromElement(
          this.gl,
          this.texture,
          this.activeMedia.element,
          {
            auto: false,
            minMag: this.gl.NEAREST,
            wrap: this.gl.CLAMP_TO_EDGE,
            flipY: 1,
          },
        );
      }
      this.gl.useProgram(this.programInfo.program);
      twgl.setUniforms(this.programInfo, this.uniforms);
      twgl.drawBufferInfo(this.gl, this.bufferInfo);

      this.activeMedia.animationTime = timestamp;
      if (
        this.activeMedia.ended ||
        (this.mediaClips[0].endTime &&
          this.activeMedia.currentTime >= this.mediaClips[0].endTime)
      ) {
        this.nextVideo();
      }
    }
    if (this.state === MediaState.Playing)
      requestAnimationFrame(this.onAnimationFrame);
  };

  private nextVideo() {
    if (!this.mediaClips) return;

    // First call, setup initial 2 videos
    if (!this.activeMedia) {
      this.activeMedia = this.createMedia(this.mediaClips[0]);
      this.activeMedia.play();

      if (this.mediaClips.length > 1) {
        this.loadingMedia = this.createMedia(this.mediaClips[1]);
      }
    } else if (this.loadingMedia) {
      const currentMedia = this.activeMedia;
      this.activeMedia = this.loadingMedia;
      MediaSequence.destroyMedia(currentMedia);
      this.mediaClips.shift();
      this.activeMedia.play();

      if (this.mediaClips.length > 1) {
        this.loadingMedia = this.createMedia(this.mediaClips[1]);
      } else {
        this.loadingMedia = undefined;
      }
    } else {
      this.activeMedia = MediaSequence.destroyMedia(this.activeMedia);
    }
  }
}
