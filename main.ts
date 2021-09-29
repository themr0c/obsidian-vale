import { DisableStyleModal } from "disable";
import { EnableStyleModal } from "enable";
import { InstallStyleModal } from "install";
import { ValeManager } from "manager";
import { FileSystemAdapter, MarkdownView, Plugin } from "obsidian";
import * as path from "path";
import { ValeSettingTab } from "settings";
import { DEFAULT_SETTINGS, ValeResponse, ValeSettings } from "types";
import { UninstallStyleModal } from "uninstall";
import { ValeResultsView, VIEW_TYPE_VALE } from "./view";

export default class ValePlugin extends Plugin {
  settings: ValeSettings;
  view: ValeResultsView;
  manager: ValeManager;

  results: ValeResponse;

  async onload() {
    this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData());

    if (path.isAbsolute(this.settings.cli.configPath)) {
      this.manager = new ValeManager(this.settings.cli.configPath);
    } else {
      const { adapter } = this.app.vault;

      if (adapter instanceof FileSystemAdapter) {
        this.manager = new ValeManager(
          adapter.getFullPath(this.settings.cli.configPath)
        );
      }
    }

    this.addSettingTab(new ValeSettingTab(this.app, this));

    this.addCommand({
      id: "vale-check-document",
      name: "Check document",
      checkCallback: (checking) => {
        if (checking) {
          return !!this.app.workspace.getActiveViewOfType(MarkdownView);
        }

        this.activateView();

        return true;
      },
    });

    this.addCommand({
      id: "vale-uninstall-style",
      name: "Uninstall style",
      callback: () => {
        new UninstallStyleModal(this.app, this.manager).open();
      },
    });

    this.addCommand({
      id: "vale-install-style",
      name: "Install style",
      callback: () => {
        new InstallStyleModal(this.app, this.manager).open();
      },
    });

    this.addCommand({
      id: "vale-enable-style",
      name: "Enable style",
      callback: () => {
        new EnableStyleModal(this.app, this.manager).open();
      },
    });

    this.addCommand({
      id: "vale-disable-style",
      name: "Disable style",
      callback: () => {
        new DisableStyleModal(this.app, this.manager).open();
      },
    });

    this.registerView(
      VIEW_TYPE_VALE,
      (leaf) => (this.view = new ValeResultsView(leaf, this.settings))
    );
  }

  async onunload() {
    if (this.view) {
      await this.view.onClose();
    }

    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_VALE)
      .forEach((leaf) => leaf.detach());
  }

  async activateView() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_VALE);

    await this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_VALE,
      active: true,
    });

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(VIEW_TYPE_VALE)[0]
    );
  }
}
