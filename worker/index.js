// Redirects plain HTTP and www to https://tenbri.com, then serves the static site.
export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.protocol === 'http:' || url.hostname === 'www.tenbri.com') {
			url.protocol = 'https:';
			url.hostname = 'tenbri.com';
			return Response.redirect(url.toString(), 301);
		}
		return env.ASSETS.fetch(request);
	},
};
