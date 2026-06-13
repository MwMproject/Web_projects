import { buildings } from "../data/buildings.js";

export class UI {
  constructor(game) {
    this.game = game;
    this.resourceBar = document.querySelector("#resourceBar");
    this.buildingList = document.querySelector("#buildingList");
    this.eventLog = document.querySelector("#eventLog");
    this.placementHint = document.querySelector("#placementHint");
    this.expeditionButton = document.querySelector("#expeditionButton");
    this.expeditionStatus = document.querySelector("#expeditionStatus");
    this.cancelBuildButton = document.querySelector("#cancelBuildButton");
    this.villageStatus = document.querySelector("#villageStatus");

    this.bind();
    this.renderBuildingList();
  }

  bind() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => this.activateTab(button.dataset.tab));
    });

    this.cancelBuildButton.addEventListener("click", () => this.game.cancelBuildMode());
    this.expeditionButton.addEventListener("click", () => this.game.expeditions.start());
  }

  activateTab(tabName) {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tab === tabName);
    });
    document.querySelectorAll(".panel-section").forEach((section) => {
      section.classList.toggle("is-active", section.id === `${tabName}Panel`);
    });
  }

  render() {
    this.renderResources();
    this.renderBuildingList();
    this.renderEvents();
    this.renderExpedition();
    this.renderPlacementHint();
    this.villageStatus.textContent = `${this.game.villagers.length}/${this.game.getPopulationCap()} villageois`;
  }

  renderResources() {
    const definitions = this.game.resources.definitions;
    this.resourceBar.innerHTML = Object.entries(definitions).map(([id, resource]) => `
      <div class="resource-pill" title="${resource.label}">
        <span class="resource-icon" style="background:${resource.color}"></span>
        <strong>${resource.short}</strong>
        <span>${Math.floor(this.game.resources.get(id))}</span>
      </div>
    `).join("");
  }

  renderBuildingList() {
    this.buildingList.innerHTML = buildings.map((building) => {
      const unlocked = this.game.buildings.isUnlocked(building);
      const selected = this.game.selectedBuildingId === building.id;
      return `
        <button class="building-card ${selected ? "is-selected" : ""} ${unlocked ? "" : "is-locked"}"
          type="button"
          data-building-id="${building.id}"
          ${unlocked ? "" : "disabled"}>
          <canvas class="building-sprite" width="42" height="42" data-sprite="${building.id}"></canvas>
          <span>
            <span class="building-name">
              <span>${building.name}</span>
              <span>${this.game.buildings.count(building.id)}</span>
            </span>
            <span class="building-desc">${building.description}</span>
            <span class="building-cost">${this.formatCost(building.cost)}</span>
          </span>
        </button>
      `;
    }).join("");

    this.buildingList.querySelectorAll(".building-card").forEach((button) => {
      button.addEventListener("click", () => this.game.selectBuilding(button.dataset.buildingId));
    });

    this.drawBuildingSprites();
  }

  drawBuildingSprites() {
    this.buildingList.querySelectorAll("canvas[data-sprite]").forEach((canvas) => {
      const building = buildings.find((item) => item.id === canvas.dataset.sprite);
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = building.color.base;
      ctx.fillRect(9, 17, 24, 17);
      ctx.fillStyle = building.color.roof;
      ctx.fillRect(6, 11, 30, 8);
      ctx.fillStyle = "#15110d";
      ctx.fillRect(19, 25, 6, 9);
    });
  }

  renderEvents() {
    this.eventLog.innerHTML = this.game.eventLog.map((event) => `
      <div class="event-entry"><strong>${event.time}</strong> ${event.message}</div>
    `).join("");
  }

  renderExpedition() {
    const hasPort = this.game.hasBuilding("port");
    const active = this.game.expeditions.active;
    this.expeditionButton.disabled = !hasPort || Boolean(active);
    if (!hasPort) {
      this.expeditionStatus.textContent = "Le port est requis pour envoyer un équipage.";
    } else if (active) {
      this.expeditionStatus.textContent = `Expédition en cours : retour dans ${Math.ceil(active.remaining)} s.`;
    } else {
      this.expeditionStatus.textContent = "Coût : 25 nourriture, 20 bois. Les dieux décideront du reste.";
    }
  }

  renderPlacementHint() {
    const selected = buildings.find((building) => building.id === this.game.selectedBuildingId);
    this.placementHint.classList.toggle("is-hidden", !selected);
    if (selected) {
      this.placementHint.textContent = `Placement : ${selected.name}. Cliquez une case de sol constructible.`;
    }
  }

  formatCost(cost) {
    return Object.entries(cost)
      .map(([resource, amount]) => `${amount} ${this.game.resources.definitions[resource].short}`)
      .join(" · ");
  }
}
