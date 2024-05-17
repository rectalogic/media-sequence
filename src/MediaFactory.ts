// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { MediaClip } from './MediaClip.js';
import { VideoMedia } from './VideoMedia.js';
import { ImageMedia } from './ImageMedia.js';

export default function createMedia(mediaClip: MediaClip) {
  switch (mediaClip.type) {
    case 'video':
      return new VideoMedia(mediaClip);
    case 'image':
      return new ImageMedia(mediaClip);
    default:
      throw new TypeError(`Unimplemented media type ${mediaClip.type}`);
  }
}
