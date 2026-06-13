export class ExpeditionSystem {
  constructor(game) {
    this.game = game;
    this.active = null;
    this.baseCost = { food: 25, wood: 20 };
  }

  start() {
    if (!this.game.hasBuilding("port")) {
      this.game.addEvent("Il faut d'abord construire un port.");
      return false;
    }
    if (this.active) {
      this.game.addEvent("Une expédition est déjà en mer.");
      return false;
    }
    if (!this.game.resources.spend(this.baseCost)) {
      this.game.addEvent("L'équipage manque de bois ou de nourriture.");
      return false;
    }

    this.active = {
      remaining: 8,
      boosted: this.game.njordBlessing,
    };
    this.game.njordBlessing = false;
    this.game.addEvent("Un drakkar quitte le port vers les brumes du nord.");
    this.game.notify();
    return true;
  }

  update(delta) {
    if (!this.active) return;
    this.active.remaining -= delta;
    if (this.active.remaining > 0) return;
    this.resolve();
  }

  resolve() {
    const roll = Math.random() + (this.active.boosted ? 0.18 : 0);
    this.active = null;

    if (roll < 0.25) {
      this.game.resources.add({ wood: -10, food: -10 });
      this.game.addEvent("Le brouillard égare l'équipage : une partie des provisions est perdue.");
    } else if (roll < 0.58) {
      this.game.resources.add({ wood: 35, stone: 20, food: 15 });
      this.game.addEvent("Les rameurs reviennent chargés de ressources.");
    } else if (roll < 0.82) {
      this.game.resources.add({ iron: 18, faith: 12 });
      this.game.addEvent("Une relique gravée de runes est rapportée au village.");
    } else {
      this.game.resources.add({ faith: 24, iron: 10 });
      this.game.addEvent("Un signe mythologique accompagne le retour du drakkar.");
    }

    this.game.notify();
  }
}
