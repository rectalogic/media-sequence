// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { z } from 'zod';
import { effectSchema } from './Effect.js';

const transitionTargetSchema = z
  .object({
    effects: z.array(effectSchema).optional(),
    style: z.string().optional(),
  })
  .strict();
export const transitionSchema = z
  .object({
    source: transitionTargetSchema.optional(),
    dest: transitionTargetSchema.optional(),
  })
  .strict();

export type TransitionInfo = z.infer<typeof transitionSchema>;
