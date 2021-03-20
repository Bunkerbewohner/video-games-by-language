import Apify from 'apify'
import {handlePage} from './src/routes';

const {utils: {log}} = Apify;

Apify.main(async () => {
    const requestList = await Apify.openRequestList('start-urls', []);
    const requestQueue = await Apify.openRequestQueue();

    await requestQueue.addRequest({
        url: 'https://www.gog.com/games/ajax/filtered?mediaType=game&page=1&sort=release_desc&language=en',
        headers: {
            'Accept-Language': 'en',
        },
    });

    const crawler = new Apify.CheerioCrawler({
        requestList,
        requestQueue,
        maxConcurrency: 50,
        handlePageFunction: async (context) => {
            const {url, userData: {label}} = context.request;
            return handlePage(context);
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});
