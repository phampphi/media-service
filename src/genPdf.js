import fs from 'fs';
import { generate } from '@pdfme/generator';

const customFonts = {
    OpenSans: { data: fs.readFileSync("assets/OpenSans.ttf") },
}
const pdfReportFile = fs.readFileSync('assets/pteReport.json');
const pdfReportJson = JSON.parse(pdfReportFile);

// const inputs = [{
//   name: 'Lenny Lenny', email: 'lenny@email.com', country: 'Vietnam', id: 'PTE_001',
//   listening: '90', reading: '80', writing: '70', speaking: '75', overall: '80'
// }];

export const generatePDF = async (data) => {
    return await generate({ template: pdfReportJson, inputs: [data], options: { customFonts } });
}