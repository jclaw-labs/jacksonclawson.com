import pluginBundle from '@11ty/eleventy-plugin-bundle';
import pluginImages from './.eleventy.images.js';
import pluginYouTube from "eleventy-plugin-youtube-embed";
import embedVimeo from "eleventy-plugin-vimeo-embed";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginBundle, {
    bundles: ["basecss"]
  });
  eleventyConfig.addPlugin(pluginImages);
  eleventyConfig.addPlugin(embedVimeo);
  eleventyConfig.addPlugin(pluginYouTube, {
    modestBranding: true,
    lite: {
      responsive: true,
      thumbnailQuality: 'maxresdefault'
    }
  });

  // Agent toolkit vendored from local-config: tooling, not pages.
  eleventyConfig.ignores.add('AGENTS.md');
  eleventyConfig.ignores.add('.claude/**');

  eleventyConfig.addPassthroughCopy('img');
  eleventyConfig.addPassthroughCopy('js/night-train.js');
  eleventyConfig.addPassthroughCopy({ "public": "/" });
  eleventyConfig.addWatchTarget('css/');
  eleventyConfig.addWatchTarget('js/');

  eleventyConfig.setServerOptions({
    liveReload: false
  });

  eleventyConfig.addCollection('projectsByPriority', (collection) => {
    let projects = [];
    projects.push(...collection.getFilteredByGlob('projects/**/*.liquid'));
    projects.push(...collection.getFilteredByGlob('projects/**/*.md'));

    const result = projects.map((project) => {
      let split = project.inputPath.split('/')
      let projectFolder = split[2]
      project.imgPath = `./projects/${projectFolder}`
      return project
    }).sort((a, b) => {
      if (a.data.priority > b.data.priority) return -1
      else if (a.data.priority < b.data.priority) return 1
      else return 0
    })
    return result
  });
}
