// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { z } from 'zod';

export const cssValueSchema = z
  .union([z.string(), z.number()])
  .nullable()
  .optional();
const keyframeSchema = z
  .object({
    composite: z.enum(['accumulate', 'add', 'auto', 'replace']).optional(),
    easing: z.string().optional(),
    offset: z.number().nullable().optional(),
  })
  .catchall(cssValueSchema);

export const animationSchema = z.object({
  composite: z.enum(['accumulate', 'add', 'replace']).optional(),
  fill: z.enum(['auto', 'backwards', 'both', 'forwards', 'none']).optional(),
  easing: z.string().optional(),
  iterations: z.number().optional(),
  iterationComposite: z.enum(['accumulate', 'replace']).optional(),
  keyframes: z.array(keyframeSchema),
});
export type AnimationInfo = z.infer<typeof animationSchema>;
