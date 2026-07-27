/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ListRenderer } from "@web/views/list/list_renderer";
import { useEffect } from "@odoo/owl";

patch(ListRenderer.prototype, {
    setup() {
        super.setup(...arguments);

        const modelName = this.props.list.resModel;
        const storageKey = `odoo_col_widths_${modelName}`;

        useEffect(
            (tableEl) => {
                if (!tableEl) return;

                const headers = tableEl.querySelectorAll("thead th");

                const savedWidths = JSON.parse(localStorage.getItem(storageKey) || "{}");
                headers.forEach((th) => {
                    const fieldName = th.dataset.name;
                    if (fieldName && savedWidths[fieldName]) {
                        th.style.width = savedWidths[fieldName];
                    }
                });

                let debounceTimer;
                const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                        if (mutation.type === "attributes" && mutation.attributeName === "style") {
                            const th = mutation.target;
                            if (th.tagName === "TH" && th.dataset.name) {

                                clearTimeout(debounceTimer);
                                debounceTimer = setTimeout(() => {
                                    const currentWidths = JSON.parse(localStorage.getItem(storageKey) || "{}");

                                    headers.forEach((headerTh) => {
                                        if (headerTh.dataset.name && headerTh.style.width) {
                                            currentWidths[headerTh.dataset.name] = headerTh.style.width;
                                        }
                                    });

                                    localStorage.setItem(storageKey, JSON.stringify(currentWidths));
                                    console.log(`💾 Saved updated layout for ${modelName}:`, currentWidths);
                                }, 300); // Wait for 300ms, ensuring no more motion
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
