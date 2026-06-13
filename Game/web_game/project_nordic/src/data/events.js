export const events = [
  {
    text: "Un corbeau d'Odin observe le village : +8 foi.",
    apply: (game) => game.resources.add({ faith: 8 }),
  },
  {
    text: "Une tempête de Thor frappe les côtes : -12 bois.",
    apply: (game) => game.resources.add({ wood: -12 }),
  },
  {
    text: "Freyja veille sur les réserves : +14 nourriture.",
    apply: (game) => game.resources.add({ food: 14 }),
  },
  {
    text: "Njörd bénit le port : la prochaine expédition sera améliorée.",
    apply: (game) => {
      if (game.hasBuilding("port")) game.njordBlessing = true;
      else game.resources.add({ food: 8 });
    },
  },
  {
    text: "Loki provoque un incident : production ralentie temporairement.",
    apply: (game) => {
      game.productionMultiplier = 0.45;
      window.setTimeout(() => {
        game.productionMultiplier = 1;
        game.addEvent("Les artisans retrouvent leur rythme après la ruse de Loki.");
      }, 8000);
    },
  },
];
