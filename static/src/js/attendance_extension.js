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
     * Session service to access information about the current user, company, and context.
     */
    const session = require('web.session');

    /**
     * Converts a float number representing hours (e.g., 8.5) into a string in HH:mm format (e.g., "08:30").
     *
     * @param {number} hoursFloat - A float number representing time in hours. Example: 1.75 means 1 hour and 45 minutes.
     * @returns {string} A string formatted as "HH:mm".
     */
    const floatToHHMM = (hoursFloat) =>{
        const hours = Math.floor(hoursFloat);
        const minutes = Math.floor((hoursFloat - hours) * 60);
        const paddedHours = String(hours).padStart(2, '0');
        const paddedMinutes = String(minutes).padStart(2, '0');
        return `${paddedHours}:${paddedMinutes}`;
    }

    /**
     * Converts a UTC datetime string to local time and formats it as "YYYY-MM-DD HH:MM:SS".
     *
     * @param {string} utcString - UTC time, e.g., "2025-07-09 22:36:22"
     * @returns {string} Local time in 24-hour format
     */
    const formatTimeLocal = (utcString) => {
        const iso = utcString.replace(" ", "T") + "Z";
        const date = new Date(iso);
        return date.toLocaleString("en-CA", {            
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
        });
    };

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
         * 5. Calls the `getLunchCheckInAttendance` method to check if a future lunch check-in already exists.
         * 6. Locates the attendance UI container and appends a "Lunch Hour" button.
         * 7. Disables the button if:
         *    - The employee is currently checked out, or
         *    - A lunch check-in already exists.
         * 8. Binds a click event to the "Lunch Hour" button, which triggers the `setLunchHour` method.
         *
         * @async
         * @returns {Promise<void>} A promise that resolves once the UI has been updated.
         */
         start: async function () {           
            await this._super.apply(this, arguments);

            const hours = await this.getWeeklyHours();

            const container = this.$el.find('h4, h3').first();
            const hoursMessage = await this.getWorkedHoursMessage(hours);
            container.append(
                `<div id="weekly-hours-box" class="alert alert-info mt-4">
                    ${hoursMessage}
                </div>`
            );  

            const attendance = await this.getLunchCheckInAttendance();        
                
            const attendanceContainer = this.$el.find('.o_hr_attendance_kiosk_mode');

            const disabled = this.employee.attendance_state == 'checked_out' || attendance;
                
            attendanceContainer.append(`
                <button id="lunch-hour-button" class="btn btn-primary mt-4" ${disabled? 'disabled':''}>
                    Hora de Almuerzo
                </button>
            `);

            this.$el.find('#lunch-hour-button').on('click', this.setLunchHour.bind(this));     

            if (disabled)
                this.$el.find("#lunch-hour-button").hide();

            return Promise.resolve();
        },

        /**
         * Registers the user's lunch hour if not already set.
         *       
         * @async       
         */
        setLunchHour: async function () {   

            const attendance = await this.getLunchCheckInAttendance();
            if(attendance)             
                return            

            if(this.employee.attendance_state == 'checked_in'){

                const checks = await rpc.query({
                    model: 'hr.attendance',
                    method: 'set_lunch_hour',
                    args: [],
                });          
                               
                this.$el.find('#lunch-hour-button').hide();
                
                const hours = await this.getWeeklyHours();
                const hoursMessage = await this.getWorkedHoursMessage(hours);
                this.$el.find('#weekly-hours-box').html(hoursMessage);

                this.call('notification', 'notify', {
                    title: 'Hora de Almuerzo',
                    message: `La hora de almuerzo fue marcada desde las ${formatTimeLocal(checks.check_out)} hasta las ${formatTimeLocal(checks.check_in)}.`,
                    type: 'success',                  
                });
            }                
        },

        /**
         * Retrieves the next lunch check-in attendance for the current user.        
         *
         * @async
         * @returns {Promise<Object|null>} A promise that resolves to the lunch attendance record 
         * or undefined if no lunch check-in is found.
         */
        getLunchCheckInAttendance: async function() {
            return await rpc.query({
                model: 'hr.attendance',
                method: 'get_lunch_check_in',
                args: [],
            });
        },

        /**
         * Fetches the total weekly worked hours for the current user.
         *
         * @async
         * @returns {Promise<number>} Weekly worked hours.
         */
        getWeeklyHours: async function () {
            return await rpc.query({
                model: 'hr.attendance',
                method: 'get_weekly_hours',
                args: [],
            });
        },

        /**
         * Generates a message displaying the total worked hours so far this week.
         *
         * @param {number} weeklyHours - The total number of hours worked this week. 
         * @returns {string} A string message showing the worked hours.                            
         */
        getWorkedHoursMessage: async function(weeklyHours){
            let hoursText = floatToHHMM(weeklyHours);
            const weeklyWorkHours =  await this.getWeeklyWorkHours();
            if(weeklyHours < weeklyWorkHours)
               hoursText = `<span class="text-danger">${hoursText}</span>`;            
            
            return `Horas laboradas en la semana: ${hoursText}`;
        },

        /**
         * Overrides the original method to show a warning if the check button is active before the lunch hour ends.
         * 
         * @override
         */
        update_attendance: function () {
            const self = this;
            const _super = this._super;

            this.getLunchCheckInAttendance()
            .then((att)=>{
                if (att?.check_in && new Date(att.check_in + 'Z') > new Date()) {
                    this.call('notification', 'notify', {
                        title: 'Hora de Almuerzo',
                        message: `Ya ha marcado la hora de almuerzo. Debe esperar hasta las ${formatTimeLocal(att.check_in)} para poder registrar la salida.`,
                        type: 'warning',
                    });
                    return
                }
                // Call the original method
                return _super.apply(self, arguments);
            }); 
        },

        /**
         * Gets the total weekly working hours assigned to the current employee.
         * Assumes a 5-day workweek.   
         *
         * @returns {Promise<number>} The total number of working hours per week.
         */
        getWeeklyWorkHours: async function(){

            const employees = await  this._rpc({
                model: "hr.employee",
                method: "search_read",
                args: [[["user_id", "=", session.uid]], ["name", "resource_calendar_id"]],
            });
                                
            if(!(employees && employees.length > 0))
                return 0;

            const employee = employees[0];
            const calendarId = employee.resource_calendar_id?.[0];
          
            const calendars = await this._rpc({
                model: 'resource.calendar',
                method: 'read',
                args: [[calendarId], ['name', 'hours_per_day']],
            });

            if(!(calendars && calendars.length > 0))
                return 0;

            const calendar = calendars[0];           
            return calendar.hours_per_day * 5;
        }
    });

    return attendanceExtension;
});