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

import { isPositionLocation } from 'molstar/lib/mol-geo/util/location-iterator';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';
import { ColorTheme } from 'molstar/lib/mol-theme/color';
import { ColorThemeCategory } from 'molstar/lib/mol-theme/color/categories';
import { ThemeDataContext } from 'molstar/lib/mol-theme/theme';
import { ColorNames } from 'molstar/lib/mol-util/color/names';
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition';

export function CustomColorTheme(
    ctx: ThemeDataContext,
    props: PD.Values<{}>
): ColorTheme<{}> {
    const { radius, center } = ctx.structure?.boundary.sphere!;
    const radiusSq = Math.max(radius * radius, 0.001);
    const scale = ColorTheme.PaletteScale;

    return {
        factory: CustomColorTheme,
        granularity: 'uniform',
        color: location => {
            return ColorNames.black;
        },
        props: props,
        description: '',
    };
}

export const CustomColorThemeProvider: ColorTheme.Provider<{}, 'basic-wrapper-custom-color-theme'> = {
    name: 'basic-wrapper-custom-color-theme',
    label: 'Custom Color Theme',
    category: ColorThemeCategory.Misc,
    factory: CustomColorTheme,
    getParams: () => ({}),
    defaultValues: { },
    isApplicable: (ctx: ThemeDataContext) => true,
};

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

export async function initViewer(element: string | HTMLDivElement, pdbContents: string, defaultColor: number = 0xD3D3D3, regionColors?: {selector: string, color: number}[]) {
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
    });

    const trajectory = await plugin.builders.structure.parseTrajectory(
        data,
        "pdb",
    );

    const preset = await plugin.builders.structure.hierarchy.applyPreset(
        trajectory,
        "default"
    );

    const components = plugin.managers.structure.hierarchy.current.structures[0].components;  

    // Change base color to red using uniform color theme
    await plugin.managers.structure.component.updateRepresentationsTheme(components, {
        color: "uniform",
        colorParams: { value: Color(defaultColor) }
    });

    // Apply overpaint
    if (regionColors) {
        for (let regionColor of regionColors) {
            await setStructureOverpaint(
                plugin,
                components,
                Color(regionColor.color),
                (s: Structure) => getLoci(s, regionColor.selector)
            );
        }
    }

    return plugin;
}
