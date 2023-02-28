import fetch, { Headers } from 'node-fetch';

const url = 'https://api.wit.ai/dictation?v=20221114';
const headers = new Headers();
headers.append("Content-Type", "audio/wav");
headers.append("Authorization", `Bearer ${process.env.WIT_API_KEY}`);

const parseResponse = response => {
    const chunks = response
        .split('\r\n')
        .map(x => x.trim())
        .filter(x => x.length > 0);

    let prev = '';
    let jsons = [];
    for (const chunk of chunks) {
        try {
            prev += chunk;
            jsons.push(JSON.parse(prev));
            prev = '';
        } catch (_e) { }
    }

    return jsons;
};

export const dictation = (data) => {
    return new Promise((resolve, reject) => {
        fetch(url, { method: "POST", body: data.buffer, headers: headers })
            .then(response => Promise.all([response.text(), response.status]))
            .then(([contents, status]) => {
                if (status > 200) {
                    console.log(contents);
                    reject(contents);
                }
                else {
                    const finalResponses = parseResponse(contents).filter(r => r.is_final);
                    const text = finalResponses.map(r => r.text).join(' ');
                    const confidence = finalResponses.map(r => r.speech ? r.speech.confidence : 0).reduce((a, b) => a + b, 0) / finalResponses.length;

                    const result = { text: text.replaceAll('Hey Facebook', ''), confidence: confidence, status: status };
                    console.log(result);
                    resolve(result);
                }
            })
            .catch(e => reject(e));
    });
};
