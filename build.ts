// build the HTML
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import {GogGameDetails} from "./src/gog";

const templateFile = fs.readFileSync('./gog/_template.html', 'utf-8');
const template = Handlebars.compile(templateFile);

const files = fs.readdirSync("./apify_storage/datasets/default", 'utf-8');

const data = files.filter(filename => filename.endsWith(".json")).map(filename => {
    const path = './apify_storage/datasets/default/' + filename;
    const game = JSON.parse(fs.readFileSync(path, 'utf-8'));
    game.textLanguages = Object.keys(game.languages);
    game.audioLanguages = game.supportedAudioLanguages; // language names, not codes
    return game;
});

const languageNameToCode = {};
for (let game of data) {
    for (let [code, lang] of Object.entries(game.languages)) {
        languageNameToCode[lang as string] = code;
    }
}

for (let game of data) {
    game.audioLanguages = game.audioLanguages.map(lang => languageNameToCode[lang]);
}

const languages = {};
data.forEach((game: GogGameDetails) => Object.entries(game.languages).forEach(([code,lang]) => languages[code] = lang))

const html = template({
    games: data,
    gamesJson: JSON.stringify(data),
    numGames: data.length,
    languages: Object.entries(languages).map(([code, lang]) => ({code, lang})),
    languageNameToCodeJSON: JSON.stringify(languageNameToCode),
});

fs.writeFileSync('./gog/index.html', html, {encoding: 'utf-8'})


