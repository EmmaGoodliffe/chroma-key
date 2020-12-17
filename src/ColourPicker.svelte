<script lang="ts">
  import { defaultHex, defaultAlpha } from "./store";

  export let onUpdate: (colour: string) => void;

  let hex = defaultHex;
  let alpha = defaultAlpha;

  $: fullColour = hex + alpha;
</script>

<style lang="scss">
  .preview {
    width: 100px;
    height: 100px;
  }
</style>

<input type="color" bind:value={hex} on:change={() => onUpdate(fullColour)} />
<input type="text" bind:value={alpha} on:change={() => onUpdate(fullColour)} />
<div class="preview" style={`background-color: ${fullColour};`} />
