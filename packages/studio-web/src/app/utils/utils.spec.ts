import { validateFileType } from "./utils";

describe("validateFileType", () => {
  it("should validate by extension", () => {
    const textFile = new File(["foo"], "foo.txt", {
      type: "text/plain",
    });

    const accepts = ".txt,image/png,audio/*,video/mp4";
    expect(validateFileType(textFile, accepts)).toBeTrue();

    const shouldRefuse = accepts.replace(".txt,", "");
    expect(validateFileType(textFile, shouldRefuse)).toBeFalse();
  });

  it("should validate by mimetype", () => {
    const pngFile = new File(["foo"], "foo.png", {
      type: "image/png",
    });

    const accepts = ".txt,image/png,audio/*,video/mp4";
    expect(validateFileType(pngFile, accepts)).toBeTrue();

    const shouldRefuse = accepts.replace("image/png,", "");
    expect(validateFileType(pngFile, shouldRefuse)).toBeFalse();
  });

  it("should validate by wildcard mimetype", () => {
    const mp3File = new File(["foo"], "foo.mp3", {
      type: "audio/mpeg",
    });
    const wavFile = new File(["foo"], "foo.wav", {
      type: "audio/wav",
    });

    const accepts = ".txt,image/png,audio/*,video/mp4";
    expect(validateFileType(mp3File, accepts)).toBeTrue();
    expect(validateFileType(wavFile, accepts)).toBeTrue();

    const shouldRefuse = accepts.replace("audio/*,", "");
    expect(validateFileType(mp3File, shouldRefuse)).toBeFalse();
    expect(validateFileType(wavFile, shouldRefuse)).toBeFalse();
  });

  it("should support leading and trailing whitespace in the accept parameter", () => {
    const mp3File = new File(["foo"], "foo.mp3", {
      type: "audio/mpeg",
    });

    const accepts = ".txt, image/png , audio/* , , video/mp4";
    expect(validateFileType(mp3File, accepts)).toBeTrue();
  });

  it("should refuse invalid wildcard mimetypes", () => {
    const blaFile = new File(["foo"], "foo.bla", {
      type: "bla/png",
    });

    const accepts = "bla/*";
    expect(validateFileType(blaFile, accepts)).toBeFalse();
  });
});
