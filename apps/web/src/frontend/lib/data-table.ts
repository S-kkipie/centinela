import type { Column } from "@tanstack/react-table";
import type { RowData } from "@tanstack/react-table";
import type { TableFeaturesConfig } from "@/frontend/lib/table-features";
import type {
    ExtendedColumnFilter,
    FilterOperator,
    FilterVariant,
} from "@/frontend/types/data-table";
import { dataTableConfig } from "./data-table-config";

export function getCommonPinningStyles<TData extends RowData>({
    column,
    withBorder = false,
}: {
    column: Column<TableFeaturesConfig, TData>;
    withBorder?: boolean;
}): React.CSSProperties {
    const isPinned = column.getIsPinned();
    const isLastLeftPinnedColumn =
        isPinned === "start" && column.getIsLastColumn("start");
    const isFirstRightPinnedColumn =
        isPinned === "end" && column.getIsFirstColumn("end");

    return {
        boxShadow: withBorder
            ? isLastLeftPinnedColumn
                ? "-4px 0 4px -4px var(--border) inset"
                : isFirstRightPinnedColumn
                  ? "4px 0 4px -4px var(--border) inset"
                  : undefined
            : undefined,
        left: isPinned === "start" ? `${column.getStart("start")}px` : undefined,
        right:
            isPinned === "end" ? `${column.getAfter("end")}px` : undefined,
        opacity: isPinned ? 0.97 : 1,
        position: isPinned ? "sticky" : "relative",
        background: "var(--background)",
        width: column.getSize(),
        zIndex: isPinned ? 1 : 0,
    };
}

export function getFilterOperators(filterVariant: FilterVariant) {
    const operatorMap: Record<
        FilterVariant,
        { label: string; value: FilterOperator }[]
    > = {
        text: dataTableConfig.textOperators,
        number: dataTableConfig.numericOperators,
        range: dataTableConfig.numericOperators,
        date: dataTableConfig.dateOperators,
        dateRange: dataTableConfig.dateOperators,
        boolean: dataTableConfig.booleanOperators,
        select: dataTableConfig.selectOperators,
        multiSelect: dataTableConfig.multiSelectOperators,
        locationCascade: dataTableConfig.multiSelectOperators,
    };

    return operatorMap[filterVariant] ?? dataTableConfig.textOperators;
}

export function getDefaultFilterOperator(filterVariant: FilterVariant) {
    const operators = getFilterOperators(filterVariant);

    return operators[0]?.value ?? (filterVariant === "text" ? "iLike" : "eq");
}

export function getValidFilters<TData extends RowData>(
    filters: ExtendedColumnFilter<TData>[],
): ExtendedColumnFilter<TData>[] {
    return filters.filter(
        (filter) =>
            filter.operator === "isEmpty" ||
            filter.operator === "isNotEmpty" ||
            (Array.isArray(filter.value)
                ? filter.value.length > 0
                : filter.value !== "" &&
                  filter.value !== null &&
                  filter.value !== undefined),
    );
}
