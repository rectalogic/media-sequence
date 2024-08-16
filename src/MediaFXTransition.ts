// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

import { TransitionInfo, TransitionAnimationInfo } from './schema/index.js';

interface Styles {
  [key: string]: string | null;
}

interface ElementStyles {
  element: HTMLElement;
  styles: Styles;
}

export class MediaFXTransition extends HTMLElement {
  private elementStyles: ElementStyles[] = [];

  private animations: Animation[] = [];

  constructor(
    duration: number,
    source: HTMLElement,
    dest: HTMLElement,
    transitionInfo: TransitionInfo,
  ) {
    this.createTransitionAnimations(source, transitionInfo.source, duration);
    this.createTransitionAnimations(dest, transitionInfo.dest, duration);
  }

  private createTransitionAnimations(
    element: HTMLElement,
    animationInfo: TransitionAnimationInfo,
    duration: number,
  ) {
    if (animationInfo.style) {
      const styles: Styles = {};
      const { style } = element;
      for (const [key, value] of Object.entries(animationInfo.style)) {
        styles[key] = style.getPropertyValue(key);
        style.setProperty(key, value);
      }
      this.elementStyles.push({ element, styles });
    }
    if (animationInfo.animations) {
      this.animations.push(
        ...animationInfo.animations.map(animation => {
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
        }),
      );
    }
  }

  private resetStyles() {
    this.elementStyles.forEach(es => {
      for (const [key, value] of Object.entries(es.styles)) {
        es.element.style.setProperty(key, value);
      }
    });
  }

  private async awaitFinished() {
    await Promise.all(this.animations.map(a => a.finished));
    this.resetStyles();
  }

  public get finished() {
    return this.awaitFinished();
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
