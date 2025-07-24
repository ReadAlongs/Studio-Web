// audioExtension uses the mime type to return a valid extension prefix
export function audioExtension(mimetype: string): string {
  switch (mimetype) {
    case "audio/mpeg":
      return ".mp3";
    case "audio/wav":
      return ".wav";
    case "audio/webm":
      return ".webm";
    case "audio/m4a":
      return ".m4a";
    default:
      return ".wav";
  }
}

export function textMimeType(filename: string): string {
  filename = filename.toLowerCase();
  switch (true) {
    case filename.endsWith(".xml"):
      return "application/readlong+xml";
    case filename.endsWith(".readalong"):
      return "application/readlong+xml";
    default:
      return "text/plain";
  }
}
