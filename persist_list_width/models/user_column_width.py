from odoo import models, fields, api

class UserColumnWidth(models.Model):
    _name = 'user.column.width'
    _description = 'User Column Width Storage'

    user_id = fields.Many2one('res.users', string='User')
    model_name = fields.Char(string='Model Name', required=True)
    column_widths_json  = fields.Text(string='Column Width', default={})

    # Needed for race conditions
    _sql_constraints = [
        ('user_model_unique', 'unique(user_id, model_name)', 'A user can only have one layout configuration per model!')
    ]

    @api.model
    def save_widths(self, model_name, widths_dict):
        import json
        config = self.search([('user_id', '=', self.env.user.id), ('model_name', '=', model_name)], limit=1)
        if config:
            config.write({'column_widths_json': json.dumps(widths_dict)})
        else:
            self.create({
                'model_name': model_name,
                'column_widths_json': json.dumps(widths_dict)
            })
        return True

    @api.model
    def get_widths(self, model_name):
        import json
        config = self.search([('user_id', '=', self.env.user.id), ('model_name', '=', model_name)], limit=1)
        if config and config.column_widths_json:
            return json.loads(config.column_widths_json)
        return {}