"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initViewer = initViewer;
// import { DefaultPluginSpec, PluginSpec } from 'molstar/lib/mol-plugin/spec';
// import { PluginContext } from 'molstar/lib/mol-plugin/context';
const config_1 = require("molstar/lib/mol-plugin/config");
const structure_1 = require("molstar/lib/mol-model/structure");
const builder_1 = require("molstar/lib/mol-script/language/builder");
const script_1 = require("molstar/lib/mol-script/script");
const color_1 = require("molstar/lib/mol-util/color");
const structure_overpaint_1 = require("molstar/lib/mol-plugin-state/helpers/structure-overpaint");
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const spec_1 = require("molstar/lib/mol-plugin-ui/spec");
const context_1 = require("molstar/lib/mol-plugin-ui/context");
const plugin_1 = require("molstar/lib/mol-plugin-ui/plugin");
function getLoci(structure, selector) {
    return __awaiter(this, void 0, void 0, function* () {
        if (selector.match("[A-Z]:(\\d+-\\d+,?)+")) {
            var [chain, ranges] = selector.split(":");
        }
        else if (selector.match("(\\d+-\\d+,?)+")) {
            var chain = "A";
            var ranges = selector;
        }
        else {
            throw `Invalid loci selector: ${selector}`;
        }
        const disjoints = ranges.split(",").map((x) => {
            const fromto = x.split("-");
            return builder_1.MolScriptBuilder.core.logic.and([
                builder_1.MolScriptBuilder.core.rel.gre([builder_1.MolScriptBuilder.struct.atomProperty.macromolecular.label_seq_id(), fromto[0]]),
                builder_1.MolScriptBuilder.core.rel.lte([builder_1.MolScriptBuilder.struct.atomProperty.macromolecular.label_seq_id(), fromto[1]]),
            ]);
        });
        const sel = script_1.Script.getStructureSelection(builder_1.MolScriptBuilder.struct.generator.atomGroups({
            'chain-test': builder_1.MolScriptBuilder.core.rel.eq([builder_1.MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id(), chain]),
            'residue-test': builder_1.MolScriptBuilder.core.logic.or(disjoints),
        }), structure);
        const loci = structure_1.StructureSelection.toLociWithSourceUnits(sel);
        return loci;
    });
}
function initViewer(element, pdbContents, regionColors) {
    return __awaiter(this, void 0, void 0, function* () {
        const parent = typeof element === 'string' ? document.getElementById(element) : element;
        // const canvas = document.createElement('canvas') as HTMLCanvasElement;
        // parent.appendChild(canvas);
        const spec = Object.assign(Object.assign({}, (0, spec_1.DefaultPluginUISpec)()), { config: [
                [config_1.PluginConfig.VolumeStreaming.Enabled, false],
                [config_1.PluginConfig.Viewport.ShowExpand, true],
                [config_1.PluginConfig.Viewport.ShowControls, true],
                [config_1.PluginConfig.Viewport.ShowSettings, true],
                [config_1.PluginConfig.Viewport.ShowSelectionMode, true],
                [config_1.PluginConfig.Viewport.ShowAnimation, true],
                [config_1.PluginConfig.Viewport.ShowTrajectoryControls, true],
                [config_1.PluginConfig.Viewport.ShowScreenshotControls, true],
            ] });
        const plugin = new context_1.PluginUIContext(spec);
        yield plugin.init();
        (0, client_1.createRoot)(parent).render(<plugin_1.Plugin plugin={plugin}/>);
        // plugin.initViewer(canvas, parent);
        const data = yield plugin.builders.data.rawData({
            data: pdbContents,
            label: "meow",
        });
        const trajectory = yield plugin.builders.structure.parseTrajectory(data, "pdb");
        const preset = yield plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
        if (regionColors) {
            for (let regionColor of regionColors) {
                yield (0, structure_overpaint_1.setStructureOverpaint)(plugin, plugin.managers.structure.hierarchy.currentComponentGroups[0], (0, color_1.Color)(regionColor.color), (s) => getLoci(s, regionColor.selector));
            }
        }
        return plugin;
    });
}
