/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ListRenderer } from "@web/views/list/list_renderer";
import { onWillStart, useEffect } from "@odoo/owl";
import { rpc } from "@web/core/network/rpc";

patch(ListRenderer.prototype, {
    setup() {
        super.setup(...arguments);

        const modelName = this.props.list.resModel;
        this.savedColumnWidths = {};

        // 1. PRE-RENDER FETCH & INJECTION
        onWillStart(async () => {
            try {
                const savedWidths = await rpc("/web/user_column_width/get", {
                    model_name: modelName,
                });

                if (savedWidths && Object.keys(savedWidths).length > 0) {
                    this.savedColumnWidths = savedWidths;

                    // Inject values straight into Odoo's metadata definitions
                    this.props.archInfo.columns.forEach((col) => {
                        const fieldName = col.name;
                        if (fieldName && savedWidths[fieldName]) {
                            col.width = parseInt(savedWidths[fieldName], 10) || savedWidths[fieldName];
                        }
                    });
                }
            } catch (error) {
                console.error("Pre-load column fetch error:", error);
            }
        });

        // 2. LIVE MOUSE INTERACTION WATCHER
        useEffect(
            (tableEl) => {
                if (!tableEl) return;

                const headers = tableEl.querySelectorAll("thead th");

                // Immediately read straight from memory cache if data was pre-loaded
                headers.forEach((th) => {
                    const fieldName = th.dataset.name;
                    if (fieldName && this.savedColumnWidths[fieldName]) {
                        th.style.width = this.savedColumnWidths[fieldName];
                    }
                });

                let debounceTimer;
                // An arrow function preserve "this" context automatically
                const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                        if (mutation.type === "attributes" && mutation.attributeName === "style") {
                            const th = mutation.target;
                            if (th.tagName === "TH" && th.dataset.name) {

                                clearTimeout(debounceTimer);
                                debounceTimer = setTimeout(async () => {
                                    const currentWidths = {};

                                    headers.forEach((headerTh) => {
                                        if (headerTh.dataset.name && headerTh.style.width) {
                                            currentWidths[headerTh.dataset.name] = headerTh.style.width;
                                        }
                                    });

                                    try {
                                        await rpc("/web/user_column_width/save", {
                                            model_name: modelName,
                                            widths_dict: currentWidths,
                                        });
                                    } catch (rpcErr) {
                                        console.error("Failed to push column adjustments to server database:", rpcErr);
                                    }
                                }, 500); // Wait 500ms after dragging stops to write to DB
                            }
                        }
                    }
                });

                headers.forEach((th) => {
                    observer.observe(th, {
                        attributes: true,
                        attributeFilter: ["style"],
                    });
                });

                return () => {
                    observer.disconnect();
                    clearTimeout(debounceTimer);
                };
            },
            () => [document.querySelector(".o_list_table")]
        );
    }
});
