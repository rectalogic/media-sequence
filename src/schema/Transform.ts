// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { z } from 'zod';

export const transformSchema = z
  .object({
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
