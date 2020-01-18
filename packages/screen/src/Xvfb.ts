import { logger } from "@qawolf/logger";
import { sleep } from "@qawolf/web";
import { spawn } from "child_process";
import { pathExists } from "fs-extra";

// TODO slack reminder to look into unclosed stuffs
// TODO tests...

export class Xvfb {
  private _display: number;
  private _process: any;

  protected constructor(options) {
    this._display = options.display;
    this._process = options.process;
  }

  public async start(args: string[] = []) {
    const display = await getUnusedDisplay();

    const process = spawn("Xvfb", [display.toString()].concat(args));

    process.stderr.on("data", data => {
      logger.debug(`Xvfb: ${data.toString()}`);
    });

    let timeout = 30000;

    while (!(await displayExists(display))) {
      await sleep(50);
      timeout -= 50;
      if (timeout <= 0) throw new Error("Could not start Xvfb.");
    }

    return new Xvfb({ display, process });
  }

  public async stop() {
    if (!this._process) {
      return;
    }

    this._process.kill();
    this._process = null;

    let timeout = 30000;

    while (await displayExists(this._display)) {
      await sleep(50);
      timeout -= 50;
      if (timeout <= 0) throw new Error("Could not stop Xvfb.");
    }
  }
}

const getLockFile = (display: number) => `/tmp/.X${display}-lock`;

const displayExists = async (display: number) =>
  pathExists(getLockFile(display));

const getUnusedDisplay = async (): Promise<number> => {
  let display = 98;

  while (await displayExists(display)) {
    display++;
  }

  return display;
};
