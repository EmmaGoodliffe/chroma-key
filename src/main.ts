import App from "./App.svelte";

const app = new App({
  target: document.body,
  props: {
    convert: console.log,
  },
});

export default app;
