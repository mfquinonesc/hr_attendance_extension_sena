from datetime import datetime, timedelta
import pytz
from odoo import api, SUPERUSER_ID

def set_cron_nextcall(cr, registry):
    """ Sets the 'nextcall' datetime for the auto-checkout attendance cron job based on the configured CUTOFF_HOUR system parameter. Defaults to 19 if not set or invalid."""
    env = api.Environment(cr, SUPERUSER_ID, {})
    
    default_cutoff = 19
    # Get cutoff hour from system parameter (default to 0 if not set 19)    
    try:
        cutoff_hour_str = env['ir.config_parameter'].sudo().get_param('CUTOFF_HOUR')
        cutoff_hour = int(cutoff_hour_str) if cutoff_hour_str else default_cutoff
    except Exception:
        cutoff_hour = default_cutoff    

    # Get the current date/time in the desired timezone
    tz = pytz.timezone('America/Bogota')
    now = datetime.now(tz)

    # Set nextcall today at cutoff hour, or tomorrow if that hour has already passed
    nextcall_dt = now.replace(hour=cutoff_hour, minute=0, second=0, microsecond=0)
    if nextcall_dt < now:
        nextcall_dt += timedelta(days=1)

    # Convert to UTC (Odoo stores datetimes in UTC)
    nextcall_utc = nextcall_dt.astimezone(pytz.utc)

    # Find the cron job and set its nextcall when the module is installed
    cron = env.ref('hr_attendance_extension.ir_cron_auto_checkout_attendances', raise_if_not_found=False)
    if cron:
        cron.sudo().write({'nextcall': nextcall_utc.strftime('%Y-%m-%d %H:%M:%S')})  
    