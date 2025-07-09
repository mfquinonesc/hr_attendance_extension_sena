# -*- coding: utf-8 -*-
{
    'name': "hr_attendance_extension",
    
    'description': """
        This module extends the attendance odoo module funtionality.
    """,

    'author': "AB Comercial S.A.S.",
    'website': "https://gpscontrol.co/",
   
    'category': 'Customizations',
    'version': '0.1',
   
    'depends': ['hr_attendance'],

    # always loaded
    'data': [ 

    ],   

    'assets': {
        'web.assets_backend': [
            'hr_attendance_extension/static/src/js/attendance_extension.js',            
        ],       
    },
}
