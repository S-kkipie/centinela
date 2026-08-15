import type {
    ColumnSort,
    Row,
    RowData,
    TableFeatures,
} from "@tanstack/react-table";
import type { DataTableConfig } from "../lib/data-table-config";
import type { FilterItemSchema } from "../lib/parsers";
import type { TableFeaturesConfig } from "../lib/table-features";

declare module "@tanstack/react-table" {
    interface ColumnMeta<
        TFeatures extends TableFeatures,
        TData extends RowData,
        TValue,
    > {
        label?: string;
        placeholder?: string;
        variant?: FilterVariant;
        options?: Option[];
        range?: [number, number];
        unit?: string;
        icon?: React.FC<React.SVGProps<SVGSVGElement>>;
        locationTree?: Record<string, Record<string, string[]>>;
    }
}

export interface Option {
    label: string;
    value: string;
    count?: number;
    icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

export type FilterOperator = DataTableConfig["operators"][number];
export type FilterVariant = DataTableConfig["filterVariants"][number];
export type JoinOperator = DataTableConfig["joinOperators"][number];

export interface ExtendedColumnSort<TData extends RowData>
    extends Omit<ColumnSort, "id"> {
    id: Extract<keyof TData, string>;
}

export interface ExtendedColumnFilter<TData extends RowData>
    extends FilterItemSchema {
    id: Extract<keyof TData, string>;
}

export interface DataTableRowAction<TData extends RowData> {
    row: Row<TableFeaturesConfig, TData>;
    variant: "update" | "delete";
}
