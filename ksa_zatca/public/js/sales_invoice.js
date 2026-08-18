frappe.ui.form.on("Sales Invoice", {
  // The actual ZATCA clearance call runs server-side, in the on_submit
  // doc_event (see zatca_invoice.py) - it always runs there regardless of
  // how the submit happened (desk UI, API, mobile). That call is idempotent
  // (guarded on custom_cleared), so it's safe to also poke it from here.
  //
  // What this handler is actually for: the submit response the desk UI
  // receives isn't always guaranteed to already carry the QR/custom_cleared
  // fields written by that server-side hook (e.g. if the doctype is ever
  // queued in background, or under any other timing quirk) - so instead of
  // trusting that payload, force one clean re-fetch straight from the
  // server once the submit is confirmed done. This is what actually fixes
  // "the fields look stale until I refresh the whole page".
  on_submit: function (frm) {
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
