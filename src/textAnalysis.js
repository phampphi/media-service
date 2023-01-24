import fetch, { Headers } from 'node-fetch';
import fs from 'fs';
import { parse } from 'csv-parse';

const MAPPING = {
    grammar: ['duplication', 'inconsistent-entities', 'grammar'],
    vocabulary: ['terminology', 'omission', 'duplication', 'non-conformance', 'register', 'style'],
    spelling: ['misspelling']
}

const headers = new Headers();
headers.append("conten", "application/json");
headers.append("Content-Type", "application/x-www-form-urlencoded");

export const analyseText = (text) => {
    return new Promise((resolve, reject) => {
        const urlencoded = new URLSearchParams();
        urlencoded.append("text", text);
        urlencoded.append("language", "en-US");

        const requestOptions = {
            method: 'POST',
            headers: headers,
            body: urlencoded,
            redirect: 'follow'
        };

        fetch(process.env.TEXT_ANALYSIS_URL, requestOptions)
            .then(response => response.json())
            .then(data => {
                const matches = data.matches;
                const result = {grammar:0, vocabulary:0, spelling: 0}

                for (let entry of matches){
                    for (let key in result){
                        (MAPPING[key].includes(entry.rule.issueType)) && result[key]++;
                    }
                }
                resolve(result);
            })
            .catch(error => reject(error));
    });
}

const readCSVToMap = (filePath) => {
    return new Promise((resolve) => {
        //let data = [];
        let ranges = {};
        fs.createReadStream(filePath)
            .pipe(parse({ delimiter: ",", from_line: 2 }))
            .on("data", (row) => {
                //data.push(row);
                ranges[row[0]] = Math.abs(parseFloat(row[5]));
            })
            .on("end", (err) => {
                resolve(ranges);
            })
    })
}

const vocabRanges = await readCSVToMap('./assets/WordDifficulty.csv');

const PUNCTUATION = '[.?!,\'";\\:\\-\\(\\)/\\+\\-\\*\u00AB\u00BB\u00BF\u201C-\u201E\u060C\u061F\u05BE\u05C0\u05C3\u05C6\u2000-\u206F\u22EF\u3000-\u3002\u3008-\u3011\uFF01\uFF08\uFF09\uFF0C\uFF1A\uFF1B\uFF1F\uFF3B\uFF3D\uFE41\uFE42\uFE4F\uFF5E]';
/**
   * Strip punctuation from a sentence.
   * @param {object[]|string} words - Words of a sentence.
   * @return {object[]|string} Words without punctuation.
   */
var stripPunctuation = (words) => {
    let wasString = false;
    if (typeof words === 'string') {
      wasString = true;
      words = [words];
    }

    /*
     * Will remove all punctuation symbols that are not directly enclosed in characters
     * In a sentence like "John's car broke.", the . would be removed, but not the '
     */
    const punctuationStart = new RegExp(`^${PUNCTUATION}`);
    const punctuationEnd = new RegExp(`${PUNCTUATION}$`);
    const punctuationBefore = new RegExp(` ${PUNCTUATION}`, 'g');
    // Special case: "The users' browser", keep the ' here
    const punctuationAfter = new RegExp(`${PUNCTUATION.replace("'", '')} `, 'g');

    words = words.map(word => {
      return word
        .replace(punctuationStart, '')
        .replace(punctuationEnd, '')
        .replace(punctuationBefore, ' ')
        .replace(punctuationAfter, ' ');
    });

    return (wasString) ? words.toString().replace(/[ ]{2}/g, ' ') : words;
}

export const calculateVocabRange = (text) => {
    const answers = stripPunctuation(text.trim().toLowerCase());
    const words = answers.split(' ').filter(a => a.trim().length > 0);
    let total = 0;
    for (let w of words){
        const zScore = vocabRanges[w];
        total += !!zScore ? zScore : 0;
    }
    return total / words.length;
}