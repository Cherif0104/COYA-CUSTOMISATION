/**
 * GÃ©nÃ¨re le mÃ©ga-catalogue vÃ©hicule COYA.
 *
 * La liste mÃ©lange constructeurs actifs, marques historiques, divisions
 * commerciales, labels bus/camions et marques rÃ©gionales. Les petits acteurs
 * reÃ§oivent une gamme reprÃ©sentative par segment + finitions pour garder un
 * rÃ©fÃ©rentiel dense, utilisable sans API externe.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const SEED_BRANDS = `
Abarth,AC Cars,AC Schnitzer,Acura,Aiways,Aixam,Alfa Romeo,Alpina,Alpine,Alta,Alvis,AM General,
AMC,Apollo,Arcfox,Ariel,Arrival,Artega,Ashok Leyland,Asia Motors,Aston Martin,Audi,Aurus,Autobianchi,
Avatr,BAC,BAIC,Bajaj,Baojun,Bentley,Berliet,Bertone,Bestune,BharatBenz,Blue Bird,Bluecar,BMW,Bollinger,
Borgward,Bowler,BYD,Brabus,BrightDrop,Brilliance,Bristol,Bufori,Bugatti,Buick,Cadillac,Callaway,
Caterham,Changan,Changfeng,Chatenet,Chery,Chevrolet,Chrysler,CitroÃ«n,Corre La Licorne,Corvette,Cupra,
Dacia,Daewoo,DAF,Daihatsu,Daimler,Datsun,De Tomaso,Deepal,Delage,DeLorean,Denza,Detroit Electric,
Devin,DFM,DFSK,Dodge,Dongfeng,Donkervoort,DS Automobiles,Eagle,Ebro,Eicher,Elfin,ERF,Exeed,Facel Vega,
Faraday Future,FAW,Ferrari,Fiat,Fisker,Foden,Force Motors,Ford,Forthing,Foton,Freightliner,GAC,Gardner Douglas,
GAZ,Geely,Genesis,Geo,Ginetta,GMC,GMA,Gordon Murray Automotive,Great Wall,Hafei,Haima,Haval,Hennessey,
Higer,Hillman,Hino,Holden,Honda,Hongqi,Horch,Hudson,Hummer,Hyundai,IKCO,IM Motors,Ineos,Infiniti,Innocenti,
Intermeccanica,International Trucks,Isdera,Isuzu,Italdesign,Iveco,IVECO Bus,JAC,Jaguar,Jeep,Jensen,Jetour,
Jetta,JMC,Kamaz,Karma,Karry,Kenworth,Kia,King Long,Koenigsegg,KTM,Lada,Lagonda,Lamborghini,Lancia,Land Rover,
Landwind,LDV,Leapmotor,Lexus,Leyland,Li Auto,Lifan,Lightyear,Ligier,Lincoln,Lloyd,Lordstown,Lotus,Lucid,Lynk & Co,
Mahindra,MAN,Marcos,Marmon,Maruti Suzuki,Maserati,Maxus,Maybach,Mazda,McLaren,Mercedes-AMG,Mercedes-Benz,
Mercury,MG,Microcar,Mini,Mitsubishi,Mitsuoka,Morgan,Morris,Moskvitch,Nash,Neoplan,Nikola,NIO,Nissan,Noble,
Oldsmobile,Opel,ORA,Packard,Pagani,Panhard,Panoz,Peterbilt,Peugeot,Pierce-Arrow,Pininfarina,Plymouth,Polestar,
Pontiac,Porsche,Proton,Qoros,RAM,Renault,Renault Trucks,Rimac,Rising Auto,Rivian,Roewe,Rolls-Royce,RUF,Saab,
SAIC,Saturn,Scania,SEAT,Seres,Shelby,Simca,Sinotruk,Å koda,Skywell,Skyworth,Smart,Solaris,Soueast,Spyker,
SsangYong,SSC,Studebaker,Subaru,Sunbeam,Suzuki,SWM,Talbot,Tank,Tata,Tatra,Tesla,Think,Toyota,Triumph,TVR,UAZ,
UD Trucks,Vauxhall,Venturi,Venucia,VinFast,Volkswagen,Volvo,W Motors,Wanderer,Wartburg,Western Star,WM Motor,
Wuling,Xpeng,Yamaha,Yema,Yutong,Zastava,Zeekr,Zenos,Zhiji,Zhongtong,Zotye,ZX Auto,
Belgian Minerva,Imperia,Gillet,Van Hool,VDL Bus & Coach,Praga,Avia,Nova Bus,Prevost,New Flyer,Lion Electric,
Campagna,Magna Steyr,Steyr,Traton,Navistar,Rinspeed,Sbarro,Wiesmann,Gumpert,Melkus,YES!,Keating,Ultima,Radical,
Prodrive,Westfield,MG Rover,Rover,Austin,Morris Commercial,Wolseley,Riley,Standard,Vanden Plas,Singer,Humber,
Commer,Scammell,Leyland Trucks,Alexander Dennis,Optare,Perodua,Naza,Hindustan Motors,Premier,Reva,Atul Auto,
Hero MotoCorp,TVS Motors,Royal Enfield,CFMoto,QJMotor,Zongshen,Loncin,Dayun,Shacman,Beiben,CAMC,Jinbei,
Golden Dragon,Ankai,Sunlong,Youngman,Nanjing Automobile,Wey,Hozon,Neta,Aion,Hyper,Geometry,Farizon,Maple,Livan,
Enovate,HiPhi,Human Horizons,Voyah,Luxeed,Aito,Besturn,Senova,Bisu,BAW,Fangchengbao,Yangwang,Denway,Changhe,
KG Mobility,Tata Daewoo,GM Korea,Renault Korea,Proto Motors,Oullim Motors,Spirra,CT&T,Kandi,GAC Trumpchi,
Singulato,Byton,Qiantu,Techrules,Weltmeister,Dearcc,Sitech,Leopaard,Hawtai,Zinoro,Huanghai,Gonow,Foday,Kawei,
Kingstar,Polestones,Rox,Acadian,Beaumont,Bricklin,McLaughlin,Monarch,Meteor,Fargo Canada,Frontenac,Asuna,
Passport,Quebec Manic,HTT Plethore,Felino,Canoo,Aptera,Zoox,Workhorse,Rezvani,Saleen,Vector Motors,Mosler,
Local Motors,Rossion,Vanderhall,Polaris Slingshot,Indian Motorcycle,Zero Motorcycles,Harley-Davidson,Mack Trucks,
Thomas Built Buses,IC Bus,Spartan Motors,Autocar Trucks,ElDorado National,Motor Coach Industries
`;

const CORE_MODELS = {
  Toyota: ['Corolla', 'Camry', 'RAV4', 'Yaris', 'Hilux', 'Land Cruiser', 'Prius', 'Highlander', 'Proace', 'C-HR', 'Tacoma', 'Tundra', 'Sienna'],
  Volkswagen: ['Golf', 'Passat', 'Polo', 'Tiguan', 'Touran', 'Transporter', 'Caddy', 'ID.3', 'ID.4', 'Touareg', 'Arteon', 'Crafter', 'Amarok'],
  Renault: ['Clio', 'Megane', 'Captur', 'Kadjar', 'Scenic', 'Kangoo', 'Master', 'Trafic', 'Zoe', 'Austral', 'Espace', 'Twingo', 'Rafale'],
  Peugeot: ['208', '308', '3008', '5008', 'Partner', 'Expert', 'Boxer', '2008', '508', 'Rifter', '408', 'Traveller', 'e-208'],
  'Mercedes-Benz': ['Classe A', 'Classe C', 'Classe E', 'GLC', 'GLE', 'Sprinter', 'Vito', 'EQC', 'EQE', 'Classe S', 'GLA', 'CLA', 'EQS'],
  BMW: ['SÃ©rie 1', 'SÃ©rie 3', 'SÃ©rie 5', 'X1', 'X3', 'X5', 'i3', 'i4', 'iX', 'SÃ©rie 7', 'X6', 'X7', 'i5'],
  Ford: ['Fiesta', 'Focus', 'Mondeo', 'Kuga', 'Puma', 'Transit', 'Transit Custom', 'Mustang Mach-E', 'F-150', 'Explorer', 'Ranger', 'Bronco', 'Edge'],
  Hyundai: ['i10', 'i20', 'i30', 'Tucson', 'Santa Fe', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'Kona', 'Elantra', 'Sonata', 'Palisade', 'Staria'],
  Kia: ['Picanto', 'Rio', 'Ceed', 'Sportage', 'Sorento', 'EV6', 'EV9', 'Niro', 'Stonic', 'Telluride', 'K5', 'Carnival', 'Soul'],
  BYD: ['Atto 3', 'Seal', 'Tang', 'Han', 'Dolphin', 'Song Plus', 'Qin Plus', 'Yuan Plus', 'Seagull', 'e6', 'Destroyer 05', 'Fang Cheng Bao 5', 'Yangwang U8'],
  Tesla: ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck', 'Roadster', 'Semi', 'Model 2', 'Model Q', 'Robovan', 'Plaid', 'Long Range', 'Performance'],
};

const trimSuffixes = ['Base', 'Business', 'Confort', 'Executive'];
const segmentNames = [
  'City', 'Compact', 'Sedan', 'Wagon', 'Crossover', 'SUV', 'Grand SUV',
  'Pickup', 'Van', 'Minibus', 'Cargo', 'Electric', 'Hybrid',
];

function uniqSorted(values) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'fr', { sensitivity: 'base' }),
  );
}

function modelsForBrand(brand) {
  const names = [];
  (CORE_MODELS[brand] || []).forEach((name) => {
    trimSuffixes.forEach((trim) => names.push(`${name} ${trim}`));
  });
  segmentNames.forEach((segment) => {
    trimSuffixes.forEach((trim) => names.push(`${segment} ${trim}`));
  });
  return Array.from(new Set(names)).slice(0, 56);
}

const brands = uniqSorted(SEED_BRANDS.split(','));
const rows = brands.flatMap((brand) =>
  modelsForBrand(brand).map((name, index) => ({
    brand,
    name,
    year_from: index % 9 === 0 ? 2010 : index % 5 === 0 ? 2020 : 2015,
    year_to: index % 31 === 0 ? 2024 : null,
  })),
);

const dataDir = path.join(root, 'data');
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'vehicle-catalog-brands.json'), JSON.stringify(brands, null, 2));
fs.writeFileSync(path.join(dataDir, 'vehicle-catalog-models.json'), JSON.stringify(rows, null, 2));
console.log('Wrote', brands.length, 'brands and', rows.length, 'models to', dataDir);
