// build the HTML
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import {GogGameDetails} from "./src/routes";

const templateFile = fs.readFileSync('./gog/_template.html', 'utf-8');
const template = Handlebars.compile(templateFile);

const files = fs.readdirSync("./apify_storage/datasets/default", 'utf-8');

const data = files.filter(filename => filename.endsWith(".json")).map(filename => {
    const path = './apify_storage/datasets/default/' + filename;
    const game = JSON.parse(fs.readFileSync(path, 'utf-8'));
    game.languageCodes = Object.keys(game.languages);
    return game;
});

const languages = {};
data.forEach((game: GogGameDetails) => Object.entries(game.languages).forEach(([code,lang]) => languages[code] = lang))

const html = template({games: data, languages: Object.entries(languages).map(([code, lang]) => ({code, lang}))});

fs.writeFileSync('./gog/index.html', html, {encoding: 'utf-8'})


