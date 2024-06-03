// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import * as D from 'decoders';

const mediaClipDecoder = D.exact({
  type: D.oneOf(['video', 'image']),
  src: D.string,
  startTime: D.optional(D.number, 0),
  endTime: D.optional(D.number),
  objectFit: D.optional(
    D.oneOf(['fill', 'contain', 'cover', 'none', 'scale-down']),
    'contain',
  ),
  transform: D.optional(
    D.exact({
      startOffset: D.optional(D.number),
      endOffset: D.optional(D.number),
      keyframes: D.array(
        D.exact({
          easing: D.optional(D.string),
          offset: D.optional(D.number),
          scale: D.optional(D.number),
          rotate: D.optional(D.number),
          translateX: D.optional(D.number),
          translateY: D.optional(D.number),
        }),
      ),
    }),
  ),
});

const mediaClipsDecoder = D.array(mediaClipDecoder);

export type MediaClip = D.DecoderType<typeof mediaClipDecoder>;

export function processMediaClipArray(mediaClips: unknown): MediaClip[] {
  return mediaClipsDecoder.verify(mediaClips);
}
