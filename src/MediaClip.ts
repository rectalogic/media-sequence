// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

export interface MediaClip {
  readonly type: 'video' | 'image';
  readonly src: string;
  readonly startTime?: number;
  readonly endTime?: number;
}

function isMediaClip(mediaClip: any): mediaClip is MediaClip {
  return (
    (mediaClip.type === 'video' || mediaClip.type === 'image') &&
    typeof mediaClip.src === 'string' &&
    (mediaClip.startTime === undefined ||
      typeof mediaClip.startTime === 'number') &&
    (mediaClip.endTime === undefined || typeof mediaClip.endTime === 'number')
  );
}

export function isMediaClipArray(mediaClips: any): mediaClips is MediaClip[] {
  return Array.isArray(mediaClips) && mediaClips.every(isMediaClip);
}
