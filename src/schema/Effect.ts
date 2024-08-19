// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { z } from 'zod';

const cssValueSchema = z.union([z.string(), z.number()]).nullable().optional();
const keyframeSchema = z
  .object({
    composite: z.enum(['accumulate', 'add', 'auto', 'replace']).optional(),
    easing: z.string().optional(),
    offset: z.number().nullable().optional(),
  })
  .catchall(cssValueSchema);

// Ensure our Keyframe schema matches Keyframe
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats
function assert<T extends never>() {}
type TypeEqualityGuard<A, B> = Exclude<A, B> | Exclude<B, A>;
assert<TypeEqualityGuard<z.infer<typeof keyframeSchema>, Keyframe>>();

export const effectSchema = z.object({
  options: z
    .object({
      composite: z.enum(['accumulate', 'add', 'replace']).optional(),
      fill: z
        .enum(['auto', 'backwards', 'both', 'forwards', 'none'])
        .optional(),
      easing: z.string().optional(),
      iterations: z.number().optional(),
      iterationComposite: z.enum(['accumulate', 'replace']).optional(),
    })
    .optional(),
  keyframes: z.array(keyframeSchema),
});
export type EffectInfo = z.infer<typeof effectSchema>;
