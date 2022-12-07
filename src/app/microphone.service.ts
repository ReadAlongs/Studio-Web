// -*- typescript-indent-level: 2 -*-
import { EventEmitter, Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class MicrophoneService {
  private chunks: Array<Blob> = [];
  protected recorderEnded = new EventEmitter<Blob>();
  public recorderError = new EventEmitter<ErrorCase>();
  // tslint:disable-next-line
  public recorderState = new EventEmitter<RecorderState>();
  private _recorderState = RecorderState.INITIALIZING;

  constructor() {}

  private recorder: MediaRecorder | null;

  private static guc() {
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }

  getUserContent() {
    return MicrophoneService.guc();
  }

  startRecording() {
    if (this._recorderState === RecorderState.RECORDING) {
      this.recorderError.emit(ErrorCase.ALREADY_RECORDING);
    }
    if (this._recorderState === RecorderState.PAUSED) {
      this.resume();
      return;
    }
    this._recorderState = RecorderState.INITIALIZING;
    MicrophoneService.guc()
      .then((mediaStream) => {
        this.recorder = new MediaRecorder(mediaStream);
        this._recorderState = RecorderState.INITIALIZED;
        this.recorderState.emit(this._recorderState);
        this.addListeners();
        this.recorder.start();
        this._recorderState = RecorderState.RECORDING;
        this.recorderState.emit(this._recorderState);
      })
      .catch((err) => {
        this._recorderState = RecorderState.PERMISSION_DENIED;
      });
  }

  pause() {
    if (
      this.recorder !== null &&
      this._recorderState === RecorderState.RECORDING
    ) {
      this.recorder.pause();
      this._recorderState = RecorderState.PAUSED;
      this.recorderState.emit(this._recorderState);
    }
  }

  resume() {
    if (
      this.recorder !== null &&
      this._recorderState === RecorderState.PAUSED
    ) {
      this._recorderState = RecorderState.RECORDING;
      this.recorderState.emit(this._recorderState);
      this.recorder.resume();
    }
  }

  stopRecording() {
    this._recorderState = RecorderState.STOPPING;
    this.recorderState.emit(this._recorderState);
    return new Promise((resolve, reject) => {
      this.recorderEnded.subscribe(
        (blob) => {
          this._recorderState = RecorderState.STOPPED;
          this.recorderState.emit(this._recorderState);
          resolve(blob);
        },
        (_) => {
          this.recorderError.emit(ErrorCase.RECORDER_TIMEOUT);
          reject(ErrorCase.RECORDER_TIMEOUT);
        }
      );
      if (this.recorder !== null) this.recorder.stop();
    }).catch(() => {
      this.recorderError.emit(ErrorCase.USER_CONSENT_FAILED);
    });
  }

  getRecorderState() {
    return this._recorderState;
  }

  private addListeners() {
    if (this.recorder !== null) {
      this.recorder.ondataavailable = this.appendToChunks;
      this.recorder.onstop = this.recordingStopped;
    }
  }

  private appendToChunks(event: BlobEvent) {
    this.chunks.push(event.data);
  }

  private recordingStopped(event: Event) {
    const blob = new Blob(this.chunks, { type: "audio/webm" });
    this.chunks = [];
    this.recorderEnded.emit(blob);
    this.clear();
  }

  private clear() {
    this.recorder = null;
    this.chunks = [];
  }
}

export enum ErrorCase {
  USER_CONSENT_FAILED,
  RECORDER_TIMEOUT,
  ALREADY_RECORDING,
}

export enum RecorderState {
  INITIALIZING,
  INITIALIZED,
  RECORDING,
  PAUSED,
  STOPPING,
  STOPPED,
  PERMISSION_DENIED,
}
