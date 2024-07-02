// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { MediaInfo } from './schema/index.js';
import { VideoMedia } from './VideoMedia.js';
import { ImageMedia } from './ImageMedia.js';

export default function createMedia(mediaInfo: MediaInfo) {
  switch (mediaInfo.type) {
    case 'video':
      return new VideoMedia(mediaInfo);
    case 'image':
      return new ImageMedia(mediaInfo);
    default:
      throw new TypeError(`Unimplemented media type ${mediaInfo.type}`);
  }
}
