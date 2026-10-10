/* ==========================================================================
   On The Globe Marketing — work data
   --------------------------------------------------------------------------
   This is the ONLY file you need to touch to add new work.

   To add a new client:
   1. If they are in a new state/country, add an entry to `regions`.
      - `id`        lowercase, no spaces (used in URLs: work.html#wisconsin)
      - `fips`      US states only: the 2-digit state FIPS code (lets the map
                    highlight the state). Leave out for countries.
      - `iso`       Countries only: ISO 3166-1 numeric code as a string
                    (e.g. "124" for Canada) so the map can highlight it.
      - `pin`       [longitude, latitude] where the map pin sits.
   2. Drop the client's site files in /projects/<slug>/ (optional — only needed
      if you want visitors to click around the live site inside ours).
   3. Drop screenshots in /img/work/.
   4. Add an entry to `projects` below. The home page list, the map pins,
      the Work page and the case study page all build themselves from it.
   ========================================================================== */

window.OTG_DATA = {
  regions: [
    {
      id: "wisconsin",
      name: "Wisconsin",
      abbr: "WI",
      country: "United States",
      fips: "55",
      pin: [-89.63, 44.96] // Wausau
    }
  ],

  projects: [
    {
      slug: "stewart-ave",
      client: "Stewart Ave Auto Group",
      short: "Stewart Ave",
      region: "wisconsin",
      city: "Wausau, WI",
      coords: [-89.63, 44.96],
      year: "2026",
      category: "Automotive",
      services: ["Website design", "Development", "Site structure", "Motion"],
      summary:
        "Three family businesses on one street — collision repair, a brand-new auto care shop, and self storage — given one front door online, and a clear way to find the right one.",

      // Live, clickable copy of the site that lives in /projects/stewart-ave/
      live: "projects/stewart-ave/index.html",
      // Pages visitors can jump between in the live preview
      pages: [
        { label: "Group", src: "projects/stewart-ave/index.html", shot: "img/work/stewart-index.jpg" },
        { label: "Auto Care", src: "projects/stewart-ave/autocare.html", shot: "img/work/stewart-autocare.jpg" },
        { label: "Collision", src: "projects/stewart-ave/collision.html", shot: "img/work/stewart-collision.jpg" },
        { label: "Storage", src: "projects/stewart-ave/storage.html", shot: "img/work/stewart-storage.jpg" }
      ],
      cover: "img/work/stewart-index.jpg",
      mobileShot: "img/work/stewart-mobile.jpg",

      // ---- Case study (shown on case.html?p=stewart-ave) -------------------
      caseStudy: {
        lede:
          "Stewart Ave is three businesses that share a name, a street and a family — but online they didn't share anything. That makes it easy to call the body shop about an oil change, or land on the wrong page entirely.",
        sections: [
          {
            label: "The starting point",
            title: "One name, three very different errands.",
            body: [
              "Stewart Ave Collision & Repair has been the go-to body shop in Central Wisconsin for years. Then the family opened Stewart Ave Auto Care in a new building for maintenance and general repair, and they also run Stewart Ave Storage on the west side of Wausau.",
              "Three businesses, three different customers, one name. The question wasn't how to make a nice website. It was how to get someone with a dented bumper, someone due for an oil change and someone moving apartments to the right place in one click."
            ]
          },
          {
            label: "What we noticed",
            title: "People don't think in company names. They think in problems.",
            body: [
              "Nobody searches for “Stewart Ave Auto Group.” They search for “body shop Wausau” or “storage unit near me.” So the first screen had to be organized by what you need, not by what the company is called.",
              "We also wanted the real places on screen. Footage of the actual shop floor, the new Auto Care building and the storage lot does more for trust than any stock photo of someone else's garage."
            ]
          },
          {
            label: "The thinking",
            title: "Three doors, one hallway.",
            body: [
              "The landing page is split into three panels — one per business — each with its own color: red for collision, blue for auto care, amber for storage. You pick your door and you're in. The colors carry through every page so you always know which business you're looking at.",
              "Underneath, every page shares the same structure: what we do, how to book, where we are, when we're open. Learn one and you know all three. We also added small “right place?” notes that send collision customers to the body shop and maintenance customers to Auto Care, because with three businesses sharing one name, that mix-up is the easiest one to make."
            ]
          },
          {
            label: "What we built",
            title: "A group site that works like three.",
            list: [
              "A split-panel landing page with real video from each location",
              "Auto Care page with services, hours and an appointment request form",
              "Collision page built around insurance, loaner cars and the lifetime warranty",
              "Storage page with unit sizes, the owner's own words and a call-to-reserve",
              "Mobile-first layout — most of these visits happen on a phone in a parking lot",
              "Motion kept quiet and switched off for anyone with reduced motion set"
            ]
          },
          {
            label: "Where it goes next",
            title: "Built to grow with them.",
            body: [
              "Because all three businesses share one system, adding a fourth location or a new service is a page, not a rebuild. Next up: local search setup for each business and a review strategy so the shops' reputations show up where people are actually looking."
            ]
          }
        ]
      }
    }
  ]
};
