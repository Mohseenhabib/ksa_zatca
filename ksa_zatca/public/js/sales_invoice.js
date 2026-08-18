// The ZATCA clearance/reporting call is enqueued as a background job right
// after submit (see on_submit in zatca_invoice.py), not run inline with the
// submit request - ZATCA is a live external API and can be slow, so we
// don't want every invoice submission blocked on it. Once that background
// job finishes (success or failure), it publishes this realtime event; when
// it's for the invoice currently open, refresh so the QR/custom_cleared
// fields show up automatically, with no manual reload needed.
frappe.realtime.on("ksa_zatca_processed", function (data) {
  const frm = cur_frm;
  if (frm && frm.doc.doctype === "Sales Invoice" && frm.doc.name === data.invoice) {
    frm.reload_doc();
  }
});

frappe.ui.form.on("Sales Invoice", {
  on_submit: function (frm) {
    // Submit itself completes before ZATCA processing does now (it's
    // backgrounded) - this just syncs the normal post-submit state. The
    // ksa_zatca_processed listener above handles the ZATCA-specific fields
    // once that background job actually finishes.
    frm.reload_doc();
  },
  refresh: function (frm) {
    if (frm.doc.docstatus === 1 && frm.doc.custom_cleared == 0) {
      frm.add_custom_button(
        __("Zatca"),
        function () {
          frm.call({
            method:
              "ksa_zatca.ksa_zatca.doctype.zatca_config.zatca_invoice.zatca_Call",
            args: {
              invoice_number: frm.doc.name,
            },
            freeze: true,
            freeze_message: __("Sending Zatca Request..."),
            callback: function (response) {
              if (response.message) {
                frappe.msgprint(response.message);
              }
              frm.reload_doc();
            },
          });
        },
        __("Phase-2"),
      );
    }
  },
});
frappe.ui.form.on("Sales Invoice Item", {
  item_tax_template(frm, cdt, cdn) {
    item = frappe.get_doc(cdt, cdn);
    frm.set_query("custom_tax_exemption_reason", "items", () => {
      return {
        filters: {
          tax_category: item.custom_item_tax_category,
        },
      };
    });
  },
});
