import type { UrlObject } from "node:url";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

export function useMutateSearchParams() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    /** should be used only for modal purposes since replace doesnt store the url in the navigation history */
    const replaceSet = React.useCallback(
        (param: string, value: string) => {
            const newParams = new URLSearchParams(searchParams);

            newParams.set(param, value);

            router.replace(`${pathname}?${newParams.toString()}`, {
                scroll: false,
            });
        },
        [pathname, router, searchParams],
    );

    /** should be used only for modal purposes since replace doesnt store the url in the navigation history */
    const replaceDelete = React.useCallback(
        (param: string) => {
            const newParams = new URLSearchParams(searchParams);

            newParams.delete(param);

            router.replace(`${pathname}?${newParams.toString()}`, {
                scroll: false,
            });
        },
        [pathname, router, searchParams],
    );

    /** convenient for navigation using search params */
    const navigateWithParams = React.useCallback(
        (param: string, value: string) => {
            const newParams = new URLSearchParams(searchParams);

            newParams.set(param, value);

            router.push(`${pathname}?${newParams.toString()}`, {
                scroll: false,
            });
        },
        [pathname, router, searchParams],
    );

    /** convenient for navigation using NextLink component */
    const navigateWithURL = React.useCallback(
        (
            param: string,
            value: string,
            options?: { overridePreviousParams?: boolean },
        ): UrlObject => {
            const newParams = new URLSearchParams(
                options?.overridePreviousParams ? undefined : searchParams,
            );

            newParams.set(param, value);

            return {
                pathname,
                search: `?${newParams.toString()}`,
            };
        },
        [pathname, searchParams],
    );

    const replaceSetMany = React.useCallback(
        (params: { param: string; value: string }[]) => {
            const newParams = new URLSearchParams(searchParams);

            params.forEach(({ param, value }) => {
                newParams.set(param, value);
            });

            router.replace(`${pathname}?${newParams.toString()}`, {
                scroll: false,
            });
        },
        [pathname, router, searchParams],
    );
    const replaceDeleteMany = React.useCallback(
        (params: string[]) => {
            const newParams = new URLSearchParams(searchParams);

            params.forEach((s) => {
                newParams.delete(s);
            });

            router.replace(`${pathname}?${newParams.toString()}`, {
                scroll: false,
            });
        },
        [pathname, router, searchParams],
    );
    //   /** convenient for modal actions purposes */
    //   const replaceActionRoute = React.useCallback(
    //     (action: Action) => {
    //       const [actionRoute, actionParams] = action.split("?");

    //     const newParams = new URLSearchParams(actionParams);

    //     newParams.set(
    //       FROM_ACTIONS_PARAM,
    //       pathname + "?" + searchParams.toString(),
    //     );

    //     router.replace(actionRoute + "?" + newParams.toString(), {
    //       scroll: false,
    //     });
    //   },
    //   [pathname, router, searchParams],
    // );

    return {
        /** should be used only for modal purposes since replace doesnt store the url in the navigation history */
        replaceSet,
        /** should be used only for modal purposes since replace doesnt store the url in the navigation history */
        replaceDelete,
        /** convenient for navigation using search params */
        navigateWithParams,
        router,
        searchParams,
        pathname,
        /** convenient for navigation using NextLink component */
        navigateWithURL,
        replaceSetMany,
        replaceDeleteMany,
    };
}
