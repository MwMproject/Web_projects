export const roles = {
  idle: {
    label: "Libre",
    description: "Se promène dans le village.",
    color: "#8b7a9a",
  },
  farmer: {
    label: "Paysan",
    description: "Produit de la nourriture, surtout si des champs existent.",
    color: "#7ea66a",
    produces: { interval: 7, resources: { food: 4 } },
  },
  woodcutter: {
    label: "Bûcheron",
    description: "Produit du bois pour les constructions.",
    color: "#8a5a32",
    produces: { interval: 8, resources: { wood: 4 } },
  },
  miner: {
    label: "Mineur",
    description: "Produit pierre et parfois un peu de fer.",
    color: "#79837e",
    produces: { interval: 9, resources: { stone: 4, iron: 1 } },
  },
  blacksmith: {
    label: "Forgeron",
    description: "Améliore la production de fer si une forge existe.",
    color: "#b85c4a",
    requiresBuilding: "forge",
    produces: { interval: 10, resources: { iron: 3 } },
  },
  warrior: {
    label: "Guerrier",
    description: "Prépare la défense du village pour les futures vagues ennemies.",
    color: "#9a4b3f",
  },
  navigator: {
    label: "Navigateur",
    description: "Réduit le risque des expéditions.",
    color: "#6f9eb2",
  },
};
