const path = require('path');
const fs = require('fs');
const fitxer =  path.join(__dirname,'../database/db.json');

/* save database */
const savedb = (data) => {
  fs.writeFileSync(fitxer, JSON.stringify(data));
}

/* get database */
const getdb = () => {
    if(!fs.existsSync(fitxer)) return null;
    const info = fs.readFileSync(fitxer,{encoding: "utf-8"});
    data =  JSON.parse(info);
    return data
}

module.exports = {getdb, savedb};