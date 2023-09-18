# Adding HTML alerts/messages to the home page in Koha using jQuery and reports

## Holds queue count (déjà vu)

In the koha-US video ["TTEOT Training Video - S3E9 - jQuery/SQL/CSS: Hold Queue Notifications"](https://www.youtube.com/watch?v=PC4CVUMLriY) which has a corresponding web page at [Adding holds queue count to the home Page](https://hopperdietzel.org/koha_notes/holds_queue_count) I explained how to add a holds queue count and a report to the home page in Koha.

Basically, whenever you load the home page in Koha, a report runs that grabs the holds queue count for the library you're logged in at and then adds that number to a button on the home page screen.  Then, clicking that button runs a holds queue report for that library and the video and web page above can walk you through that process.

With the addition of patron self-cancelled holds in Koha 22.11, the question came up, can we do something similar to alert staff when there's a pending hold shelf cancellation request.

So, here is an explanation of how to use jQuery to add HTML to the home page in Koha above the "News" column on the left hand side of the home page.  And for the purposes of this tutorial, I'm going to add a "Hold shelf cancellation requests" alert to the home page, but I'm going to walk through each piece of the jQuery and SQL to fully explain what's going on.

## Step 1: IntranetUserJS

The basic and most important part of this hack is the code you need to add to IntranetUSerJs.  This jQuery allows you to put whatever you want onto the home page in Koha above the "News" section in the left hand column.

```javascript

//Special functions - create multiple variables for uses in other places 
  //logged_in_branchcode variable
    var logged_in_branchcode = $('.logged-in-branch-code').first().text().trim(); 

//Home 
  //BEGIN holds queue, MIT, and cnx requests buttons on staff interface main page 
    if ( $('#main_intranet-main').length ) { 
      var homepage_action_report = '113'; 
      $.getJSON('/cgi-bin/koha/svc/report?id=' + homepage_action_report + '&phase=Run+this+report&param_name=Branchcode1&sql_params=' + logged_in_branchcode, function(data) { 
        $.each(data, function(index, value) { 
          var homepage_action_buttons = value; 
          $('#area-news').before(homepage_action_buttons); 
        }); 
      }); 
    }

```

### Step 1.a: "logged_in_branchcode" explained

The first part of this is a simple piece of jQuery that grabs the logged in branchcode from the page and converts it into a Javascript variable for use later on.  The current logged in branchcode is something I use repeatedly in the jQuery I write, so it's kind of handy just to create this variable any time a page loads.  That way I can call it whenever I need it.

Since I may need it for running the report here, adding it is essential.

```javascript

//Special functions - create multiple variables for uses in other places 
  //logged_in_branchcode variable
    var logged_in_branchcode = $('.logged-in-branch-code').first().text().trim(); 

```

### Step 1.b: If statement explained

The first part of this piece of jQuery is a Javascript "If/Then" statment.  And in this case it's a pretty simple statement.  The homepage in the staff interface is the only page in Koha that has the ID "main_intranet-main."  So this statement is just saying that the code between the braces is only going execute on pages where the ID = "main_intranet"

```javascript

if ( $('#main_intranet-main').length ) { 

}

```

### Step 1.c: Homepage action report explained

This jQuery works by getting data from a report in the Koha reports module.  When you add a report to Koha, your Koha will automatically assign an ID number to that report.  Since my system is different than your report, the ID number of the report your jQuery needs to run is going to be different than the report ID in my Koha.  All we're doing in this piece is telling the jQuery which report to run.  

In the koha-US demo system, the report I want to run is 113.  When you create the report you want to run in your system, you'll have to replace "113" with the ID number from the report in your system.

```javascript

var homepage_action_report = '113'; 

```

### Step 1.d getJSON explained

Now that we've created the logged_in_branchcode and the homepage_action_report variable, the next command will execute that report.

This piece of the code is a ".getJSON command that executes a Koha report.  The report number it specifies is defined by the homepage_action_report and the branchcode that it uses is the branchcode spcified in the logged_in_branchcode variable - i.e. the branch you're logged in at.

A caveat I'll put here is that if you use a report that includes more runtime paramaters than the one in this example, you need to adjust this URL so that it runs the report properly.

```Javascript

$.getJSON('/cgi-bin/koha/svc/report?id=' + homepage_action_report + '&phase=Run+this+report&param_name=Branchcode1&sql_params=' + logged_in_branchcode, function(data) {

}); 

```

### Step 1.e "each data" explained

And now that we've run the report, we need to get the data out of it.  This command is telling jQuery to take the data and index all of the values that are returned.

The reports I recommend using all have the benefit of only having 1 result, which makes the indexing easy.

```Javascript

$.getJSON('/cgi-bin/koha/svc/report?id=' + homepage_action_report + '&phase=Run+this+report&param_name=Branchcode1&sql_params=' + logged_in_branchcode, function(data) { 
  $.each(data, function(index, value) { 
  
  }); 
}); 

```

### Step 1.f homepage_action_buttons variable explained

Here we're creating a new variable called homepage_action_buttons and the value we're giving it is the data from the report and store it as this variable.

```Javascript

$.getJSON('/cgi-bin/koha/svc/report?id=' + homepage_action_report + '&phase=Run+this+report&param_name=Branchcode1&sql_params=' + logged_in_branchcode, function(data) { 
  $.each(data, function(index, value) { 
    var homepage_action_buttons = value;
  }); 
}); 

```

### Step 1.g Putting it all together

Finally we take the data from the report that's been stored in the homepage_action_buttons variable and we display it on the page.

The selector '#area-news' is the ID of the News column on the left hand side of the page on Koha's home page.  All that's happening here is that jQuery is telling Koha to take all of the data the report gathers and put it in the space right before that div on the page.

The caveat I'll add here is that you can put this HTML anywhere you want it on the homepage.  If you want to put it _after_ the news section, you could switch ".before" to ".after".  If you wanted to put it above the module buttons on the home page you could change the selector from "#area-news" to ".col-sm-9.col-lg-6" and change ".before" to ".prepend".  On Next Search Catalog we already push our pending alerts to the area above the news column, so I actually use "#area-pending" for my location.  The possibilities for where to position this are enormous.

```Javascript

if ( $('#main_intranet-main').length ) { 
  var homepage_action_report = '113'; 
  $.getJSON('/cgi-bin/koha/svc/report?id=' + homepage_action_report + '&phase=Run+this+report&param_name=Branchcode1&sql_params=' + logged_in_branchcode, function(data) { 
    $.each(data, function(index, value) { 
      var homepage_action_buttons = value; 
      $('#area-news').before(homepage_action_buttons); 
    }); 
  }); 
}

```

## Step 2: SQL Report

The second key part of this hack is a report that will run when the home page loads in Koha.

This is the full report that I'm using as a demo for this example.  All it does is gather information about patron initiated hold cancellations.

But you can write a report to do anything you want - or multiple things.  In Next Search Catalog we have a report that counts the holds queue items; missing in transit items; and requested hold cancellations.  The end result is only limited by your ability to write a report to gather data.

```SQL

Select 
  Concat_Ws(
    '',
    If(
      Coalesce(request_cancellation_counts.HOLD_CNX_COUNT, 0) = 0,
      Concat_Ws(
        '',
        '<div ',
        'id="cnx_requests_clear" ',
        'class="page-section" ',
        'style="text-align: center;',
        '">',
        '<h3 class="next_label_green">',
        'No patron cancelled requests',
        '</h3>',
        '</div>'
      ),
      Concat_Ws(
        '',
        '<div id="cnx_requests_action" class="page-section">',
        '<h4 style="background-color: #1f9bde; border-radius: 6px; padding: 1em; text-align: center; ">',
        'Cancelled requests needing action</h4>',
        '<a class="btn btn-lg next_red btn-block noprint" ',
        'style="font-size: 1.5em; color: black;" ',
        'href="/cgi-bin/koha/circ/waitingreserves.pl#holdscancelled_panel" ',
        'target="_blank"> ',
        '<i class="fa fa-tasks"></i> Cancelled requests <br />',
        '<span style="font-weight: bold;">(',
        Coalesce(request_cancellation_counts.HOLD_CNX_COUNT, 0),
        '</span> requests)</a>',
        '</div>'
      )
    )
  ) As INFO
From branches
  Left Join (
    Select 
      reserves.branchcode,
      Count(
        Distinct hold_cancellation_requests.hold_cancellation_request_id
      ) As HOLD_CNX_COUNT
    From hold_cancellation_requests
      Join reserves On hold_cancellation_requests.hold_id = reserves.reserve_id
    Group By 
      reserves.branchcode
  ) request_cancellation_counts On request_cancellation_counts.branchcode = branches.branchcode
Where 
  branches.branchcode = <<Branchcode1>>

```

### Step 2.a: Getting branchcodes

This is pretty self-explanatory - I'm just getting branchcodes from every library in the database.

```SQL

Select
  branches.branchcode
From
  branches
Where
  branches.branchcode = <<Branchcode1>>

```

### Step 2.b: Getting request cancellation data

This will become a sub-query of the SQL in step 2.a.

Basically what I'm doing here is getting the data from reserves so I know which branchcode a request is being picked up at and I'm connecting that to the hold_cancellation_requests table so I can count how many cancellations there are at each branch.

```SQL

Select
  reserves.branchcode,
  Count(Distinct hold_cancellation_requests.hold_cancellation_request_id) As HOLD_CNX_COUNT
From
  hold_cancellation_requests Join
  reserves On hold_cancellation_requests.hold_id = reserves.reserve_id
Group By
  reserves.branchcode

```

Step 2.c: Combining the two

This gets us all of the branchcodes and all of the request cancellation counts - even if the request cancellation count is a null value.

```SQL

Select
  branches.branchcode,
  request_cancellation_counts.HOLD_CNX_COUNT
From branches 
  Left Join (
    Select 
      reserves.branchcode,
      Count(
        Distinct hold_cancellation_requests.hold_cancellation_request_id
      ) As HOLD_CNX_COUNT
    From hold_cancellation_requests
      Join reserves On hold_cancellation_requests.hold_id = reserves.reserve_id
    Group By 
      reserves.branchcode
  ) request_cancellation_counts On request_cancellation_counts.branchcode = branches.branchcode
Where
  branches.branchcode = <<Branchcode1>>

```
Step 2.d: Concatenating the data into an HTML string

This next part is the important part of the SQL in terms of how it is presented on the home page.  In order to add in some HTML so it looks nice, the final result would be pretty boring and not helpful.  By getting the SQL to output some HTML we can create a button that will take the user to the holds awaiting pickup page where they can take the final action to cancel the request and get it off of the hold shelf.

This was my next step getting to the result I wanted.

A few notes:  

- I almost always use "Concat_Ws" instead of "Concat" when I put HTML in an SQL report because if you have a database field that yeilds a null value in a simple "Concat" statement, the entire statement will render as null.  However, if you use "Concat_Ws" SQL will just skip the null values.
- You can use whatever styles you like to format the output.  It's all up to you.
- You can also use any classes that are built into Koha or that you've defined in IntranetUserCss.
- SQL comments can be written inside of forwardshlashes and asterixes as such: /* SQL COMMENT GOES HERE */ and I've added several comments in the SQL below

```SQL

Select 
  Concat_Ws(
    '',     /* Concat_WS('', database feild, 'text string') is effectively the same as a simple Concat() */
    '<div id="cnx_requests_action" ',     /* I'm creating a div and giving it an ID in case I want to do other things to it later */
    'class="page-section">',     /* and I'm giving the div a "page-section" class so it matches the News area */
    '<h4 style="',     /* I'm creating a H4 header and giving it some style */
    'background-color: #1f9bde; ',     /* I'm givning the H$ a color that matches the branding at my library */
    'border-radius: 6px; padding: 1em; text-align: center; ',     /* And I'm making it look like a big button */
    '">',
    'Cancelled requests needing action</h4>',
    '<a class="btn btn-lg next_red btn-block noprint" ',     /* I'm creating a link and styling it like a big button */
    'style="',
    'font-size: 1.5em; ',     /* I'm embiggining the font size on the button */
    'color: black;" ',     /* and making the text black */
    'href="/cgi-bin/koha/circ/waitingreserves.pl#holdscancelled_panel" ',     /* This is the URL of the Holds awaiting pickup page */
    'target="_blank"> ',     /* and I'm making it open in a new window */
    '<i class="fa fa-tasks"></i> ',     /* I'm adding a "To-do" list icon before the text on the button */
    'Cancelled requests <br />',
    '<span ',
    'style="',
    'font-weight: bold;',
    '">(',
    Coalesce(request_cancellation_counts.HOLD_CNX_COUNT, 0),     /* This adds the cancelled holds count to the button */
    '</span>',     /* By coalescing the count with 0, if the count is null, a zero appears instead of no data */
    ' requests)',
    '</a>',
    '</div>'
  ) As INFO
From branches
  Left Join (
    Select 
      reserves.branchcode,
      Count(
        Distinct hold_cancellation_requests.hold_cancellation_request_id
      ) As HOLD_CNX_COUNT
    From hold_cancellation_requests
      Join reserves On hold_cancellation_requests.hold_id = reserves.reserve_id
    Group By 
      reserves.branchcode
  ) request_cancellation_counts On request_cancellation_counts.branchcode = branches.branchcode
Where 
  branches.branchcode = <<Branchcode1>>

```

Step 2.e: Optional-do not display if the count = 0

By wrapping the Concat_Ws() statement from step 2.d with an IF() statement, we can optionally make the HTML not appear if the cancelled request count is zero.


```SQL

Select 
  Concat_Ws(     
    '',
    If(
      Coalesce(request_cancellation_counts.HOLD_CNX_COUNT, 0) = 0,     /* This first part of the If/Then statement is the logical test */
      '',     /* If the logical test is true, i.e. if there are 0 requests, then the report returns an empty string */
      Concat_Ws(     /* But if the test is false, i.e. there are canceled requests, then the HTML appears instead */
        '',
        '<div id="cnx_requests_action" class="page-section">',
        '<h4 style="background-color: #1f9bde; border-radius: 6px; padding: 1em; text-align: center; ">',
        'Cancelled requests needing action</h4>',
        '<a class="btn btn-lg next_red btn-block noprint" ',
        'style="font-size: 1.5em; color: black;" ',
        'href="/cgi-bin/koha/circ/waitingreserves.pl#holdscancelled_panel" ',
        'target="_blank"> ',
        '<i class="fa fa-tasks"></i> Cancelled requests <br />',
        '<span style="font-weight: bold;">(',
        Coalesce(request_cancellation_counts.HOLD_CNX_COUNT, 0),
        '</span> requests)</a>',
        '</div>'
      )
    )
  ) As INFO
From branches
  Left Join (
    Select 
      reserves.branchcode,
      Count(
        Distinct hold_cancellation_requests.hold_cancellation_request_id
      ) As HOLD_CNX_COUNT
    From hold_cancellation_requests
      Join reserves On hold_cancellation_requests.hold_id = reserves.reserve_id
    Group By 
      reserves.branchcode
  ) request_cancellation_counts On request_cancellation_counts.branchcode = branches.branchcode
Where 
  branches.branchcode = <<Branchcode1>>

```

Step 2.f: Optional-display a label if the count = 0

Instead of a blank space, you can add in a message that says "There are 0 cancelled requests" or whatever crazy thing you want to say.

For the purposes of the koha-US demo site, this is the option we've used.

```SQL

Select 
  Concat_Ws(
    '',
    If(
      Coalesce(request_cancellation_counts.HOLD_CNX_COUNT, 0) = 0,
      Concat_Ws(
        '',
        '<div ',
        'id="cnx_requests_clear" ',
        'class="page-section" ',
        'style="text-align: center;',
        '">',
        '<h3 class="next_label_green">',     /* This is a CSS class used by Next Search Catalog in IntranetUserCSS */
        'No patron cancelled requests',
        '</h3>',
        '</div>'
      ),
      Concat_Ws(
        '',
        '<div id="cnx_requests_action" class="page-section">',
        '<h4 style="background-color: #1f9bde; border-radius: 6px; padding: 1em; text-align: center; ">',
        'Cancelled requests needing action</h4>',
        '<a class="btn btn-lg next_red btn-block noprint" ',
        'style="font-size: 1.5em; color: black;" ',
        'href="/cgi-bin/koha/circ/waitingreserves.pl#holdscancelled_panel" ',
        'target="_blank"> ',
        '<i class="fa fa-tasks"></i> Cancelled requests <br />',
        '<span style="font-weight: bold;">(',
        Coalesce(request_cancellation_counts.HOLD_CNX_COUNT, 0),
        '</span> requests)</a>',
        '</div>'
      )
    )
  ) As INFO
From branches
  Left Join (
    Select 
      reserves.branchcode,
      Count(
        Distinct hold_cancellation_requests.hold_cancellation_request_id
      ) As HOLD_CNX_COUNT
    From hold_cancellation_requests
      Join reserves On hold_cancellation_requests.hold_id = reserves.reserve_id
    Group By 
      reserves.branchcode
  ) request_cancellation_counts On request_cancellation_counts.branchcode = branches.branchcode
Where 
  branches.branchcode = <<Branchcode1>>

```

## Step 3: Optional CSS

In order to speed up my custom designs in Koha, I've created several pieces of CSS that can be used to add color to the buttons and labels.  This CSS is not necessary, but it can give you an idea of how we've used CSS to add the different color options mentioned in the report above.

Next Search catalog labels are some pieces of CSS I created that add style to an element in our staff interface based on our branding.

```CSS

/* Next Search Catalog labels */
  .next_label_green {
    background: #9eef8f none;
    color: black;
    padding-left: .75em;
    padding-top: .25em;
    padding-right: .75em;
    padding-bottom: .25em;
    border-radius: 16px;
    display: inline-block;
    font-weight: normal;
    line-height: 1.42857143;
    margin-bottom: 0;
    text-align: center;
    vertical-align: middle;
    white-space: nowrap;
  }
  
  .next_label_yellow {
    background: #efe18f none;
    color: black;
    padding-left: .75em;
    padding-top: .25em;
    padding-right: .75em;
    padding-bottom: .25em;
    border-radius: 16px;
    display: inline-block;
    font-weight: normal;
    line-height: 1.42857143;
    margin-bottom: 0;
    text-align: center;
    vertical-align: middle;
    white-space: nowrap;
  }
  
  .next_label_red {
    background: #ef8f9e none;
    color: black;
    padding-left: .75em;
    padding-top: .25em;
    padding-right: .75em;
    padding-bottom: .25em;
    border-radius: 16px;
    display: inline-block;
    font-weight: normal;
    line-height: 1.42857143;
    margin-bottom: 0;
    text-align: center;
    vertical-align: middle;
    white-space: nowrap;
  }
  
  .next_label_purple {
    background: #e18fef none;
    color: black;
    padding-left: .75em;
    padding-top: .25em;
    padding-right: .75em;
    padding-bottom: .25em;
    border-radius: 16px;
    display: inline-block;
    font-weight: normal;
    line-height: 1.42857143;
    margin-bottom: 0;
    text-align: center;
    vertical-align: middle;
    white-space: nowrap;
  }

  .next_label_dark {
    background: #0157b9 none;
    color: #FFFFFF;
    padding-left: .75em;
    padding-top: .25em;
    padding-right: .75em;
    padding-bottom: .25em;
    border-radius: 16px;
    display: inline-block;
    font-weight: normal;
    line-height: 1.42857143;
    margin-bottom: 0;
    text-align: center;
    vertical-align: middle;
    white-space: nowrap;
  }

  .next_label_medium {
    background: #1f9bde none;
    color: #FFFFFF;
    padding-left: .75em;
    padding-top: .25em;
    padding-right: .75em;
    padding-bottom: .25em;
    border-radius: 16px;
    display: inline-block;
    font-weight: normal;
    line-height: 1.42857143;
    margin-bottom: 0;
    text-align: center;
    vertical-align: middle;
    white-space: nowrap;
  }

  .next_label_light {
    background: #d7ebff none;
    color: #000000;
    padding-left: .75em;
    padding-top: .25em;
    padding-right: .75em;
    padding-bottom: .25em;
    border-radius: 16px;
    display: inline-block;
    font-weight: normal;
    line-height: 1.42857143;
    margin-bottom: 0;
    text-align: center;
    vertical-align: middle;
    white-space: nowrap;
  }

```

Next Search Catalog colors are some pieces of CSS I created to quickly add our preferred colors to different elements in Koha.

```CSS 

/* Next search catalog colors */
  .next_green {
    background: #9eef8f none;
    color: black;
  }
  
  .next_green:hover {
    background: #3ce01f none;
    color: black;
  } 
  
  .next_yellow {
    background: #efe18f none;
    color: black;
  }
  
  .next_yellow:hover {
    background: #e0c422 none;
    color: black;
  }
  
  .next_red {
    background: #ef8f9e none;
    color: black;
  }
    
  .next_red:hover {
    background: #e0223e none;
    color: black;
  }
  
  .next_purple {
    background: #e18fef none;
    color: black;
  }
  
  .next_purple:hover {
    background: #c31fe0 none;
    color: white;
  }

  .next_dark {
    background: #0157b9;
    color: #FFFFFF;
  }

  .next_dark:hover {
    background: #04368e;
    color: #FFFFFF;
  }

  .next_medium {
    background: #1f9bde;
    color: #FFFFFF;
  }

  .next_medium:hover {
    background: #0157b9;
    color: #FFFFFF;
  }

  .next_light {
    background: #d7ebff;;
    color: #000000;
  }

  .next_light:hover {
    background: #1f9bde;
    color: #FFFFFF;
  }

```

## Step 4: Taking it further

In our system we have a report that not only includes the hold cancellation requests, but also a Holds queue count, and a missing-in-transit count.  This creates buttons that further link to a holds queue report and a missing-in-transit report.

### Step 4.a: Next Search Catalog's Homepage Action Report

The JQuery from step 1 is designed to get data from 1 report.  In the case of Next Search Catalog, the report that the jQuery is drawing data from gets data for the holds queue, and our missing-in-transit report, as well as the holds cacellation report.  There are two comments in the SQL about changing report numbers that you should read if you want to try this.

This requires a minor change in our jQuery because the report we're referencing here has 4 runtime variables instead of just the 1 presented earlier.

The part of the jQuery above that reads

```javascript

$.getJSON('/cgi-bin/koha/svc/report?id=' + homepage_action_report + '&phase=Run+this+report&param_name=Branchcode1&sql_params=' + logged_in_branchcode, function(data)

```
must be changed to 

```Javascript 

$.getJSON('/cgi-bin/koha/svc/report?id=' + to_do_dashboard_report + '&phase=Run+this+report&param_name=branchcode+1&sql_params=' + loglibbc + '&param_name=branchcode+2&sql_params=' + loglibbc + '&param_name=branchcode+3&sql_params=' + loglibbc + '&param_name=branchcode+4&sql_params=' + loglibbc, function(data) 

```
on our system for this report to render properly.

```SQL

SELECT
  CONCAT_WS('', 
    IF(
      COALESCE(request_queue_count.REQUEST_COUNT, 0) = 0,
      Concat_WS('',
        '<div ',
          'id="holds_queue_clear" ',
          'class="page-section" ',
          'style="text-align: center;',
        '">',
        '<h3 class="next_label_green">', 
        'Holds queue is empty',
        '</h3>',
        '</div>'
      ),
      Concat_WS('',
        '<div id="holds_queue_action" class="page-section">',
        '<h4 style="background-color: #1f9bde; border-radius: 6px; padding: 1em; text-align: center; ">',
        'Holds queue</h4>',
        '<a class="btn btn-lg next_light btn-block noprint" ',
        'style="font-size: 1.5em; color: black;" ',
        'href="/cgi-bin/koha/reports/guided_reports.pl',
        '?reports=115',     /* Our holds queue report is report 115, so you must change this number to match your own holds queue report */
        '&phase=Run+this+report',
        '&param_name=Choose+your+library|branches',
        '&sql_params=',
        branches.branchcode,
        '&limit=500" ',
        'target="_blank"> ',
        '<i class="fa fa-tasks"></i> Holds queue <br />',
        '<span style="font-weight: bold;">(',
        COALESCE(request_queue_count.REQUEST_COUNT, 0),
        '</span> items)</a>',
        '</div>'
      )
    ),
    IF(
      COALESCE(missing_in_transit.MIT_COUNT, 0) = 0, 
      Concat_WS('',
        '<div ',
          'id="holds_queue_clear" ',
          'class="page-section" ',
          'style="text-align: center;',
        '">',
        '<h3 class="next_label_green">',
        'No missing in transit items',
        '</h3>',
        '</div>'
      ),
      Concat_WS('',
        '<div id="missing_in_transit_action" class="page-section">',
        '<h4 style="background-color: #1f9bde; border-radius: 6px; padding: 1em; text-align: center; ">',
        'Missing in transit</h4>',
        '<a class="btn btn-lg next_purple btn-block noprint" ',
        'style="font-size: 1.5em; color: black;" ',
        'href="/cgi-bin/koha/reports/guided_reports.pl?',
        'reports=116',     /* Our missing in transit report is report 116, so you must change this number to match your own missing in transit report */
        '&phase=Run+this+report',
        '&param_name=Choose+your+library|branches',
        branches.branchcode,
        '&limit=500',
        'target="_blank"> ',
        '<i class="fa fa-tasks"></i> Missing in transit <br />',
        '<span style="font-weight: bold;">(',
        COALESCE(missing_in_transit.MIT_COUNT, 0),
        '</span> items)</a>',
        '</div>'
      )
    ),
    IF(
      COALESCE(request_cancellations.HOLD_CNX_COUNT, 0) = 0,
      '',
      Concat_WS('', 
        '<div id="cnx_requests_action" class="page-section">',
        '<h4 style="background-color: #1f9bde; border-radius: 6px; padding: 1em; text-align: center; ">',
        'Cancelled requests needing action</h4>',
        '<a class="btn btn-lg next_red btn-block noprint" ',
        'style="font-size: 1.5em; color: black;" ',
        'href="/cgi-bin/koha/circ/waitingreserves.pl#holdscancelled_panel" ',
        'target="_blank"> ',
        '<i class="fa fa-tasks"></i> Cancelled requests <br />',
        '<span style="font-weight: bold;">(',
        COALESCE(request_cancellations.HOLD_CNX_COUNT, 0),
        '</span> requests)</a>',
        '</div>'
      )
    )
  ) AS HOLDS_MITS_REQCNX
FROM
  branches LEFT JOIN
  (
    SELECT
      hold_fill_targets.source_branchcode,
      Count(DISTINCT hold_fill_targets.itemnumber) AS REQUEST_COUNT
    FROM
      hold_fill_targets
    GROUP BY
      hold_fill_targets.source_branchcode
  ) request_queue_count 
    ON request_queue_count.source_branchcode = branches.branchcode LEFT JOIN
  (
    SELECT
      reserves.branchcode,
      Count(DISTINCT hold_cancellation_requests.hold_cancellation_request_id) AS
      HOLD_CNX_COUNT
    FROM
      hold_cancellation_requests JOIN
      reserves ON hold_cancellation_requests.hold_id = reserves.reserve_id
    GROUP BY
      reserves.branchcode
  ) request_cancellations 
    ON request_cancellations.branchcode = branches.branchcode,
  (
    SELECT
      Count(DISTINCT branchtransfers.itemnumber) AS MIT_COUNT
    FROM
      branchtransfers JOIN
      items ON branchtransfers.itemnumber = items.itemnumber
    WHERE
      (
        (
          branchtransfers.datearrived IS NULL 
            OR
          branchtransfers.datearrived = ''
        ) 
          AND
        (
          branchtransfers.datecancelled IS NULL 
            OR
          branchtransfers.datecancelled = ''
        ) 
          AND
        branchtransfers.datesent < CurDate() - INTERVAL 7 DAY 
          AND
        branchtransfers.tobranch = <<branchcode 1>>
      ) 
        OR
      (
        (
          branchtransfers.datearrived IS NULL 
            OR
          branchtransfers.datearrived = ''
        )  
          AND
        (
          branchtransfers.datecancelled IS NULL 
            OR
          branchtransfers.datecancelled = ''
        ) 
          AND
        branchtransfers.datesent < CurDate() - INTERVAL 7 DAY 
          AND
        branchtransfers.frombranch = <<branchcode 2>>
      ) 
        OR
      (
        (
          branchtransfers.datearrived IS NULL 
            OR
          branchtransfers.datearrived = ''
        ) 
          AND
        (
          branchtransfers.datecancelled IS NULL 
            OR
          branchtransfers.datecancelled = ''
        ) 
          AND
        branchtransfers.datesent < CurDate() - INTERVAL 7 DAY 
          AND
        items.homebranch = <<branchcode 3>>
      )
  ) missing_in_transit
WHERE
  branches.branchcode = <<branchcode 4>>

```

### Step 4.b: Priority holds queue report

This is the Next Search Catalog priority holds queue report:

```SQL

SELECT 
  Concat_Ws( 
    '<br />', 
    If( 
      LOCATIONS.lib = PERM_LOCATIONS.lib, 
      LOCATIONS.lib, 
      Concat(PERM_LOCATIONS.lib, " (", LOCATIONS.lib, ")") 
    ), 
    ITEMTYPESS.description, 
    CCODES.lib, 
    items.itemcallnumber, 
    items.copynumber, 
    If( 
      hold_fill_targets.source_branchcode = priority.branchcode, 
      "<span style='font-weight: bold;'>(Highest priority)</span>", 
      If( 
        hold_fill_targets.item_level_request = 1, 
        "<span style='font-weight: bold;'>(Highest priority)</span>", 
        If( 
          priority.Count_itemnumber = 1, 
          "<span>(High priority)</span>",
          "" 
        ) 
      ) 
    ), 
    Concat('<span class="noprint">Accessioned date: ', items.dateaccessioned, '</span>'), 
    (Concat( 
      '<br />', 
      '<a class="next_btn next_green noprint" href=\"/cgi-bin/koha/catalogue/detail.pl?biblionumber=', 
      biblio.biblionumber, 
      '\" target="_blank">Go to biblio</a>' 
      ) 
    ) 
  ) AS CALL_NUMBER, 
  Concat_Ws( 
    '<br />', 
    biblio.author, 
    Concat_Ws( 
      ' ', 
      biblio.title, 
      '<br />', 
      IF( 
        ExtractValue(biblio_metadata.metadata, '//datafield[@tag="245"]/subfield[@code="h"]') = '', 
        '', 
        Concat( 
          ExtractValue(biblio_metadata.metadata, '//datafield[@tag="245"]/subfield[@code="h"]'), 
          '<br />' 
        ) 
      ), 
      IF( 
        ExtractValue(biblio_metadata.metadata, '//datafield[@tag="245"]/subfield[@code="b"]') = '', 
        '', 
        Concat( 
          ExtractValue(biblio_metadata.metadata, '//datafield[@tag="245"]/subfield[@code="b"]'), 
          '<br />' 
        ) 
      ), 
      IF( 
        ExtractValue(biblio_metadata.metadata, '//datafield[@tag="245"]/subfield[@code="n"]') = '', 
        '', 
        Concat( 
          ExtractValue(biblio_metadata.metadata, '//datafield[@tag="245"]/subfield[@code="n"]'), 
          '<br />' 
        ) 
      ), 
      IF( 
        ExtractValue(biblio_metadata.metadata, '//datafield[@tag="245"]/subfield[@code="p"]') = '', 
        '', 
        Concat( 
          ExtractValue(biblio_metadata.metadata, '//datafield[@tag="245"]/subfield[@code="p"]'), 
          '<br />' 
        ) 
      ) 
    ) 
  ) AS AUTHOR_TITLE, 
  Concat_Ws( 
    '<br />', 
    Concat( 
      '<img src="/cgi-bin/koha/svc/barcode?barcode=', 
      '*', 
      Upper(items.barcode), 
      '*', 
      '&type=Code39"></img>' 
    ), 
    items.barcode , 
    '<br />', 
    items.holdingbranch
  ) AS BARCODE 
FROM 
  biblio LEFT JOIN 
  ((hold_fill_targets LEFT JOIN 
  items ON hold_fill_targets.itemnumber = items.itemnumber) LEFT JOIN 
  biblio_metadata ON items.biblionumber = biblio_metadata.biblionumber) ON 
      biblio.biblionumber = biblio_metadata.biblionumber LEFT JOIN 
  ( 
    SELECT 
      authorised_values.category, 
      authorised_values.authorised_value, 
      authorised_values.lib 
    FROM 
      authorised_values 
    WHERE 
      authorised_values.category = 'CCODE' 
  ) CCODES 
  ON CCODES.authorised_value = 
    items.ccode LEFT JOIN 
  ( 
    SELECT 
      authorised_values.category, 
      authorised_values.authorised_value, 
      authorised_values.lib 
    FROM 
      authorised_values 
    WHERE 
      authorised_values.category = 'LOC' 
  ) PERM_LOCATIONS 
  ON PERM_LOCATIONS.authorised_value = items.permanent_location LEFT JOIN 
  ( 
    SELECT 
      authorised_values.category, 
      authorised_values.authorised_value, 
      authorised_values.lib 
    FROM 
      authorised_values 
    WHERE 
      authorised_values.category = 'LOC' 
  ) LOCATIONS 
  ON LOCATIONS.authorised_value = items.location LEFT JOIN 
  ( 
    SELECT 
      itemtypes.itemtype, 
      itemtypes.description 
    FROM 
      itemtypes 
  ) ITEMTYPESS 
  ON ITEMTYPESS.itemtype = items.itype JOIN 
  ( 
    SELECT 
      hold_fill_targets.reserve_id, 
      reserves.branchcode, 
      icounts.Count_itemnumber 
    FROM 
      hold_fill_targets JOIN 
      reserves ON reserves.reserve_id = hold_fill_targets.reserve_id LEFT JOIN 
      ( 
        SELECT 
          items.biblionumber, 
          Count(DISTINCT items.itemnumber) AS Count_itemnumber 
        FROM 
          items 
        WHERE 
          (items.notforloan IS NOT NULL OR 
            items.notforloan <> 0) AND 
          (items.damaged IS NOT NULL OR 
            items.damaged <> 0) AND 
          (items.itemlost IS NOT NULL OR 
            items.itemlost <> 0) AND 
          (items.withdrawn IS NOT NULL OR 
            items.withdrawn <> 0) AND 
          items.onloan IS NULL 
        GROUP BY 
          items.biblionumber 
    ) icounts 
    ON icounts.biblionumber = hold_fill_targets.biblionumber 
  ) priority 
  ON priority.reserve_id = hold_fill_targets.reserve_id 
WHERE 
  hold_fill_targets.source_branchcode LIKE <<Choose your library|branches>> 
GROUP BY 
  hold_fill_targets.itemnumber 
ORDER BY 
  If( 
    hold_fill_targets.source_branchcode = priority.branchcode, 
    "1", 
    If( 
      hold_fill_targets.item_level_request = 1, 
      "1", 
      If( 
        priority.Count_itemnumber = 1, 
        "2", 
        "3" 
      ) 
    ) 
  ), 
  items.homebranch, 
  PERM_LOCATIONS.lib, 
  ITEMTYPESS.description, 
  CCODES.lib, 
  items.itemcallnumber, 
  biblio.author, 
  biblio.title, 
  items.barcode

```

### Step 4.c: Missing in transit report

This is the SQL for the Next Search Catalog "Missing-in-transit" report.

This report replaces Koha's built in "Transfers to receive" report for us because we wanted a report that indicated more than just transfers to receive.

This report includes items were:

1. Transferred _to_ this library from another library more than 7 days ago
2. Transferred _from_ this library to another library more than 7 days ago
3. _Owned_ by this library and were transfered between two other libraries more than 7 days ago 

The other feature of this report is that there is a complex "mailto" link that's created in the last column.  If there is a result that is missing in transit, clicking this link will tell your default e-mail program to send an e-mail to the owning, sending, and receiving library and the body of the message will ask staff at those libraries to do a shelf-check for the item.


```SQL

SELECT 
  Concat( 
    '<a class="btn btn-default btn-xs noprint"', 
    'href=\"/cgi-bin/koha/catalogue/detail.pl?biblionumber=', 
    item_info.biblionumber, 
    '\" target="_blank">BIBLIO</a>' 
  ) AS 'LINK', 
  item_info.HOME_LIBRARY, 
  item_info.branchname AS CURRENTLY_AT, 
  item_info.LOCATION, 
  item_info.ITYPE, 
  item_info.CCODE, 
  item_info.CALL_NUMBER, 
  item_info.author, 
  item_info.TITLE, 
  item_info.datelastseen, 
  item_info.barcode1, 
  item_info.homebranch AS OWNED_BY, 
  frombranches.branchname AS SENT_FROM, 
  branchtransfers.datesent AS SENT_DATE, 
  tobranches.branchname AS SENT_TO, 
  branchtransfers.reason AS TRANSFER_REASON, 
  Concat_WS('', 
    '<a class="btn btn-default btn-xs noprint" ', 
    'href="mailto:', 
    item_info.branchemail, 
    '?subject=Missing&nbsp;in&nbsp;transit&nbsp;', 
    branchtransfers.branchtransfer_id, 
    '&amp;cc=', 
    frombranches.branchemail, 
    ';', 
    tobranches.branchemail, 
    '&body=An%20item%20owned%20by%20&#42;&#42;', 
    item_info.HOME_LIBRARY, 
    '&#42;&#42;%20was%20shipped%20from%20&#42;&#42;', 
    frombranches.branchname, 
    '&#42;&#42;%20to%20&#42;&#42;', 
    tobranches.branchname, 
    '&#42;&#42;%20on%20', 
    branchtransfers.datesent, 
    '%20and%20the%20item%20has%20not%20yet%20arrived.', 
    '%0D%0A%0D%0A', 
    'The%20details%20are%20as%20follow%3A', 
    '%0D%0A%0D%0A', 
    'Branch%20transfer%20ID%3A%20', 
    branchtransfers.branchtransfer_id, 
    '%0D%0A%0D%0A', 
    'Home%20library%3A%20', 
    item_info.HOME_LIBRARY, 
    '%0D%0ALocation%3A%20', 
    item_info.LOCATION, 
    '%0D%0AItem%20type%3A%20', 
    item_info.ITYPE, 
    '%0D%0ACollection%20code%3A%20', 
    item_info.CCODE, 
    '%0D%0ACall%20number%3A%20', 
    item_info.CALL_NUMBER, 
    '%0D%0AAuthor%3A%20', 
    item_info.author, 
    '%0D%0ATitle%3A%20', 
    UPPER(REPLACE(item_info.TITLE, '&', 'and')), 
    '%0D%0ABarcode%20number%3A%20', 
    item_info.barcode, 
    '%0D%0A%0D%0A', 
    'Sent%20from%3A%20', 
    frombranches.branchname, 
    '%0D%0ASent%20to%3A%20', 
    tobranches.branchname, 
    '%0D%0ASent%20on%3A%20', 
    branchtransfers.datesent, 
    '%0D%0A%0D%0A', 
    'Transfer%20reason%3A%20', 
    branchtransfers.reason, 
    '%20%0D%0A%0D%0A', 
    'Could%20you%20please%20check%20the%20shelves%20at%20your%20library%20', 
    '&#40;including%20the%20hold%20shelf&#41;%20', 
    'and%20check%20this%20item%20in%20if%20you%20find%20it&#63;', 
    '%0D%0A%0D%0A', 
    'Thank you,', 
    '%20%0D%0A%0D%0A', 
    '">Send e-mail</a>' 
  ) AS MAILTO_LINK
FROM 
  branchtransfers JOIN 
  branches frombranches ON branchtransfers.frombranch = frombranches.branchcode JOIN 
  branches tobranches ON branchtransfers.tobranch = tobranches.branchcode JOIN 
  (SELECT 
    items.biblionumber, 
    items.itemnumber, 
    items.barcode, 
    home.branchname AS HOME_LIBRARY, 
    holding.branchname, 
    perm_locs.lib AS PERM_LOCATION, 
    Concat_Ws('', 
      perm_locs.lib, 
      If(locs.lib = 'Recently returned', ' (Recently returned)', '') 
    ) AS LOCATION, 
    itemtypes.description AS ITYPE, 
    ccodes.lib AS CCODE, 
    items.itemcallnumber, 
    Concat_Ws('', 
      items.itemcallnumber, 
      If(items.copynumber IS NULL, '', Concat(' (Copy number: ', items.copynumber, ')')) 
    ) AS CALL_NUMBER, 
    biblio.author, 
    Concat_Ws(' ', biblio.title, biblio.medium, biblio.subtitle, 
    biblioitems.number, biblio.part_name) AS TITLE, 
    items.datelastseen, 
    items.copynumber, 
    Concat('-', items.barcode, '-') AS barcode1, 
    items.homebranch, 
    home.branchemail 
  FROM 
    items JOIN 
    biblio ON items.biblionumber = biblio.biblionumber JOIN 
    biblioitems ON biblioitems.biblionumber = biblio.biblionumber LEFT JOIN 
    (SELECT 
      authorised_values.category, 
      authorised_values.authorised_value, 
      authorised_values.lib, 
      authorised_values.lib_opac 
    FROM 
      authorised_values 
    WHERE 
      authorised_values.category = 'LOC' 
    ) 
    perm_locs ON perm_locs.authorised_value = items.permanent_location LEFT JOIN 
    (SELECT 
      authorised_values.category, 
      authorised_values.authorised_value, 
      authorised_values.lib, 
      authorised_values.lib_opac 
    FROM 
      authorised_values 
    WHERE 
      authorised_values.category = 'LOC' 
    ) locs ON locs.authorised_value = items.location LEFT JOIN 
    itemtypes ON itemtypes.itemtype = items.itype LEFT JOIN 
    (SELECT 
      authorised_values.category, 
      authorised_values.authorised_value, 
      authorised_values.lib, 
      authorised_values.lib_opac 
    FROM 
      authorised_values 
    WHERE 
      authorised_values.category = 'CCODE' 
    ) 
    ccodes ON 
    ccodes.authorised_value = items.ccode LEFT JOIN 
    branches home ON home.branchcode = items.homebranch LEFT JOIN 
    branches holding ON holding.branchcode = items.holdingbranch 
  GROUP BY 
    items.biblionumber, 
    items.itemnumber 
  ) 
  item_info ON item_info.itemnumber = branchtransfers.itemnumber 
WHERE 
  branchtransfers.datearrived IS NULL AND 
  branchtransfers.datecancelled IS NULL AND 
  Concat_Ws(' | ', 
    item_info.homebranch, 
    branchtransfers.frombranch, 
    branchtransfers.tobranch 
  ) LIKE Concat('%', <<Choose your library|branches>>, '%') AND 
  branchtransfers.datesent < CurDate() - INTERVAL 7 DAY 
GROUP BY 
  item_info.biblionumber, 
  item_info.itemnumber 
ORDER BY 
  item_info.HOME_LIBRARY, 
  item_info.PERM_LOCATION, 
  item_info.ITYPE, 
  item_info.CCODE, 
  item_info.itemcallnumber, 
  item_info.author, 
  item_info.TITLE, 
  item_info.copynumber 

```