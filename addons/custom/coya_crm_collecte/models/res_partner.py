# -*- coding: utf-8 -*-
# Part of COYA.PRO. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models


class ResPartner(models.Model):
    _inherit = "res.partner"

    coya_fiche_type_id = fields.Many2one(
        "coya.fiche.type",
        string="Collection (collecte)",
        ondelete="set null",
    )
    coya_programme_id = fields.Many2one(
        "coya.programme",
        string="Programme",
        ondelete="set null",
    )
    coya_projet_id = fields.Many2one(
        "coya.projet",
        string="Projet",
        ondelete="set null",
    )
    coya_bootcamp_id = fields.Many2one(
        "coya.bootcamp",
        string="Formation / Bootcamp",
        ondelete="set null",
    )
    coya_cohorte_id = fields.Many2one(
        "coya.bootcamp.cohorte",
        string="Cohorte",
        ondelete="set null",
    )

    coya_collecte_section_label = fields.Char(
        string="Libellé collecte",
        compute="_compute_coya_collecte_section_label",
    )

    @api.depends("coya_fiche_type_id")
    def _compute_coya_collecte_section_label(self):
        for rec in self:
            if rec.coya_fiche_type_id:
                rec.coya_collecte_section_label = f"Collecte — {rec.coya_fiche_type_id.name}"
            else:
                rec.coya_collecte_section_label = "Collecte"

