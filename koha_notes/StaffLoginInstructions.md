# Koha Login Instructions

There is a system preference in Koha called  StaffLoginInstructions that allows you to add content to the login page in Koha.


## First attempt

The first change I ever made to this page was pretty simple:

```html

<h2>Main office contact informaiton</h2>
<h3>
  Main office: 785-555-5555<br>
  Toll free: 800-555-5555<br>
  eMail: help@just_a_sample.com<br>
  After hours: 208-555-5555<br>
</h3>

```

The problem with this is that it puts the conten into the box with the username and password input fields.  It crowds a lot of stuff into that box and I wasn't satisfied with the results.

![First attempt](koha_notes/images/stafflogininstructions.png){:class="img-responsive"}

## Second attempt

The next step I took was to add some jQuery to the system preference to put the content I wanted above the box.

```html

<script type="text/javascript">

function init() {

  //Creates contact info on login page
    $('#main_auth.main_main-auth #login').before('<!-- Contact information -->' +
      '<div id="next_office" style="text-align: center;">' +
      '<h2>' + 
      'Main office contact informaiton' + 
      '</h2>' +
      '<h3>' + 
      'Phone: 785-555-5555<br>' + 
      'eMail: help@just_a_sample.com<br>' + 
      'Toll free: 800-555-5555<br>' + 
      'After hours: 208-555-5555<br>' + 
      '</h3>' +
      '</div>'
    );
  
}
  
//makes the function run when the login page loads
  window.onload = init;

</script>

```

This script puts the contact information I want above the box at the top of the page and I was happy with this for a very long time.

## Additional enhancements - post upgrade message

After an upgrade we ask staff to clear the cache on their browser before they log in.  I wanted to add a reminder on this page so staff would remember to clear their caches.  Typically I leave this code in the preference all of the time but I add "display: none;" to the style tag.  That way I don't have to remember where I stored the code and paste it back into place every time I need it.  All I have to do is update the message and add or remove the "display: none" attribute from the style tag as needed.

That code looks like this:

```javascript

  //Creates an upgrade message on login page
    $('#main_auth.main_main-auth #login').parent().prepend('<!-- NSC Upgrade message -->' + 
      '<div">' + 
        '<h2 id="upgrade_note" class="next_login_message" style="text-align: center; font-size: 3em;">' + 
          'Koha was upgraded on Saturday night<br>Please clear your browser\'s cache<br>before logging in on or after Smarch 55, 2525.' + 
        '</h2>' + 
        '<h3 style="text-align: center; font-size: 2em;">' + 
          '<a href="https://northeast-kansas-library-system.github.io/nextsteps/upgrades/upgrade_clear_cache.html" target="_blank">' + 
            'Clear your browser cache (type \'SHIFT-CTRL-DELETE\') instructions' + 
          '</a>' + 
        '</h3>' + 
      '</div>'
    );

```

## Further enhancement to the post-upgrade message

Unfortunately many staff found it possible to ignore the post-upgrade message.  So, I added some further code to highlight the message when the cursor hovers over it.  I think that may be helping - I think the flashing yellow background actually gets an extra 2 or 3 people to notice the message.

```javascript

  //adds hover function to login message on login page
    $('.next_login_message').hover(function() {
      $( ".next_login_message" ).css("background-color","#FFFF00");
        }, function(){
      $( ".next_login_message" ).css("background-color","#E6F0F2");
    });

```


## Then I went a little crazy

One of the problems with the contact information is that people who log in and need help when our office is closed don't reach out for help when they need help.  They will send e-mail for situations when it would actually be better to phone the "After hours" number.  So I wanted to come up with a way to automatically change the contact information depeding on the time of the day and the day of the week.

There are notes in the code that describe what it's doing.  And this code is set for Central time.  If you're in a different time zone, you'll have to make changes to the gmt_offset variables for your time zone.

The same is true for the open hours and weekday/weekend variables.  The NEKLS office is open M-F from 8:00 a.m. to 5:00 p.m.  The related fields would need to be updated if your hours and days open do not match those hours.

```javascript

  //Creates open hours notice
    //Calculate USA Daylight Savings Time start and end
      var dst_date_now = new Date();
      var dst_start_year = dst_date_now.getUTCFullYear();
      var march_start_first = new Date(dst_start_year, '2', '1');
      var march_start_first_day_of_week = march_start_first.getDay();
      var dst_start_date = new Date(march_start_first - ( -(14 - march_start_first_day_of_week) * 86400000));
      var november_end_first = new Date(dst_start_year, '10', '1');
      var november_end_first_day_of_week = november_end_first.getDay();
      var dst_end_date = new Date(november_end_first - ( -(7 - november_end_first_day_of_week) * 86400000));
      console.log('dst_start_date: ' + dst_start_date);
      console.log('dst_end_date: ' + dst_end_date);

    //Set offset for Standard time vs Daylight time
      if (dst_date_now >= dst_start_date && dst_date_now <= dst_end_date) {
        console.log('Central Daylight Time')
        var gmt_offset = 5
      } else {
        console.log('Central Standard Time')
        var gmt_offset = 6
      }
      console.log('gmt_offset: ' + gmt_offset);

    //Set open hours and weekday/weekend variables
      var d = new Date();
      var x = new Date(d.getTime() - gmt_offset * 60 * 60 * 1000);
      var y = x.toUTCString();
      let day = x.getUTCDay();
      let hour = x.getUTCHours();
      var weekday = (day >= 1 && day <= 6);
      var openhour = (hour >= 8 && hour <= 17);

    //If it's the weekend or not an "Open" hour, display a "NEKLS office is closed" message
      if ((openhour !== true) || (weekday !== true)) {
        $('#next_office_closed').show();
        console.log('The main office is currently closed.  If you need immediate help with Koha, please phone the after-hours number listed below');
        } else {
        $('#next_office_open').show();
        console.log('The NEKLS office is currently open.');
      }

```

Once that's set, you would use it by updating the contact information function.  Essentially what you do is create two contact information sections.  One is in a div with an ID called "next_contact_open" and the other is in a div with an ID called "next_contact_closed" and both include the style tag "display: none;"

The last part of the date function switches the style tag from "display: none" to "display: ;" depending on whether that function shows the office as open or closed.

The full final script reads:

```html

<script type="text/javascript">

function init() {

  //Creates an upgrade message on login page
    $('#main_auth.main_main-auth #login').parent().prepend('<!-- NSC Upgrade message -->' + 
      '<div ' + 
      /* add or remove "none" in the next line to turn the  message on or off */
      'style="display: none;"' + 
      '>' + 
        '<h2 id="upgrade_note" class="next_login_message" style="text-align: center; font-size: 3em;">' + 
          'Koha was upgraded on Saturday night<br>Please clear your browser\'s cache<br>before logging in on or after Smarch 55, 2525.' + 
        '</h2>' + 
        '<h3 style="text-align: center; font-size: 2em;">' + 
          '<a href="https://northeast-kansas-library-system.github.io/nextsteps/upgrades/upgrade_clear_cache.html" target="_blank">' + 
            'Clear your browser cache (type \'SHIFT-CTRL-DELETE\') instructions' + 
          '</a>' + 
        '</h3>' + 
      '</div>'
    );

  //adds hover function to the upgrade message on login page
    $('.next_login_message').hover(function() {
      $( ".next_login_message" ).css("background-color","#FFFF00");
        }, function(){
      $( ".next_login_message" ).css("background-color","#E6F0F2");
    });

  //Creates contact info on login page
    $('#main_auth.main_main-auth #login').before('<!-- Contact information -->' +
      '<div id="next_office_open" style="text-align: center;display: none;">' +
      '<h2>' + 
      'Main office contact informaiton' + 
      '</h2>' +
      '<h3>' + 
      'Phone: 785-555-5555<br>' + 
      'eMail: help@just_a_sample.com<br>' + 
      'Toll free: 800-555-5555<br>' + 
      'After hours: 208-555-5555<br>' + 
      '</h3>' +
      '</div>' +
      '<div id="next_office_closed" style="text-align: center;display: none;">' +
      '<h2>' + 
      'The Main office is typically open Monday-Friday, 8:00 a.m. - 5:00 p.m.<br>' +
      'If you need immediate help, please call the "After hours" number listed below.<br />' + 
      'For non-immediate problems, please email us at the address below.</h2>' +
      '</h2>' +
      '<h3>' + 
      'eMail: help@just_a_sample.com<br>' + 
      'After hours: 208-555-5555<br>' + 
      '</h3>' +
      '</div>'
    );
  
  //Creates open hours notice
    //Calculate USA Daylight Savings Time start and end
      var dst_date_now = new Date();
      var dst_start_year = dst_date_now.getUTCFullYear();
      var march_start_first = new Date(dst_start_year, '2', '1');
      var march_start_first_day_of_week = march_start_first.getDay();
      var dst_start_date = new Date(march_start_first - ( -(14 - march_start_first_day_of_week) * 86400000));
      var november_end_first = new Date(dst_start_year, '10', '1');
      var november_end_first_day_of_week = november_end_first.getDay();
      var dst_end_date = new Date(november_end_first - ( -(7 - november_end_first_day_of_week) * 86400000));
      console.log('dst_start_date: ' + dst_start_date);
      console.log('dst_end_date: ' + dst_end_date);

    //Set offset for Standard time vs Daylight time
      if (dst_date_now >= dst_start_date && dst_date_now <= dst_end_date) {
        console.log('Central Daylight Time')
        var gmt_offset = 5
      } else {
        console.log('Central Standard Time')
        var gmt_offset = 6
      }
      console.log('gmt_offset: ' + gmt_offset);

    //Set open hours and weekday/weekend variables
      var d = new Date();
      var x = new Date(d.getTime() - gmt_offset * 60 * 60 * 1000);
      var y = x.toUTCString();
      let day = x.getUTCDay();
      let hour = x.getUTCHours();
      var weekday = (day >= 1 && day <= 6);
      var openhour = (hour >= 8 && hour <= 17);

    //If it's the weekend or not an "Open" hour, display a "NEKLS office is closed" message
      if ((openhour !== true) || (weekday !== true)) {
        $('#next_office_closed').show();
        console.log('The main office is currently closed.  If you need immediate help with Koha, please phone the after-hours number listed below');
        } else {
        $('#next_office_open').show();
        console.log('The NEKLS office is currently open.');
      }
  
}
  
//makes the function run when the login page loads
  window.onload = init;

</script>

```

## Final thoughts

These are examples of what works for me at my libraries.  The content you put in this system preference is totally configurable depending on your own situation.  You can make the content of the messages whatever you want it to be.