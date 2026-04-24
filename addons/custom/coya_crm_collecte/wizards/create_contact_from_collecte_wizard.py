# -*- coding: utf-8 -*-
# Part of COYA.PRO. See LICENSE file for full copyright and licensing details.

from odoo import fields, models


class CoyaCreateContactFromCollecteWizard(models.TransientModel):
    _name = "coya.create.contact.from.collecte.wizard"
    _description = "Créer un contact à partir d'une collection (collecte)"

    fiche_type_id = fields.Many2one(
        "coya.fiche.type",
        string="Collection (collecte)",
        required=True,
    )
    programme_id = fields.Many2one(
        "coya.programme",
        string="Programme",
    )
    projet_id = fields.Many2one(
        "coya.projet",
        string="Projet",
    )
    bootcamp_id = fields.Many2one(
        "coya.bootcamp",
        string="Formation / Bootcamp",
    )
    cohorte_id = fields.Many2one(
        "coya.bootcamp.cohorte",
        string="Cohorte",
    )

    def action_create_contact(self):
        self.ensure_one()
        partner = self.env["res.partner"].create(
            {
                "coya_fiche_type_id": self.fiche_type_id.id,
                "coya_programme_id": self.programme_id.id or False,
                "coya_projet_id": self.projet_id.id or False,
                "coya_bootcamp_id": self.bootcamp_id.id or False,
                "coya_cohorte_id": self.cohorte_id.id or False,
                "company_type": "person",
            }
        )
        return {
            "type": "ir.actions.act_window",
            "name": "Contact",
            "res_model": "res.partner",
            "res_id": partner.id,
            "view_mode": "form",
            "target": "current",
            "context": {
                "default_coya_fiche_type_id": self.fiche_type_id.id,
                "default_coya_programme_id": self.programme_id.id or False,
                "default_coya_projet_id": self.projet_id.id or False,
                "default_coya_bootcamp_id": self.bootcamp_id.id or False,
                "default_coya_cohorte_id": self.cohorte_id.id or False,
            },
        }

