// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import * as D from 'decoders';

import { transformDecoder } from './Transform.js';

const mediaClipDecoder = D.exact({
  type: D.oneOf(['video', 'image']),
  src: D.string,
  startTime: D.optional(D.number, 0),
  endTime: D.optional(D.number),
  objectFit: D.optional(
    D.oneOf(['fill', 'contain', 'cover', 'none', 'scale-down']),
    'contain',
  ),
  transforms: D.optional(
    D.array(
      D.exact({
        easing: D.optional(D.string),
        offset: D.optional(D.number),
        scale: D.optional(D.number),
        rotate: D.optional(D.number),
        translateX: D.optional(D.number),
        translateY: D.optional(D.number),
      }),
    ),
  ),
  //XXX need a name for each animation - these are applied to the div containing the video/image
  animations: D.optional(
    D.array(
      D.exact({
        name: D.string,
        keyframes: D.array(
          D.object({
            composite: D.optional(
              D.oneOf(['accumulate', 'add', 'auto', 'replace']),
            ),
            easing: D.optional(D.string),
            offset: D.optional(D.number),
            properties: D.record(D.either(D.number, D.string)),
          }),
        ),
      }),
    ),
  ),
});

const mediaClipsDecoder = D.array(mediaClipDecoder);

export type MediaClip = D.DecoderType<typeof mediaClipDecoder>;

export function processMediaClipArray(mediaClips: unknown): MediaClip[] {
  return mediaClipsDecoder.verify(mediaClips);
}
