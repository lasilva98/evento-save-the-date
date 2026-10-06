/* =========================================================
   Save the Date · AI Agents Zendesk
   ========================================================= */
(() => {
  "use strict";

  /* ---------- Configuração ---------- */
  const CONFIG = {
    // URL do App da Web do Google Apps Script (termina em /exec) que grava as
    // inscrições na planilha. Enquanto for null, ficam só no navegador (teste).
    endpoint: "https://script.google.com/macros/s/AKfycbw_zZqQ9CrPhZSz1DP499My-nXuIqAxuxYQNp84ffNrSXwd49Baj6iOLfu63zd2fJ7SNA/exec",
    eventStart: new Date("2026-11-04T09:00:00-03:00"),
    eventEnd: new Date("2026-11-04T11:00:00-03:00"),
    eventDate: "2026-11-04",
    title: "AI Agents Zendesk + WhatsApp · Save the Date",
    address: "Torre 1 - Av. Dr. Chucri Zaidan, 920 - 14º Andar - Vila Cordeiro, São Paulo - SP, 04583-110",
    lat: -23.6236,
    lng: -46.6996,
  };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* =========================================================
     Quebra de títulos em linhas (para revelar linha a linha)
     ========================================================= */
  const splitTargets = $$(".split-lines").map((el) => ({ el, html: el.innerHTML }));
  function splitLines() {
    splitTargets.forEach(({ el, html }) => {
      el.innerHTML = html;
      const words = [];
      let space = false;
      const walk = (node, wrapEm) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            n.textContent.replace(/\u00a0/g, "\u0001").split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { words.push(" "); space = true; return; }
              const txt = part.replace(/\u0001/g, "&nbsp;");
              const s = document.createElement("span"); s.className = "w";
              s.innerHTML = wrapEm ? `<em>${txt}</em>` : txt;
              s.dataset.sp = space && words.length ? "1" : "";
              space = false;
              words.push(s);
            });
          } else if (n.nodeType === 1) walk(n, wrapEm || n.tagName === "EM");
        });
      };
      walk(el, false);
      el.innerHTML = "";
      words.forEach((w) => el.append(typeof w === "string" ? document.createTextNode(w) : w));
      // agrupa pela posição vertical
      const lines = [];
      let top = null;
      $$(".w", el).forEach((w) => {
        const t = w.offsetTop;
        if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; }
        const line = lines[lines.length - 1];
        line.push((line.length && w.dataset.sp ? " " : "") + w.innerHTML);
      });
      el.innerHTML = lines.map((l) => `<span class="line"><span>${l.join("")}</span></span>`).join("");
    });
  }

  /* =========================================================
     Início
     ========================================================= */
  let lenis = null;
  const start = async () => {
    if (document.fonts) await document.fonts.ready;
    splitLines();
    if (!hasGSAP) return;
    // rolagem suave só com mouse; no celular a rolagem nativa é melhor e não trava a gaveta
    const touch = matchMedia("(hover: none), (pointer: coarse)").matches;
    if (!reduce && !touch && window.Lenis) {
      lenis = new Lenis({ lerp: .085, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    animate();
  };
  start();

  let resizeT;
  addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { splitLines(); hasGSAP && ScrollTrigger.refresh(); }, 250);
  });

  /* =========================================================
     Animações
     ========================================================= */
  function animate() {
    // hero
    gsap.from(".hero .split-lines .line > span", { yPercent: 110, duration: 1.4, ease: "expo.out", stagger: .12, delay: .15 });
    gsap.from(".hero__logos > *, .hero__sub, .hero__foot > *, .nav > *", { y: 18, opacity: 0, duration: 1.1, ease: "expo.out", stagger: .06, delay: .45 });

    // títulos e blocos revelados ao entrar na tela
    $$(".split-lines").forEach((el) => {
      if (el.closest(".hero")) return;
      gsap.from($$(".line > span", el), { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    $$(".reveal").forEach((el) => {
      gsap.from(el, { y: 30, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" } });
    });

    // networking: leve parallax na foto
    gsap.fromTo(".network__img img", { yPercent: -10 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".network", start: "top bottom", end: "bottom top", scrub: true } });

    // nav: cor por seção
    const nav = $("#nav");
    $$("[data-theme]").forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec, start: "top 40px", end: "bottom 40px",
        onToggle: (st) => st.isActive && nav.classList.toggle("is-light", sec.dataset.theme === "light"),
      });
    });

    // links internos com scroll suave
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const t = $(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(t, { duration: 1.4 }) : t.scrollIntoView({ behavior: "smooth" });
    }));

    ScrollTrigger.refresh();
  }

  /* =========================================================
     Nav com fundo ao rolar + botão fixo de inscrição
     (aparece quando o botão do hero sai da tela e some no cartão final)
     ========================================================= */
  (() => {
    const nav = $("#nav"), sticky = $("#stickyCta"), heroCta = $(".hero__cta"), card = $("#ctaCard");
    const update = () => {
      const h = heroCta.getBoundingClientRect(), c = card.getBoundingClientRect();
      const heroCtaVisible = h.top < innerHeight - 10 && h.bottom > 70;
      const cardVisible = c.top < innerHeight * .85 && c.bottom > 0;
      sticky.classList.toggle("is-on", !heroCtaVisible && !cardVisible && !document.body.classList.contains("is-locked"));
      nav.classList.toggle("is-scrolled", scrollY > 20);
    };
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    addEventListener("load", update);
    setTimeout(update, 1500);
    update();
    window.__updateSticky = update;
  })();

  /* =========================================================
     Vídeos oficiais da Zendesk (carregam só ao clicar)
     ========================================================= */
  $$("[data-yt]").forEach((btn) => btn.addEventListener("click", () => {
    if (btn.querySelector("iframe")) return;
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    f.title = btn.getAttribute("aria-label");
    btn.appendChild(f);
  }));

  /* =========================================================
     Mapas
     ========================================================= */
  const q = encodeURIComponent(CONFIG.address);
  $$("[data-maps]").forEach((a) => (a.href = `https://www.google.com/maps/search/?api=1&query=${q}`));
  $$("[data-waze]").forEach((a) => (a.href = `https://waze.com/ul?ll=${CONFIG.lat},${CONFIG.lng}&q=${q}&navigate=yes`));

  /* =========================================================
     Formulário (gaveta lateral)
     ========================================================= */
  const drawer = $("#drawer"), form = $("#regForm");
  const openDrawer = () => {
    drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked"); lenis && lenis.stop(); window.__updateSticky && window.__updateSticky();
    if ($("#stepForm").classList.contains("is-active")) setTimeout(() => $("input", form).focus({ preventScroll: true }), 500);
  };
  const closeDrawer = () => {
    drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked"); lenis && lenis.start(); window.__updateSticky && window.__updateSticky();
    // depois de confirmar, reabrir volta ao formulário (útil para validar o layout)
    setTimeout(() => {
      if ($("#stepDone").classList.contains("is-active")) {
        form.reset(); sel.classList.add("is-empty");
        $("#stepDone").classList.remove("is-active"); $("#stepForm").classList.add("is-active");
      }
    }, 800);
  };
  $$("[data-open-form]").forEach((b) => b.addEventListener("click", openDrawer));
  $$("[data-close]", drawer).forEach((b) => b.addEventListener("click", closeDrawer));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer(); });

  const whats = $("#f-whats");
  whats.addEventListener("input", () => {
    const d = whats.value.replace(/\D/g, "").slice(0, 11);
    let v = d;
    if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 6) v = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
    whats.value = v;
  });
  const sel = $("#f-cliente");
  sel.classList.add("is-empty");
  sel.addEventListener("change", () => sel.classList.toggle("is-empty", !sel.value));

  const validators = {
    nome: (v) => v.trim().split(/\s+/).length >= 2 && v.trim().length >= 4,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    empresa: (v) => v.trim().length >= 2,
    cargo: (v) => v.trim().length >= 2,
    whatsapp: (v) => [10, 11].includes(v.replace(/\D/g, "").length),
    cliente_zendesk: (v) => v === "Sim" || v === "Não",
  };
  const check = (el) => {
    const ok = validators[el.name](el.value);
    el.closest(".field").classList.toggle("is-invalid", !ok);
    return ok;
  };
  $$("input, select", form).forEach((el) => {
    el.addEventListener("blur", () => el.value && check(el));
    el.addEventListener("input", () => el.closest(".field").classList.contains("is-invalid") && check(el));
    el.addEventListener("change", () => el.closest(".field").classList.contains("is-invalid") && check(el));
  });

  async function saveRegistration(data) {
    if (CONFIG.endpoint) {
      // text/plain evita a verificação prévia de CORS, que o Apps Script não responde
      const r = await fetch(CONFIG.endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data),
        redirect: "follow",
      });
      const res = await r.json().catch(() => ({}));
      if (!r.ok || !res.ok) throw new Error(res.erro || "Falha ao salvar");
      return;
    }
    await new Promise((r) => setTimeout(r, 900));
    try {
      const list = JSON.parse(localStorage.getItem("inscricoes_aiagents") || "[]");
      list.push(data); localStorage.setItem("inscricoes_aiagents", JSON.stringify(list));
    } catch {}
    console.info("[AI Agents] Inscrição salva localmente:", data);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fields = $$("input, select", form);
    const ok = fields.map(check);
    if (ok.includes(false)) { fields[ok.indexOf(false)].focus(); return; }
    const fd = Object.fromEntries(new FormData(form));
    const data = {
      nome: fd.nome.trim(), email: fd.email.trim().toLowerCase(), empresa: fd.empresa.trim(), cargo: fd.cargo.trim(),
      whatsapp: fd.whatsapp, cliente_zendesk: fd.cliente_zendesk,
      criado_em: new Date().toISOString(), origem: location.href,
    };
    const btn = $("#submitBtn");
    btn.classList.add("is-loading"); btn.disabled = true;
    try {
      await saveRegistration(data);
      $("#doneName").textContent = data.nome.split(" ")[0];
      $("#stepForm").classList.remove("is-active"); $("#stepDone").classList.add("is-active");
      $(".drawer__panel").scrollTop = 0;
      loadWeather();
    } catch {
      alert("Opa, não conseguimos concluir sua inscrição agora. Tenta de novo em instantes?");
    } finally {
      btn.classList.remove("is-loading"); btn.disabled = false;
    }
  });

  /* =========================================================
     Agenda (Google / .ics)
     ========================================================= */
  const toICS = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const details = "Café da manhã de networking com clientes Zendesk (9h às 9h45), seguido de AI Agents e as novas cobranças da Meta no WhatsApp, com casos reais. Evento gratuito.";
  $("#gcalBtn").href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(CONFIG.title)}&dates=${toICS(CONFIG.eventStart)}/${toICS(CONFIG.eventEnd)}` +
    `&details=${encodeURIComponent(details)}&location=${q}`;
  $("#icsBtn").addEventListener("click", () => {
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AI Agents Zendesk//PT", "BEGIN:VEVENT",
      "UID:ai-agents-zendesk-20261104", `DTSTAMP:${toICS(new Date())}`,
      `DTSTART:${toICS(CONFIG.eventStart)}`, `DTEND:${toICS(CONFIG.eventEnd)}`,
      `SUMMARY:${CONFIG.title}`, `DESCRIPTION:${details}`, `LOCATION:${CONFIG.address.replace(/,/g, "\\,")}`,
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Amanhã tem AI Agents Zendesk!", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "ai-agents-zendesk.ics"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  /* =========================================================
     Previsão do tempo (Open-Meteo, sem chave)
     - até 16 dias antes: previsão real para 04/11 às 9h
     - antes disso: média histórica de 04/11 nos últimos 5 anos
     ========================================================= */
  const WMO = (c) => {
    if (c === 0) return ["☀️", "Céu limpo"];
    if (c <= 2) return ["🌤️", "Poucas nuvens"];
    if (c === 3) return ["☁️", "Nublado"];
    if (c <= 48) return ["🌫️", "Neblina"];
    if (c <= 57) return ["🌦️", "Garoa"];
    if (c <= 67) return ["🌧️", "Chuva"];
    if (c <= 82) return ["🌦️", "Pancadas de chuva"];
    return ["⛈️", "Tempestade"];
  };
  let weatherLoaded = false;
  async function loadWeather() {
    if (weatherLoaded) return;
    const icon = $("#wIcon"), temp = $("#wTemp"), desc = $("#wDesc"), note = $("#wNote");
    const base = `latitude=${CONFIG.lat}&longitude=${CONFIG.lng}&timezone=America%2FSao_Paulo`;
    const eventNoon = new Date(CONFIG.eventDate + "T12:00:00-03:00");
    const days = (eventNoon - Date.now()) / 86400000;
    try {
      if (days <= 15 && days > -1) {
        const r = await (await fetch(`https://api.open-meteo.com/v1/forecast?${base}&start_date=${CONFIG.eventDate}&end_date=${CONFIG.eventDate}` +
          "&daily=precipitation_probability_max&hourly=temperature_2m,weather_code")).json();
        const [ic, label] = WMO(r.hourly.weather_code[9]);
        const rain = r.daily.precipitation_probability_max[0] ?? 0;
        icon.textContent = ic; temp.textContent = `${Math.round(r.hourly.temperature_2m[9])}°`;
        desc.textContent = `${label} às 9h, com ${rain}% de chance de chuva. ${rain >= 50 ? "Vale levar um guarda-chuva!" : "Tudo indica uma manhã tranquila."}`;
        note.textContent = "Previsão para o dia do evento, via Open-Meteo.";
      } else {
        const years = [2021, 2022, 2023, 2024, 2025];
        const res = await Promise.all(years.map((y) => fetch(`https://archive-api.open-meteo.com/v1/archive?${base}&start_date=${y}-11-04&end_date=${y}-11-04` +
          "&daily=precipitation_sum&hourly=temperature_2m").then((x) => x.json())));
        const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
        const t9 = Math.round(avg(res.map((r) => r.hourly.temperature_2m[9])));
        const rainy = res.filter((r) => r.daily.precipitation_sum[0] >= 1).length;
        icon.textContent = rainy >= 3 ? "🌦️" : rainy >= 1 ? "⛅" : "🌤️";
        temp.textContent = `~${t9}°`;
        desc.textContent = `Nessa época, São Paulo costuma estar assim às 9h. Choveu em ${rainy} dos últimos ${years.length} anos, então ${rainy >= 3 ? "melhor levar um guarda-chuva" : "um casaquinho leve resolve"}.`;
        const avail = new Date(eventNoon - 15 * 86400000).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        note.textContent = `Média histórica de 4/11. A previsão de verdade aparece aqui a partir de ${avail}.`;
      }
      weatherLoaded = true;
    } catch {
      icon.textContent = "🌤️"; temp.textContent = "~20°";
      desc.textContent = "Primavera em SP: manhã amena, que costuma esquentar ao longo do dia.";
      note.textContent = "Não conseguimos carregar a previsão agora.";
    }
  }
})();
