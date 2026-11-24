/* Chrono — place historical moments on the timeline. Negative years are BCE. */
(function () {
  const EVENTS = `Apollo 11 lands on the Moon=1969|The Berlin Wall falls=1989|The first iPhone goes on sale=2007|Columbus reaches the Americas=1492
|The US Declaration of Independence is adopted=1776|The storming of the Bastille=1789|The Titanic sinks=1912|World War I begins=1914|World War II ends=1945
|India becomes independent=1947|The Wright brothers' first powered flight=1903|Darwin publishes On the Origin of Species=1859|Newton publishes the Principia=1687
|The Magna Carta is sealed=1215|Constantinople falls to the Ottomans=1453|Luther posts his Ninety-five Theses=1517|Galileo spots the moons of Jupiter=1610
|The first modern Olympic Games, in Athens=1896|Fleming discovers penicillin=1928|Watson and Crick describe DNA's double helix=1953|Sputnik 1 is launched=1957
|Tim Berners-Lee proposes the World Wide Web=1989|The Chernobyl disaster=1986|Euro notes and coins enter circulation=2002|Wikipedia launches=2001
|Nelson Mandela is released from prison=1990|The Soviet Union dissolves=1991|The Battle of Hastings=1066|Vesuvius buries Pompeii=79|Gandhi leads the Salt March=1930
|Bell patents the telephone=1876|Einstein publishes special relativity=1905|The first human heart transplant=1967|The Hubble Space Telescope is launched=1990
|The Eiffel Tower is completed=1889|The Suez Canal opens=1869|The Panama Canal opens=1914|Yuri Gagarin becomes the first human in space=1961|Pluto is discovered=1930
|Napoleon is defeated at Waterloo=1815|The American Civil War ends=1865|The Peace of Westphalia is signed=1648|Chandrayaan-3 lands near the Moon's south pole=2023
|WHO declares COVID-19 a pandemic=2020|The Bitcoin white paper is published=2008|Google is founded=1998|Ray Tomlinson sends the first network email=1971
|Construction of the Taj Mahal begins=1632|The Black Death reaches Europe=1347|Tokyo hosts the first Olympics held in Asia=1964|Shakespeare is born=1564
|Magellan's expedition completes the first circumnavigation=1522|The Great Fire of London=1666|The Rosetta Stone is found=1799|Queen Victoria takes the throne=1837
|The first Nobel Prizes are awarded=1901|Leonardo da Vinci is born=1452|Michelangelo finishes the Sistine Chapel ceiling=1512|Copernicus publishes his Sun-centred model=1543
|The Spanish Armada is defeated=1588|Jamestown is founded in Virginia=1607|The Mayflower reaches Plymouth=1620|England's Glorious Revolution=1688
|Peter the Great founds St Petersburg=1703|The Acts of Union create Great Britain=1707|The Battle of Plassey=1757|James Cook reaches Australia's east coast=1770
|The Boston Tea Party=1773|James Watt patents his improved steam engine=1769|The first crewed hot-air balloon flight=1783|The US Constitution is signed=1787
|Edward Jenner tests the smallpox vaccine=1796|The Louisiana Purchase=1803|Napoleon crowns himself Emperor=1804|The Battle of Trafalgar=1805
|Britain abolishes the slave trade=1807|The Stockton and Darlington Railway opens=1825|Morse sends "What hath God wrought"=1844|Revolutions sweep across Europe=1848
|The Indian Rebellion begins=1857|Abraham Lincoln is assassinated=1865|Mendel publishes his pea-plant experiments=1866|Alfred Nobel patents dynamite=1867
|The US transcontinental railroad is completed=1869|Mendeleev publishes his periodic table=1869|Edison demonstrates his practical light bulb=1879|Krakatoa erupts=1883
|The Indian National Congress holds its first session=1885|The Statue of Liberty is dedicated=1886|Röntgen discovers X-rays=1895|Marie Curie shares the Nobel Prize in Physics=1903
|The great San Francisco earthquake=1906|Ford introduces the Model T=1908|Amundsen reaches the South Pole=1911|The October Revolution in Russia=1917
|The Jallianwala Bagh massacre=1919|Tutankhamun's tomb is discovered=1922|Lindbergh flies solo across the Atlantic=1927|The Wall Street Crash=1929
|The Hindenburg airship disaster=1937|World War II begins=1939|The attack on Pearl Harbor=1941|The D-Day landings in Normandy=1944|The United Nations is founded=1945
|The People's Republic of China is proclaimed=1949|India's constitution comes into effect=1950|Hillary and Tenzing reach the summit of Everest=1953
|Rosa Parks refuses to give up her bus seat=1955|The Treaty of Rome founds the European Economic Community=1957|The Cuban Missile Crisis=1962
|Martin Luther King Jr. gives his "I Have a Dream" speech=1963|President Kennedy is assassinated=1963|Bangladesh becomes independent=1971
|Martin Cooper makes the first handheld mobile phone call=1973|The Fall of Saigon ends the Vietnam War=1975|Microsoft is founded=1975|Apple is founded=1976
|Smallpox is declared eradicated=1980|The IBM PC is launched=1981|India wins its first Cricket World Cup=1983|The Space Shuttle Challenger disaster=1986
|Germany is reunified=1990|The Channel Tunnel opens=1994|Dolly the sheep is born=1996|Hong Kong is handed over to China=1997|The euro launches as an electronic currency=1999
|The September 11 attacks=2001|The Human Genome Project is completed=2003|Facebook launches=2004|The Indian Ocean tsunami=2004|YouTube launches=2005
|Barack Obama is elected US president=2008|The Large Hadron Collider circulates its first beam=2008|The Higgs boson discovery is announced=2012
|NASA's Curiosity rover lands on Mars=2012|India's Mangalyaan enters Mars orbit=2014|Gravitational waves are detected for the first time=2015|The Paris climate agreement is adopted=2015
|The first image of a black hole is released=2019|The James Webb Space Telescope is launched=2021|ChatGPT is released=2022|Rome is founded, according to tradition=-753
|The first Olympic Games at Olympia, by tradition=-776|Julius Caesar is assassinated=-44|Alexander the Great dies=-323|The Western Roman Empire falls=476
|Muhammad's migration to Medina, the Hijra=622|Charlemagne is crowned emperor=800|The First Crusade captures Jerusalem=1099|Genghis Khan is proclaimed Great Khan=1206
|The Hundred Years' War begins=1337|The Ming dynasty is founded=1368|Vasco da Gama reaches India by sea=1498|Babur founds the Mughal Empire at Panipat=1526
|Akbar becomes Mughal emperor=1556|The English East India Company is chartered=1600|Shivaji is crowned=1674|Qin Shi Huang unifies China=-221|The Battle of Marathon=-490
|Socrates is executed=-399|The Duke of Wellington becomes British prime minister=1828|The first Indian railway runs from Bombay to Thane=1853
|The Red Cross is founded=1863|The first FIFA World Cup is held in Uruguay=1930|The first Cricket World Cup is held in England=1975|Neil Armstrong is born=1930
|The Golden Gate Bridge opens=1937|Mount Everest is announced as the world's highest peak=1856|The first successful polio vaccine is announced=1955|The Beatles release their first single=1962|The first Wimbledon Championships=1877|The first Tour de France=1903|Gandhi returns to India from South Africa=1915|Mahatma Gandhi is assassinated=1948
|NATO is founded=1949|The Korean War begins=1950|Queen Elizabeth II is crowned=1953|The Berlin Wall is built=1961|India launches its first satellite, Aryabhata=1975
|Voyager 1 is launched=1977|Mount St. Helens erupts=1980|The first Space Shuttle flight=1981|Compact discs go on sale=1982|The Bhopal gas tragedy=1984|Windows 1.0 is released=1985
|The first SMS text message is sent=1992|Amazon is founded=1994|Concorde makes its last commercial flight=2003|Twitter launches=2006|Usain Bolt runs 100 m in 9.58 seconds=2009
|The first Indian Premier League season=2008|Instagram launches=2010|The Fukushima nuclear disaster=2011|The Philae lander touches down on a comet=2014|The UK votes to leave the EU=2016
|India withdraws its ₹500 and ₹1000 notes=2016|SpaceX first lands an orbital rocket booster=2015|Fire badly damages Notre-Dame de Paris=2019|The Perseverance rover lands on Mars=2021
|Halley's Comet last swings close to the Sun=1986|The first Academy Awards ceremony=1929|The BBC starts a regular television service=1936|The first nuclear chain reaction, in Chicago=1942
|ENIAC, an early electronic computer, is unveiled=1946|The transistor is invented at Bell Labs=1947|India's first general election begins=1951|The first laser is demonstrated=1960
|The first cash machine opens, in London=1967|ARPANET sends its first message=1969|Intel releases the 4004 microprocessor=1971|Louise Brown, the first IVF baby, is born=1978
|Sony launches the Walkman=1979|Tetris is created=1984|The first website goes live=1991|Deep Blue beats Garry Kasparov in a chess match=1997|Sachin Tendulkar plays his first Test match=1989
|Sachin Tendulkar scores the first ODI double century=2010|Kalpana Chawla becomes the first Indian-born woman in space=1997|Rakesh Sharma becomes the first Indian in space=1984
|ISRO is founded=1969|Chandrayaan-1 is launched=2008|Mother Teresa wins the Nobel Peace Prize=1979|Rabindranath Tagore wins the Nobel Prize in Literature=1913
|C. V. Raman wins the Nobel Prize in Physics=1930|The Third Battle of Panipat=1761|The Treaty of Versailles is signed=1919|The League of Nations first meets=1920
|The Penny Black, the first postage stamp, is issued=1840|Daguerre announces the daguerreotype photograph=1839|Babbage proposes his Difference Engine=1822
|Ada Lovelace publishes her notes on the Analytical Engine=1843|The Brooklyn Bridge opens=1883|The first Ferris wheel turns at the Chicago World's Fair=1893
|The Lumière brothers hold their first public film screening=1895|Marconi sends the first transatlantic radio signal=1901|Insulin is first used to treat a patient=1922
|Hubble shows that the universe is expanding=1929|Jesse Owens wins four golds at the Berlin Olympics=1936|Anne Frank's diary is published=1947|The Sydney Opera House opens=1973
|Malala Yousafzai wins the Nobel Peace Prize=2014|The first ascent of K2=1954|The Hoover Dam is completed=1936|The Mona Lisa is stolen from the Louvre=1911`
    .split("|").map((s) => s.trim()).filter(Boolean).map((s) => { const [e, y] = s.split("="); return { id: e, e, y: +y }; });
  const ROUNDS = 5, NOW = 2026;
  const fmtY = (y) => (y < 0 ? `${-y} BCE` : `${y}`);

  MG.css(`
  .ch-card{font-size:24px;font-weight:650;letter-spacing:-.015em;padding:22px;border-radius:14px;background:linear-gradient(135deg,#f8f0d8,#efe2bd);color:#3d2f0b;margin-bottom:22px;line-height:1.3;
    box-shadow:inset 0 0 0 1px rgba(160,120,0,.25);font-family:Georgia,"Times New Roman",serif}
  .ch-year{font:700 44px var(--mono);letter-spacing:-.03em;text-align:center;margin:4px 0}
  .ch-line{position:relative;height:100px;margin-top:22px;border-top:2px solid var(--line)}
  .ch-pin{position:absolute;top:-7px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:4px;animation:fadeUp .4s var(--ease) both}
  .ch-pin i{width:12px;height:12px;border-radius:50%;background:var(--accent);border:2px solid var(--surface)}
  .ch-pin b{font:700 12px var(--mono)}.ch-pin small{font-size:11px;color:var(--ink-2);max-width:110px;text-align:center;line-height:1.2}`);

  MG.define({
    slug: "chrono",
    howTo: `<p>Each card describes a moment in history. Slide to the year you think it happened.</p>
    <ul><li>The slider's window is randomized, so its edges don't give the answer away.</li>
    <li>Scoring is fair across eras: the further back an event is, the more slack you get (at least ±25 years, growing with age).</li>
    <li>${ROUNDS} cards per game, and you'll never see the same event twice.</li></ul>`,
    progress: (s) => `Card ${s.ans.length + 1} of ${s.qs.length}`,
    partial: (s) => s.ans.reduce((a, b) => a + b.s, 0) / s.qs.length,
    init(ctx) {
      const qs = ctx.pick(EVENTS, ROUNDS);
      if (!qs) return null;
      return { qs: qs.map((ev) => {
        const span = ev.y < 1000 ? 1400 : ev.y < 1700 ? 700 : 400;
        let lo = ev.y - ctx.rng.int(Math.round(span * 0.15), Math.round(span * 0.85)), hi = lo + span;
        if (hi > NOW) { lo -= hi - NOW; hi = NOW; }
        if (lo < -1200) { lo = -1200; hi = Math.max(hi, ev.y + 50); }
        return { ...ev, lo, hi };
      }), ans: [] };
    },
    render(ctx, st) {
      const { root, h } = ctx;
      function round() {
        const i = st.ans.length, ev = st.qs[i];
        root.innerHTML = "";
        const range = h("input", { type: "range", min: ev.lo, max: ev.hi, value: Math.round((ev.lo + ev.hi) / 2), step: 1, "aria-label": "Year" });
        const yr = h("div", { class: "ch-year" });
        const show = () => (yr.textContent = fmtY(+range.value));
        range.addEventListener("input", show); show();
        range.addEventListener("keydown", (e) => e.key === "Enter" && submit());
        const fb = h("div", { class: "feedback" });
        const btn = h("button", { class: "btn primary lg", onclick: submit }, "Place it");
        root.append(MG.roundTop(i, st.qs.length), h("div", { class: "ch-card" }, ev.e), yr, range,
          h("div", { class: "row faint mono", style: "justify-content:space-between;font-size:12px" }, h("span", {}, fmtY(ev.lo)), h("span", {}, fmtY(ev.hi))),
          h("div", { class: "row", style: "margin-top:18px" }, btn), fb);
        range.focus({ preventScroll: true });
        let locked = false;
        function submit() {
          if (locked) return; locked = true; range.disabled = true;
          const g = +range.value, err = Math.abs(g - ev.y), s = Math.max(0, Math.round(100 * (1 - err / Math.max(25, (NOW - ev.y) / 6))));
          st.ans.push({ g, s }); ctx.save();
          fb.innerHTML = `<div class="pop row" style="gap:18px"><span>It was <b class="mono" style="font-size:22px">${fmtY(ev.y)}</b></span>
            <span class="muted">${err === 0 ? "Exactly right!" : `${err} year${err > 1 ? "s" : ""} off`}</span><span class="gain">+${s}</span></div>`;
          fb.append(timeline());
          const last = st.ans.length >= st.qs.length;
          const next = h("button", { class: "btn primary lg", onclick: () => (last ? end() : round()) }, last ? "See result" : "Next");
          btn.replaceWith(next); next.focus();
        }
      }
      function timeline() {
        const done = st.qs.slice(0, st.ans.length), ys = done.map((e) => e.y).concat(st.ans.map((a) => a.g));
        const mn = Math.min(...ys) - 10, mx = Math.max(...ys) + 10, X = (y) => 4 + ((y - mn) / (mx - mn)) * 92;
        const line = h("div", { class: "ch-line" });
        done.slice().sort((a, b) => a.y - b.y).forEach((e, idx) => line.append(h("div", { class: "ch-pin", style: `left:${X(e.y)}%;top:${idx % 2 ? 28 : -7}px` }, h("i"), h("b", {}, fmtY(e.y)), h("small", {}, e.e.length > 34 ? e.e.slice(0, 32) + "…" : e.e))));
        return line;
      }
      const end = () => { const sc = st.ans.map((a) => a.s); ctx.finish(sc.reduce((a, b) => a + b, 0) / st.qs.length, { summary: st.qs.map((e, k) => `${fmtY(e.y)}: ${e.e} <span class="mono">(${fmtY(st.ans[k].g)}, +${sc[k]})</span>`).join("<br>"), share: MG.blocks(sc) }); };
      st.ans.length >= st.qs.length ? end() : round();
    },
  });
})();
