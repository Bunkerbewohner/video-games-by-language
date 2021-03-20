import Apify, {CheerioHandlePage} from 'apify'

const {utils: {log}} = Apify;

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

interface GogGames {
    page: number;
    products: GogGamesListItem[],
    totalGamesFound: number;
    totalPages: number;
}

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
    languages: {[lang: string]: string};
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

export const handlePage: CheerioHandlePage = async ({request, $, json, crawler}) => {
    const requestQueue = crawler.requestQueue;

    // Handle Start URLs
    if (json && 'products' in json) {
        const result = json as GogGames;

        if (result.page === 1) {
            log.info(`FOUND ${result.totalGamesFound} GAMES`)
        } else {
            log.info(`Crawling page ${result.page}/${result.totalPages}`)
        }

        for (let game of result.products) {
            const url = `https://api.gog.com/products/${game.id}?expand=description`
            requestQueue.addRequest({
                url,
                headers: {
                    "Accept-Language": "en"
                },
                userData: game
            })
        }

        if (result.page < result.totalPages) {
            const next = result.page + 1;
            requestQueue.addRequest({
                url: `https://www.gog.com/games/ajax/filtered?mediaType=game&page=${next}&sort=release_desc`,
            })
        }
    } else if (request.url.match(/api\.gog\.com\/products/)) {
        log.info('Crawling game at ' + request.url)
        const game = request.userData as GogGamesListItem;
        await Apify.pushData({
            ...game,
            ...json
        })
    } else {
        log.info(`Unsupported URL '${request.url}'`)
    }
};
