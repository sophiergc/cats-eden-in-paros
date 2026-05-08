/* ============================================================
   Cats Eden Paros — donation site logic
   Edit CONFIG to update without touching the rest.
   ============================================================ */

const CONFIG = {
  // PayPal — email-based donate URL is used so the chosen amount prefills.
  // (The hosted button XVV5ZRYK2C7UN ignores the amount URL param.)
  paypalEmail: "labandadicasaelea@gmail.com",
  paypalHostedButtonId: "XVV5ZRYK2C7UN", // kept as fallback

  // Fundraising goal (EUR)
  goalAmount: 15000,

  // Current total raised (EUR). Update as donations come in.
  currentRaised: 2840,

  // Number of donors (set null to hide)
  donorCount: 47,

  // Default selected amounts
  defaultMonthly: 10,
  defaultOneoff: 50,

  // ---- FILM STRIP ----
  // Order is from `filmOrder` (numbers refer to filmNN.jpg). Put Martina-holding-cats first.
  // Anything not listed here will be appended at the end.
  filmCount: 22,
  filmOrder: [
    // (Edit this list to put your favourite Martina-with-cats shots first.
    //  e.g. [18, 19, 20, 21, 22, 1, 2, 3, ...])
  ],

  // ---- FACEBOOK POSTS ----
  // To get a URL: open the post on FB → click the timestamp → copy URL.
  facebookPosts: [
    {
      title: "Mimi's recovery — week three",
      excerpt: "After her surgery she's eating on her own again. Slow progress is still progress.",
      date: "Apr 28",
      url: "https://www.facebook.com/labandadicasaelea/",
    },
    {
      title: "Three new kittens at the door",
      excerpt: "Found in a box near the harbour. All bottle-feeding now, all stable.",
      date: "Apr 18",
      url: "https://www.facebook.com/labandadicasaelea/",
    },
    {
      title: "Sterilisation week — eleven cats",
      excerpt: "The travelling vet was here for three days. Eleven sterilisations, all street cats.",
      date: "Apr 09",
      url: "https://www.facebook.com/labandadicasaelea/",
    },
    {
      title: "Theo finally adopted",
      excerpt: "Four years on Paros, now flying to a forever home in Berlin. Thank you, Anna.",
      date: "Mar 30",
      url: "https://www.facebook.com/labandadicasaelea/",
    },
    {
      title: "Land update: we found a plot",
      excerpt: "The owner is open to a long lease. This is real. We need the funds to lock it in.",
      date: "Mar 22",
      url: "https://www.facebook.com/labandadicasaelea/",
    },
  ],
};

/* ============================================================
   Reveal-on-scroll
   ============================================================ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
function observeReveals(root = document) {
  root.querySelectorAll(".reveal:not(.in)").forEach((el) => revealObserver.observe(el));
}
observeReveals();

/* ============================================================
   Progress bar + counter
   ============================================================ */
function animateCount(el, target, duration = 2200) {
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const value = Math.round(target * eased);
    el.textContent = "€" + value.toLocaleString("en-GB");
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function initProgress() {
  const fill = document.getElementById("progressFill");
  const counter = document.querySelector(".counter");
  const percentEl = document.getElementById("percentText");
  const donorsEl = document.getElementById("donorsText");
  if (!fill || !counter) return;

  const pct = Math.min(100, (CONFIG.currentRaised / CONFIG.goalAmount) * 100);
  const card = document.querySelector(".progress");
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          fill.style.width = pct.toFixed(1) + "%";
          animateCount(counter, CONFIG.currentRaised);
          let p = 0;
          const interval = setInterval(() => {
            p += pct / 60;
            if (p >= pct) { p = pct; clearInterval(interval); }
            percentEl.textContent = Math.round(p) + "%";
          }, 30);
          obs.unobserve(card);
        }
      });
    },
    { threshold: 0.3 }
  );
  obs.observe(card);

  if (CONFIG.donorCount != null && donorsEl) {
    donorsEl.textContent = CONFIG.donorCount.toLocaleString("en-GB");
  }
}
initProgress();

/* ============================================================
   Donation tabs + amounts
   ============================================================ */
const state = {
  monthlyAmount: CONFIG.defaultMonthly,
  oneoffAmount: CONFIG.defaultOneoff,
};

function updateButtons() {
  const m = document.getElementById("monthlyDisplay");
  const o = document.getElementById("oneoffDisplay");
  const sticky = document.getElementById("stickyAmt");
  if (m) m.textContent = "€" + state.monthlyAmount;
  if (o) o.textContent = "€" + state.oneoffAmount;
  if (sticky) sticky.textContent = "€" + state.monthlyAmount + "/mo";
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.toggle("active", t === tab);
      t.setAttribute("aria-selected", t === tab);
    });
    document.querySelectorAll(".tab-panel").forEach((p) => {
      p.classList.toggle("active", p.dataset.panel === target);
    });
  });
});

function wirePanel(panel, key) {
  const buttons = panel.querySelectorAll(".amount");
  const customInput = panel.querySelector('input[type="number"]');

  buttons.forEach((b) => {
    b.addEventListener("click", () => {
      buttons.forEach((bb) => bb.classList.remove("selected"));
      b.classList.add("selected");
      state[key + "Amount"] = Number(b.dataset.amount);
      if (customInput) customInput.value = "";
      updateButtons();
    });
  });

  if (customInput) {
    customInput.addEventListener("input", () => {
      const v = Number(customInput.value);
      if (v > 0) {
        buttons.forEach((bb) => bb.classList.remove("selected"));
        state[key + "Amount"] = v;
        updateButtons();
      }
    });
  }
}
wirePanel(document.querySelector('[data-panel="monthly"]'), "monthly");
wirePanel(document.querySelector('[data-panel="oneoff"]'), "oneoff");
updateButtons();

/* ============================================================
   PayPal donation flow
   Uses the hosted donate button. Amount is passed in URL.
   On the PayPal page donor can choose monthly vs one-time.
   ============================================================ */
// One-time donation: modern donate URL, amount prefilled
function paypalOneoffURL(amount) {
  const params = new URLSearchParams({
    business: CONFIG.paypalEmail,
    amount: String(amount),
    currency_code: "EUR",
    item_name: "Cats Eden Paros — Donation",
    no_shipping: "1",
  });
  return "https://www.paypal.com/donate/?" + params.toString();
}

// Monthly donation: legacy subscription URL — locks in recurring monthly,
// donor lands on PayPal already configured to subscribe at the chosen amount.
function paypalMonthlyURL(amount) {
  const params = new URLSearchParams({
    cmd: "_xclick-subscriptions",
    business: CONFIG.paypalEmail,
    item_name: "Cats Eden Paros — Monthly Donation",
    currency_code: "EUR",
    a3: String(amount),  // amount per billing cycle
    p3: "1",             // every 1 period
    t3: "M",             // M = month
    src: "1",            // recurring (not a fixed-instalment plan)
    sra: "1",            // re-attempt failed payments
    no_shipping: "1",
  });
  return "https://www.paypal.com/cgi-bin/webscr?" + params.toString();
}

document.getElementById("donateMonthly").addEventListener("click", () => {
  const amt = Math.max(1, Number(state.monthlyAmount) || CONFIG.defaultMonthly);
  window.open(paypalMonthlyURL(amt), "_blank", "noopener");
});
document.getElementById("donateOneoff").addEventListener("click", () => {
  const amt = Math.max(1, Number(state.oneoffAmount) || CONFIG.defaultOneoff);
  window.open(paypalOneoffURL(amt), "_blank", "noopener");
});

/* ============================================================
   Build film gallery
   Photos that fail to load show a "drop into images/film/" hint.
   ============================================================ */
function buildFilmGallery() {
  const grid = document.getElementById("filmGrid");
  if (!grid) return;
  const all = Array.from({ length: CONFIG.filmCount }, (_, i) => i + 1);
  const ordered = (CONFIG.filmOrder && CONFIG.filmOrder.length)
    ? [...CONFIG.filmOrder, ...all.filter(n => !CONFIG.filmOrder.includes(n))]
    : all;
  grid.innerHTML = ordered.map((n) => {
    const num = String(n).padStart(2, "0");
    return `
      <figure class="film-card reveal" role="listitem">
        <div class="film-card-img">
          <img src="images/film/film${num}.jpg" alt="" loading="lazy"
               onerror="this.style.display='none'; this.parentNode.classList.add('empty');" />
        </div>
        <figcaption>roll · ${num}</figcaption>
      </figure>
    `;
  }).join("");
  observeReveals(grid);
}
buildFilmGallery();

/* ============================================================
   Carousels — cycle slides with a soft fade
   ============================================================ */
function makeCarousel(slideSelector, dotSelector, intervalMs) {
  const slides = document.querySelectorAll(slideSelector);
  const dots   = document.querySelectorAll(dotSelector);
  if (slides.length < 2) return;
  let idx = 0;
  setInterval(() => {
    slides[idx].classList.remove("is-active");
    dots[idx]?.classList.remove("is-active");
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add("is-active");
    dots[idx]?.classList.add("is-active");
  }, intervalMs);
}
makeCarousel(".hero-slide", ".hero-dots .dot", 4500);
makeCarousel(".story-slide", ".story-dots .dot", 5500);

/* Video carousel — cycle every 6.5s, only the active video plays */
(function () {
  const slides = document.querySelectorAll(".video-slide");
  const dots   = document.querySelectorAll(".video-dots .dot");
  if (slides.length < 2) return;

  const videos = [...slides].map(s => s.querySelector("video"));
  const playActive = (i) => {
    videos.forEach((v, vi) => {
      if (!v) return;
      if (vi === i) {
        v.play().catch(() => { /* autoplay may be blocked until interaction */ });
      } else {
        try { v.pause(); v.currentTime = 0; } catch (e) {}
      }
    });
  };

  let idx = 0;
  playActive(0);

  // Pause inactive videos when the carousel scrolls offscreen, resume when back
  const wrap = slides[0].parentElement;
  if (wrap) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) playActive(idx);
        else videos.forEach(v => v?.pause());
      });
    }, { threshold: 0.2 });
    io.observe(wrap);
  }

  setInterval(() => {
    slides[idx].classList.remove("is-active");
    dots[idx]?.classList.remove("is-active");
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add("is-active");
    dots[idx]?.classList.add("is-active");
    playActive(idx);
  }, 6500);
})();

/* ============================================================
   Sticky donate bar — fades in past the hero, hides near donate card
   ============================================================ */
(function () {
  const pill = document.getElementById("stickyDonate");
  if (!pill) return;

  const hero = document.querySelector(".hero");
  const donate = document.getElementById("donate");
  const footer = document.querySelector(".footer");

  if (hero) {
    new IntersectionObserver(
      (entries) => entries.forEach((e) => pill.classList.toggle("visible", !e.isIntersecting)),
      { threshold: 0.2 }
    ).observe(hero);
  }
  if (donate) {
    new IntersectionObserver(
      (entries) => entries.forEach((e) => pill.classList.toggle("hidden-near-donate", e.isIntersecting)),
      { threshold: 0.25 }
    ).observe(donate);
  }
  if (footer) {
    new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) pill.classList.add("hidden-near-donate"); }),
      { threshold: 0.4 }
    ).observe(footer);
  }
})();

/* ============================================================
   Misc
   ============================================================ */
document.getElementById("year").textContent = new Date().getFullYear();

const params = new URLSearchParams(window.location.search);
if (params.has("thanks")) {
  const kind = params.get("thanks");
  const toast = document.createElement("div");
  toast.style.cssText =
    "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a1c;color:#fff;padding:1em 1.6em;border-radius:999px;box-shadow:0 12px 40px rgba(0,0,0,0.18);z-index:200;font-size:0.95rem;font-weight:500;";
  toast.textContent =
    kind === "monthly"
      ? "Thank you — your monthly support means everything."
      : "Thank you — your gift has been received.";
  document.body.appendChild(toast);
  setTimeout(() => (toast.style.opacity = "0"), 5000);
  setTimeout(() => toast.remove(), 6000);
}
