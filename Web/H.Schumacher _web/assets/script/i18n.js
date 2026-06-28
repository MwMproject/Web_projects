(function () {
  const STORAGE_KEY = 'hs_lang';
  const DEFAULT_LANG = 'fr';

  const DICT = {
    fr: {
      'nav.accueil': 'Accueil',
      'nav.prestation': 'Prestation',
      'nav.references': 'Références',
      'nav.bureau': 'Bureau',
      'nav.actualites': 'Actualités',
      'nav.recrutement': 'Recrutement',
      'nav.contact': 'Contact',

      'hero.title': 'Pour une qualité d’eau maitrisée',

      'home.prestations.kicker': 'Expertise',
      'home.prestations.title': 'Nos prestations & compétences',
      'home.prestations.text': 'De la conception à la réalisation, nous couvrons la technique sanitaire, les fluides spéciaux, le traitement des eaux, les gaz médicaux, les piscines et les ouvrages aquatiques.',
      'home.prestations.btn': 'Voir nos prestations',

      'home.actus.kicker': 'Actualités',
      'home.actus.title': 'Dernières nouvelles du bureau',
      'home.actus.card1.tag': 'Santé',
      'home.actus.card1.title': 'Extension du bloc opératoire — CHUV, Lausanne',
      'home.actus.card1.text': 'Janvier 2026 — Démarrage des études d’exécution pour la modernisation de 18 salles chirurgicales.',
      'home.actus.card2.tag': 'Aquatique',
      'home.actus.card2.title': 'Nouveau système de filtration — Aquatis, Lausanne',
      'home.actus.card2.text': 'Décembre 2025 — Mise en service du nouveau traitement biologique pour les bassins tropicaux.',
      'home.actus.card3.tag': 'Sport',
      'home.actus.card3.title': 'Rénovation piscine des Mélèzes — Phase 2',
      'home.actus.card3.text': 'Novembre 2025 — Réception des travaux d’assainissement du bassin olympique et de la fosse plongeoir.',
      'home.actus.link': 'Lire la suite',
      'home.actus.btn': 'Toutes les actualités',

      'home.refs.kicker': 'Références',
      'home.refs.title': 'Quelques projets représentatifs',
      'home.refs.card1.tag': 'Loisirs / Aquarium',
      'home.refs.card1.title': 'Aquatis 2002 – 2017',
      'home.refs.card1.text': 'Conception des aquariums, traitement des eaux, filtration mécanique et biologique, fontaine décorative et miroir d’eau extérieur.',
      'home.refs.card2.tag': 'Sport / Piscine',
      'home.refs.card2.title': 'Piscine des Mélèzes',
      'home.refs.card2.text': 'Assainissement complet avec cuvelage inox, nage à contre-courant et nouveau local technique de traitement d’eau.',
      'home.refs.card3.tag': 'Santé / Gaz médicaux',
      'home.refs.card3.title': 'BOPC — CHUV',
      'home.refs.card3.text': 'Réaménagement et modernisation complète de 18 salles chirurgicales dans le plus grand bloc opératoire centralisé de Suisse.',
      'home.refs.link': 'Voir la fiche projet',
      'home.refs.btn': 'Toutes les références',

      'footer.nav.title': 'Navigation',
      'footer.bottom': '© 2026 H. Schumacher — Tous droits réservés',
    },
    de: {
      'nav.accueil': 'Startseite',
      'nav.prestation': 'Leistungen',
      'nav.references': 'Referenzen',
      'nav.bureau': 'Büro',
      'nav.actualites': 'Aktuelles',
      'nav.recrutement': 'Stellenangebote',
      'nav.contact': 'Kontakt',

      'hero.title': 'Für eine kontrollierte Wasserqualität',

      'home.prestations.kicker': 'Expertise',
      'home.prestations.title': 'Unsere Leistungen & Kompetenzen',
      'home.prestations.text': 'Von der Planung bis zur Umsetzung decken wir Sanitärtechnik, Spezialflüssigkeiten, Wasseraufbereitung, medizinische Gase, Schwimmbäder und Wasserbauten ab.',
      'home.prestations.btn': 'Unsere Leistungen ansehen',

      'home.actus.kicker': 'Aktuelles',
      'home.actus.title': 'Neuigkeiten aus dem Büro',
      'home.actus.card1.tag': 'Gesundheit',
      'home.actus.card1.title': 'Erweiterung des Operationstrakts — CHUV, Lausanne',
      'home.actus.card1.text': 'Januar 2026 — Beginn der Ausführungsplanung zur Modernisierung von 18 Operationssälen.',
      'home.actus.card2.tag': 'Wasser',
      'home.actus.card2.title': 'Neue Filteranlage — Aquatis, Lausanne',
      'home.actus.card2.text': 'Dezember 2025 — Inbetriebnahme der neuen biologischen Aufbereitung für die Tropenbecken.',
      'home.actus.card3.tag': 'Sport',
      'home.actus.card3.title': 'Sanierung Schwimmbad Mélèzes — Phase 2',
      'home.actus.card3.text': 'November 2025 — Abnahme der Sanierungsarbeiten am Olympiabecken und am Sprungbecken.',
      'home.actus.link': 'Weiterlesen',
      'home.actus.btn': 'Alle Neuigkeiten',

      'home.refs.kicker': 'Referenzen',
      'home.refs.title': 'Einige repräsentative Projekte',
      'home.refs.card1.tag': 'Freizeit / Aquarium',
      'home.refs.card1.title': 'Aquatis 2002 – 2017',
      'home.refs.card1.text': 'Planung der Aquarien, Wasseraufbereitung, mechanische und biologische Filterung, Zierbrunnen und Wasserspiegel im Außenbereich.',
      'home.refs.card2.tag': 'Sport / Schwimmbad',
      'home.refs.card2.title': 'Schwimmbad Mélèzes',
      'home.refs.card2.text': 'Komplettsanierung mit Edelstahlauskleidung, Gegenstromanlage und neuer Wasseraufbereitungstechnik.',
      'home.refs.card3.tag': 'Gesundheit / Medizinische Gase',
      'home.refs.card3.title': 'BOPC — CHUV',
      'home.refs.card3.text': 'Umbau und vollständige Modernisierung von 18 Operationssälen im größten zentralisierten OP-Trakt der Schweiz.',
      'home.refs.link': 'Projekt ansehen',
      'home.refs.btn': 'Alle Referenzen',

      'footer.nav.title': 'Navigation',
      'footer.bottom': '© 2026 H. Schumacher — Alle Rechte vorbehalten',
    },
    en: {
      'nav.accueil': 'Home',
      'nav.prestation': 'Services',
      'nav.references': 'References',
      'nav.bureau': 'About us',
      'nav.actualites': 'News',
      'nav.recrutement': 'Careers',
      'nav.contact': 'Contact',

      'hero.title': 'For controlled water quality',

      'home.prestations.kicker': 'Expertise',
      'home.prestations.title': 'Our services & expertise',
      'home.prestations.text': 'From design to completion, we cover sanitary engineering, specialty fluids, water treatment, medical gases, swimming pools and aquatic structures.',
      'home.prestations.btn': 'View our services',

      'home.actus.kicker': 'News',
      'home.actus.title': 'Latest news from the firm',
      'home.actus.card1.tag': 'Health',
      'home.actus.card1.title': 'Operating block extension — CHUV, Lausanne',
      'home.actus.card1.text': 'January 2026 — Start of detailed design studies for the modernisation of 18 operating rooms.',
      'home.actus.card2.tag': 'Aquatic',
      'home.actus.card2.title': 'New filtration system — Aquatis, Lausanne',
      'home.actus.card2.text': 'December 2025 — Commissioning of the new biological treatment for the tropical pools.',
      'home.actus.card3.tag': 'Sport',
      'home.actus.card3.title': 'Mélèzes pool renovation — Phase 2',
      'home.actus.card3.text': 'November 2025 — Completion of refurbishment works on the olympic pool and diving pit.',
      'home.actus.link': 'Read more',
      'home.actus.btn': 'All news',

      'home.refs.kicker': 'References',
      'home.refs.title': 'A few representative projects',
      'home.refs.card1.tag': 'Leisure / Aquarium',
      'home.refs.card1.title': 'Aquatis 2002 – 2017',
      'home.refs.card1.text': 'Design of the aquariums, water treatment, mechanical and biological filtration, decorative fountain and outdoor water mirror.',
      'home.refs.card2.tag': 'Sport / Swimming pool',
      'home.refs.card2.title': 'Mélèzes swimming pool',
      'home.refs.card2.text': 'Full refurbishment with stainless steel lining, counter-current swimming and new water treatment plant room.',
      'home.refs.card3.tag': 'Health / Medical gases',
      'home.refs.card3.title': 'BOPC — CHUV',
      'home.refs.card3.text': 'Refurbishment and complete modernisation of 18 operating rooms in the largest centralised operating block in Switzerland.',
      'home.refs.link': 'View project sheet',
      'home.refs.btn': 'All references',

      'footer.nav.title': 'Navigation',
      'footer.bottom': '© 2026 H. Schumacher — All rights reserved',
    },
  };

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  }

  function applyTranslations(lang) {
    const dict = DICT[lang] || DICT[DEFAULT_LANG];
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const pairs = el.getAttribute('data-i18n-attr').split(',');
      pairs.forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        if (dict[key]) el.setAttribute(attr, dict[key]);
      });
    });

    document.querySelectorAll('.lang-switch button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  window.setLang = function (lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations(lang);
  };

  document.addEventListener('DOMContentLoaded', () => {
    applyTranslations(getLang());
  });
})();
