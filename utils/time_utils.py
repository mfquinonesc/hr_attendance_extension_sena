import logging
import pytz

# Global timezone constant
APP_TIMEZONE = pytz.timezone('America/Bogota')

# Name in the System Parameters UI 
PARAM_NAME_KEY = 'CUTOFF_HOUR'


_logger = logging.getLogger(__name__)

def get_cutoff_hour_minutes(env, param_name=PARAM_NAME_KEY, default_hour=19, default_minutes=0):
    """Retrieves the cutoff hour defined by the user from system parameters. The expected value is in "HH:MM" format (e.g., "19:30") from UI."""
    try:
        cutoff_hour_str = env['ir.config_parameter'].sudo().get_param(param_name)
        if cutoff_hour_str:
            hours, minutes = cutoff_hour_str.strip().split(':')
            return int(hours), int(minutes)
    except Exception as e:
        _logger.warning(f"Failed to parse {PARAM_NAME_KEY}: {e}")

    return default_hour, default_minutes