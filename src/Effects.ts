// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { fromError } from 'zod-validation-error';
import { EffectInfo, effectSchema, transformSchema } from './schema/index.js';

interface EffectsMap {
  [key: string]: EffectInfo;
}

export const Effects: EffectsMap = {} as const;

export const addCustomEffect = (name: string, effect: unknown): void => {
  try {
    Effects[name] = effectSchema.parse(effect);
  } catch (error) {
    throw fromError(error);
  }
};

export const addCustomTransformEffect = (
  name: string,
  transform: unknown,
): void => {
  try {
    const parsedTransform = transformSchema.parse(transform);
    Effects[name] = {
      keyframes: parsedTransform.keyframes.map(kf => ({
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
};
