// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT
import { fixture, expect } from '@open-wc/testing';
import { MediaSequence } from '../src/MediaSequence.js';
import '../src/media-sequence.js';

describe('MediaSequence', () => {
  it('has a default header "Hey there" and counter 5', async () => {
    const el = await fixture<MediaSequence>(
      `<media-sequence></media-sequence>`,
    );

    // expect(el.header).to.equal('Hey there');
    // expect(el.counter).to.equal(5);
  });
});
