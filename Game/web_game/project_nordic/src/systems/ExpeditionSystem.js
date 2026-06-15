export class ExpeditionSystem {
  constructor(game) {
    this.game = game;
    this.active = null;
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

    const plan = this.game.worldMap.getSelectedPlan();
    const cost = this.game.worldMap.getCost(plan.destination, plan.mode);
    const duration = this.game.worldMap.getDuration(plan.destination);
    const navigatorBonus = Math.min(0.18, this.game.getRoleCount("navigator") * 0.06);
    const risk = Math.max(0.04, this.game.worldMap.getRisk(plan.destination, plan.mode) - navigatorBonus);

    if (!this.game.resources.spend(cost)) {
      this.game.addEvent("L'équipage manque de ressources pour cette route.");
      return false;
    }

    this.active = {
      destinationId: plan.destination.id,
      destinationName: plan.destination.name,
      modeId: plan.modeId,
      modeLabel: plan.mode.label,
      remaining: duration,
      total: duration,
      risk,
      boosted: this.game.njordBlessing,
    };
    this.game.njordBlessing = false;
    this.game.addEvent(`Un drakkar part vers ${plan.destination.name} : ${plan.mode.label.toLowerCase()}.`);
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
    const active = this.active;
    const destination = this.game.worldMap.getDestination(active.destinationId);
    const mode = this.game.worldMap.modes[active.modeId];
    const clan = this.game.worldMap.getClan(destination.clanId);
    const risk = Math.max(0.04, active.risk - (active.boosted ? 0.12 : 0));
    const success = Math.random() > risk;
    const greatSuccess = success && Math.random() > 0.72;
    this.active = null;

    if (!success) {
      this.game.resources.add({ wood: -8, food: -8 });
      this.game.worldMap.changeRelation(destination.clanId, -4);
      this.game.addEvent(`L'expédition vers ${destination.name} revient affaiblie. ${clan.name} se méfie davantage.`);
    } else if (active.modeId === "raid") {
      const gains = this.scaleRewards(destination.rewards, greatSuccess ? 1.55 : 1.15);
      this.game.resources.add(gains);
      this.game.worldMap.changeRelation(destination.clanId, mode.relationImpact);
      this.game.addEvent(`Raid réussi à ${destination.name}. Butin rapporté, mais les relations se tendent.`);
    } else if (active.modeId === "trade") {
      const gains = this.scaleRewards(destination.rewards, greatSuccess ? 1.05 : 0.72);
      this.game.resources.add(gains);
      this.game.worldMap.changeRelation(destination.clanId, mode.relationImpact);
      this.game.addEvent(`Commerce conclu à ${destination.name}. ${clan.name} apprécie l'échange.`);
    } else {
      const gains = this.scaleRewards(destination.rewards, greatSuccess ? 1.35 : 0.92);
      this.game.resources.add(gains);
      this.game.worldMap.changeRelation(destination.clanId, mode.relationImpact);
      this.game.addEvent(`Les éclaireurs reviennent de ${destination.name} avec de nouvelles ressources.`);
    }

    this.game.notify();
  }

  scaleRewards(rewards, factor) {
    return Object.fromEntries(
      Object.entries(rewards).map(([resource, amount]) => [resource, Math.max(1, Math.round(amount * factor))]),
    );
  }
}
