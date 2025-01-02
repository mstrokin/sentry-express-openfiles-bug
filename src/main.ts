import { App } from "./app";

(async () => {
  const app = await App.init();

  app.start();
})();
