import * as fs from "fs";
import { BackendOptions } from "./backend";

export function initSessionDirectory(options: BackendOptions) {
  const directories = [
    options.sessionDirectory,
    options.getCertDirectory(),
    options.getTrackingDataDirectory(),
    options.sessionDirectory + "/files",
    options.sessionDirectory + "/locsByUrl",
  ];
  directories.forEach((dir) => {
    console.log({ dir });
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  });
}
