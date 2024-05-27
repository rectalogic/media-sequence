/* eslint-disable max-classes-per-file */
// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { Media } from './Media.js';

export interface TransformKeyframe {
  readonly offset: number; // Percentage when keyframe becomes active, 0..1
  readonly scale: number;
  readonly rotate: number; // degrees
  readonly translateX: number; // NDC coordinates, -1..1
  readonly translateY: number; // NDC coordinates, -1..1
}

function processKeyframe(keyframe: any): TransformKeyframe {
  let kf = keyframe;
  if (
    typeof kf.offset === 'number' &&
    kf.offset >= 0 &&
    kf.offset <= 1.0 &&
    (kf.scale === undefined || typeof kf.scale === 'number') &&
    (kf.rotate === undefined || typeof kf.rotate === 'number') &&
    (kf.translateX === undefined || typeof kf.translateX === 'number') &&
    (kf.translateY === undefined || typeof kf.translateY === 'number')
  ) {
    if (kf.scale === undefined) kf = { ...kf, scale: 1 };
    if (kf.rotate === undefined) kf = { ...kf, rotate: 0 };
    if (kf.translateX === undefined) kf = { ...kf, translateX: 0 };
    if (kf.translateY === undefined) kf = { ...kf, translateY: 0 };
  } else {
    throw new Error('Invalid Keyframe', { cause: keyframe });
  }
  return kf;
}

export function processKeyframes(keyframes: any): TransformKeyframe[] {
  if (Array.isArray(keyframes)) {
    return keyframes.map(kf => processKeyframe(kf));
  }
  throw new Error('Transform keyframes are not an array');
}

abstract class Transform {
  /*
  protected media: Media;

  protected keyframes: TransformKeyframe[];

  constructor(media: Media, keyframes: TransformKeyframe[]) {
    this.media = media;
    this.keyframes = keyframes;
  }

  public abstract apply(): void;

  public abstract update(): void;
}

export class WebAnimationTransform extends Transform {
  private animation?: Animation;

  public apply() {
    const effect = new KeyframeEffect(
      this.media.element,
      this.keyframes.map(kf => this.toWebAnimationKeyframe(kf)),
      this.media.duration * 1000,
    );
    this.animation = new Animation(effect, document.timeline);
    this.animation.play();
    this.animation.pause();
  }

  public update() {
    if (this.animation) {
      this.animation.currentTime =
        (this.media.currentTime - this.media.mediaClip.startTime) * 1000;
    }
  }

  private toWebAnimationKeyframe(keyframe: TransformKeyframe): Keyframe {
    const transforms = [];
    if (keyframe.translateX !== 0 || keyframe.translateY !== 0)
      transforms.push(
        `translate(${keyframe.translateX * this.media.width}px, ${
          keyframe.translateY * this.media.height
        }px)`,
      );
    if (keyframe.scale !== 1) transforms.push(`scale(${keyframe.scale})`);
    if (keyframe.rotate !== 0) transforms.push(`rotate(${keyframe.rotate}deg)`);
    return {
      offset: keyframe.offset,
      transform: transforms.length > 0 ? transforms.join(' ') : 'none',
    };
  }
}

export class CanvasImageTransform extends Transform {
  private objectFitMatrix?: DOMMatrix;

  public apply() {}

  public update() {}

  public buildMatrix(time: number): DOMMatrix {
    if (!this.objectFitMatrix)
      this.objectFitMatrix = this.computeObjectFitMatrix();
    // XXX interpolate keyframes to get scale etc. and build matrix
    // XXX what about easing? need to match css easing https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function
    // https://github.com/mkbabb/keyframes.js/blob/77e34708e7f205e15e57ed0eca3ab2eb2f37d343/src/math.ts#L43
    return new DOMMatrix(); //XXX
  }

  private computeTransformMatrix(
    scale: number,
    rotate: number,
    translateX: number,
    translateY: number,
  ): DOMMatrix {
    const matrix = new DOMMatrix();
    matrix.translateSelf(this.media.width / 2, this.media.height / 2);
    if (translateX !== 0 || translateY !== 0)
      matrix.translateSelf(translateX, translateY);
    if (scale !== 1) matrix.scaleSelf(scale, scale);
    if (rotate !== 0) matrix.rotateSelf(0, 0, rotate);
    matrix.translateSelf(-this.media.width / 2, -this.media.height / 2);
    return matrix;
  }

  private computeObjectFitMatrix(): DOMMatrix {
    let fit = this.media.element.style.objectFit;
    const containerWidth = this.media.width;
    const containerHeight = this.media.height;
    const contentWidth = this.media.intrinsicWidth;
    const contentHeight = this.media.intrinsicHeight;
    const containerRatio = containerWidth / containerHeight;
    const contentRatio = contentWidth / contentHeight;
    let scaleX = 1;
    let scaleY = 1;
    let tX = 0;
    let tY = 0;
    if (fit === 'scale-down') {
      if (contentWidth <= containerWidth && contentHeight <= containerHeight)
        fit = 'none';
      else fit = 'contain';
    }
    switch (fit) {
      case 'contain':
        if (contentRatio > containerRatio) {
          scaleX = scaleY = containerWidth / contentWidth;
          tY = (containerHeight - contentHeight * scaleY) / 2;
        } else {
          scaleX = scaleY = containerHeight / contentHeight;
          tX = (containerWidth - contentWidth * scaleX) / 2;
        }
        break;
      case 'cover':
        if (contentRatio > containerRatio) {
          scaleX = scaleY = containerHeight / contentHeight;
          tX = (containerWidth - contentWidth * scaleX) / 2;
        } else {
          scaleX = scaleY = containerWidth / contentWidth;
          tY = (containerHeight - contentHeight * scaleY) / 2;
        }
        break;
      case 'none':
        if (contentWidth > containerWidth)
          tX = -(contentWidth - containerWidth) / 2;
        else tX = (containerWidth - contentWidth) / 2;

        if (contentHeight > containerHeight)
          tY = -(contentHeight - containerHeight) / 2;
        else tY = (containerHeight - contentHeight) / 2;
        break;
      default:
    }
    const matrix = new DOMMatrix();
    matrix.translateSelf(tX, tY);
    matrix.scaleSelf(scaleX, scaleY);
    return matrix;
  }
  */
}
