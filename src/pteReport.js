import mysql from 'mysql-await';
import { generatePDF } from './genPdf.js'
import { generatePteScoreChart, generateEnablingScoreChart } from './genChart.js';

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const dbPrefix = process.env.DB_PREFIX || "";
const sql = `select additionals, timecreated from ${dbPrefix}h5pactivity_attempts_results 
              where interactiontype = 'compound'
              and attemptid in (select max(id) from ${dbPrefix}h5pactivity_attempts 
                                where userId = ?
                                and h5pactivityid in (select instance from ${dbPrefix}course_modules where id in (?))
                                group by h5pactivityid)`;
const userSql = `select id, firstname, lastname, email, country from ${dbPrefix}user where id = ?`;

const PTE_SKILLS = ['Listening', 'Reading', 'Speaking', 'Writing'];
const ENABLING_SKILLS = ['Grammar', 'Oral Fluency', 'Pronunciation', 'Spelling', 'Vocabulary', 'Written Discourse'];
const ENABLING_SKILLS_MAPPING = {
  'Grammar': 'Grammar',
  'Oral Fluency': 'Oral Fluency',
  'Pronunciation': 'Pronunciation',
  'Spelling': 'Spelling',
  'Vocabulary': 'Vocabulary',
  'Vocabulary Range': 'Vocabulary',
  'Linguistic Range': 'Written Discourse',
  'Structure': 'Written Discourse'
};

export const generatePTEReport = async (userId, activityIds) => {
  const userResults = await pool.awaitQuery(userSql, [userId]);
  const user = {
    name: `${userResults[0].lastname} ${userResults[0].firstname}`,
    email: `${userResults[0].email}`,
    country: `${userResults[0].country}`,
    id: 'PTE_' + `${userResults[0].id}`.padStart(3, '0')
  };

  const results = await pool.awaitQuery(sql, [userId, activityIds]);

  const scores = {};
  const pteScoresArr = [0, 0, 0, 0];
  const enablingScoresArr = [{ score: 0, count: 0 }, { score: 0, count: 0 }, { score: 0, count: 0 }, { score: 0, count: 0 }, { score: 0, count: 0 }, { score: 0, count: 0 }];
  let overall = 0;
  let testDate = 0;
  for (let result of results) {
    const timecreated = result.timecreated;
    testDate = testDate < timecreated ? timecreated : testDate;

    const additionals = JSON.parse(result.additionals);
    const taggedScore = additionals.extensions.taggedScore;
    if (!taggedScore) continue;

    for (let tag in taggedScore) {
      const t = tag.split('_')[0];
      if (PTE_SKILLS.includes(t)) {
        pteScoresArr[PTE_SKILLS.indexOf(t)] += taggedScore[tag];
        scores[t] = !!scores[t] ? scores[t] + taggedScore[tag] : taggedScore[tag];
      }
      if (!!ENABLING_SKILLS_MAPPING[t]) {
        enablingScoresArr[ENABLING_SKILLS.indexOf(ENABLING_SKILLS_MAPPING[t])].score += taggedScore[t];
        enablingScoresArr[ENABLING_SKILLS.indexOf(ENABLING_SKILLS_MAPPING[t])].count += 1;
      }
    }
  }
  for (let key in scores) {
    overall += scores[key];
    scores[key] = `${Math.round(scores[key])}`;
  }

  const pteScoresChart = await generatePteScoreChart(PTE_SKILLS, pteScoresArr.map(s => Math.round(s)));
  const enablingScoresChart = await generateEnablingScoreChart(ENABLING_SKILLS, enablingScoresArr.map(s => s.count == 0 ? 0 : Math.round((s.score / s.count) * 90)));
  const data = {
    ...user,
    ...scores,
    overall: `${Math.round(overall / PTE_SKILLS.length)}`,
    pteScoresChart,
    enablingScoresChart,
    testDate: new Intl.DateTimeFormat(process.env.LOCALE).format(new Date(testDate * 1000))
  };

  return await generatePDF(data);
}

export const releasePool = () => {
  pool.end(() => { console.log('Connection pool released') });
}

