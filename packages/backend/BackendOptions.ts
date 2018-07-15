import * as path from "path";

export class BackendOptions {
  bePort: number;
  proxyPort: number;
  sessionDirectory: string;
  onReady: () => void;
  dontTrack: any[];
  block: any[];
  disableDefaultBlockList: boolean;

  constructor({
    bePort,
    proxyPort,
    sessionDirectory,
    onReady,
    dontTrack,
    block,
    disableDefaultBlockList
  }) {
    this.bePort = bePort;
    this.proxyPort = proxyPort;
    this.sessionDirectory = sessionDirectory;
    this.onReady = onReady;
    this.dontTrack = dontTrack;
    this.block = block;
    this.disableDefaultBlockList = disableDefaultBlockList;
  }

  getCertDirectory() {
    return path.resolve(this.sessionDirectory, "certs");
  }

  getTrackingDataDirectory() {
    return path.resolve(this.sessionDirectory, "tracking-data");
  }

  getSessionJsonPath() {
    return path.resolve(this.sessionDirectory, "session.json");
  }

  getLocStorePath() {
    return path.resolve(this.sessionDirectory, "locs");
  }

  getChromeUserDataDirectory() {
    return path.resolve(this.sessionDirectory, "chrome");
  }
}
