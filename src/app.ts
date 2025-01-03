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
    const stream = createReadStream(path);
    const lineReaded = createInterface({
      input: stream,
    });

    function destroyStreamAndResolve(): void {
      stream.destroy();
      resolve();
    }

    //MS: We need to call destroy.stream when lineReaded interface is closed, otherwise file is never closed.
    lineReaded.on("close", !FIX_ENABLED ? resolve : destroyStreamAndResolve);

    lineReaded.on("line", (line) => {
      lineReaded.close();
      //MS: This line causes readStream to never be closed
      lineReaded.removeAllListeners();
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
