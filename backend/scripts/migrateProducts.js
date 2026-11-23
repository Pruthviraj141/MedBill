import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Top 10 Indian retail medicines
const products = [
  {
    "_id": "med_dolo_650",
    "id": "med_dolo_650",
    "name": "Dolo 650 Tablet",
    "price": 33,
    "category": "Tablets",
    "icon": "/icons/tablets.png",
    "active": true
  },
  {
    "_id": "med_crocin_advance",
    "id": "med_crocin_advance",
    "name": "Crocin Advance 500mg",
    "price": 22,
    "category": "Tablets",
    "icon": "/icons/tablets.png",
    "active": true
  },
  {
    "_id": "med_augmentin_625",
    "id": "med_augmentin_625",
    "name": "Augmentin 625 Duo Tablet",
    "price": 195,
    "category": "Tablets",
    "icon": "/icons/tablets.png",
    "active": true
  },
  {
    "_id": "med_azithral_500",
    "id": "med_azithral_500",
    "name": "Azithral 500 Tablet",
    "price": 125,
    "category": "Tablets",
    "icon": "/icons/tablets.png",
    "active": true
  },
  {
    "_id": "med_pan_40",
    "id": "med_pan_40",
    "name": "Pan 40 Tablet",
    "price": 155,
    "category": "Tablets",
    "icon": "/icons/tablets.png",
    "active": true
  },
  {
    "_id": "med_pan_d",
    "id": "med_pan_d",
    "name": "Pan-D Capsule",
    "price": 180,
    "category": "Capsules",
    "icon": "/icons/capsules.png",
    "active": true
  },
  {
    "_id": "med_montair_lc",
    "id": "med_montair_lc",
    "name": "Montair LC Tablet",
    "price": 210,
    "category": "Tablets",
    "icon": "/icons/tablets.png",
    "active": true
  },
  {
    "_id": "med_glycomet_gp1",
    "id": "med_glycomet_gp1",
    "name": "Glycomet-GP 1 Tablet",
    "price": 85,
    "category": "Tablets",
    "icon": "/icons/tablets.png",
    "active": true
  },
  {
    "_id": "med_telma_40",
    "id": "med_telma_40",
    "name": "Telma 40 Tablet",
    "price": 145,
    "category": "Tablets",
    "icon": "/icons/tablets.png",
    "active": true
  },
  {
    "_id": "med_okacet_10",
    "id": "med_okacet_10",
    "name": "Okacet 10mg Tablet",
    "price": 22,
    "category": "Tablets",
    "icon": "/icons/tablets.png",
    "active": true
  }
];

const tempSqlFile = path.resolve('./seed-products.sql');
let sql = 'DELETE FROM products;
';
for (const p of products) {
  const id = p.id || p._id;
  const name = p.name.replace(/'/g, "''");
  const price = p.price;
  const category = (p.category || 'Tablets').replace(/'/g, "''");
  const icon = p.icon || '/icons/tablets.png';
  const now = new Date().toISOString();
  sql += ;
}

fs.writeFileSync(tempSqlFile, sql);
console.log('Generated seed-products.sql for top 10 medicines.');
console.log('Run: npx wrangler d1 execute medical-pos-db --local --file=./seed-products.sql');
