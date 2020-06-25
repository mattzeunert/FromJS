import * as path from "path";
import * as fs from "fs";

export class BackendOptions {
  bePort: number;
  proxyPort: number;
  sessionDirectory: string;
  onReady: (x: any) => void;
  dontTrack: any[];
  block: any[];
  disableDefaultBlockList: boolean;
  backendOriginWithoutPort: string;

  constructor({
    bePort,
    proxyPort,
    sessionDirectory,
    onReady,
    dontTrack,
    block,
    disableDefaultBlockList,
    backendOriginWithoutPort,
  }) {
    this.bePort = bePort;
    this.proxyPort = proxyPort;
    this.sessionDirectory = sessionDirectory;
    this.onReady = onReady;
    this.dontTrack = dontTrack;
    this.block = block;
    this.disableDefaultBlockList = disableDefaultBlockList;
    this.backendOriginWithoutPort = backendOriginWithoutPort;
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

  getBackendServerCertDirPath() {
    return path.resolve(this.sessionDirectory, "be-server-cert");
  }

  getBackendServerCertPath() {
    return path.resolve(this.getBackendServerCertDirPath(), "cert.pem");
  }

  getBackendServerPrivateKeyPath() {
    return path.resolve(this.getBackendServerCertDirPath(), "key.pem");
  }

  getBackendServerCertInfo() {
    return {
      key: fs.readFileSync(this.getBackendServerPrivateKeyPath()),
      cert: fs.readFileSync(this.getBackendServerCertPath()),
    };
  }
}
