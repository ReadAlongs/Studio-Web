import { EventEmitter, Injectable } from "@angular/core";

declare var MediaRecorder: any;

@Injectable({
  providedIn: "root",
})
export class MicrophoneService {
  private chunks: Array<any> = [];
  protected recorderEnded = new EventEmitter();
  public recorderError = new EventEmitter<ErrorCase>();
  // tslint:disable-next-line
  public recorderState = new EventEmitter<RecorderState>();
  private _recorderState = RecorderState.INITIALIZING;

  constructor() {}

  private recorder: any;

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
    if (this._recorderState === RecorderState.RECORDING) {
      this.recorder.pause();
      this._recorderState = RecorderState.PAUSED;
      this.recorderState.emit(this._recorderState);
    }
  }

  resume() {
    if (this._recorderState === RecorderState.PAUSED) {
      this._recorderState = RecorderState.RECORDING;
      this.recorderState.emit(this._recorderState);
      this.recorder.resume();
    }
  }

  stopRecording(outputFormat: OutputFormat) {
    this._recorderState = RecorderState.STOPPING;
    this.recorderState.emit(this._recorderState);
    return new Promise((resolve, reject) => {
      this.recorderEnded.subscribe(
        (blob) => {
          this._recorderState = RecorderState.STOPPED;
          this.recorderState.emit(this._recorderState);
          if (outputFormat === OutputFormat.WEBM_BLOB) {
            resolve(blob);
          }
          if (outputFormat === OutputFormat.WEBM_BLOB_URL) {
            const audioURL = URL.createObjectURL(blob);
            resolve(audioURL);
          }
        },
        (_) => {
          this.recorderError.emit(ErrorCase.RECORDER_TIMEOUT);
          reject(ErrorCase.RECORDER_TIMEOUT);
        }
      );
      this.recorder.stop();
    }).catch(() => {
      this.recorderError.emit(ErrorCase.USER_CONSENT_FAILED);
    });
  }

  getRecorderState() {
    return this._recorderState;
  }

  private addListeners() {
    this.recorder.ondataavailable = this.appendToChunks;
    this.recorder.onstop = this.recordingStopped;
  }

  private appendToChunks = (event: any) => {
    this.chunks.push(event.data);
  };
  private recordingStopped = (event: any) => {
    const blob = new Blob(this.chunks, { type: "audio/webm" });
    this.chunks = [];
    this.recorderEnded.emit(blob);
    this.clear();
  };

  private clear() {
    this.recorder = null;
    this.chunks = [];
  }
}

export enum OutputFormat {
  WEBM_BLOB_URL,
  WEBM_BLOB,
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
