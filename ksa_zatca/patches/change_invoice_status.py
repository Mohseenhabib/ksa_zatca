import frappe

def execute():
       
        invoices=frappe.db.get_all("Sales Invoice",filters={"posting_date":[">=","01-09-2024"],"docstatus":1,"custom_clearance_status":"Cleared","custom_production":1},order_by='posting_date asc',pluck="name")
        for i in invoices:
            frappe.db.set_value("Sales Invoice",i,"custom_clearance_status","Not Cleared")

