// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import * as D from 'decoders';

export namespace Animation {
  export type Properties<P> = {
    [Property in keyof P]?: number;
  };

  export interface Keyframe<P extends Properties<P>> {
    offset: number;
    // XXX add easing - hmm, may want different easing for different properties in same keyframe?
    properties: P;
  }

  export const keyframeDecoder = D.exact({
    offset: D.number.refine(n => n >= 0 && n <= 1, 'Must be between 0 and 1'),
    properties: D.record(D.number),
  });

  export class Timeline<P extends Properties<P>> {
    private keyframes: Keyframe<Properties<P>>[] = [];

    constructor(keyframes: Keyframe<P>[]) {
      if (keyframes.length === 0) return;

      const sortedKeyframes = [...keyframes].sort(
        (a, b) => a.offset - b.offset,
      );
      // Map property name to the keyframe it last appeared in
      const property2keyframe = this.mapPropertyToKeyframe(sortedKeyframes[0]);
      this.keyframes[0] = {
        offset: sortedKeyframes[0].offset,
        properties: sortedKeyframes[0].properties,
      };
      for (let i = 1; i < sortedKeyframes.length; i++) {
        const currentProperties: Properties<P> = sortedKeyframes[i].properties;
        // Find properties that were previously defined but not on this keyframe
        const missingProperties = new Map(
          [...property2keyframe].filter(
            ([k, _v]) => !Object.hasOwn(currentProperties, k),
          ),
        );

        // Add any properties introduced/modified on this keyframe, mapping them to the keyframe
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const key in currentProperties) {
          property2keyframe.set(key, sortedKeyframes[i]);
        }
        // Then add any properties not defined on this frame, with their interpolated values
        for (const [key, keyframe] of missingProperties) {
          // Initialize to previous value in case we don't find it ahead of us
          currentProperties[key] = keyframe.properties[key];
          for (const nextKeyframe of sortedKeyframes.slice(i + 1)) {
            if (Object.hasOwn(nextKeyframe.properties, key)) {
              currentProperties[key] = this.interpolate(
                sortedKeyframes[i].offset,
                key,
                keyframe,
                nextKeyframe,
              );
              break;
            }
          }
        }
        this.keyframes[i] = {
          offset: sortedKeyframes[i].offset,
          properties: currentProperties,
        };
      }
    }

    // Map property names to keyframe
    // eslint-disable-next-line class-methods-use-this
    private mapPropertyToKeyframe(keyframe: Keyframe<P>) {
      const map = new Map<keyof P, Keyframe<P>>();
      // Use for..in because it knows the key type
      // See https://github.com/microsoft/TypeScript/pull/12253#issuecomment-263132208
      // eslint-disable-next-line no-restricted-syntax, guard-for-in
      for (const key in keyframe.properties) map.set(key, keyframe);
      return map;
    }

    // eslint-disable-next-line class-methods-use-this
    private interpolate(
      time: number,
      key: keyof P,
      currentKeyframe: Keyframe<Properties<P>>,
      nextKeyframe: Keyframe<Properties<P>>,
    ) {
      const currentValue = currentKeyframe.properties[key];
      const nextValue = nextKeyframe.properties[key];
      if (currentValue !== undefined && nextValue !== undefined) {
        return (
          currentValue +
          (time - currentKeyframe.offset) * (nextValue - currentValue)
        );
      }
      return undefined;
    }

    public tick(time: number) {
      const interpolatedProperties: Properties<P> = {};
      const currentKeyframe = this.keyframes[0];
      const nextKeyframe = this.keyframes[1];
      if (!currentKeyframe) return interpolatedProperties;
      if (currentKeyframe.offset > time) return interpolatedProperties;
      if (!nextKeyframe) return currentKeyframe.properties;
      if (nextKeyframe.offset > time) {
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const key in currentKeyframe.properties) {
          interpolatedProperties[key] = this.interpolate(
            time,
            key,
            currentKeyframe,
            nextKeyframe,
          );
        }
        return interpolatedProperties;
      }

      let keyframe = this.keyframes.shift();
      [keyframe] = this.keyframes;
      while (
        keyframe &&
        keyframe.offset < time &&
        this.keyframes[1] &&
        this.keyframes[1].offset > time
      )
        keyframe = this.keyframes.shift();
      if (keyframe === undefined) return interpolatedProperties;
      return keyframe.properties;
    }
  }
}
