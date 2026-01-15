import Elastica, { type ElasticaConfigOBB, type ElementData } from '@darkroom.engineering/elastica';
import { type HTMLAttributes, type ReactNode } from 'react';
import { dragForcePresetsLib, initalConditionsPresets, updatePresets, type InitialConditionParams, type UpdateParams } from './presets';
export type { Container, ElasticaConfigOBB, ElementData, Vector2D } from '@darkroom.engineering/elastica';
export type { InitialConditionParams, UpdateParams } from './presets';
export { AxisAlignedBoundaryBox, dragForcePresetsLib, initalConditionsPresets, updatePresets, useElastica };
type ElasticaContextValue = {
    addBox: (element: HTMLElement, slide: ElementData) => void;
    removeBox: (element: HTMLElement) => void;
    elastica: Elastica;
};
declare function useElastica(): ElasticaContextValue;
export type ReactElasticaRef = {
    play: () => void;
    pause: () => void;
};
export type ReactElasticaProps = {
    children?: ReactNode;
    className?: string;
    config?: ElasticaConfigOBB;
    initialCondition?: (params: InitialConditionParams) => void;
    update?: (params: UpdateParams) => void;
    showHashGrid?: boolean;
};
declare const ReactElastica: import("react").ForwardRefExoticComponent<ReactElasticaProps & import("react").RefAttributes<ReactElasticaRef>>;
export type AxisAlignedBoundaryBoxProps = HTMLAttributes<HTMLDivElement>;
declare function AxisAlignedBoundaryBox({ className, children, ...props }: AxisAlignedBoundaryBoxProps): import("react/jsx-runtime").JSX.Element;
export default ReactElastica;
