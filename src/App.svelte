<script lang="ts">
  import ColourPicker from "./ColourPicker.svelte";
  import { colour1, colour2 } from "./store";

  let files: FileList;
  let preview = "";

  $: buttonIsDisabled = !(files && files.length);

  const post = async (url: string, data: Object) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response.json();
  };

  const bytesToBase64 = (bytes: Uint8Array) => {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const chromaKey = async () => {
    const [file] = files;
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = bytesToBase64(bytes);
    const result = await post("/chroma-key", {
      base64,
      convert: {
        from: $colour1,
        to: $colour2,
      },
    });
    console.log({ result });
    preview = result.base64 as string;
  };
</script>

<style lang="scss">
  * {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }
  @mixin btn {
    padding: 0.5rem 1rem;
    background-color: #eee;
    border: none;
    border-radius: 0.2rem;
  }
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 80%;
    margin: auto;
    div {
      flex: 1;
      margin: 1rem 0;
      &.instructions {
        font-style: italic;
        text-decoration: underline;
        text-underline-position: under;
      }
      input[type="file"] {
        color: white;
        &::-webkit-file-upload-button {
          @include btn;
        }
      }
      button {
        @include btn;
        &.disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
      }
    }
  }
</style>

<main>
  <div class="instructions">Choose an image</div>
  <div><input type="file" id="image-input" bind:files /></div>
  <div class="instructions">Choose how to convert colours</div>
  <div>
    <ColourPicker title="Convert from..." onUpdate={c => colour1.set(c)} />
    <ColourPicker title="...to..." onUpdate={c => colour2.set(c)} />
  </div>
  <div class="instructions">Go!</div>
  <div>
    <button
      class:disabled={buttonIsDisabled}
      on:click={buttonIsDisabled ? null : chromaKey}>Chroma key</button>
  </div>
  <div>
    {#if preview.length}<img src={preview} alt="Preview" />{/if}
  </div>
</main>
