<script lang="ts">
  export let convert: () => void;
  let files;
</script>

<main>
  <input
    type="file"
    bind:files={files}
    on:change={() => {
      console.log({ files });
    }} />
  <button on:click={convert}>Convert</button>
</main>
