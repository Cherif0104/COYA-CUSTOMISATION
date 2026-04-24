{
    "name": "COYA CRM ↔ Collecte (Contacts)",
    "summary": "Création de contacts basée sur une collection (collecte) + champs Programme/Projet/Formation",
    "version": "18.0.1.0.0",
    "author": "SENEGEL",
    "website": "https://coya.pro",
    "category": "CRM",
    "license": "LGPL-3",
    "depends": [
        "contacts",
        "crm",
        "coya_collecte",
        "coya_programme_budget",
        "coya_bootcamp",
    ],
    "data": [
        "security/ir.model.access.csv",
        "views/res_partner_views.xml",
        "wizards/create_contact_from_collecte_wizard_views.xml",
        "views/menu_views.xml",
    ],
    "installable": True,
    "application": False,
}

