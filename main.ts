import { App, ButtonComponent, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';
import { FileSuggest, FolderSuggest, getFilesInFolder, getLevel1Headers, updateFileWithTemplate, RunUpdate, RunAllRules, TemplateFolderStruct } from './file-ops';

interface MyPluginSettings {
	TemplateFolderArray: Array<TemplateFolderStruct>;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	TemplateFolderArray: [{ Template: '', Folder: '', IncludeSubFolders: false }],
}

export default class UFFT extends Plugin {
	settings: MyPluginSettings;
	DEBUG = false;

	async onload() {
		await this.loadSettings();
		const LastVersionUpdate = "241227 12:39:35 AM";
		console.log('UFFT is loaded! ' + LastVersionUpdate);

		// Expose the plugin to the window object for debugging
		if (this.DEBUG) {
			(window as any).UFFT = this;
		}

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('list-start', `UFFT - Update Files From Template`, async (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			await RunAllRules(this.app, this.settings.TemplateFolderArray);
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		this.addCommand({
			id: 'ufft-update-files-from-template',
			name: 'Update Files From Template',
			callback: async () => {
				await RunAllRules(this.app, this.settings.TemplateFolderArray);
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new UFFTSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			//console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class UFFTSettingTab extends PluginSettingTab {
	plugin: UFFT;

	constructor(app: App, plugin: UFFT) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async RunUpdate(index: number): Promise<void> {
		const template = this.plugin.settings.TemplateFolderArray[index].Template;
		const folder = this.plugin.settings.TemplateFolderArray[index].Folder;
		const includeSubFolders = this.plugin.settings.TemplateFolderArray[index].IncludeSubFolders;
		await RunUpdate(this.app, template, folder, includeSubFolders);
	}

	async RunAllRules(): Promise<void> {
		await RunAllRules(this.app, this.plugin.settings.TemplateFolderArray);
	}

	display(): void {
		const {containerEl} = this;
		this.containerEl.empty();
		this.add_ufft_setting();
	}

	add_ufft_setting(): void {
		this.containerEl.createEl('h1', {text: 'UFFT Settings'});

		const descEl = document.createDocumentFragment();

		descEl.append(
			'All rules will be executed in sequence.',	
			descEl.createEl('br'),
			'All files will be updated based on the template and folder settings.',
		);
		new Setting(this.containerEl)
			.setName('Update Files From Template')
			.setDesc(descEl)
			.addButton((button: ButtonComponent) => {
				button
					.setTooltip('Update Files From Template')
					.setButtonText('Update Files From Template')
					.setCta()
					.onClick(async () => {
						this.RunAllRules();
						await this.plugin.saveSettings();
						this.display();
					});
			});

		const ruleDesc = document.createDocumentFragment();
		ruleDesc.append(
			'1. Choose the template to use. ',
			ruleDesc.createEl('br'),
			'2. Choose the folder to use.',
		);
		new Setting(this.containerEl)
			.setName('Add new rule')
			.setDesc(ruleDesc)
			.addButton((button: ButtonComponent) => {
				button
					.setTooltip('Add new rule')
					.setButtonText('+')
					.setCta()
					.onClick(async () => {
						this.plugin.settings.TemplateFolderArray.push({
							Template: '',
							Folder: '',
							IncludeSubFolders: false,
						});
						await this.plugin.saveSettings();
						this.display();
					});
			});

			this.plugin.settings.TemplateFolderArray.forEach((TemplateFolderArray, index) => {
				const settings = this.plugin.settings.TemplateFolderArray;
				const settingsTemplate = settings.map((e) => e.Template);
				const settingsFolder = settings.map((e) => e.Folder);

				const checkArr = (arr: string[], val: string) => {
					return arr.some((arrVal) => val === arrVal);
				};


				const s = new Setting(this.containerEl)
				
				.addSearch((cb) => {
					new FileSuggest(this.app, cb.inputEl)
					cb.setPlaceholder('Template')
						.setValue(TemplateFolderArray.Template)
						.onChange(async (newTemplate) => {
							this.plugin.settings.TemplateFolderArray[index].Template = newTemplate.trim();
							await this.plugin.saveSettings();
						});
				})
				.addSearch((cb) => {
					new FolderSuggest(this.app, cb.inputEl);
					cb.setPlaceholder('Folder')
						.setValue(TemplateFolderArray.Folder)
						.onChange(async (newFolder) => {
							this.plugin.settings.TemplateFolderArray[index].Folder = newFolder.trim();
							await this.plugin.saveSettings();
						});
				})
				.addToggle((cb) => {
					cb.setValue(TemplateFolderArray.IncludeSubFolders)
						.onChange(async (newIncludeSubFolders) => {
							this.plugin.settings.TemplateFolderArray[index].IncludeSubFolders = newIncludeSubFolders;
							await this.plugin.saveSettings();
						});
				})
				.addExtraButton((cb) => {
					cb.setIcon('cross')
						.setTooltip('Delete')
						.onClick(async () => {
							this.plugin.settings.TemplateFolderArray.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						});
				})
				.addExtraButton((cb) => {
					cb.setIcon('check')
						.setTooltip('Run Update')
						.onClick(async () => {
							this.RunUpdate(index);
						});
				})
				;
				
				 
			s.infoEl.remove();
			});
	}
}
