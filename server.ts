import express from "express";
import Jimp from "jimp";
import { resolve } from "path";

type RGBA = [number, number, number, number];

type Colour = string | RGBA;

const hexToInt = (hex: string) => parseInt(hex.replace("#", "0x"));

const parseColour = (colour: Colour) =>
  typeof colour === "string" ? hexToInt(colour) : Jimp.rgbaToInt(...colour);

const chromaKey = async (buffer: Buffer, colour1: number, colour2: number) => {
  const png = await Jimp.read(buffer);
  const width = png.getWidth();
  const height = png.getHeight();
  const swappedPng = new Jimp(width, height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const pixel = png.getPixelColour(x, y);
      const swappedColour = pixel === colour1 ? colour2 : pixel;
      swappedPng.setPixelColour(swappedColour, x, y);
    }
  }
  const base64 = await swappedPng.getBase64Async("image/png");
  return base64;
};

const app = express();

app.use(express.json());
app.use(express.static("dist"));

app.get("/", (req, res) => {
  res.sendFile(resolve("index.html"));
});

app.post("/chroma-key", async (req, res) => {
  try {
    const base64 = req.body.base64 as string;
    const from = req.body.convert.from as Colour;
    const to = req.body.convert.to as Colour;
    try {
      const buffer = Buffer.from(base64, "base64");
      res.json({
        request: req.body,
        base64: await chromaKey(buffer, parseColour(from), parseColour(to)),
      });
    } catch (err) {
      res.status(500).json({
        message: `Server error: ${err}`,
      });
    }
  } catch (err) {
    res.status(400).json({
      message: "Bad request",
      request: req.body,
    });
  }
});

const port = 1234;
app.listen(port, () => console.log(`Listening at http://localhost:${port}`));
