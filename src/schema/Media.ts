// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { z } from 'zod';
import { fromError } from 'zod-validation-error';
import { animationSchema } from './Animation.js';
import { transitionInfoSchema } from './Transition.js';
import { Transitions } from '../Transitions.js';

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
          name: z.string().refine(name => name in Transitions, {
            message: 'Invalid transition name',
          }),
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
