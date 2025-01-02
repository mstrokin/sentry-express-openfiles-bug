import * as Sentry from "@sentry/node";

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
      Sentry.captureException("fake exception to debug open files");
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
