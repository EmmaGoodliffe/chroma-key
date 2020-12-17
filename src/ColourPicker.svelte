<script lang="ts">
  import { defaultHex, defaultAlpha } from "./store";

  export let title: string;
  export let onUpdate: (colour: string) => void;

  let hex = defaultHex;
  let alpha = defaultAlpha;

  $: fullColour = hex + alpha;
</script>

<style lang="scss">
  $length: 8rem;
  .colour-picker {
    display: flex;
    width: 100%;
    font-size: 1.5rem;
    .title {
      min-width: 12rem;
      text-align: right;
    }
    .preview {
      flex: 1;
      margin: auto 1rem;
      min-width: $length;
      max-width: $length;
      border: 0.1rem solid white;
      text-align: center;
      font-family: monospace;
      line-height: 2rem;
    }
    input {
      flex: 1;
      &[type="text"] {
        background-color: transparent;
        border: 0.1rem solid white;
        color: white;
        font-size: inherit;
        min-width: $length;
        max-width: $length;
      }
    }
  }
</style>

<div class="colour-picker">
  <span class="title">{title}</span>
  <div class="preview" style={`color: ${fullColour};`}>{fullColour}</div>
  <input type="color" bind:value={hex} on:change={() => onUpdate(fullColour)} />
  <input
    type="text"
    bind:value={alpha}
    on:change={() => onUpdate(fullColour)} />
</div>
