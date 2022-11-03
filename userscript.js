// ==UserScript==
// @name         @zikeji/kittens
// @namespace    https://www.github.com/zikeji/kittens
// @description  Various automations for Kittens Game
// @match        *kittensgame.com/web/*
// @match        *kittensgame.com/beta/*
// @match        *kittensgame.com/alpha/*
// @version      0.0.10
// @grant        none
// @author       You
// @copyright    2022, Zikeji
// @icon         https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f63c.png
// ==/UserScript==

(() => {
	class zikeji {
		constructor() {
			/** @type {AutoObserve} */
			this.AutoObserve = new AutoObserve();
			/** @type {AutoHunt} */
			this.AutoHunt = new AutoHunt();
			/** @type {AutoCraft} */
			this.AutoCraft = new AutoCraft();
			/** @type {AutoPromote} */
			this.AutoPromote = new AutoPromote(this);
			/** @type {AutoPraise} */
			this.AutoPraise = new AutoPraise();
			/** @type {AutoTrade} */
			this.AutoTrade = new AutoTrade(this);
			/** @type {number} */
			this._tickTimeout = setTimeout(this._tick.bind(this), 1e3);
			/** @type {number} */
			this._refreshUITimeout = setTimeout(this._refreshUI.bind(this), 10e3);
			this._buildMenu()
		}

		log(...data) {
			console.log(`%c@zikeji/kittens`, 'color:#DF01D7; font-weight: bold; background: #000; padding: 0.1rem 0.3rem', ...data);
		}

		async _tick() {
			await new Promise((resolve) => setTimeout(resolve, 1));
			try {
				this.AutoHunt._execute();
				this.AutoCraft._execute();
				this.AutoPromote._execute();
				this.AutoPraise._execute();
				this.AutoTrade._execute();
			} catch (e) {
				this.log('Encountered error handling _tick.', e);
			}
			this._tickTimeout = setTimeout(this._tick.bind(this), 2e3);
		}

		async _refreshUI() {
			await new Promise((resolve) => setTimeout(resolve, 1));
			try {
				this.AutoObserve._refreshUI();
				this.AutoHunt._refreshUI();
				this.AutoCraft._refreshUI();
				this.AutoPromote._refreshUI();
				this.AutoPraise._refreshUI();
				this.AutoTrade._refreshUI();
			} catch (e) {
				this.log('Encountered error handling _refreshUI.', e);
			}
			this._refreshUITimeout = setTimeout(this._refreshUI.bind(this), 10e3);
		}

		_buildMenu() {
			const optionsDiv = document.getElementById('optionsDiv');

			const toggle = document.createElement('a');
			toggle.href = '#';
			toggle.innerHTML = '@zikeji/kittens';

			const container = document.createElement('div');
			container.style.display = 'none';

			toggle.addEventListener('click', (event) => {
				event.preventDefault();
				event.stopPropagation();
				container.style.display = container.style.display === 'none' ? 'block' : 'none';
			});

			this.AutoObserve._buildOptions(container);
			this.AutoHunt._buildOptions(container);
			this.AutoCraft._buildOptions(container);
			this.AutoPromote._buildOptions(container);
			this.AutoPraise._buildOptions(container);
			this.AutoTrade._buildOptions(container);

			optionsDiv.querySelector('.optsExtra').after(document.createElement('br'), document.createElement('br'), toggle);
			toggle.after(container);
		}
	}

	/**
	 * @typedef {object} Resource
	 * @property {string} name
	 * @property {string} title
	 * @property {string} tag
	 * @property {number} value
	 * @property {number} maxValue
	 * @property {boolean} unlocked
	 */

	/**
	 * @typedef {object} Race
	 * @property {{name: string; val: number}[]} buys
	 * @property {string} name
	 * @property {string} title
	 * @property {boolean} unlocked
	 */

	/**
	 * @typedef {object} Technology
	 * @property {string} name
	 * @property {string} label
	 * @property {string} flavor
	 * @property {string} effectDesc
	 * @property {string} description
	 * @property {boolean} researched
	 * @property {boolean} unlocked
	 */

	/**
	 * @typedef {object} Game
	 * @property {(message: string, type?: string, tag?: "alicornCorruption" | "alicornRift" | "alicornSacrifice" | "astronomicalEvent" | "craft" | "elders" | "faith" | "hunt" | "ivoryMeteor" | "meteor" | "tcRefine" | "tcShatter" | "trade" | "unicornRift" | "unicornSacrifice" | "workshopAutomation", noBullet?: boolean) => void} msg
	 * @property {object} resPool
	 * @property {(name: string) => Resource | false} resPool.get
	 * @property {(pays: {name: string; val: number}[]) => void} resPool.payPrices
	 * @property {object} village
	 * @property {() => void} village.sendHunters
	 * @property {(name: string, qty: number) => void} craft
	 * @property {(name: string) => number} getResCraftRatio
	 * @property {object} diplomacy
	 * @property {(name: string) => Race | false} diplomacy.get
	 * @property {Race[]} diplomacy.races
	 * @property {(race: Race, trades: number) => void} diplomacy.tradeMultiple
	 * @property {object} science
	 * @property {(name: string) => Technology | false} science.get
	 */

	class BaseModule {
		/**
		 * @param {string} module 
		 */
		constructor(module, defaultEnabled) {
			this.module = module;
			/** @type {Game} */
			this.game = gamePage;
			/** @type {HTMLInputElement} */
			this.checkbox;
			/** @type {HTMLElement} */
			this.label;
			/** @type {HTMLDivElement|null} */
			this.optionsContainer = null;
			if (this.getConfig('enabled', defaultEnabled === false ? '0' : '1') === '1') {
				if (this.isUnlocked()) {
					this.enable();
				} else {
					this.disable();
				}
			} else {
				this.disable();
			}
		}

		/**
		 * @returns {boolean}
		 */
		isUnlocked() {
			return true;
		}

		log(...data) {
			console.log(`%c@zikeji/${this.module}`, 'color:#DF01D7; font-weight: bold; background: #000; padding: 0.1rem 0.3rem', ...data);
		}

		/**
		 * @param {string} key 
		 * @param {string} defaultValue 
		 * @returns {string}
		 */
		getConfig(key, defaultValue) {
			return localStorage.getItem(`zikeji/${this.module}/${key}`) ?? defaultValue;
		}

		/**
		 * @param {string} key 
		 * @param {string} value 
		 */
		setConfig(key, value) {
			localStorage.setItem(`zikeji/${this.module}/${key}`, value);
		}

		enable() {
			this.enabled = true;
			this.setConfig('enabled', '1');
			if (this.checkbox) {
				this.checkbox.checked = true;
			}
			if (this.optionsContainer) {
				this.optionsContainer.style.display = 'block';
			}
			this.log('Enabled');
		}

		disable() {
			this.enabled = false;
			this.setConfig('enabled', '0');
			if (this.checkbox) {
				this.checkbox.checked = false;
			}
			if (this.optionsContainer) {
				this.optionsContainer.style.display = 'none';
			}
			this.log('Disabled');
		}

		_execute() {
			throw new Error("Not Implemented");
		}

		_refreshUI() {
			if (this.isUnlocked()) {
				if (this.label.style.display === 'none') {
					this.label.style.display = 'block';
					if (this.optionsContainer) {
						this.optionsContainer.style.display = this.enabled ? 'block' : 'none';
					}
				}
			} else if (this.label.style.display === 'block') {
				this.label.style.display = 'none';
				if (this.optionsContainer) {
					this.optionsContainer.style.display = 'none';
				}
			}
		}

		/**
		 * @param {HTMLDivElement} container 
		 */
		_buildOptions(container) {
			this.checkbox = document.createElement('input');
			this.checkbox.id = `@zikeji/kittens/${this.module}/enabled`;
			this.checkbox.type = 'checkbox';
			this.checkbox.checked = this.enabled;

			this.label = document.createElement('label');
			this.label.id = `label/${this.checkbox.id}`;
			this.label.for = this.checkbox.id;
			this.label.innerHTML = `Enable ${this.module}`;
			this.label.style.display = this.isUnlocked() ? 'block' : 'none';

			this.label.addEventListener('click', () => {
				if (this.enabled) {
					this.disable();
				} else {
					this.enable();
				}
			});

			container.append(this.checkbox, this.label);
		}
	}

	class AutoObserve extends BaseModule {
		constructor() {
			super('AutoObserve');
			this._observer = new MutationObserver(this._execute.bind(this));
			this._observer.observe(document.getElementById('observeButton'), {
				childList: true
			});
		}

		/**
		 * @param {MutationRecord[]} list
		 */
		_execute(list) {
			if (!this.enabled) return;
			for (const mutation of list) {
				for (const node of mutation.addedNodes) {
					if (node.id === 'observeBtn') {
						setTimeout(() => {
							node.click();
							this.log('Observed Astronomical Event');
						}, 1e3);
					}
				}
			}
		}
	}

	class AutoHunt extends BaseModule {
		constructor() {
			super('AutoHunt');
		}

		_execute() {
			if (!this.enabled) return;
			const power = this.game.resPool.get('manpower');
			if (!power) return;
			if (power.value / power.maxValue > 0.95) {
				this.game.resPool.payPrices([{ name: "manpower", val: 100 }]);
				this.game.village.sendHunters();
			}
		}
	}

	/**
	 * @typedef {object} Craftable
	 * @property {boolean} enabled
	 * @property {string} resource
	 * @property {number} amount
	 * @property {number} ratio
	 * @property {Array<[string, number]>} [guards]
	 * @property {() => boolean} [handle]
	 * @property {boolean} [log]
	 */

	class AutoCraft extends BaseModule {
		constructor() {
			super('AutoCraft');
			/** @type {Record<string,Craftable>} */
			this._craftables = {
				catnip: {
					resource: 'wood',
					amount: 10,
					ratio: 0.95
				},
				wood: {
					resource: 'beam',
					amount: 1,
					ratio: 0.95
				},
				minerals: {
					resource: 'slab',
					amount: 1,
					ratio: 0.95
				},
				iron: {
					resource: 'plate',
					amount: 1,
					ratio: 0.95
				},
				coal: {
					resource: 'steel',
					amount: 1,
					ratio: 0.95,
					guards: [
						['iron', 100]
					],
					log: true
				},
				oil: {
					resource: 'kerosene',
					amount: 1,
					ratio: 0.95,
					log: true
				},
				titanium: {
					resource: 'alloy',
					amount: 1,
					guards: [
						['steel', 300]
					],
					ratio: 0.95,
					log: true
				},
				uranium: {
					resource: 'thorium',
					amount: 1,
					ratio: 0.95,
					log: true
				},
				unobtainium: {
					resource: 'eludium',
					amount: 1,
					guards: [
						['alloy', 2500]
					],
					ratio: 0.95,
					log: true
				},
				culture: {
					resource: 'manuscript',
					amount: 1,
					ratio: 0.95,
					handle: () => {
						let shouldCraft = true;
						const parchment = this.game.resPool.get('parchment');
						const furs = this.game.resPool.get('furs');
						if (!parchment || !furs) return false;
						if (parchment.value < 25) {
							shouldCraft = false;
							const quantityRequired = Math.ceil((25 - parchment.value) / (1 + this.game.getResCraftRatio('parchment')));
							if (furs.value > (175 * quantityRequired)) {
								this.game.craft('parchment', quantityRequired);
								shouldCraft = true;
							}
						}
						if (!shouldCraft) return false;
						this.game.craft('manuscript', 1);
						return true;
					},
					log: true
				}
			};
			for (const item of Object.keys(this._craftables)) {
				this._craftables[item].enabled = this.getConfig(`${item}/enabled`, '1') === '1';
			}
		}

		/**
		 * @param {string} item
		 */
		enableCraftable(item) {
			if (!this._craftables[item]) {
				this.log('Craftable does not exist.');
				return;
			}
			this.setConfig(`${item}/enabled`, '1');
			this._craftables[item].enabled = true;
		}

		/**
		 * @param {string} item
		 */
		disableCraftable(item) {
			if (!this._craftables[item]) {
				this.log('Craftable does not exist.');
				return;
			}
			this.setConfig(`${item}/enabled`, '0');
			this._craftables[item].enabled = false;
		}

		_execute() {
			if (!this.enabled) return;
			for (const item of Object.keys(this._craftables)) {
				const options = this._craftables[item];
				if (!options.enabled) continue;
				const res = this.game.resPool.get(item);
				if (!res || !res.unlocked) continue;
				if (res.value / res.maxValue > options.ratio) {
					let shouldCraft = true;
					if (options.guards) {
						for (const [resource, quantity] of options.guards) {
							if (this.game.resPool.get(resource).value < quantity) {
								shouldCraft = false;
							}
						}
					}
					if (!shouldCraft) continue;
					const crafted = options.handle ? options.handle.apply(this) : (this.game.craft(options.resource, options.amount) ?? true);
					if (options.log && crafted) {
						const actualAmount = Math.round((options.amount * (1 + this.game.getResCraftRatio(options.resource))) * 100) / 100;
						this.game.msg(`+${actualAmount} ${options.resource}`);
						this.log(`crafted ${actualAmount} ${options.resource}`);
					}
				}
			}
		}

		/**
		 * @param {HTMLDivElement} container 
		 */
		_buildOptions(container) {
			super._buildOptions(container);

			/** @type {HTMLDivElement} */
			this.optionsContainer = document.createElement('div');
			this.optionsContainer.style.display = this.enabled ? 'block' : 'none';

			for (const key of Object.keys(this._craftables)) {
				const checkbox = document.createElement('input');
				checkbox.id = `@zikeji/kittens/${this.module}/${key}/enabled`;
				checkbox.type = 'checkbox';
				checkbox.checked = this._craftables[key].enabled;

				const toggleLabel = document.createElement('label');
				toggleLabel.id = `label/${checkbox.id}`;
				toggleLabel.for = checkbox.id;
				toggleLabel.innerHTML = `Enable ${this.module}/${key}`;
				toggleLabel.style.display = 'block';

				toggleLabel.addEventListener('click', () => {
					if (this._craftables[key].enabled) {
						checkbox.checked = false;
						this.disableCraftable(key);
					} else {
						checkbox.checked = true;
						this.enableCraftable(key);
					}
				});

				this.optionsContainer.append(checkbox, toggleLabel);
			}

			container.append(this.optionsContainer);
		}
	}

	class AutoPromote extends BaseModule {
		constructor(zikeji) {
			super('AutoPromote');
			/** @type {zikeji} */
			this.zikeji = zikeji;
		}

		isUnlocked() {
			return this.game.science.get('civil')?.researched === true;
		}

		enable() {
			super.enable();
			if (this.zikeji && this.zikeji.AutoTrade.enabled) {
				this.zikeji.AutoTrade.disable();
			}
		}

		disable() {
			super.disable();
		}

		_execute() {
			if (!this.enabled) return;
			const gold = this.game.resPool.get('gold');
			if (!gold || !gold.unlocked) return;
			if (gold.value / gold.maxValue > 0.95) {
				this.game.village.promoteKittens();
			}
		}
	}

	class AutoPraise extends BaseModule {
		constructor() {
			super('AutoPraise');
		}

		isUnlocked() {
			return this.game.resPool.get('faith')?.unlocked === true;
		}

		_execute() {
			if (!this.enabled) return;
			const faith = this.game.resPool.get('faith');
			if (!faith || !faith.unlocked) return;
			if (faith.value / faith.maxValue > 0.95) {
				this.game.religion.praise();
			}
		}
	}

	// <label id="test" for="schemeToggle">Color theme:</label>
	// <input id="test" type="text">

	class AutoTrade extends BaseModule {
		constructor(zikeji) {
			super('AutoTrade', false);
			/** @type {zikeji} */
			this.zikeji = zikeji;
			/** @type {string} */
			this.activeRace = this.getConfig('activeRace', 'lizards');
			/** @type {Record<string, HTMLInputElement>} */
			this.checkboxes = {};
			/** @type {Record<string, HTMLElement>} */
			this.labels = {};
		}

		isUnlocked() {
			for (const race of this.game.diplomacy.races) {
				if (race.unlocked) {
					return true;
				}
			}
			return false;
		}

		enable() {
			super.enable();
			if (this.zikeji && this.zikeji.AutoPromote.enabled) {
				this.zikeji.AutoPromote.disable();
			}
		}

		disable() {
			super.disable();
		}

		_execute() {
			if (!this.enabled) return;
			const gold = this.game.resPool.get('gold');
			if (!gold || !gold.unlocked) return;
			if (gold.value / gold.maxValue > 0.95) {
				const race = this.game.diplomacy.get(this.activeRace);
				if (!race) return;
				for (const buys of race.buys) {
					const data = this.game.resPool.get(buys.name);
					if (!data) continue;
					if (buys.val > data.value) {
						return;
					}
				}
				this.game.diplomacy.tradeMultiple(race, 1);
				this.log(`Automatically traded with ${race.title}`);
			}
		}

		_refreshUI() {
			super._refreshUI();
			for (const race of this.game.diplomacy.races) {
				if (race.unlocked && this.labels[race.name].style.display === 'none') {
					this.labels[race.name].style.display = 'block';
				}
			}
		}

		/**
		 * @param {HTMLDivElement} container 
		 */
		_buildOptions(container) {
			super._buildOptions(container);

			/** @type {HTMLDivElement} */
			this.optionsContainer = document.createElement('div');
			this.optionsContainer.style.display = this.enabled ? 'block' : 'none';

			for (const race of this.game.diplomacy.races) {
				const checkbox = document.createElement('input');
				checkbox.id = `@zikeji/kittens/${this.module}/${race.name}/active`;
				checkbox.type = 'checkbox';
				checkbox.checked = this.activeRace === race.name;

				this.checkboxes[race.name] = checkbox;

				const toggleLabel = document.createElement('label');
				toggleLabel.id = `label/${checkbox.id}`;
				toggleLabel.for = checkbox.id;
				toggleLabel.innerHTML = `Trade with ${race.name}`;
				toggleLabel.style.display = 'block';

				this.labels[race.name] = toggleLabel;

				if (!race.unlocked) {
					toggleLabel.style.display = 'none';
				}

				toggleLabel.addEventListener('click', () => {
					for (const name of Object.keys(this.checkboxes)) {
						if (name !== race.name) {
							this.checkboxes[name].checked = false;
						} else {
							this.checkboxes[name].checked = true;
						}
					}
					this.setConfig('activeRace', race.name);
					this.activeRace = race.name;
				});

				this.optionsContainer.append(checkbox, toggleLabel);
			}

			container.append(this.optionsContainer);
		}
	}

	const waitForDojo = (func) => {
		if (window.dojo) {
			return func();
		}
		setTimeout(() => {
			waitForDojo(func);
		}, 100);
	};
	waitForDojo(() => {
		dojo.addOnLoad(() => {
			dojo.subscribe('server/load', () => {
				window.zikeji = new zikeji();
			});
		});
	});
})();