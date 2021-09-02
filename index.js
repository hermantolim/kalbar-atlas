const axios = require("axios");
const fs = require("fs");
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

function main() {
    const features = [];

    Object.keys(counties).map(async (id) => {
        const arg = {...api_arg};
        arg.county = counties[id].toLowerCase();
        const result = await axios.get(`${api_url}?${new URLSearchParams(arg)}`)
            .then(res => {
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
                fs.writeFile(
                    `data/${id}.geojson`,
                    JSON.stringify(data),
                    (err) => {
                        if(err) {
                          console.log(`=> [ERROR] ${id} ${err}`);
                        } else {
                          console.log(`=> [OK] ${id}`);
                        }
                    }
                );

                return data
            });

        features.push(result);
    });

    return fs.writeFile("counties.geojson", JSON.stringify({
        type: "FeatureCollection",
        features
    }), (err) => err
            ? console.error(`=> [ERROR] failed to write counties.geojson`)
            : console.log(`=> [OK] finish writing to counties.geojson`)
    );
}

main()