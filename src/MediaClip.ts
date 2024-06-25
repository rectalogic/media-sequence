// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import * as D from 'decoders';

const animationDecodeSpec = {
  composite: D.optional(
    D.either(
      D.constant('accumulate'),
      D.constant('add'),
      D.constant('replace'),
    ),
  ),
  fill: D.optional(
    D.either(
      D.constant('auto'),
      D.constant('backwards'),
      D.constant('both'),
      D.constant('forwards'),
      D.constant('none'),
    ),
  ),
  easing: D.optional(D.string),
  iterations: D.optional(D.number),
  iterationComposite: D.optional(
    D.either(D.constant('accumulate'), D.constant('replace')),
  ),
  keyframes: D.array(
    D.inexact({
      composite: D.optional(
        D.either(
          D.constant('accumulate'),
          D.constant('add'),
          D.constant('auto'),
          D.constant('replace'),
        ),
      ),
      easing: D.optional(D.string),
      offset: D.optional(D.nullable(D.number)),
    }).pipe(D.record(D.optional(D.either(D.string, D.number, D.null_)))),
  ),
};

const transitionDecoder = D.exact(animationDecodeSpec);
export type Transition = D.DecoderType<typeof transitionDecoder>;

const mediaClipDecoder = D.exact({
  type: D.either(D.constant('video'), D.constant('image')),
  src: D.string,
  startTime: D.optional(D.number, 0),
  endTime: D.optional(D.number),
  objectFit: D.optional(
    D.either(
      D.constant('fill'),
      D.constant('contain'),
      D.constant('cover'),
      D.constant('none'),
      D.constant('scale-down'),
    ),
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
  animations: D.optional(
    D.array(
      D.exact({
        startOffset: D.optional(D.number),
        endOffset: D.optional(D.number),
        ...animationDecodeSpec,
      }),
    ),
  ),
  transition: D.optional(
    D.exact({
      overlap: D.number,
      source: D.array(transitionDecoder),
      dest: D.array(transitionDecoder),
    }),
  ),
});

const mediaClipsDecoder = D.array(mediaClipDecoder);

export type MediaClip = D.DecoderType<typeof mediaClipDecoder>;

export function processMediaClipArray(mediaClips: unknown): MediaClip[] {
  return mediaClipsDecoder.verify(mediaClips);
}
