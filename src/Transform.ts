/* eslint-disable max-classes-per-file */
// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import * as D from 'decoders';
import { Animation } from './animation.js';
import { Media } from './Media.js';

//XXX defaulting is no good - a subsequent keyframe that doesn't specify a value will reset that value to 0 (scale) etc.
//XXX should deal with undefined when we compute the matrix, and default if unspecified
const keyframePropertiesDecoder = D.exact({
  scale: D.optional(D.number, 1),
  rotate: D.optional(D.number, 0),
  translateX: D.optional(D.number, 0),
  translateY: D.optional(D.number, 0),
});
type TransformProperties = D.DecoderType<typeof keyframePropertiesDecoder>;
type TransformKeyframe = Animation.Keyframe<TransformProperties>;

//const keyframeDecoder = Animation.keyframeDecoder.pipe(keyframePropertiesDecoder);
const keyframeDecoder = Animation.keyframeDecoder.refine(
  (kf): kf is TransformKeyframe =>
    keyframePropertiesDecoder.verify(kf.properties) !== undefined,
  'Must be TransformKeyframe',
);
export const keyframesDecoder = D.array(keyframeDecoder);

//export type TransformKeyframe = D.DecoderType<typeof keyframeDecoder>;

export function processKeyframes(keyframes: unknown): TransformKeyframe[] {
  return keyframesDecoder.verify(keyframes);
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

  */
}
