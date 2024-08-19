// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { fromError } from 'zod-validation-error';
import MediaFXEffect from './MediaFXEffect.js';
import { EffectInfo } from './schema/Effect.js';
import { transformSchema } from './schema/Transform.js';

export default class MediaFXTransform extends MediaFXEffect {
  public override get effectInfo(): EffectInfo {
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
        options: {
          fill: 'forwards',
        },
      };
    } catch (error) {
      throw fromError(error);
    }
  }
}
