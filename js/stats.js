am5.ready(() => {
  const API_URL = 'http://54.169.75.250:8000/stats';
  const MAPBOX_ACCESS_KEY =
    'pk.eyJ1IjoiYW1nMjIwNzUiLCJhIjoiY2swajRlMno5MDZjMjNvbTF2MnRpNmd1biJ9.ADtpGBcPTJhWfSn2vWk07w';
  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const COUNTRY_MAP = {
    'United States of America': 'United States',
    "People's Republic of China": 'China',
    'Vatican City': 'Holy See (Vatican City State)',
  };

  let map = null;

  const setDate = () => {
    const date = new Date();
    const year = date.getFullYear();

    document.getElementById('date').innerHTML = `${
      MONTHS[date.getMonth()]
    } ${date.getDate()}, ${year}`;
  };

  const fetchStats = async () => {
    try {
      const {
        profile_count,
        upcoming_profile_count,
        profile_count_in_sectors,
        vector_dimensionality,
        total_vector_points,
        profile_count_in_countries,
      } = await fetch(API_URL).then((res) => res.json());

      const profileData = [
        { category: 'profile_count', value: profile_count },
        {
          category: 'upcoming_profile_count',
          value: upcoming_profile_count,
        },
      ];
      const sectorsData = profile_count_in_sectors.x.map((sector, i) => ({
        category: sector,
        value: profile_count_in_sectors.y[i],
      }));

      createChart('profileCount', profileData);
      createChart('sectors', sectorsData);

      document.getElementById('vector-dimensionality').innerHTML =
        vector_dimensionality.toLocaleString();
      document.getElementById('total-vector-points').innerHTML =
        total_vector_points.toLocaleString();

      const { ref_country_codes } = await getCountriesLatLong();

      const features = [];

      profile_count_in_countries.x.forEach((country, i) => {
        let finalCountry = country;

        if (
          [
            'United States of America',
            "People's republic of China",
            'Vatican City',
          ].includes(finalCountry)
        ) {
          finalCountry = COUNTRY_MAP[country];
        }

        const data = ref_country_codes.find(
          (coord) => coord.country === finalCountry
        );

        if (data) {
          const count = profile_count_in_countries.y[i];

          const arrayOfFeatures = Array.from({ length: count }, (_, i) => ({
            id: `${country}-${i}`,
            type: 'feature',
            geometry: {
              coordinates: [data.longitude, data.latitude],
              type: 'Point',
            },
          }));

          features.push(...arrayOfFeatures);
        }
      });

      renderDealsMap('map-container', { type: 'FeatureCollection', features });
    } catch (err) {
      console.log('Error occurred while fetching stats:', err.message);
    }
  };

  const createChart = (id = '', data = []) => {
    const root = am5.Root.new(id);

    const responsive = am5themes_Responsive.new(root);

    responsive.addRule({
      relevant: am5themes_Responsive.widthL,
      applying: function () {
        series.slices.template.set('tooltipText', '{category}: {value}');
      },
      removing: function () {
        series.slices.template.set('tooltipText', '');
      },
    });

    root.setThemes([am5themes_Animated.new(root), responsive]);

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        radius: am5.percent(70),
      })
    );

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: 'value',
        categoryField: 'category',
      })
    );

    series.states.create('hidden', {
      endAngle: -90,
    });

    series.data.setAll(data);

    series.labels.template.setAll({
      fontSize: 14,
      fill: am5.color(0x9ca3af),
      text: '{category}\n[bold fontSize: 16px]{value}[/]',
      oversizedBehavior: 'wrap',
      maxWidth: 170,
    });

    series.slices.template.set('tooltipText', '');

    series.ticks.template.setAll({
      location: 0.5,
    });
  };

  const getCountriesLatLong = async () => {
    return fetch('http://127.0.0.1:8080/js/countries-lat-long.json').then(
      (res) => res.json()
    );
  };

  const renderDealsMap = (containerId, data) => {
    if (map) {
      map.remove();
    }

    map = new mapboxgl.Map({
      container: containerId,
      accessToken: MAPBOX_ACCESS_KEY,
      style: 'mapbox://styles/amg22075/ck1acsvj00ore1clvyw66eqqe',
      center: [11, 38],
      renderWorldCopies: false,
      zoom: 0,
      maxZoom: 16,
      minZoom: 0,
      pitch: 0,
      bearing: 0,
      tolerance: 0,
      attributionControl: false,
      localIdeographFontFamily: "'Noto Sans', 'Noto Sans CJK SC', sans-serif",
    });

    map.keyboard.disable();
    map.dragRotate.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disableRotation();

    map.on('load', () => {
      map.addSource('Source', {
        type: 'geojson',
        data,
        cluster: true,
        clusterRadius: 5,
        attribution: '<a>© Lombard Standard</a>',
      });

      map.addLayer({
        id: 'Cluster',
        type: 'circle',
        source: 'Source',
        filter: ['has', 'point_count'],
        layout: {
          visibility: 'visible',
        },
        paint: {
          'circle-pitch-alignment': 'map',
          'circle-pitch-scale': 'map',
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#111827',
            10,
            '#111827',
            30,
            '#111827',
          ],
          'circle-blur': 0,
          'circle-radius': 20,
          'circle-opacity': 1,
          'circle-stroke-width': 0,
          'circle-stroke-opacity': 1,
          'circle-stroke-color': '#111827',
        },
      });

      map.addLayer({
        id: 'Cluster_count',
        type: 'symbol',
        source: 'Source',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Roboto Mono Bold'],
          'text-size': 16,
          'text-offset': [0, 0],
        },
        paint: { 'text-color': '#ffffff' },
      });

      map.addLayer({
        id: 'unCluster_count',
        type: 'circle',
        source: 'Source',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#111827',
          'circle-radius': 6,
        },
      });
    });
  };

  setDate();
  fetchStats();
});
