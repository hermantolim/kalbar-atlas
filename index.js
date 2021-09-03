const axios = require("axios");
const fs = require("fs");
const randUserAgent = require("random-useragent");
const api_url = "https://nominatim.openstreetmap.org/search";
const api_arg = {
    polygon_geojson: 1,
    limit: 1,
    format: "geojson",
    state: "kalimantan barat",
    country: "id",
    namedetails: 1
};

const counties = {
    6101: "Kabupaten Sambas",
    6102: "Kabupaten Mempawah",
    6103: "Kabupaten Sanggau",
    6104: "Kabupaten Ketapang",
    6105: "Kabupaten Sintang",
    6106: "Kabupaten Kapuas Hulu",
    6107: "Kabupaten Bengkayang",
    6108: "Kabupaten Landak",
    6109: "Kabupaten Sekadau",
    6110: "Kabupaten Melawi",
    6111: "Kabupaten Kayong Utara",
    6112: "Kabupaten Kubu Raya",
    6171: "Kota Pontianak",
    6172: "Kota Singkawang"
};

const features = [];

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sleep(ms, fn, ...args) {
    await timeout(ms);
    return fn(...args);
}

async function processRequest(id) {
    const arg = {...api_arg};
    arg.county = counties[id].toLowerCase();
    return await axios.get(`${api_url}?${new URLSearchParams(arg)}`, {
        headers: {
            "Accept": "application/json",
            "User-Agent": randUserAgent.getRandom()
        }
    }).then(async res => {
        const {type, bbox, geometry, properties } = res.data.features[0];
        const data = {
            type,
            id: Number(id),
            bbox,
            properties: {
              name: properties.namedetails.official_name
            },
            geometry
        };

        await fs.writeFile(
            `data/${id}.geojson`,
            JSON.stringify(data),
            (e) => {
                if (e) {
                    console.error(`=> [ERROR] failed to process (${id}) ${counties[id]}`);
                } else {
                    console.log(`=> [OK] (${id}) ${counties[id]}`);
                }
            }
        );

        return data;
    })
    .catch(e => console.error(`=> [ERROR] request error (${id}) ${counties[id]}`));
}

async function main() {
    const interval = 2000;
    const actions = Object.keys(counties).map((id, index) => {
        return sleep(interval * index, processRequest, id);
    });

    const features = await Promise.all(actions);
    return sleep(interval, (features) => {
        return fs.writeFile(
            "data/counties.geojson",
            JSON.stringify({
                type: "FeatureCollection",
                features
            }),
            (e) => {
                if (e) {
                    console.error(`=> [ERROR] failed to write counties.geojson`);
                } else {
                    console.log(`=> [OK] finish writing to counties.geojson`);
                }
            }
        );
    }, features);
}

function run() {
    main().then(() => {}).catch(console.error);
}

run();