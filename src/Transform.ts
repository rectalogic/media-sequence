/* eslint-disable max-classes-per-file */
// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import * as D from 'decoders';
import { Animation } from './Animation.js';
import { Media } from './Media.js';

//XXX defaulting is no good - a subsequent keyframe that doesn't specify a value will reset that value to 0 (scale) etc.
//XXX should deal with undefined when we compute the matrix, and default if unspecified
const transformPropertiesDecoder = D.exact({
  scale: D.optional(D.number, 1),
  rotate: D.optional(D.number, 0),
  translateX: D.optional(D.number, 0),
  translateY: D.optional(D.number, 0),
});
type TransformProperties = D.DecoderType<typeof transformPropertiesDecoder>;
type TransformKeyframe = Animation.Keyframe<TransformProperties>;

//const keyframeDecoder = Animation.keyframeDecoder.pipe(transformPropertiesDecoder);
const keyframeDecoder = Animation.keyframeDecoder.refine(
  (kf): kf is TransformKeyframe =>
    transformPropertiesDecoder.verify(kf.properties) !== undefined,
  'Must be TransformKeyframe',
);
export const transformDecoder = D.array(keyframeDecoder);

//export type TransformKeyframe = D.DecoderType<typeof keyframeDecoder>;

export class Transform {
  protected media: Media;

  protected animation: Animation.Timeline<TransformProperties>;

  private objectFitMatrix?: DOMMatrix;

  constructor(
    media: Media,
    keyframes: Animation.Keyframe<TransformProperties>[],
  ) {
    this.media = media;
    this.animation = new Animation.Timeline<TransformProperties>(keyframes);
  }
  /*
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
