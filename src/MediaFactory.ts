// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { MediaLoadCallback, MediaErrorCallback } from './Media.js';
import { MediaClip } from './MediaClip.js';
import { VideoMedia } from './VideoMedia.js';
import { ImageMedia } from './ImageMedia.js';

export default function createMedia(
  mediaClip: MediaClip,
  onLoad: MediaLoadCallback,
  onError: MediaErrorCallback,
) {
  switch (mediaClip.type) {
    case 'video':
      return new VideoMedia(mediaClip, onLoad, onError);
    case 'image':
      return new ImageMedia(mediaClip, onLoad, onError);
    default:
      throw new TypeError(`Unimplemented media type ${mediaClip.type}`);
  }
}
