import frappe
from frappe.utils.background_jobs import enqueue
def execute():
    
    from ksa_zatca.ksa_zatca.doctype.zatca_config.zatca_invoice import zatca_Call
    invoices= invoices = frappe.db.get_all(
        "Sales Invoice",
        filters={"posting_date": [">=", "01-09-2024"],"docstatus":1,"custom_clearance_status":"Not Cleared","custom_production":1},
        order_by='posting_date asc, posting_time asc',
        pluck="name"
    )

    for i in invoices:
        
        frappe.enqueue(
                zatca_Call,
                timeout=600,
                invoice_number=i,
                queue="short"
                
            )