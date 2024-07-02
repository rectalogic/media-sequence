// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { TransitionInfo, TransitionAnimationInfo } from './schema/index.js';

export class Transition {
  private animations: Animation[];

  constructor(
    duration: number,
    source: HTMLElement,
    dest: HTMLElement,
    transitionInfo: TransitionInfo,
  ) {
    this.animations = [
      ...Transition.createTransitionAnimations(
        source,
        transitionInfo.source,
        duration,
      ),
      ...Transition.createTransitionAnimations(
        dest,
        transitionInfo.dest,
        duration,
      ),
    ];
    // source.style
  }

  private static createTransitionAnimations(
    element: HTMLElement,
    animationInfo: TransitionAnimationInfo,
    duration: number,
  ) {
    return animationInfo.animations.map(animation => {
      const effect = new KeyframeEffect(element, animation.keyframes, {
        duration: duration / (animation.iterations || 1),
        composite: animation.composite,
        fill: animation.fill,
        easing: animation.easing,
        iterations: animation.iterations,
        iterationComposite: animation.iterationComposite,
      });
      const anim = new Animation(effect);
      anim.pause();
      return anim;
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
