import { type Dispatch, type SetStateAction } from 'react';
export declare function isEmptyArray<T>(arr: T[] | null | undefined): boolean;
export declare function useJavascriptEnable(initState?: boolean): [boolean, Dispatch<SetStateAction<boolean>>];
export type HashGridProps = {
    gridSize: number;
};
export declare function HashGrid({ gridSize }: HashGridProps): import("react/jsx-runtime").JSX.Element;
