// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { z } from 'zod';
import { fromError } from 'zod-validation-error';

const cssValueSchema = z.union([z.string(), z.number()]).nullable().optional();
const keyframeSchema = z
  .object({
    composite: z.enum(['accumulate', 'add', 'auto', 'replace']).optional(),
    easing: z.string().optional(),
    offset: z.number().nullable().optional(),
  })
  .catchall(cssValueSchema);

const animationSchema = z.object({
  composite: z.enum(['accumulate', 'add', 'replace']).optional(),
  fill: z.enum(['auto', 'backwards', 'both', 'forwards', 'none']).optional(),
  easing: z.string().optional(),
  iterations: z.number().optional(),
  iterationComposite: z.enum(['accumulate', 'replace']).optional(),
  keyframes: z.array(keyframeSchema),
});
export type AnimationInfo = z.infer<typeof animationSchema>;

const transitionAnimationInfo = z
  .object({
    style: z.object({}).catchall(cssValueSchema).optional(),
    animations: z.array(animationSchema.strict()),
  })
  .strict();

export type TransitionAnimationInfo = z.infer<typeof transitionAnimationInfo>;

const transitionInfoSchema = z.object({
  source: transitionAnimationInfo,
  dest: transitionAnimationInfo,
});

export type TransitionInfo = z.infer<typeof transitionInfoSchema>;

const transformSchema = z
  .object({
    startOffset: z.number().optional(),
    endOffset: z.number().optional(),
    keyframes: z.array(
      z
        .object({
          easing: z.string().optional(),
          offset: z.number().optional(),
          scale: z.number().optional(),
          rotate: z.number().optional(),
          translateX: z.number().optional(),
          translateY: z.number().optional(),
        })
        .strict(),
    ),
  })
  .strict();

const mediaInfoSchema = z.object({
  type: z.enum(['video', 'image']),
  src: z.string(),
  startTime: z.number().default(0),
  endTime: z.number().optional(),
  objectFit: z
    .enum(['fill', 'contain', 'cover', 'none', 'scale-down'])
    .default('contain'),
  transform: transformSchema.optional(),
  animations: z
    .array(
      animationSchema
        .extend({
          startOffset: z.number().optional(),
          endOffset: z.number().optional(),
        })
        .strict(),
    )
    .optional(),
  transition: z
    .union([
      z
        .object({
          duration: z.number(),
          name: z.string(),
        })
        .strict(),
      z
        .object({ duration: z.number(), transition: transitionInfoSchema })
        .strict(),
    ])
    .optional(),
});

const mediaInfosDecoder = z.array(mediaInfoSchema);

export type MediaInfo = z.infer<typeof mediaInfoSchema>;

export function processMediaInfoArray(mediaInfos: unknown): MediaInfo[] {
  try {
    return mediaInfosDecoder.parse(mediaInfos);
  } catch (error) {
    throw fromError(error);
  }
}
