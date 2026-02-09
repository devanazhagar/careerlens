const pdf = require('pdf-parse');
console.log('pdf type:', typeof pdf);
if (typeof pdf === 'object') {
    console.log('Keys:', Object.keys(pdf));
    if (pdf.default) {
        console.log('pdf.default type:', typeof pdf.default);
    }
}
