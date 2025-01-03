import * as Sentry from "@sentry/node";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

//Switch to false to test the broken getContextLinesFromFile function (below) without testing whole Sentry.captureException
const TEST_SENTRY = true;
//Switch to true to enable the stream.destroy() fix in getContextLinesFromFile
const FIX_ENABLED = false;

const brokenCode = () => {
  if (TEST_SENTRY) {
    Sentry.captureException("fake exception to debug open files");
  } else {
    getContextLinesFromFile("./src/main.ts");
  }
};

/* Broken code from @sentry/node */
function getContextLinesFromFile(path: string): Promise<void> {
  return new Promise((resolve, _reject) => {
    // It is important *not* to have any async code between createInterface and the 'line' event listener
    // as it will cause the 'line' event to
    // be emitted before the listener is attached.
    const stream = createReadStream(path);
    const lineReaded = createInterface({
      input: stream,
    });

    // Init at zero and increment at the start of the loop because lines are 1 indexed.
    let lineNumber = 0;
    // We use this inside Promise.all, so we need to resolve the promise even if there is an error
    // to prevent Promise.all from short circuiting the rest.
    function onStreamError(e: Error): void {
      // Mark file path as failed to read and prevent multiple read attempts.
      lineReaded.close();
      lineReaded.removeAllListeners();
      resolve();
    }

    // We need to handle the error event to prevent the process from crashing in < Node 16
    // https://github.com/nodejs/node/pull/31603
    stream.on("error", onStreamError);
    lineReaded.on("error", onStreamError);
    lineReaded.on("close", resolve);

    lineReaded.on("line", (line) => {
      lineNumber++;
      lineReaded.close();
      //MS: This line causes readStream to never be closed
      lineReaded.removeAllListeners();
      //MS: This line makes sure we destroy the stream
      if (FIX_ENABLED) {
        stream.destroy();
      }
    });
  });
}

export class App {
  public static async init(): Promise<App> {
    const app = new App();
    return app;
  }

  public async start() {
    this.initSentry();
    console.log("App is listening, run lsof now");
    console.log(
      "lsof -p`ps aux |  grep \"main.js\" | grep node | head  -n 1| awk '{print $2}'`"
    );
    for (var i = 0; i <= 10; i++) {
      brokenCode();
    }
    this.listen("127.0.0.1", 3000);
  }

  private async listen(host: string, port: number) {
    setTimeout(() => {}, 1000000);
  }

  private initSentry(): void {
    Sentry.init({
      dsn: "https://123456789@987654321.ingest.sentry.io/123456789",
      tracesSampleRate: 1.0,
      environment: "production",
    });
  }
}
