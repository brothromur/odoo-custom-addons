import json
from odoo import http
from odoo.http import request


class UserColumnWidthController(http.Controller):

    @http.route('/web/user_column_width/get', type='json', auth='user')
    def get_widths(self, model_name):  # 🪓 REMOVED 'self' HERE
        """Bypasses standard ACL checks to fetch widths for any logged-in user."""
        config = request.env['user.column.width'].sudo().search([
            ('user_id', '=', request.env.user.id),
            ('model_name', '=', model_name)  # Matches your clean python model field name
        ], limit=1)

        if config and config.column_widths_json:
            return json.loads(config.column_widths_json)
        return {}

    @http.route('/web/user_column_width/save', type='json', auth='user')
    def save_widths(self, model_name, widths_dict):  # 🪓 REMOVED 'self' HERE
        """Bypasses standard ACL checks to write widths for any logged-in user."""
        model_obj = request.env['user.column.width'].sudo()
        config = model_obj.search([
            ('user_id', '=', request.env.user.id),
            ('model_name', '=', model_name)  # Matches your clean python model field name
        ], limit=1)

        if config:
            config.write({'column_widths_json': json.dumps(widths_dict)})
        else:
            model_obj.create({
                'user_id': request.env.user.id,
                'model_name': model_name,  # Matches your clean python model field name
                'column_widths_json': json.dumps(widths_dict)
            })
        return True
