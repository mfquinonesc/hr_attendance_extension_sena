from datetime import datetime, timedelta
import pytz
from odoo import api, SUPERUSER_ID
from .utils.time_utils import get_cutoff_hour_minutes, APP_TIMEZONE

def set_cron_nextcall(cr=None, registry=None, env=None):
    """ Sets the 'nextcall' datetime for the auto-checkout attendance cron job based on the configured CUTOFF_HOUR system parameter. Defaults to 19 if not set or invalid."""
    if not env:
        env = api.Environment(cr, SUPERUSER_ID, {})
    
    # Get the hour and minutes defined in the system parameters
    cutoff_hour, cutoff_minutes = get_cutoff_hour_minutes(env)   

    # Get the current date/time in the desired timezone
    now = datetime.now(APP_TIMEZONE)

    # Set nextcall today at cutoff hour, or tomorrow if that hour has already passed
    nextcall_dt = now.replace(hour=cutoff_hour, minute=cutoff_minutes, second=0, microsecond=0)
    if nextcall_dt < now:
        nextcall_dt += timedelta(days=1)

    # Convert to UTC (Odoo stores datetimes in UTC)
    nextcall_utc = nextcall_dt.astimezone(pytz.utc)

    # Find the cron job and set its nextcall when the module is installed
    cron = env.ref('hr_attendance_extension.ir_cron_auto_checkout_attendances', raise_if_not_found=False)
    if cron:
        cron.sudo().write({'nextcall': nextcall_utc.strftime('%Y-%m-%d %H:%M:%S')})  
    