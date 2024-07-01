// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { TransitionInfo, TransitionAnimationInfo } from './Playlist.js';

export class Transition {
  private animations: Animation[];

  constructor(
    source: HTMLElement,
    dest: HTMLElement,
    transitionInfo: TransitionInfo,
  ) {
    this.animations = [
      ...Transition.createTransitionAnimations(
        source,
        transitionInfo.source,
        transitionInfo.duration,
      ),
      ...Transition.createTransitionAnimations(
        dest,
        transitionInfo.dest,
        transitionInfo.duration,
      ),
    ];
  }

  private static createTransitionAnimations(
    element: HTMLElement,
    transitions: TransitionAnimationInfo[],
    duration: number,
  ) {
    return transitions.map(transition => {
      const effect = new KeyframeEffect(element, transition.keyframes, {
        duration: duration / (transition.iterations || 1),
        composite: transition.composite,
        fill: transition.fill,
        easing: transition.easing,
        iterations: transition.iterations,
        iterationComposite: transition.iterationComposite,
      });
      const animation = new Animation(effect);
      animation.pause();
      return animation;
    });
  }

  public get finished() {
    return Promise.all(this.animations.map(a => a.finished));
  }

  public play() {
    for (const animation of this.animations) animation.play();
  }

  public pause() {
    for (const animation of this.animations) animation.pause();
  }

  public cancel() {
    for (const animation of this.animations) animation.cancel();
  }
}
