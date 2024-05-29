// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import * as D from 'decoders';

import { keyframesDecoder } from './Transform.js';

const mediaClipDecoder = D.object({
  type: D.oneOf(['video', 'image']),
  src: D.string,
  startTime: D.optional(D.number, 0),
  endTime: D.optional(D.number),
  objectFit: D.optional(
    D.oneOf(['fill', 'contain', 'cover', 'none', 'scale-down']),
    'contain',
  ),
  keyframes: D.optional(keyframesDecoder),
});
const mediaClipsDecoder = D.array(mediaClipDecoder);

export type MediaClip = D.DecoderType<typeof mediaClipDecoder>;

export function processMediaClipArray(mediaClips: unknown): MediaClip[] {
  return mediaClipsDecoder.verify(mediaClips);
}
