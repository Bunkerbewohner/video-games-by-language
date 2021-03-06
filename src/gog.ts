import Apify, {CheerioHandlePage, Request, RequestQueue} from 'apify'

const {utils: {log}} = Apify;

// items from https://www.gog.com/games/ajax/filtered
interface GogGamesListItem {
    id: string;
    title: string;
    slug: string;
    image: string;
    url: string;
    category: string;
    rating: number;
    isGame: boolean;
    developer: string;
    publisher: string;
    gallery: string[];
    supportedOperatingSystems: string[];
    genres: string[];
    isTBA: boolean;
    globalReleaseDate: number;
}

// result of https://www.gog.com/games/ajax/filtered
interface GogGames {
    page: number;
    products: GogGamesListItem[],
    totalGamesFound: number;
    totalPages: number;
}

// result of https://api.gog.com/products/${game.id}
export interface GogGameDetails {
    id: number;
    title: string;
    purchase_link: string;
    slug: string;
    content_system_compatibility: {
        windows: boolean;
        linux: boolean;
        osx: boolean;
    };
    languages: { [lang: string]: string };
    links: {
        purchase_link: string;
        product_card: string;
        images: {
            background: string;
            logo: string;
            logo2x: string;
            icon: string;
            //...
        }
    }
}

export const handleGogPage: CheerioHandlePage = async ({request, $, json, crawler}) => {
    const requestQueue = crawler.requestQueue;

    // Handle Start URLs
    if (json && 'products' in json) {
        await step1_readListing(json as GogGames, requestQueue);
    } else if (request.url.match(/api\.gog\.com\/products/)) {
        await step2_readDetailsFromApi(request, json, requestQueue);
    } else if (request.url.match(/\/game\//)) {
        await step3_readProductPage(request, $);
    } else {
        log.info(`Unsupported URL '${request.url}'`)
    }
};

async function step3_readProductPage(request: Request, $: cheerio.Root) {
    const game = request.userData as GogGamesListItem;
    const completeData: any = request.userData;

    const supportedAudioLanguages: string[] = [];

    $(".details__languages-row--audio-support")
        .filter((i, el) => !$(el).hasClass("details__languages-row--unavailable"))
        .each((i, el) => supportedAudioLanguages.push($(el.prev).text().trim()));

    completeData.supportedAudioLanguages = supportedAudioLanguages;

    await Apify.pushData(completeData);
}

async function step2_readDetailsFromApi(request: Request, json: any, requestQueue: RequestQueue) {
    log.info('Crawling game at ' + request.url)
    const game = request.userData as GogGamesListItem;
    const allDataExceptAudioLanguages = {...game, ...json};

    // supported audio languages are only listed on the HTML page
    await requestQueue.addRequest({
        url: "https://www.gog.com" + game.url,
        headers: {
            "Accept-Language": "en",
        },
        userData: allDataExceptAudioLanguages,
    });
}

async function step1_readListing(result: GogGames, requestQueue: RequestQueue & object) {
    if (result.page === 1) {
        log.info(`FOUND ${result.totalGamesFound} GAMES`)
    } else {
        log.info(`Crawling page ${result.page}/${result.totalPages}`)
    }

    for (let game of result.products) {
        // most info can be access through the API
        const url = `https://api.gog.com/products/${game.id}`
        await requestQueue.addRequest({
            url,
            headers: {
                "Accept-Language": "en"
            },
            userData: game
        });
    }

    if (result.page < result.totalPages) {
        const next = result.page + 1;
        await requestQueue.addRequest({
            url: `https://www.gog.com/games/ajax/filtered?mediaType=game&page=${next}&sort=release_desc`,
        })
    }
}