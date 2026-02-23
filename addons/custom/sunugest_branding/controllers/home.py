# -*- coding: utf-8 -*-
from odoo import http
from odoo.addons.web.controllers import home as web_home
from odoo.http import request


class Home(web_home.Home):

    @http.route('/', type='http', auth='none')
    def index(self, s_action=None, db=None, **kw):
        # Si déjà connecté (base + session + utilisateur interne), aller vers l'app COYA
        if request.db and request.session.uid:
            try:
                if web_home.is_user_internal(request.session.uid):
                    return request.redirect_query('/odoo', query=request.params)
            except Exception:
                pass
        # Entrée directe sur le login (plus de landing)
        return request.redirect_query('/web/login', query=request.params)

    @http.route('/web/signup', type='http', auth='none')
    def signup_redirect(self, **kw):
        """Désactive la page d'inscription : redirection vers le login."""
        return request.redirect_query('/web/login', query=request.params)
