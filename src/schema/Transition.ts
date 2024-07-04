// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { z } from 'zod';
import { animationSchema } from './Animation.js';

const transitionAnimationInfo = z
  .object({
    style: z.object({}).catchall(z.string().nullable()).optional(),
    animations: z.array(animationSchema.strict()),
  })
  .strict();

export type TransitionAnimationInfo = z.infer<typeof transitionAnimationInfo>;

export const transitionInfoSchema = z.object({
  source: transitionAnimationInfo,
  dest: transitionAnimationInfo,
});

export type TransitionInfo = z.infer<typeof transitionInfoSchema>;
