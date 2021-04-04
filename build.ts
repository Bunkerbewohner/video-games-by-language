// build the HTML
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import {GogGameDetails} from "./src/gog";

const templateFile = fs.readFileSync('./gog/_index.html', 'utf-8');
const template = Handlebars.compile(templateFile);

const languageTemplateFile = fs.readFileSync("./gog/_language.html", "utf-8");
const languageTemplate = Handlebars.compile(languageTemplateFile);

const files = fs.readdirSync("./apify_storage/datasets/default", 'utf-8');

const data = files.filter(filename => filename.endsWith(".json")).map(filename => {
    const path = './apify_storage/datasets/default/' + filename;
    const game = JSON.parse(fs.readFileSync(path, 'utf-8'));
    game.textLanguages = Object.keys(game.languages);

    // list of language names
    game.audioLanguages = game.supportedAudioLanguages; // language names, not codes

    game.audioLanguagesDict = {};
    for (let [code, lang] of Object.entries(game.languages)) {
        game.audioLanguagesDict[code] = lang;
    }

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

const languageCodeToEnglish = {
    "en": "English",
    "cn": "Simplified Chinese",
    "de": "German",
    "es": "Spanish",
    "fr": "French",
    "pl": "Polish",
    "ru": "Russian",
    "br": "Brazilian Portuguese",
    "it": "Italian",
    "jp": "Japanese",
    "ko": "Korean",
    "es_mx": "Mexican Spanish",
    "zh": "Traditional Chinese",
    "pt": "Portuguese",
    "nl": "Dutch",
    "cz": "Czech",
    "da": "Dansk",
    "hu": "Hungarian",
    "tr": "Turkish",
    "sv": "Slovenian",
    "ar": "Arabic",
    "bl": "Bulgarian",
    "fi": "Finnish",
    "gk": "Greek",
    "no": "Norwegian",
    "ro": "Romanian",
    "th": "Thai",
    "uk": "Ukrainian",
    "sb": "Sorbian",
    "sk": "Slovak",
    "be": "Belarusian",
    "ca": "Catalan",
    "he": "Hebrew",
    "is": "Icelandic",
    "fa": "Farsi",
    "gog_IN": "Inuktitut",
};

const relevantData = data.map(row => ({
    title: row.title,
    languages: row.languages,
    supportedAudioLanguages: row.supportedAudioLanguages,
    audioLanguages: row.audioLanguages,
    textLanguages: row.textLanguages,
    genres: row.genres,
    links: row.links,
    wordsOn: row.worksOn,
}));

const html = template({
    games: data,
    gamesJson: JSON.stringify(relevantData),
    numGames: data.length,
    languages: Object.entries(languages).map(([code, lang]) => ({code, lang})),
    languageNameToCodeJSON: JSON.stringify(languageNameToCode),
    languageCodeToEnglish: languageCodeToEnglish,
});

fs.writeFileSync('./gog/index.html', html, {encoding: 'utf-8'});

//--

for (const [code, name] of Object.entries(languages)) {
    const games = data.filter(g => g.textLanguages.indexOf(code) >= 0);

    for (const game of games) {
        game.audioSupport = game.audioLanguages.indexOf(code) >= 0;
    }

    const html = languageTemplate({
        games: games,
        gamesJson: JSON.stringify(relevantData.filter(g => g.textLanguages.indexOf(code) >= 0)),
        numGames: games.length,
        languageCode: code,
        languageName: name,
        languageNameInEnglish: languageCodeToEnglish[code] || name,
        languages: Object.entries(languages).map(([code, lang]) => ({code, lang})),
        languageNameToCodeJSON: JSON.stringify(languageNameToCode),
        languageCodeToEnglish: languageCodeToEnglish,
    });

    fs.writeFileSync(`./gog/${code}.html`, html, {encoding: "utf-8"})
}