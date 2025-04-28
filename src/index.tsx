import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { Structure, StructureSelection } from 'molstar/lib/mol-model/structure'
import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder';
import { Expression } from 'molstar/lib/mol-script/language/expression';
import { Script } from 'molstar/lib/mol-script/script';
import { Color } from 'molstar/lib/mol-util/color';
import { setStructureOverpaint } from 'molstar/lib/mol-plugin-state/helpers/structure-overpaint'

import React from 'react';
import { createRoot } from 'react-dom/client';

import { DefaultPluginUISpec, PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { Plugin } from 'molstar/lib/mol-plugin-ui/plugin';

async function getLoci(structure: Structure, selector: string) {
    if (selector.match("[A-Z]:(\\d+-\\d+,?)+")) {
        var [chain, ranges] = selector.split(":");
    } else if (selector.match("(\\d+-\\d+,?)+")) {
        var chain = "A";
        var ranges = selector;
    } else {
        throw `Invalid loci selector: ${selector}`;
    }
    const disjoints: Expression[] = ranges.split(",").map((x) => {
        const fromto = x.split("-");
        return MS.core.logic.and([
            MS.core.rel.gre([MS.struct.atomProperty.macromolecular.label_seq_id(), fromto[0]]),
            MS.core.rel.lte([MS.struct.atomProperty.macromolecular.label_seq_id(), fromto[1]]),
        ])
    });
    const sel = Script.getStructureSelection(MS.struct.generator.atomGroups({
      'chain-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), chain]),
      'residue-test': MS.core.logic.or(disjoints),
    }), structure)
    const loci = StructureSelection.toLociWithSourceUnits(sel);
    return loci;
}

export async function initViewer(element: string | HTMLDivElement, pdbContents: string, regionColors?: {selector: string, color: number}[]) {
    const parent = typeof element === 'string' ? document.getElementById(element)! as HTMLDivElement : element;

    const spec: PluginUISpec = {
        ...DefaultPluginUISpec(),
        layout: {
            initial: {
                isExpanded: false,
                showControls: true,
                regionState: {
                    left: "collapsed",
                    top: "hidden",
                    right: "hidden",
                    bottom: "hidden",
                },
                controlsDisplay: "landscape",
            },
        },
        config: [
            [PluginConfig.VolumeStreaming.Enabled, false],
        ],
    }

    const plugin = new PluginUIContext(spec);
    await plugin.init();

    createRoot(parent).render(<Plugin plugin={plugin} />)
    // plugin.initViewer(canvas, parent);

    const data = await plugin.builders.data.rawData({
        data: pdbContents,
        label: "meow",
    })

    const trajectory = await plugin.builders.structure.parseTrajectory(
        data,
        "pdb",
    );

    const preset = await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');

    if (regionColors) {
        for (let regionColor of regionColors) {
            await setStructureOverpaint(
                plugin,
                plugin.managers.structure.hierarchy.currentComponentGroups[0],
                Color(regionColor.color),
                (s: Structure) => getLoci(s, regionColor.selector)
            );
        }
    }

    return plugin;
}
