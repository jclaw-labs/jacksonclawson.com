// Old domains redirect to jackson.fm; everything else is the static site.
const REDIRECT_HOSTS = new Set(['jacksonclawson.com', 'www.jacksonclawson.com']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (REDIRECT_HOSTS.has(url.hostname)) {
      return Response.redirect(`https://jackson.fm${url.pathname}${url.search}`, 301);
    }
    return env.ASSETS.fetch(request);
  },
};
