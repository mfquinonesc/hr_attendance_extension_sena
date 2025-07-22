from odoo import models
from ..hooks import set_cron_nextcall
from ..utils.time_utils import PARAM_NAME_KEY

class IrConfigParameter(models.Model):
    _inherit = 'ir.config_parameter'


    def write(self, vals):
        """Overrides the default write method to detect changes to the PARAM_NAME_KEY in the system parameter."""
        result = super(IrConfigParameter, self).write(vals)

        if any(rec.key == PARAM_NAME_KEY for rec in self):      
            set_cron_nextcall(env=self.env)

        return result