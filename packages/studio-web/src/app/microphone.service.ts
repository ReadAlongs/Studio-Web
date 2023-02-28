import { EventEmitter, Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class MicrophoneService {
  private chunks: Array<Blob> = [];
  private recorder: MediaRecorder | null = null;
  private recorderEnded = new EventEmitter<Blob>();

  async startRecording() {
    if (this.recorder !== null && this.recorder.state == "paused") {
      this.resume();
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.recorder = new MediaRecorder(stream);
    this.addListeners();
    this.recorder.start();
  }

  pause() {
    if (this.recorder === null) throw "Recorder was not created";
    this.recorder.pause();
  }

  resume() {
    if (this.recorder === null) throw "Recorder was not created";
    this.recorder.resume();
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.recorderEnded.subscribe(
        (blob) => {
          // Note: This works because a completely silent recording will get
          // compressed to a very small file.  The number is arbitrary, but
          // should at least catch the case of an input that is all zeros.
          if (blob.size < 2000) {
            reject("Recorder didn't hear anything");
          } else {
            resolve(blob);
          }
        },
        (_) => {
          reject("Recorder timed out");
        }
      );
      if (this.recorder === null) reject("Recorder was not created");
      else this.recorder.stop();
    });
  }

  private addListeners() {
    if (this.recorder === null) throw "Recorder was not created";
    this.recorder.addEventListener("dataavailable", (event: BlobEvent) => {
      this.chunks.push(event.data);
    });
    this.recorder.addEventListener("stop", (event: Event) => {
      const blob = new Blob(this.chunks, { type: "audio/mpeg" });
      this.chunks = [];
      this.recorderEnded.emit(blob);
      this.clear();
    });
  }

  private clear() {
    this.recorder = null;
    this.chunks = [];
  }
}
