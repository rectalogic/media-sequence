// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { ErrorCallback } from './Media.js';
import { MediaClip } from './MediaClip.js';
import { VideoMedia } from './VideoMedia.js';
import { ImageMedia } from './ImageMedia.js';

export default function createMedia(
  mediaClip: MediaClip,
  onError: ErrorCallback,
) {
  switch (mediaClip.type) {
    case 'video':
      return new VideoMedia(mediaClip, onError);
    case 'image':
      return new ImageMedia(mediaClip, onError);
    default:
      throw new TypeError(`Unimplemented media type ${mediaClip.type}`);
  }
}
