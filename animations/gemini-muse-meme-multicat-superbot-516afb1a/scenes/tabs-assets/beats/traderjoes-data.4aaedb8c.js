// Real Trader Joe's data for the `traderjoes` ad variant. Sourced from traderjoes.com on 2026-10-15
// (product titles, sizes, prices, product-page URLs and Nutrition Facts panels read from the site's own
// search/PDP data; thumbnails are the site's primary product images).
// Store context: no store chosen; the site was in its national default catalog (storeCode "TJ") and its
// header showed "My Store: Littleton" (auto-assigned). Prices are as listed there; they vary by store.
// protein = grams per whole package = servings per container x protein per serving (Nutrition Facts panel);
// null = the site lists no nutrition panel for that item (fresh produce, frozen brown rice, potatoes).
// qty = packages to buy for 7 days. PROTEIN_PER_DAY assumes each package is eaten within the week and counts
// only items with a listed panel, so it is a floor, not an estimate padded with guesses.
export const STORE = 'https://www.traderjoes.com/home/products';
export const LOGO = 'traderjoes.4aaedb8c/traderjoes-logo.svg';
export const RED = '#C81E24'; // fill of the path in traderjoes.com/content/dam/trjo/pictures/logo.svg
export const GROUPS = [
  {
    "name": "Protein",
    "items": [
      {
        "name": "Sliced Rotisserie Seasoned Chicken Breast",
        "size": "7 oz",
        "qty": 3,
        "price": 4.99,
        "img": "traderjoes.4aaedb8c/p-sliced-rotisserie-seasoned-chicken-breast.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/sliced-rotisserie-seasoned-chicken-breast-083847",
        "protein": 42
      },
      {
        "name": "Pasture Raised Large Brown Eggs",
        "size": "1 doz",
        "qty": 1,
        "price": 5.99,
        "img": "traderjoes.4aaedb8c/p-pasture-raised-large-brown-eggs.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/pasture-raised-large-brown-eggs-062124",
        "protein": 72
      },
      {
        "name": "Greek Nonfat Yogurt Plain",
        "size": "32 oz",
        "qty": 2,
        "price": 5.49,
        "img": "traderjoes.4aaedb8c/p-greek-nonfat-yogurt-plain.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/greek-nonfat-yogurt-plain-095732",
        "protein": 85
      },
      {
        "name": "Small Curd Cottage Cheese",
        "size": "32 oz",
        "qty": 1,
        "price": 4.49,
        "img": "traderjoes.4aaedb8c/p-small-curd-cottage-cheese.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/small-curd-cottage-cheese-042890",
        "protein": 96
      },
      {
        "name": "Solid White Albacore Tuna, Salt Added",
        "size": "5 oz",
        "qty": 4,
        "price": 1.99,
        "img": "traderjoes.4aaedb8c/p-albacore-tuna.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/solid-white-albacore-tuna-salt-added-099285",
        "protein": 29
      },
      {
        "name": "Shelled Edamame with Sea Salt",
        "size": "9 oz",
        "qty": 1,
        "price": 3.99,
        "img": "traderjoes.4aaedb8c/p-shelled-edamame-with-sea-salt.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/shelled-edamame-with-sea-salt-068709",
        "protein": 27
      }
    ]
  },
  {
    "name": "Carbs",
    "items": [
      {
        "name": "Oven Toasted Old Fashioned Organic Oats",
        "size": "18 oz",
        "qty": 1,
        "price": 2.99,
        "img": "traderjoes.4aaedb8c/p-organic-rolled-oats.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/oven-toasted-old-fashioned-organic-oats-004856",
        "protein": 72
      },
      {
        "name": "Brown Rice",
        "size": "30 oz",
        "qty": 1,
        "price": 3.99,
        "img": "traderjoes.4aaedb8c/p-brown-rice.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/brown-rice-093756",
        "protein": null
      },
      {
        "name": "Sprouted Wheat Multigrain Bread",
        "size": "24 oz",
        "qty": 1,
        "price": 4.49,
        "img": "traderjoes.4aaedb8c/p-sprouted-wheat-multigrain-bread.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/sprouted-wheat-multigrain-bread-037066",
        "protein": 100
      },
      {
        "name": "Russet Potatoes",
        "size": "1 each",
        "qty": 4,
        "price": 0.99,
        "img": "traderjoes.4aaedb8c/p-russet-potatoes.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/russet-potatoes-099095",
        "protein": null
      },
      {
        "name": "Chickpea Fusilli Pasta",
        "size": "12 oz",
        "qty": 1,
        "price": 2.99,
        "img": "traderjoes.4aaedb8c/p-chickpea-fusilli-pasta.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/chickpea-fusilli-pasta-078268",
        "protein": 66
      }
    ]
  },
  {
    "name": "Fruit",
    "items": [
      {
        "name": "Bananas",
        "size": "1 each",
        "qty": 7,
        "price": 0.23,
        "img": "traderjoes.4aaedb8c/p-bananas.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/bananas-048053",
        "protein": null
      },
      {
        "name": "Honeycrisp Apples",
        "size": "1 each",
        "qty": 5,
        "price": 1.49,
        "img": "traderjoes.4aaedb8c/p-honeycrisp-apples.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/honeycrisp-apples-093872",
        "protein": null
      },
      {
        "name": "Organic Wild Blueberries",
        "size": "12 oz",
        "qty": 1,
        "price": 3.99,
        "img": "traderjoes.4aaedb8c/p-organic-wild-blueberries.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/organic-wild-blueberries-016141",
        "protein": 0
      },
      {
        "name": "Strawberries 1 Lb",
        "size": "16 oz",
        "qty": 1,
        "price": 3.99,
        "img": "traderjoes.4aaedb8c/p-strawberries-1-lb.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/strawberries-1-lb-035878",
        "protein": null
      }
    ]
  },
  {
    "name": "Veggies",
    "items": [
      {
        "name": "Ready Veggies",
        "size": "12 oz",
        "qty": 2,
        "price": 2.99,
        "img": "traderjoes.4aaedb8c/p-ready-veggies.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/ready-veggies-073199",
        "protein": 8
      },
      {
        "name": "Stir Fry Veggie Blend",
        "size": "16 oz",
        "qty": 2,
        "price": 3.49,
        "img": "traderjoes.4aaedb8c/p-stir-fry-veggie-blend.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/stir-fry-veggie-blend-077922",
        "protein": 10
      },
      {
        "name": "Persian Cucumbers",
        "size": "1 lb",
        "qty": 1,
        "price": 2.49,
        "img": "traderjoes.4aaedb8c/p-persian-cucumbers.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/persian-cucumbers-070625",
        "protein": null
      },
      {
        "name": "Super Sweet Fresh Corn",
        "size": "20 oz",
        "qty": 1,
        "price": 4.49,
        "img": "traderjoes.4aaedb8c/p-super-sweet-fresh-corn.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/super-sweet-fresh-corn-009286",
        "protein": 20
      }
    ]
  },
  {
    "name": "Fuel & recovery",
    "items": [
      {
        "name": "Peanut Butter Creamy Salted",
        "size": "16 oz",
        "qty": 1,
        "price": 2.49,
        "img": "traderjoes.4aaedb8c/p-peanut-butter-creamy-salted.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/peanut-butter-creamy-salted-011999",
        "protein": 112
      },
      {
        "name": "Chocolate Milk made with Fair Trade Cocoa",
        "size": "64 fl oz",
        "qty": 1,
        "price": 4.99,
        "img": "traderjoes.4aaedb8c/p-chocolate-milk.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/chocolate-milk-made-with-fair-trade-cocoa-061673",
        "protein": 64
      },
      {
        "name": "Organic Hummus",
        "size": "8 oz",
        "qty": 1,
        "price": 2.99,
        "img": "traderjoes.4aaedb8c/p-organic-hummus.jpg",
        "url": "https://www.traderjoes.com/home/products/pdp/organic-hummus-059248",
        "protein": 16
      }
    ]
  }
];
export const TOTAL = 114.25;
export const COUNT = 22;
export const PROTEIN_PER_DAY = 156;
