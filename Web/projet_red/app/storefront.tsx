"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { comingSoon, levelLabels, products, type Product } from "./products";

type Cart = Record<string, number>;
const money = (value: number) => `${value.toFixed(2)} CHF`;

function Bottle({ product, small = false }: { product: Product; small?: boolean }) {
  const source = { pulse: "/pulse01.png", rush: "/rush02.png", void: "/void03.png" }[product.id];
  return <img className={`bottle asset-bottle bottle--${product.id} ${small ? "bottle--small" : ""}`} src={source} alt={`Bouteille ${product.name} — ${product.flavor}`} />;
}

function Heat({ score }: { score: number }) {
  return <span className="heat" aria-label={`Intensité ${score} sur 5`}>{[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= score ? "on" : ""} />)}</span>;
}

type SmokeParticle = { id: number; zone: "pulse" | "rush" | "void"; style: CSSProperties };

function SmokeField() {
  const [particles, setParticles] = useState<SmokeParticle[]>([]);

  useEffect(() => {
    const zones = ["pulse", "rush", "void"] as const;
    const next = Array.from({ length: 30 }, (_, id) => {
      const zone = zones[id % zones.length];
      const zoneStart = zone === "pulse" ? 3 : zone === "rush" ? 36 : 69;
      return {
        id,
        zone,
        style: {
          "--smoke-left": `${zoneStart + Math.random() * 27}%`,
          "--smoke-size": `${110 + Math.random() * 210}px`,
          "--smoke-duration": `${8 + Math.random() * 9}s`,
          "--smoke-delay": `${-Math.random() * 16}s`,
          "--smoke-drift": `${-55 + Math.random() * 110}px`,
          "--smoke-opacity": `${0.08 + Math.random() * 0.14}`,
        } as CSSProperties,
      };
    });
    setParticles(next);
  }, []);

  return <div className="smoke-field" aria-hidden="true">{particles.map((particle) => <i key={particle.id} className={`smoke smoke--${particle.zone}`} style={particle.style} />)}</div>;
}

export function Storefront() {
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState(false);

  useEffect(() => { try { setCart(JSON.parse(localStorage.getItem("red-cart") || "{}")); } catch {} }, []);
  useEffect(() => { localStorage.setItem("red-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { document.body.style.overflow = cartOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [cartOpen]);
  useEffect(() => {
    const root = document.documentElement;
    const animated = document.querySelectorAll<HTMLElement>("section, .level-card, .next-row");
    animated.forEach((element) => element.classList.add("reveal"));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6%" });
    animated.forEach((element) => observer.observe(element));

    let frame = 0;
    const updateScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const distance = document.documentElement.scrollHeight - innerHeight;
        const progress = distance > 0 ? scrollY / distance : 0;
        root.style.setProperty("--scroll", String(progress));
        root.style.setProperty("--drift-x", `${progress * 24}vw`);
        root.style.setProperty("--drift-x-back", `${progress * -25}vw`);
        root.style.setProperty("--drift-y", `${progress * -65}vh`);
        root.style.setProperty("--travel-one", `${progress * 85}vh`);
        root.style.setProperty("--travel-two", `${progress * 180}vh`);
        root.style.setProperty("--travel-three", `${progress * 250}vh`);
      });
    };
    updateScroll();
    addEventListener("scroll", updateScroll, { passive: true });
    return () => { observer.disconnect(); removeEventListener("scroll", updateScroll); cancelAnimationFrame(frame); };
  }, []);

  const rows = products.filter((p) => cart[p.id]).map((product) => ({ product, quantity: cart[product.id] }));
  const count = Object.values(cart).reduce((sum, n) => sum + n, 0);
  const subtotal = rows.reduce((sum, row) => sum + (row.product.price || 0) * row.quantity, 0);
  const shipping = subtotal ? 7.9 : 0;
  const update = (id: string, delta: number) => setCart((current) => { const next = Math.max(0, (current[id] || 0) + delta); const result = { ...current, [id]: next }; if (!next) delete result[id]; return result; });
  const add = (id: string) => { update(id, 1); setCartOpen(true); };
  const trioPrice = useMemo(() => 46.9, []);
  const addTrio = () => { setCart((current) => Object.fromEntries(products.map((p) => [p.id, (current[p.id] || 0) + 1]))); setCartOpen(true); };

  return <main>
    <header className="header">
      <a href="#top" className="logo" aria-label="Red, accueil"><i>R</i><span>RED<small>Sauces artisanales</small></span></a>
      <nav aria-label="Navigation principale"><a href="#sauces">Nos sauces</a><a href="#trio">Le pack</a><a href="#atelier">À propos</a><a href="#atelier">Notre histoire</a></nav>
      <button className="cart-button" onClick={() => setCartOpen(true)}>Panier <span>{count}</span></button>
    </header>

    <section className="hero" id="top">
      <SmokeField />
      <div className="hero-kicker">DROP 001 <span>·</span> CHOISIS TON NIVEAU</div>
      <div className="hero-products">{products.map((product) => <a href={`#${product.id}`} className={`hero-product hero-product--${product.id}`} key={product.id} aria-label={`Découvrir ${product.name}, ${product.flavor}`}><img className="hero-product-title" src={`/${product.id}${product.id === "pulse" ? "01" : product.id === "rush" ? "02" : "03"}.1.png`} alt={`${levelLabels[product.heatLevel]} ${product.name}, intensité ${product.heatScore} sur 5`} /><Bottle product={product}/><span>{product.flavor} <b>↘</b></span></a>)}</div>
      <a className="hero-scroll" href="#sauces">Découvrir le drop <span>↓</span></a>
    </section>

    <section className="manifesto">
      <div className="section-index">[ NOTRE FORMULE ]</div>
      <p>Des fruits francs. Une acidité précise. Des épices choisies. Le piment arrive ensuite — pour prolonger le goût, jamais pour l’effacer.</p>
      <div className="formula"><span>PIQUANTE <b>03</b></span><i>→</i><span>FORTE <b>04</b></span><i>→</i><span>EXTRÊME <b>05</b></span></div>
    </section>

    <section className="levels" id="sauces">
      <div className="section-head"><div><span className="section-index">[ LE PREMIER DROP ]</span><h2>Choisis ton niveau.</h2></div><p>Du frisson fruité à la zone de turbulences.</p></div>
      <div className="level-grid">{products.map((product) => <article id={product.id} className={`level-card level-card--${product.id}`} key={product.id}><div className="level-copy"><span>{levelLabels[product.heatLevel]}</span><strong>{product.name}</strong><em>{product.flavor}</em><small>{product.profile}</small><p>{product.description[0]}<br/>{product.description[1]}</p><Heat score={product.heatScore}/><button className="button" onClick={() => add(product.id)}>Ajouter · {money(product.price || 0)}</button></div><div className="level-bottle"><Bottle product={product}/></div></article>)}</div>
    </section>

    {products.map((product) => <section className={`product product--${product.id}`} id={product.id} key={product.id}>
      <div className="product-number">{product.number}<span>/03</span></div>
      <div className="product-visual"><Bottle product={product} /><span className="orbit">{product.profile} · {product.profile} ·</span></div>
      <div className="product-copy">
        <div className="product-meta"><span>{levelLabels[product.heatLevel]}</span><Heat score={product.heatScore}/><b>{product.heatScore}/5</b></div>
        {product.id === "void" && <div className="warning">▲ Pour palais avertis</div>}
        <h2>{product.name}</h2><h3>{product.flavor}</h3>
        <p className="profile">{product.profile}</p>
        <div className="description">{product.description.map((line) => <p key={line}>{line}</p>)}</div>
        <div className="pairings"><small>ACCORDS</small>{product.pairings?.map((pairing) => <span key={pairing}>{pairing}</span>)}</div>
        <div className="buy"><div><small>{product.volume} ML</small><strong>{money(product.price || 0)}</strong></div><button className="button" onClick={() => add(product.id)}>Ajouter au panier <span>＋</span></button></div>
      </div>
    </section>)}

    <section className="next">
      <div className="section-head"><div><span className="section-index">[ EN DÉVELOPPEMENT ]</span><h2>Next drops.</h2></div><p>Le laboratoire ne s’arrête jamais.</p></div>
      <div className="next-list">{comingSoon.map((item, index) => <div className="next-row" key={item.name}><span>0{index + 4}</span><strong>{item.name}</strong><p>{item.flavor}</p><small>{item.level}</small><i>Prochainement</i></div>)}</div>
      <form className="notify" onSubmit={(e) => { e.preventDefault(); setNotice(true); }}><label htmlFor="email">Recevoir les prochains signaux.</label><div><input id="email" type="email" placeholder="ton@email.ch" required/><button className="button">Me prévenir →</button></div>{notice && <p>Signal reçu — la connexion email sera activée prochainement.</p>}</form>
    </section>

    <section className="trio" id="trio">
      <div className="trio-copy"><span className="section-index">[ EXPÉRIENCE COMPLÈTE ]</span><h2>Le protocole<br/>en trois actes.</h2><p>PULSE pour ouvrir. RUSH pour accélérer. VOID pour franchir le seuil.</p><div className="trio-price"><strong>{money(trioPrice)}</strong><s>{money(50.7)}</s></div><button className="button button--light" onClick={addTrio}>Prendre le trio <span>＋</span></button></div>
      <div className="trio-bottles">{products.map((product) => <Bottle product={product} small key={product.id}/>)}</div>
    </section>

    <section className="craft" id="atelier"><div className="craft-photo"><span>ATELIER / SUISSE</span></div><div><span className="section-index">[ FAIT MAISON, POUR DE VRAI ]</span><h2>Petites quantités.<br/>Grandes idées.</h2><p>Chaque recette est développée, cuisinée et embouteillée à la main. Pas de compromis, pas de production anonyme.</p><div className="craft-points"><span>01<br/><b>Recettes originales</b></span><span>02<br/><b>Fabrication artisanale</b></span><span>03<br/><b>Petites séries</b></span></div></div></section>

    <section className="faq"><div><span className="section-index">[ INFOS UTILES ]</span><h2>FAQ & livraison.</h2><div className="trust"><span>◇<b>Paiement sécurisé*</b></span><span>◌<b>Expédition Suisse</b></span><span>□<b>CB · Apple Pay · Google Pay*</b></span></div><small>*Disponible lors du lancement du checkout.</small></div><div>{[
      ["Où livrez-vous ?", "En Suisse pour le lancement. D’autres zones suivront."], ["Combien coûte la livraison ?", "Tarif indicatif : 7.90 CHF. À confirmer avant le lancement."], ["Comment conserver les sauces ?", "Au frais après ouverture. Les indications définitives figureront sur le flacon."], ["Quelle sauce choisir ?", "PULSE pour commencer, RUSH pour monter, VOID pour aller au bout."], ["Comment sont-elles fabriquées ?", "En petites séries, à la main, à partir de recettes originales."], ["C’est vraiment piquant ?", "Oui — mais chaque recette est d’abord conçue pour être bonne."]
    ].map(([q, a]) => <details key={q}><summary>{q}<span>＋</span></summary><p>{a}</p></details>)}</div></section>

    <footer><div className="logo logo--footer">R<span>•</span>ED</div><p>SAUCES ARTISANALES<br/>GOÛT D’ABORD · FEU ENSUITE</p><div><a href="#sauces">Sauces</a><a href="#atelier">À propos</a><a href="#top">Instagram ↗</a></div><small>© 2026 RED — PREMIER DROP, BIENTÔT.</small></footer>

    {cartOpen && <div className="cart-layer" role="dialog" aria-modal="true" aria-label="Panier"><button className="cart-backdrop" aria-label="Fermer le panier" onClick={() => setCartOpen(false)}/><aside className="cart-drawer"><div className="cart-head"><div><small>TON PANIER</small><h2>{count ? `${count} article${count > 1 ? "s" : ""}` : "Encore vide"}</h2></div><button onClick={() => setCartOpen(false)} aria-label="Fermer">×</button></div><div className="cart-rows">{rows.length ? rows.map(({ product, quantity }) => <div className="cart-row" key={product.id}><Bottle product={product} small/><div><strong>{product.name}</strong><span>{product.flavor}</span><small>{money(product.price || 0)}</small><div className="quantity"><button onClick={() => update(product.id, -1)}>−</button><span>{quantity}</span><button onClick={() => update(product.id, 1)}>＋</button><button className="remove" onClick={() => setCart((c) => { const n = { ...c }; delete n[product.id]; return n; })}>Supprimer</button></div></div></div>) : <div className="empty"><span>○</span><p>Choisis ton niveau<br/>pour commencer.</p><button className="button" onClick={() => setCartOpen(false)}>Voir les sauces</button></div>}</div>{rows.length > 0 && <div className="cart-summary"><p><span>Sous-total</span><b>{money(subtotal)}</b></p><p><span>Livraison (indicative)</span><b>{money(shipping)}</b></p><p className="total"><span>Total</span><b>{money(subtotal + shipping)}</b></p><button className="button button--dark" onClick={() => setNotice(true)}>Commander bientôt</button><small>Le checkout sécurisé sera activé lors de la prochaine phase.</small></div>}</aside></div>}
  </main>;
}
