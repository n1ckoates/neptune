// I'll refactor this to be separated out into different files in the
import { Switch, TextInput } from "./components.js";
import registerRoute from "../api/registerRoute.js";
import {
  pluginStore,
  togglePlugin,
  removePlugin,
  installPluginFromURL,
  installPlugin,
} from "../api/plugins.js";
import { $, html, For, If } from "voby";
import hookContextMenu from "../api/hookContextMenu.js";
import { actions } from "../handleExfiltrations.js";
import { enabled as enabledPlugins } from "../api/plugins.js";
import showModal from "../api/showModal.js";

const parseManifest = (manifest) =>
  JSON.parse(manifest.slice(manifest.indexOf("/*") + 2, manifest.indexOf("*/")));

async function importLocalPlugin() {
  const [fileHandle] = await showOpenFilePicker({
    types: [{ description: "A neptune plugin file", accept: { "text/javascript": [".js"] } }],
  });

  const file = await fileHandle.getFile();
  const content = await file.text();

  let manifest;
  try {
    manifest = parseManifest(content);

    if (!["name", "author", "description"].every((m) => typeof manifest[m] === "string"))
      throw "invalid manifest";
  } catch {
    return actions.message.messageError({ message: "Invalid plugin manifest!" });
  }

  try {
    await installPlugin(
      manifest.name + "-" + (Math.random() + 1).toString(36).substring(7),
      content,
      {
        name: manifest.name,
        author: manifest.author,
        description: manifest.description,
      },
    );
  } catch {
    actions.message.messageError({ message: "Failed to install plugin!" });
  }
}

let selectedTab = $(0);
const tabs = [
  {
    name: "Plugins",
    component: () => {
      const pluginToImport = $("");

      return html`
      <div style="display: flex; gap: 10px; flex-direction: column">
        <div style="padding-top: 10px; display: flex; gap:10px">
          <!-- This text input *needs* to be able to have an onEnter event. -->
          <${TextInput} value=${pluginToImport} onEnter=${() => {
            installPluginFromURL(pluginToImport());
            pluginToImport("");
          }} placeholder="Import from URL" />
          <!-- This button will be used for importing from local files. -->
          <button onClick=${importLocalPlugin} class="neptune-round-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          </button>
        </div>
        <${For} values=${() => Object.entries(pluginStore)}>
          ${([id, plugin]) => html`<${PluginCard} plugin=${plugin} id=${id} />`}
        </${For}>
      </div>`;
    },
  },
  {
    name: "Themes",
    component: () => html`[WIP]`,
  },
];

function PluginCard({ id, plugin }) {
  return html`<div class="neptune-plugin-card">
    <div class="neptune-plugin-card-content">
      <div>
        <div style="display: flex; gap: 15px">
          <div style="display: grid; place-items: center">
            <!-- This is the delete button, we'll extract it to a component later. -->
            <button class="neptune-round-button" onClick=${() => removePlugin(id)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"></path>
              </svg>
            </button>
          </div>
          <div class="padding-top: 10px; padding-bottom: 10px">
            <div>
              <span class="neptune-plugin-title">${plugin.manifest.name}</span>
              <span> by </span>
              <span class="neptune-plugin-title">${plugin.manifest.author}</span>
            </div>
            <div style="font-size: medium">${plugin.manifest.description}</div>
          </div>
        </div>
      </div>
      <div style="margin-top: auto; margin-bottom: auto; display: flex">
        <${If} when=${() => enabledPlugins?.[id]?.Settings}>
          <button style="display: grid; place-items: center; padding: 0px;" onClick=${() => showModal(plugin.manifest.name, enabledPlugins[id].Settings)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 22px">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </button>
        </${If}>
        <${Switch}
          checked=${() => plugin.enabled}
          onClick=${() => {
            togglePlugin(id);
          }} />
      </div>
    </div>
  </div>`;
}

function TabButton({ className = "", onClick = () => {}, children }) {
  return html`<button
    onClick=${onClick}
    style="font-weight: 500; font-size: 1.14286rem; padding-bottom: 6px"
    class="${className}">
    ${children}
  </button>`;
}

registerRoute(
  "settings",
  html`<div style="width: 675px">
    <div>
      <div style="display: flex; gap: 25px; padding-bottom: 10px">
        ${tabs.map(
          (tab, idx) =>
            html`<${TabButton} onClick=${() => selectedTab(idx)} className=${() =>
              idx == selectedTab() ? "neptune-active-tab" : ""}>${tab.name}</${TabButton}>`,
        )}
      </div>
      <div>${() => tabs[selectedTab()].component}</div>
    </div>
  </div>`,
);

hookContextMenu("USER_PROFILE", "neptune settings", () =>
  neptune.actions.router.push({ pathname: "/neptune/settings", replace: true }),
);
