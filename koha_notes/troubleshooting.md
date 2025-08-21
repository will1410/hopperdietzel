## Getting troubleshooting data from Koha

NEKLS uses an open source ticketing system called OS Ticket (https://osticket.com/) to manage support issues for Next Search Catalog and other support related areas.

When someone at one of our libraries has a support issue issue, they can e-mail the ticketing system and it creates a ticket and notifies the appropriate people and then we can track what's going on as we work to resolve the issue.  An issue that often arises, though, is people will send in e-mail that simply say "Koha doesn't work" or "Why am I seeing an error message?"  My response to about 40% of all tickets that get created is "Which page?" or "Is this in Koha or Aspen Discovery?" or "Could you walk-through the steps of how you got to that error message?" or "Which account is logged in?"  And one of my favorites is "This happened on Monday?  But today's Thursday -- is it still doing it today?"

So I asked myself, wouldn't it be great if there was a button or a link that a staff member could click on in Koha that would copy much of the data I need for troubleshooting and put that on the clipboard so users could just paste that data into an e-mail they send?"

Something that looks like this:

![Location of link on Koha home page](koha_notes\images\troubleshooting\0010.png)

This steps below are how I added a "Copy troubleshooting data" link to the logged-in dropdown menu that's on almost every page in Koha.

#. The first step is to create the link and add it to the drop-down:

```javascript
$(document).ready(function () { 

  //This creates the link in the drop-down
    $('#logged-in-dropdown ul').append('<li class="nav-item"><a id="next_troubleshooting_data" class="toplinks dropdown-item">Copy troubleshooting data</a></li>');

});
```

The nav-item, toplinks, and dropdown-item classes are there to make the link conform the look of the other links in this drop-down.

#. Now that we have a link in the drop-down menu, we need to make something happen when someone clicks the link:

```javascript
$(document).ready(function () { 

  //This creates the link in the drop-down
    $('#logged-in-dropdown ul').append('<li class="nav-item"><a id="next_troubleshooting_data" class="toplinks dropdown-item">Copy troubleshooting data</a></li>');

  //Adds function to the #next_troubleshooting_data link
    $('#next_troubleshooting_data').click(function () { 

      /*  The code you put in this area will happen when you click on the link you created */

    });

});
```

#. Next we need to create some variables to grab the data we want from the browser and the web page:

```javascript
$(document).ready(function () { 

  //This creates the link in the drop-down
    $('#logged-in-dropdown ul').append('<li class="nav-item"><a id="next_troubleshooting_data" class="toplinks dropdown-item">Copy troubleshooting data</a></li>');

  //Adds function to the #next_troubleshooting_data link
    $('#next_troubleshooting_data').click(function () { 

      //Creates variables to be copied to the clipboard
        var ts_timestamp = new Date();
        var ts_koha_version = $('head meta[name="generator"]').attr('content');
        var ts_username = $(".loggedinusername").html().trim();
        var ts_branchcode = $('.logged-in-branch-code').first().text().trim();
        var ts_url = $(location).attr('href');
        var ts_breadcrumbs = $('#breadcrumbs ol li').text().trim().replace(/\n/g, '>').replace(/\s+/g, ' ').replace(/> /g, '>').replace(/>+/g, ' > ');
        var browserName;
        var userAgent = navigator.userAgent;
        var ts_width = $(window).width();
        var ts_height = $(window).height();
        var ts_zoom = Math.round(window.devicePixelRatio * 100);

    });

});
```

#. Now that we have the data, I want to manipulate parts of the breadcrumbs for two reasons.  First, the breadcrumbs can be really long.  Part of this is to shorten that big piece of text.  Second, breadcrumb data can contain patron names.  Since I'll be getting the URL, which will have the borrowernumber in the URL if it's for a patron page, I don't need the card number or patron name to be sent insecurely by e-mail, so this will remove that confidential information:

```javascript
$(document).ready(function () { 

  //This creates the link in the drop-down
    $('#logged-in-dropdown ul').append('<li class="nav-item"><a id="next_troubleshooting_data" class="toplinks dropdown-item">Copy troubleshooting data</a></li>');

  //Adds function to the #next_troubleshooting_data link
    $('#next_troubleshooting_data').click(function () { 

      //Creates variables to be copied to the clipboard
        var ts_timestamp = new Date();
        var ts_koha_version = $('head meta[name="generator"]').attr('content');
        var ts_username = $(".loggedinusername").html().trim();
        var ts_branchcode = $('.logged-in-branch-code').first().text().trim();
        var ts_url = $(location).attr('href');
        var ts_breadcrumbs = $('#breadcrumbs ol li').text().trim().replace(/\n/g, '>').replace(/\s+/g, ' ').replace(/> /g, '>').replace(/>+/g, ' > ');
        var browserName;
        var userAgent = navigator.userAgent;
        var ts_width = $(window).width();
        var ts_height = $(window).height();
        var ts_zoom = Math.round(window.devicePixelRatio * 100);

      //Creates replacement parts for some Breadcrumbs information
        const ts_catalog_details = /(?<=Catalog >).+\>/;
        const ts_cataloging = /(?<=Cataloging > Edit).+\>/;
        const ts_cataloging_edit_record = /(?<=Cataloging > Editing).+/;
        const ts_borrower_checkouts = /(?<=Checkouts >).+/;
        const ts_borrower_batch = /(?<=Check out to).+>/;
        const ts_borrower_details = /(?<=Patrons >).*?>/;
        const ts_borrower_debit_details = /(?<=Details of debit).+/;
        const ts_borrower_credit_details = /(?<=Details of credit).+/;
        const ts_catalog_search_results = /(?<=Catalog > Search for ).+/;
        const ts_modify_patron = /(?<=Modify patron ).+/;
      
      //replaces values from breadcrumbs with replacement parts
        let breadcrumbs = ts_breadcrumbs;
        let ts_breadcrumbs_simplified = breadcrumbs
          .replace(ts_catalog_details, " [TITLE] >")
          .replace(ts_cataloging, " [TITLE] (Record # [BIBLIONUMBER]) >")
          .replace(ts_cataloging_edit_record, " [TITLE] (Record # [BIBLIONUMBER])")
          .replace(ts_borrower_checkouts, " [BORROWERNAME] ([CARDNUMBER])")
          .replace(ts_borrower_batch, " [BORROWERNAME] ([CARDNUMBER]) >")
          .replace(ts_borrower_details, " [BORROWERNAME] ([CARDNUMBER]) >")
          .replace(ts_borrower_debit_details, " ([ACCOUNTLINES_ID])")
          .replace(ts_borrower_credit_details, " ([ACCOUNTLINES_ID])")
          .replace(ts_catalog_search_results, "'[SEARCH_TERMS]'")
          .replace(ts_modify_patron, "'([CATEGORY])'");

    });

});
```

#. Then it's really helpful to know which browser the staff member is using.  We encourage our libraries to use Firefox, but some use Chrome, some use Safari, etc.  This code will help identify which browser the staff member is using:

```javascript
$(document).ready(function () { 

  //This creates the link in the drop-down
    $('#logged-in-dropdown ul').append('<li class="nav-item"><a id="next_troubleshooting_data" class="toplinks dropdown-item">Copy troubleshooting data</a></li>');

  //Adds function to the #next_troubleshooting_data link
    $('#next_troubleshooting_data').click(function () { 

      //Creates variables to be copied to the clipboard
        var ts_timestamp = new Date();
        var ts_koha_version = $('head meta[name="generator"]').attr('content');
        var ts_username = $(".loggedinusername").html().trim();
        var ts_branchcode = $('.logged-in-branch-code').first().text().trim();
        var ts_url = $(location).attr('href');
        var ts_breadcrumbs = $('#breadcrumbs ol li').text().trim().replace(/\n/g, '>').replace(/\s+/g, ' ').replace(/> /g, '>').replace(/>+/g, ' > ');
        var browserName;
        var userAgent = navigator.userAgent;
        var ts_width = $(window).width();
        var ts_height = $(window).height();
        var ts_zoom = Math.round(window.devicePixelRatio * 100);

      //Creates replacement parts for some Breadcrumbs information
        const ts_catalog_details = /(?<=Catalog >).+\>/;
        const ts_cataloging = /(?<=Cataloging > Edit).+\>/;
        const ts_cataloging_edit_record = /(?<=Cataloging > Editing).+/;
        const ts_borrower_checkouts = /(?<=Checkouts >).+/;
        const ts_borrower_batch = /(?<=Check out to).+>/;
        const ts_borrower_details = /(?<=Patrons >).*?>/;
        const ts_borrower_debit_details = /(?<=Details of debit).+/;
        const ts_borrower_credit_details = /(?<=Details of credit).+/;
        const ts_catalog_search_results = /(?<=Catalog > Search for ).+/;
        const ts_modify_patron = /(?<=Modify patron ).+/;
      
      //replaces values from breadcrumbs with replacement parts
        let breadcrumbs = ts_breadcrumbs;
        let ts_breadcrumbs_simplified = breadcrumbs
          .replace(ts_catalog_details, " [TITLE] >")
          .replace(ts_cataloging, " [TITLE] (Record # [BIBLIONUMBER]) >")
          .replace(ts_cataloging_edit_record, " [TITLE] (Record # [BIBLIONUMBER])")
          .replace(ts_borrower_checkouts, " [BORROWERNAME] ([CARDNUMBER])")
          .replace(ts_borrower_batch, " [BORROWERNAME] ([CARDNUMBER]) >")
          .replace(ts_borrower_details, " [BORROWERNAME] ([CARDNUMBER]) >")
          .replace(ts_borrower_debit_details, " ([ACCOUNTLINES_ID])")
          .replace(ts_borrower_credit_details, " ([ACCOUNTLINES_ID])")
          .replace(ts_catalog_search_results, "'[SEARCH_TERMS]'")
          .replace(ts_modify_patron, "'([CATEGORY])'");

      //Simplifies browsername
        if (userAgent.indexOf("Chrome") > -1 && !userAgent.indexOf("Edge") > -1) {
        browserName = "Chrome";
        } else if (userAgent.indexOf("Firefox") > -1) {
            browserName = "Firefox";
        } else if (userAgent.indexOf("Safari") > -1 && !userAgent.indexOf("Chrome") > -1) {
            browserName = "Safari";
        } else if (userAgent.indexOf("Edge") > -1) {
            browserName = "Edge";
        } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
            browserName = "Internet Explorer";
        } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
            browserName = "Opera";
        } else {
            browserName = "Unknown";
        }

    });

});
```

#. Now that we have all of the data we want in variables, this copies the data to the clipboard:

```javascript
$(document).ready(function () { 

  //This creates the link in the drop-down
    $('#logged-in-dropdown ul').append('<li class="nav-item"><a id="next_troubleshooting_data" class="toplinks dropdown-item">Copy troubleshooting data</a></li>');

  //Adds function to the #next_troubleshooting_data link
    $('#next_troubleshooting_data').click(function () { 

      //Creates variables to be copied to the clipboard
        var ts_timestamp = new Date();
        var ts_koha_version = $('head meta[name="generator"]').attr('content');
        var ts_username = $(".loggedinusername").html().trim();
        var ts_branchcode = $('.logged-in-branch-code').first().text().trim();
        var ts_url = $(location).attr('href');
        var ts_breadcrumbs = $('#breadcrumbs ol li').text().trim().replace(/\n/g, '>').replace(/\s+/g, ' ').replace(/> /g, '>').replace(/>+/g, ' > ');
        var browserName;
        var userAgent = navigator.userAgent;
        var ts_width = $(window).width();
        var ts_height = $(window).height();
        var ts_zoom = Math.round(window.devicePixelRatio * 100);

      //Creates replacement parts for some Breadcrumbs information
        const ts_catalog_details = /(?<=Catalog >).+\>/;
        const ts_cataloging = /(?<=Cataloging > Edit).+\>/;
        const ts_cataloging_edit_record = /(?<=Cataloging > Editing).+/;
        const ts_borrower_checkouts = /(?<=Checkouts >).+/;
        const ts_borrower_batch = /(?<=Check out to).+>/;
        const ts_borrower_details = /(?<=Patrons >).*?>/;
        const ts_borrower_debit_details = /(?<=Details of debit).+/;
        const ts_borrower_credit_details = /(?<=Details of credit).+/;
        const ts_catalog_search_results = /(?<=Catalog > Search for ).+/;
        const ts_modify_patron = /(?<=Modify patron ).+/;
      
      //replaces values from breadcrumbs with replacement parts
        let breadcrumbs = ts_breadcrumbs;
        let ts_breadcrumbs_simplified = breadcrumbs
          .replace(ts_catalog_details, " [TITLE] >")
          .replace(ts_cataloging, " [TITLE] (Record # [BIBLIONUMBER]) >")
          .replace(ts_cataloging_edit_record, " [TITLE] (Record # [BIBLIONUMBER])")
          .replace(ts_borrower_checkouts, " [BORROWERNAME] ([CARDNUMBER])")
          .replace(ts_borrower_batch, " [BORROWERNAME] ([CARDNUMBER]) >")
          .replace(ts_borrower_details, " [BORROWERNAME] ([CARDNUMBER]) >")
          .replace(ts_borrower_debit_details, " ([ACCOUNTLINES_ID])")
          .replace(ts_borrower_credit_details, " ([ACCOUNTLINES_ID])")
          .replace(ts_catalog_search_results, "'[SEARCH_TERMS]'")
          .replace(ts_modify_patron, "'([CATEGORY])'");

      //Simplifies browsername
        if (userAgent.indexOf("Chrome") > -1 && !userAgent.indexOf("Edge") > -1) {
        browserName = "Chrome";
        } else if (userAgent.indexOf("Firefox") > -1) {
            browserName = "Firefox";
        } else if (userAgent.indexOf("Safari") > -1 && !userAgent.indexOf("Chrome") > -1) {
            browserName = "Safari";
        } else if (userAgent.indexOf("Edge") > -1) {
            browserName = "Edge";
        } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
            browserName = "Internet Explorer";
        } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
            browserName = "Opera";
        } else {
            browserName = "Unknown";
        }

      //Copies all of the data to the clipboard
        navigator.clipboard.writeText(
          "Troubleshooting information" + 
          "\r\n" +
          "\r\n" +
          "\t" +
          "Date: " + ts_timestamp + 
          "\r\n" +
          "\t" +
          "Koha version: " + ts_koha_version + 
          "\r\n" +
          "\r\n" +
          "\t" +
          "URL: " + ts_url +
          "\r\n" +
          "\t" +
          "Breadcrumbs: " + ts_breadcrumbs_simplified +
          "\r\n" +
          "\r\n" +
          "\t" +
          "Logged in user: " + ts_username + 
          "\r\n" +
          "\t" +
          "Logged in branchcode: " + ts_branchcode +
          "\r\n" +
          "\r\n" +
          "\t" +
          "Browser: " + browserName + " {" + userAgent + "}" +
          "\r\n" +
          "\t" +
          "Browser size: " + ts_width + " x " + ts_height + " Zoom: " + ts_zoom + "%"
        );

    });

});
```

#. This final piece of code makes an alert pop-up on the page when you click the link.  This lets the user know the data has been copied to the clipboard.

The final code for this full package is:

```javascript
$(document).ready(function () { 

  //This creates the link in the drop-down
    $('#logged-in-dropdown ul').append('<li class="nav-item"><a id="next_troubleshooting_data" class="toplinks dropdown-item">Copy troubleshooting data</a></li>');

  //Adds function to the #next_troubleshooting_data link
    $('#next_troubleshooting_data').click(function () { 

      //Creates variables to be copied to the clipboard
        var ts_timestamp = new Date();
        var ts_koha_version = $('head meta[name="generator"]').attr('content');
        var ts_username = $(".loggedinusername").html().trim();
        var ts_branchcode = $('.logged-in-branch-code').first().text().trim();
        var ts_url = $(location).attr('href');
        var ts_breadcrumbs = $('#breadcrumbs ol li').text().trim().replace(/\n/g, '>').replace(/\s+/g, ' ').replace(/> /g, '>').replace(/>+/g, ' > ');
        var browserName;
        var userAgent = navigator.userAgent;
        var ts_width = $(window).width();
        var ts_height = $(window).height();
        var ts_zoom = Math.round(window.devicePixelRatio * 100);

      //Creates replacement parts for some Breadcrumbs information
        const ts_catalog_details = /(?<=Catalog >).+\>/;
        const ts_cataloging = /(?<=Cataloging > Edit).+\>/;
        const ts_cataloging_edit_record = /(?<=Cataloging > Editing).+/;
        const ts_borrower_checkouts = /(?<=Checkouts >).+/;
        const ts_borrower_batch = /(?<=Check out to).+>/;
        const ts_borrower_details = /(?<=Patrons >).*?>/;
        const ts_borrower_debit_details = /(?<=Details of debit).+/;
        const ts_borrower_credit_details = /(?<=Details of credit).+/;
        const ts_catalog_search_results = /(?<=Catalog > Search for ).+/;
        const ts_modify_patron = /(?<=Modify patron ).+/;
      
      //replaces values from breadcrumbs with replacement parts
        let breadcrumbs = ts_breadcrumbs;
        let ts_breadcrumbs_simplified = breadcrumbs
          .replace(ts_catalog_details, " [TITLE] >")
          .replace(ts_cataloging, " [TITLE] (Record # [BIBLIONUMBER]) >")
          .replace(ts_cataloging_edit_record, " [TITLE] (Record # [BIBLIONUMBER])")
          .replace(ts_borrower_checkouts, " [BORROWERNAME] ([CARDNUMBER])")
          .replace(ts_borrower_batch, " [BORROWERNAME] ([CARDNUMBER]) >")
          .replace(ts_borrower_details, " [BORROWERNAME] ([CARDNUMBER]) >")
          .replace(ts_borrower_debit_details, " ([ACCOUNTLINES_ID])")
          .replace(ts_borrower_credit_details, " ([ACCOUNTLINES_ID])")
          .replace(ts_catalog_search_results, "'[SEARCH_TERMS]'")
          .replace(ts_modify_patron, "'([CATEGORY])'");

      //Simplifies browsername
        if (userAgent.indexOf("Chrome") > -1 && !userAgent.indexOf("Edge") > -1) {
        browserName = "Chrome";
        } else if (userAgent.indexOf("Firefox") > -1) {
            browserName = "Firefox";
        } else if (userAgent.indexOf("Safari") > -1 && !userAgent.indexOf("Chrome") > -1) {
            browserName = "Safari";
        } else if (userAgent.indexOf("Edge") > -1) {
            browserName = "Edge";
        } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
            browserName = "Internet Explorer";
        } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
            browserName = "Opera";
        } else {
            browserName = "Unknown";
        }

      //Copies all of the data to the clipboard
        navigator.clipboard.writeText(
          "Troubleshooting information" + 
          "\r\n" +
          "\r\n" +
          "\t" +
          "Date: " + ts_timestamp + 
          "\r\n" +
          "\t" +
          "Koha version: " + ts_koha_version + 
          "\r\n" +
          "\r\n" +
          "\t" +
          "URL: " + ts_url +
          "\r\n" +
          "\t" +
          "Breadcrumbs: " + ts_breadcrumbs_simplified +
          "\r\n" +
          "\r\n" +
          "\t" +
          "Logged in user: " + ts_username + 
          "\r\n" +
          "\t" +
          "Logged in branchcode: " + ts_branchcode +
          "\r\n" +
          "\r\n" +
          "\t" +
          "Browser: " + browserName + " {" + userAgent + "}" +
          "\r\n" +
          "\t" +
          "Browser size: " + ts_width + " x " + ts_height + " Zoom: " + ts_zoom + "%"
        );

      //Lets the user know the data has been copied
        alert("Troubleshooting data has been copied to your clipboard.\r\n\r\nThis data can be pasted into an e-mail to your support provider to make troubleshooting problems easier.");

    });

});
```

