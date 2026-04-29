"""
Synthetic E-Commerce Intelligence Dataset Generator
Outputs: providers.csv, shops.csv, customers.csv, products.csv,
         orders.csv, order_items.csv, carts.csv
"""

import csv, random, math, os
from datetime import datetime, timedelta

random.seed(42)
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── helpers ────────────────────────────────────────────────────────────────────
def maybe_null(value, rate=0.05):
    """Inject NULL at ~rate probability."""
    return "" if random.random() < rate else value

def rand_date(start_days_ago=730, end_days_ago=0):
    base = datetime(2026, 4, 29)
    delta = random.randint(end_days_ago, start_days_ago)
    return (base - timedelta(days=delta)).strftime("%Y-%m-%d")

def write_csv(filename, rows, header):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)
    print(f"  ✔ {filename}  ({len(rows)} rows)")

# ── admin-level config ─────────────────────────────────────────────────────────
ADMIN_CONFIG = {
    "loyalty_coefficient": 0.03,
    "global_discount_factor": 0.08,
    "conversion_threshold": 0.35,
    "promotion_sensitivity": 0.65,
}

# ── 1. providers ───────────────────────────────────────────────────────────────
CATEGORIES = ["Electronics", "Clothing", "Home & Garden", "Sports", "Beauty",
               "Toys", "Books", "Automotive", "Food & Grocery", "Health"]

STRATEGY_MAP = ["Aggressive", "Moderate", "Conservative"]

providers_rows = []
provider_meta = {}  # provider_id → strategy, max_discount
NUM_PROVIDERS = 15

for i in range(1, NUM_PROVIDERS + 1):
    pid = f"PRV{i:03d}"
    strategy = random.choice(STRATEGY_MAP)
    max_discount = round(random.uniform(0.05, 0.35), 2)
    promotion_budget = round(random.uniform(5000, 50000), 2)
    provider_meta[pid] = {"strategy": strategy, "max_discount": max_discount}
    names = [
        "TechHub", "StyleWorld", "HomeBase", "SportPro", "GlowUp",
        "FunZone", "BookNook", "AutoGear", "FreshMart", "WellCare",
        "MegaDeal", "ValueStore", "PrimePick", "BrightShop", "FastCart"
    ]
    providers_rows.append([
        pid,
        names[i - 1],
        f"contact@{names[i-1].lower().replace(' ','')}.com",
        random.choice(["Tunisia", "France", "Germany", "UAE", "USA"]),
        strategy,
        max_discount,
        promotion_budget,
        maybe_null(round(random.uniform(3.5, 5.0), 1)),   # rating
        rand_date(1800, 365),                               # contract_start
        maybe_null(round(random.uniform(0.8, 1.0), 2)),    # reliability_score
    ])

PROV_HEADER = ["provider_id","name","email","country","campaign_strategy",
               "max_discount","promotion_budget","rating",
               "contract_start","reliability_score"]

# ── 2. shops ───────────────────────────────────────────────────────────────────
shops_rows = []
shop_meta = {}  # shop_id → {provider_id, category, avg_price_factor}
NUM_SHOPS = 40
shop_names_pool = [
    "AlphaStore","BetaMart","GammaBay","DeltaShop","EpsilonZone",
    "ZetaHub","EtaPlace","ThetaCorner","IotaMall","KappaWorld",
    "LambdaPick","MuDeal","NuExpress","XiChoice","OmicronPrime",
    "PiCommerce","RhoStore","SigmaSelect","TauBest","UpsilonBuy",
    "PhiShop","ChiMart","PsiZone","OmegaHub","AlphaPlus",
    "BetaPrime","GammaFresh","DeltaElite","EpsilonTop","ZetaPro",
    "EtaGold","ThetaSilver","IotaBronze","KappaFlex","LambdaQuick",
    "MuSmart","NuFast","XiBright","OmicronEco","PiValue"
]

category_price_avg = {}  # cat → list of base prices (filled during products)

for i in range(1, NUM_SHOPS + 1):
    sid = f"SHP{i:03d}"
    prov = providers_rows[(i - 1) % NUM_PROVIDERS][0]
    cat  = CATEGORIES[(i - 1) % len(CATEGORIES)]
    price_factor = round(random.uniform(0.85, 1.20), 3)
    shop_meta[sid] = {"provider_id": prov, "category": cat,
                      "price_factor": price_factor}
    shops_rows.append([
        sid,
        shop_names_pool[i - 1],
        prov,
        cat,
        round(random.uniform(3.0, 5.0), 1),              # shop_rating
        random.randint(50, 500),                          # num_employees
        rand_date(1500, 100),                             # opened_date
        maybe_null(round(random.uniform(0.6, 0.99), 2)), # performance_index_raw
        random.choice(["Active", "Active", "Inactive"]), # status
        round(random.uniform(500, 20000), 2),             # monthly_revenue_est
    ])

SHOP_HEADER = ["shop_id","name","provider_id","category","shop_rating",
               "num_employees","opened_date","performance_index_raw",
               "status","monthly_revenue_est"]

# ── 3. customers ───────────────────────────────────────────────────────────────
FIRST_NAMES = ["Ahmed","Sara","Mohamed","Leila","Omar","Yasmine","Ali","Nour",
               "Karim","Rania","Sami","Hana","Tarek","Maya","Rami","Dina",
               "Fares","Ines","Bilel","Sonia","Lucas","Emma","Noah","Olivia",
               "Liam","Ava","James","Isabella","Logan","Sophia"]
LAST_NAMES  = ["Ben Ali","Trabelsi","Hamdi","Chaari","Gharbi","Miled","Sassi",
               "Dridi","Jomaa","Ferchichi","Martin","Dubois","Bernard","Thomas",
               "Smith","Johnson","Williams","Brown","Jones","Garcia"]

customers_rows = []
customer_meta  = {}
NUM_CUSTOMERS  = 400

for i in range(1, NUM_CUSTOMERS + 1):
    cid  = f"CUS{i:04d}"
    fn   = random.choice(FIRST_NAMES)
    ln   = random.choice(LAST_NAMES)
    join = rand_date(900, 30)
    lc   = ADMIN_CONFIG["loyalty_coefficient"]
    pts  = random.randint(0, 5000)
    disc = round(min(pts * lc, 0.20), 4)
    seg  = random.choices(
        ["Gold","Silver","Bronze","New"],
        weights=[10, 20, 35, 35]
    )[0]
    customer_meta[cid] = {"loyalty_points": pts, "loyalty_discount": disc,
                          "segment": seg}
    customers_rows.append([
        cid,
        fn, ln,
        maybe_null(f"{fn.lower()}.{ln.lower().replace(' ','_')}@mail.com"),
        maybe_null(f"+216{random.randint(20000000,99999999)}"),
        random.choice(["Tunisia","France","Germany","UAE","USA"]),
        join,
        pts,
        disc,
        seg,
        maybe_null(round(random.uniform(0, 1), 2)),  # churn_risk
        random.choice(["Active","Active","Active","Inactive"]),
    ])

CUST_HEADER = ["customer_id","first_name","last_name","email","phone",
               "country","join_date","loyalty_points","loyalty_discount",
               "segment","churn_risk","status"]

# ── 4. products ────────────────────────────────────────────────────────────────
PRODUCT_POOL = {
    "Electronics":   ["Laptop","Smartphone","Tablet","Headphones","Smartwatch",
                      "Camera","Speaker","Monitor","Keyboard","Mouse"],
    "Clothing":      ["T-Shirt","Jeans","Jacket","Sneakers","Dress",
                      "Hoodie","Scarf","Boots","Shorts","Socks"],
    "Home & Garden": ["Sofa","Lamp","Curtains","Pillow","Rug",
                      "Plant Pot","Mirror","Shelf","Candle","Mattress"],
    "Sports":        ["Yoga Mat","Dumbbell","Running Shoes","Bicycle","Helmet",
                      "Tennis Racket","Football","Swim Goggles","Backpack","Gloves"],
    "Beauty":        ["Serum","Moisturizer","Foundation","Lipstick","Mascara",
                      "Perfume","Shampoo","Conditioner","Sunscreen","Eye Cream"],
    "Toys":          ["LEGO Set","Remote Car","Puzzle","Doll","Board Game",
                      "Action Figure","Stuffed Animal","Bicycle","Kite","Slime Kit"],
    "Books":         ["Novel","Textbook","Comic","Biography","Cook Book",
                      "Self-Help","History","Science","Fantasy","Thriller"],
    "Automotive":    ["Car Cover","Floor Mat","Seat Cushion","Dash Cam","Air Freshener",
                      "Jump Starter","Tire Gauge","Wiper Blades","Phone Mount","LED Lights"],
    "Food & Grocery":["Olive Oil","Coffee","Tea","Honey","Nuts Mix",
                      "Protein Bar","Oats","Pasta","Rice","Spices Set"],
    "Health":        ["Vitamin C","Omega-3","Protein Powder","First Aid Kit","Blood Pressure Monitor",
                      "Thermometer","Hand Sanitizer","Face Mask","Pain Relief","Probiotic"],
}

BASE_PRICES = {
    "Electronics": (80, 1200), "Clothing": (15, 150), "Home & Garden": (20, 600),
    "Sports": (10, 400), "Beauty": (8, 120), "Toys": (5, 100),
    "Books": (5, 50), "Automotive": (10, 200), "Food & Grocery": (2, 40),
    "Health": (5, 80),
}

products_rows = []
product_meta  = {}
NUM_PRODUCTS  = 300

cat_prices = {c: [] for c in CATEGORIES}  # for price_competitiveness_score

shop_ids = [f"SHP{i:03d}" for i in range(1, NUM_SHOPS + 1)]

for i in range(1, NUM_PRODUCTS + 1):
    pid   = f"PRD{i:04d}"
    sid   = random.choice(shop_ids)
    cat   = shop_meta[sid]["category"]
    lo, hi = BASE_PRICES[cat]
    pf    = shop_meta[sid]["price_factor"]
    cost  = round(random.uniform(lo * 0.4, hi * 0.6), 2)
    price = round(cost * random.uniform(1.3, 2.5) * pf, 2)
    stock = random.randint(0, 500)
    qty_sold = random.randint(0, 300)
    demand = round(random.uniform(0, 1), 4)
    rr     = round(random.uniform(0, 0.25), 4)
    promo  = random.choice([0.0, 0.05, 0.10, 0.15, 0.20])
    eff    = round(demand * (1 + promo * ADMIN_CONFIG["promotion_sensitivity"]), 4)
    profit = round((price - cost) * qty_sold, 2)
    # promotion_suggestion label
    high_price_flag = False  # will update after computing cat avg
    promo_suggest = "NO"  # placeholder; recalculate below

    cat_prices[cat].append(price)
    pname = random.choice(PRODUCT_POOL[cat])

    product_meta[pid] = {
        "shop_id": sid, "category": cat, "unit_price": price,
        "cost_price": cost, "qty_sold": qty_sold, "stock": stock,
        "demand_score": demand, "return_rate": rr,
        "promo_discount": promo, "profit": profit,
    }
    products_rows.append([
        pid, pname, sid, shop_meta[sid]["provider_id"], cat,
        maybe_null(cost), price,
        maybe_null(stock, 0.03),
        qty_sold,
        maybe_null(promo, 0.04),
        profit,
        demand,
        0.0,        # price_competitiveness_score placeholder
        rr,
        0.0,        # shop_performance_index placeholder
        round(random.uniform(0, 1), 4),  # loyalty_impact_score
        eff,
        "NO",       # promotion_suggestion placeholder
        rand_date(500, 1),
        random.choice(["Active","Active","Active","Discontinued","Out of Stock"]),
    ])

# Second pass: compute price_competitiveness_score & promotion_suggestion
cat_avg = {c: (sum(v)/len(v) if v else 50) for c, v in cat_prices.items()}

# shop_performance_index: avg demand of shop's products
shop_demands = {sid: [] for sid in shop_ids}
for meta in product_meta.values():
    shop_demands[meta["shop_id"]].append(meta["demand_score"])
shop_perf = {sid: round(sum(v)/len(v), 4) if v else 0.5
             for sid, v in shop_demands.items()}

for row in products_rows:
    pid   = row[0]
    cat   = row[4]
    price = row[6]
    meta  = product_meta[pid]
    comp  = round(cat_avg[cat] / price if price > 0 else 1.0, 4)
    perf  = shop_perf[meta["shop_id"]]
    row[12] = comp
    row[14]  = perf
    # promotion_suggestion
    low_sales   = meta["qty_sold"] < 50
    high_stock  = meta["stock"] > 200
    high_price  = comp < 0.85
    low_demand  = meta["demand_score"] < 0.35
    high_return = meta["return_rate"] > 0.15
    suggest = "YES" if (low_sales and high_stock) or high_price or low_demand or high_return else "NO"
    row[17] = suggest

PROD_HEADER = ["product_id","name","shop_id","provider_id","category",
               "cost_price","unit_price","stock","quantity_sold",
               "promo_discount","profit","demand_score",
               "price_competitiveness_score","return_rate",
               "shop_performance_index","loyalty_impact_score",
               "promotion_effectiveness_score","promotion_suggestion",
               "listed_date","status"]

# ── 5. orders ──────────────────────────────────────────────────────────────────
STATUS_CHOICES = ["Delivered","Delivered","Delivered","Shipped","Processing",
                  "Cancelled","Returned","Delivered","Delivered","Processing"]
PAYMENT_METHODS = ["Credit Card","PayPal","Bank Transfer","Cash on Delivery","Wallet"]

orders_rows = []
order_meta  = {}
NUM_ORDERS  = 2000
customer_ids = [f"CUS{i:04d}" for i in range(1, NUM_CUSTOMERS + 1)]

for i in range(1, NUM_ORDERS + 1):
    oid  = f"ORD{i:05d}"
    cid  = random.choice(customer_ids)
    sid  = random.choice(shop_ids)
    odate = rand_date(365, 0)
    status = random.choice(STATUS_CHOICES)
    # inject occasional wrong status
    if random.random() < 0.02:
        status = random.choice(["Unknown","Pending","Undefined"])
    ldisc = customer_meta[cid]["loyalty_discount"]
    gdisc = ADMIN_CONFIG["global_discount_factor"]
    disc  = round((ldisc + gdisc) * random.uniform(0.5, 1.0), 4)
    total = round(random.uniform(20, 2000), 2)
    after_disc = round(total * (1 - disc), 2)
    order_meta[oid] = {"customer_id": cid, "shop_id": sid,
                       "total": total, "status": status}
    orders_rows.append([
        oid, cid, sid,
        maybe_null(odate, 0.02),
        status,
        random.choice(PAYMENT_METHODS),
        total,
        disc,
        after_disc,
        maybe_null(rand_date(365, 0), 0.10),  # delivery_date
        round(random.uniform(0.9, 5.0), 1),    # customer_rating
        maybe_null(random.choice(["", "Fast delivery!", "Great product",
                                  "Not as expected", "Would buy again",
                                  "Damaged package"]), 0.40),
    ])

# Add ~30 duplicate rows (noise)
dup_sources = random.choices(orders_rows, k=30)
for dr in dup_sources:
    orders_rows.append(list(dr))

ORD_HEADER = ["order_id","customer_id","shop_id","order_date","status",
              "payment_method","total_amount","discount_applied",
              "final_amount","delivery_date","customer_rating","review_text"]

# ── 6. order_items ─────────────────────────────────────────────────────────────
product_ids = [f"PRD{i:04d}" for i in range(1, NUM_PRODUCTS + 1)]
order_ids   = [f"ORD{i:05d}" for i in range(1, NUM_ORDERS + 1)]

order_items_rows = []
item_id = 1
for oid in order_ids:
    n_items = random.randint(1, 5)
    for _ in range(n_items):
        itid  = f"ITM{item_id:06d}"
        pid   = random.choice(product_ids)
        pmeta = product_meta[pid]
        qty   = random.randint(1, 6)
        up    = pmeta["unit_price"]
        # slight price noise
        if random.random() < 0.04:
            up = round(up * random.uniform(0.92, 1.08), 2)
        disc  = pmeta["promo_discount"]
        line  = round(up * qty * (1 - disc), 2)
        order_items_rows.append([
            itid, oid, pid,
            maybe_null(qty, 0.02),
            maybe_null(up, 0.03),
            disc,
            line,
            random.choice(["None","None","None","Returned","Exchanged"]),
        ])
        item_id += 1

ITEM_HEADER = ["order_item_id","order_id","product_id","quantity",
               "unit_price","discount","line_total","return_status"]

# ── 7. carts ───────────────────────────────────────────────────────────────────
CART_STATUSES = ["Abandoned","Converted","Saved","Abandoned","Abandoned",
                 "Converted","Converted","Abandoned"]

carts_rows = []
NUM_CARTS = 800
ct_threshold = ADMIN_CONFIG["conversion_threshold"]

for i in range(1, NUM_CARTS + 1):
    crid  = f"CRT{i:04d}"
    cid   = random.choice(customer_ids)
    cdate = rand_date(365, 0)
    c_status = random.choice(CART_STATUSES)
    # loyalty boosts conversion
    lpts = customer_meta[cid]["loyalty_points"]
    conv_boost = min(lpts / 100000, 0.10)
    conv_prob  = ct_threshold + conv_boost
    if random.random() < conv_prob:
        c_status = "Converted"
    n_items = random.randint(1, 8)
    total   = round(random.uniform(10, 800), 2)
    ttl_items = random.randint(1, n_items)
    carts_rows.append([
        crid, cid,
        maybe_null(cdate, 0.02),
        c_status,
        n_items,
        ttl_items,
        maybe_null(total, 0.04),
        round(conv_prob, 4),
        1 if c_status == "Converted" else 0,
    ])

CART_HEADER = ["cart_id","customer_id","created_date","status",
               "num_items_added","num_items_at_checkout","cart_value",
               "conversion_probability","converted"]

# ── write all CSVs ─────────────────────────────────────────────────────────────
print("\nGenerating E-Commerce Intelligence Dataset...\n")
write_csv("providers.csv",   providers_rows,   PROV_HEADER)
write_csv("shops.csv",       shops_rows,       SHOP_HEADER)
write_csv("customers.csv",   customers_rows,   CUST_HEADER)
write_csv("products.csv",    products_rows,    PROD_HEADER)
write_csv("orders.csv",      orders_rows,      ORD_HEADER)
write_csv("order_items.csv", order_items_rows, ITEM_HEADER)
write_csv("carts.csv",       carts_rows,       CART_HEADER)
print("\nAll CSV files written to:", OUTPUT_DIR)
