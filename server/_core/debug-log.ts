import fs from "node:fs";

export function trimLogFile(
  logPath: string,
  maxSize: number,
  targetSize: number
) {
  let descriptor: number | undefined;
  try {
    descriptor = fs.openSync(
      logPath,
      fs.constants.O_RDWR | fs.constants.O_NOFOLLOW
    );
    if (
      !fs.fstatSync(descriptor).isFile() ||
      fs.fstatSync(descriptor).size <= maxSize
    )
      return;
    const lines = fs.readFileSync(descriptor, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    const content = Buffer.from(keptLines.join("\n"), "utf-8");
    let written = 0;
    while (written < content.length) {
      written += fs.writeSync(
        descriptor,
        content,
        written,
        content.length - written,
        written
      );
    }
    fs.ftruncateSync(descriptor, content.length);
  } catch {
    return;
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
}
