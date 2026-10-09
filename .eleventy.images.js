import path from 'path';
import Image from '@11ty/eleventy-img';
import fs from 'fs';
import { fileURLToPath } from 'url';

const unsupportedFormats = ['.gif'];
const outputDir = './_site/img/';

export default function (eleventyConfig) {
  function relativeToImgPath(relativeFilePath) {
    const split = relativeFilePath.split('/');
    return `/img/${split[1]}`;
  }

  async function imageShortcode(inputPath, src, alt, sizes, klass) {
    // Full list of formats here: https://www.11ty.dev/docs/plugins/image/#output-formats
    const file = path.resolve(inputPath, src);
    const { ext } = path.parse(src);

    if (unsupportedFormats.includes(ext)) {
      if (alt === undefined) {
        throw new Error(`Missing \`alt\` attribute on eleventy-img shortcode from: ${src}`);
      }

      const newFile = src.split('/')[1];
      fs.copyFile(file, `${outputDir}${newFile}`, (err) => {
        if (err) {
          throw new Error(err);
        }
      });

      return `<img src="/img/${newFile}" alt="${alt}" class="${klass}" />`;
    } else {
      const metadata = await Image(file, {
        widths: [750, 1300, 1900, 2400, 2700, 3300],
        formats: ['avif', 'jpeg'],
        outputDir: outputDir
      });

      // eleventy-img 7 keeps `sizes` on a <source> with a single srcset candidate (no `w` descriptor), which HTML forbids.
      const hasMultipleCandidates = Object.values(metadata).some((candidates) => candidates.length > 1);

      const imageAttributes = {
        class: klass,
        alt,
        sizes: hasMultipleCandidates ? sizes : undefined,
        loading: 'lazy',
        decoding: 'async'
      };

      return Image.generateHTML(metadata, imageAttributes);
    }
  }

  eleventyConfig.addPairedShortcode('imagepaired', async function (content, alt, sizes, klass) {
    const json = JSON.parse(content.trim());
    const src = json.thumb;
    const imgPath = json.imgPath;
    return imageShortcode(imgPath, src, alt, sizes, klass);
  });

  eleventyConfig.addShortcode('image', async function (src, alt, sizes, klass) {
    let inputPath = this.page.inputPath;
    let split = inputPath.split('/');
    split.pop();
    inputPath = split.join(path.sep);
    return imageShortcode(inputPath, src, alt, sizes, klass);
  });
}
