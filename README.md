# Video Games by Language

Not everyone speaks English. This is a tool for finding games in your preferred language. See https://bunkerbewohner.github.io/video-games-by-language/gog/.

## Usage

To crawl the sites run `npm install` and then `npm start`.

To update the HTML pages (e.g. `gog/index.html`) afterwards run `npm build`.

Open the HTML page in a browser to view the list of games with language information.

## Sites

### gog.com

Thankfully gog.com provides all relevant data via APIs. The only problem is that they ignore the `Accept-Language` header and seem to set the language based on IP. As a consequence the GOG genres I crawled are in German.


