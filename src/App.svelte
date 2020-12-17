<script lang="ts">
  let files: FileList;
  let preview: string;

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
        from: [255, 255, 255, 255],
        to: [0, 0, 0, 0],
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
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    div {
      display: flex;
      margin: 10px 0;
      button {
        padding: 10px 20px;
        font-weight: bold;
        background-color: #eee;
      }
    }
  }
</style>

<main>
  <div>
    <input type="file" bind:files />
    <button on:click={chromaKey}>Chroma key</button>
  </div>
  <div><img src={preview} alt="Preview" /></div>
</main>
