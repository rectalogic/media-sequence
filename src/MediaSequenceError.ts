// Copyright (C) 2024 Andrew Wason
// SPDX-License-Identifier: MIT

export class MediaSequenceError {
  private _message: string;

  private _cause?: MediaError | Error | Event;

  constructor(message: string, cause?: MediaError | Error | Event) {
    this._message = message;
    this._cause = cause;
  }

  public get message() {
    return this._message;
  }

  public get cause() {
    return this._cause;
  }
}
