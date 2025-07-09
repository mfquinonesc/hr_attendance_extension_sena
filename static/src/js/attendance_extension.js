/**
 * Odoo module that extends the default attendance client action to display
 * the total number of weekly worked hours for the current user. 
 */
odoo.define('hr_attendance_extension.hr_attendance_extension', function (require) {
    'use strict';   

    /**
     * Original Odoo attendance client action.
     * Frontend component responsible for rendering the "Attendances (Check In / Check Out)" screen.
     */
    const originalAttendances = require('hr_attendance.my_attendances');

    /**
     * Odoo RPC service.
     * Communicates with Python models from the JavaScript in the frontend.
     */
    const rpc = require('web.rpc');

    /**
     * Converts a float number representing hours (e.g., 8.5) into a string in HH:mm format (e.g., "08:30").
     *
     * @param {number} hoursFloat - A float number representing time in hours. Example: 1.75 means 1 hour and 45 minutes.
     * @returns {string} A string formatted as "HH:mm".
     */
    const floatToHHMM = (hoursFloat) =>{
        const hours = Math.floor(hoursFloat);
        const minutes = Math.round((hoursFloat - hours) * 60);
        const paddedHours = String(hours).padStart(2, '0');
        const paddedMinutes = String(minutes).padStart(2, '0');
        return `${paddedHours}:${paddedMinutes}`;
    }

    /**
     * Extended Odoo attendance client action.
     * This extension overrides the `start` method to inject custom logic for displaying
     * weekly worked hours beneath the employee's name on the UI.
     */
    const attendanceExtension = originalAttendances.include({
        
        /**
         * Override of the original `start` method in the Odoo attendance client action.
         *
         * This method fetches the total number of hours worked by the current user during
         * the current ISO week and displays it in the attendance screen UI.
         *
         * Steps performed:
         * 1. Calls the original `start` method to preserve default behavior.
         * 2. Makes an RPC call to the `hr.attendance` model's `get_weekly_hours` method.
         * 3. Locates the first available `<h3>` or `<h4>` tag where the employee name is displayed.
         * 4. Appends a Bootstrap-styled info alert below the employee name showing the weekly hours in HH:mm format.
         *
         * @async
         * @returns {Promise<void>} A promise that resolves once the UI has been updated.
         */
         start: async function () {           
            await this._super.apply(this, arguments);

            const hours = await rpc.query({
                model: 'hr.attendance',
                method: 'get_weekly_hours',
                args: [],
            });

            const container = this.$el.find('h4, h3').first();
            container.append(`<div class="alert alert-info mt-2">
                Weekly Hours: ${floatToHHMM(hours)} hours
            </div>`);  

            return Promise.resolve();
        },
    });

    return attendanceExtension;
});