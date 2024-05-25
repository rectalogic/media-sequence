// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { TransformKeyframe, processKeyframes } from './Transform.js';

const ObjectFits = ['fill', 'contain', 'cover', 'none', 'scale-down'] as const;
export type ObjectFit = (typeof ObjectFits)[number];

const isObjectFit = (value: string): value is ObjectFit =>
  ObjectFits.includes(value as ObjectFit);

export interface MediaClip {
  readonly type: 'video' | 'image';
  readonly src: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly objectFit: ObjectFit;
  readonly keyframes?: TransformKeyframe[];
}

function processMediaClip(mediaClip: any): MediaClip {
  if (
    (mediaClip.type === 'video' || mediaClip.type === 'image') &&
    typeof mediaClip.src === 'string' &&
    (mediaClip.startTime === undefined ||
      typeof mediaClip.startTime === 'number') &&
    (mediaClip.endTime === undefined ||
      typeof mediaClip.endTime === 'number') &&
    (mediaClip.objectFit === undefined || isObjectFit(mediaClip.objectFit))
  ) {
    let mc = mediaClip;
    if (mc.startTime === undefined) {
      mc = { ...mc, startTime: 0 };
    }
    if (mc.objectFit === undefined) {
      mc = { ...mc, objectFit: 'contain' };
    }
    if (mc.keyframes !== undefined)
      mc = { ...mc, keyframes: processKeyframes(mc.keyframes) };
    return mc;
  }
  throw new Error('Invalid mediaClip', { cause: mediaClip });
}

export function processMediaClipArray(mediaClips: any): MediaClip[] {
  if (Array.isArray(mediaClips)) {
    return mediaClips.map(mc => processMediaClip(mc));
  }
  throw new Error('MediaClips are not an array');
}
