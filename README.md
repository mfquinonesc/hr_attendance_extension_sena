# hr_attendance_extension

This custom module adds three key features to the odoo attendance module:

1. Weekly Hours Tracking – Calculates and displays each user's total working hours for the current week.

2. Lunch hour button – Provides a button to log lunch breaks 

3. Auto Check-Out – Automatically checks out any user who hasn't manually done so by the defined cut-off hour.

## Dependencies

This extension depends on the  ```hr_attendance``` Odoo module so this has to be installed too. 

## Requirements and how to use it


### Weekly Hours Tracking

To set the total number of hours worked per week by employees, go to the Company Working Hours section under 
**Settings** → **Employees** → **Work Organization** → **Company Working Hours**. This is for an administrator user. 

This value is calculated assuming a 5-day work week. Therefore, for a 44-hour work week, you should set the daily hours to 44 / 5 = ```8.8```. This value must be set in the  **Company Working Hours** window in the field **Average Hour per Day**. Here, you can define a new one or edit an existing one.

When this value is set, once the employee reaches the defined weekly hours, the color of the weekly hours message will change from red to blue.

This extension also allows you to define the number of working hours individually for each user by configuring this value per user.


### Lunch hour button

In the user interface, a button is added that, when pressed, records both check-in and check-out times using a fixed hour.
The **Check-Out** button remains disabled until the check-in time is reached.


### Auto Checkout Attendances

Once the extension is installed, a scheduled action is created that runs daily at a time defined by the system administrator. This time is configured using the ```CUTOFF_HOUR``` parameter in the **System Parameters** window. The value must be defined as  ```CUTOFF_HOUR``` and entered in the format ```HH:MM```, for example: ```19:35``` for 7:35 PM.

The scheduled action created can be found in the **Scheduled Actions** window in Odoo, under the action name **Auto Checkout Attendances**. This action will execute the function that performs check-outs for attendances that require it. The **Next Execution Date** for the scheduled action, based on the ```CUTOFF_HOUR``` value of ```19:35```, would appear as something like **07/24/2025 19:35:00**, depending on the system's date and time format.

To ensure that the time assigned to the ```CUTOFF_HOUR``` variable is applied to the **Auto Checkout Attendances** action, you must first create the ```CUTOFF_HOUR``` parameter with a predefined time in the correct format, and then reinstall the **hr_attendance_extension** module.

If the extension is installed but the parameter ```CUTOFF_HOUR``` is not created or defined, the default **Next Execution Date** value for the **Auto Checkout Attendances** is set and it depends on the system time zone, usually ```19:00```.