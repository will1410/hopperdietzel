# Home page dashboard alerts

## Holds queue count (déjà vu)

In the koha-US video ["TTEOT Training Video - S3E9 - jQuery/SQL/CSS: Hold Queue Notifications"](https://www.youtube.com/watch?v=PC4CVUMLriY) which has a corresponding web page at [Adding holds queue count to the home Page](https://hopperdietzel.org/koha_notes/holds_queue_count) I explained how to add a holds queue count and a report to the home page in Koha.

Basically, whenever you load the home page in Koha, a report runs that grabs the holds queue count for the library you're logged in at and then adds that number to a button on the home page screen.  Then, clicking that button runs a holds queue report for that library and the video and web page above can walk you through that process.

With the addition of patron self-cancelled holds in Koha 22.11, the question came up, can we do something similar to alert staff when there's a pending hold shelf cancellation request.

Additionally, I've had staff that want our built-in Missing-in-transit report to display more prominently, so I decided to throw that in as well.

So, here it is, some jQuery, a report, and some CSS that put a Holds queue count, a Missing-in-transit count, and a Holds shelf cancellation requests count all on the home page in Koha.

## SQL

I'm going to go through these steps one-by-one


### Step 1: Basic reports

The first thing I need is a report that will get me the holds queue count.  This was my first pass at this report: 

```SQL

SELECT
  hold_fill_targetss.REQUEST_COUNT
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
  ) hold_fill_targetss 
    ON hold_fill_targetss.source_branchcode = branches.branchcode
WHERE
  branches.branchcode = 'HIGH_CC'

```

Next I needed a basic report that gets me the missing in transit count.  For our 50 library consortium, we consider "Missing-in-transit" to be anything that has been in transit for more than 7 days.  And unlike the built in "Transfers to receive" report at Home > Circulation > Transfers to receive (circ/transferstoreceive.pl), we run a custom report that shows us which items are being shipped to a specific library, from a specific library, and owned by a specific library that have been in transit for more than 7 days.

In order to cover my requirements of from; to; and owning branches, the "WHERE" section of this report becomes more complex because I want all of the possible matches to the library I'm logged in at.

The basic report I need here is:

```SQL

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
    branchtransfers.tobranch = 'HIGH_CC'
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
    branchtransfers.frombranch = 'HIGH_CC'
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
    items.homebranch = 'HIGH_CC'
  )

```

And finally, I need a basic report that gets me the hold request cancellation count.  This is a pretty easy report to write because this data is stored in a table called "hold_cancellation_requests."

```SQL

SELECT
  cancellation_count.HOLD_CNX_COUNT
FROM
  branches LEFT JOIN
  (
    SELECT
      Count(DISTINCT hold_cancellation_requests.hold_cancellation_request_id) AS
      HOLD_CNX_COUNT,
      reserves.branchcode
    FROM
      hold_cancellation_requests JOIN
      reserves ON hold_cancellation_requests.hold_id = reserves.reserve_id
    GROUP BY
      reserves.branchcode
  ) cancellation_count 
    ON cancellation_count.branchcode = branches.branchcode
WHERE
  branches.branchcode = 'HIGH_CC'

```

### Step 2: Combine holds queue and request cancellation reports

Two of these reports, the request queue count and the holds cancellation count, both rely on the "branches" table, so they are easy to combine.

Since each of these reports has a sub-query, all I have to do is put both subqueries into the same report and join them both on branches.  This report will get me a holds count and a request cancellation count for the same library in one step.

```SQL

SELECT
  request_queue_count.REQUEST_COUNT,
  request_cancellations.HOLD_CNX_COUNT
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
    ON request_cancellations.branchcode = branches.branchcode
WHERE
  branches.branchcode = 'HIGH_CC'

```

### Step 3: Add the missing in transit report

Adding the missing in transit report is more complicated because of the 3 different possible fields for branchcodes, but less complicated because I'm ont linking this sub-query to anything else in the overall query.

This almost gets me the three basic numbers I need.  What I want to do, though, is to make sure that if the value of one of these numbers is null, I want to substitute a zero, so I'll throw in a Coalesce to get me zeros instead of nulls.

```SQL

SELECT
  coalesce(request_queue_count.REQUEST_COUNT, 0) AS REQUEST_COUNT,
  coalesce(missing_in_transit.MIT_COUNT, 0) AS MIT_COUNT,
  coalesce(request_cancellations.HOLD_CNX_COUNT, 0) AS HOLD_CNX_COUNT
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
        branchtransfers.tobranch = 'HIGH_CC'
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
        branchtransfers.frombranch = 'HIGH_CC'
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
        items.homebranch = 'HIGH_CC'
      )
  ) missing_in_transit
WHERE
  branches.branchcode = 'HIGH_CC'

```

### Step 4: HTML and Concatenate 3 columns to 1 column

The final step of the SQL is to turn these 3 little pieces of data into 1 big piece of HTML.  To do that I'm going to use SQL's concat functions.

I'll start by creating one CONCAT to turn all of the results into 1 column instead of 3, then I'll concat the data I want from each column in the existing SQL into separate bits of data.  Also, just as a personal preference, I'll do everything as a "CONCAT_WS()" instead of just a normal "CONCAT()."  The advantage of this is that, if you try to use "CONCAT" and something you've includede in the concatenation includes a null value, the value of the entire "CONCAT()" statement will be null.  CONCAT_WS() merely ignores null values, so if something you want to include includes a null value, you still get a result with CONCAT_WS() where a CONCAT() statement would reuire a further COALESCE() in order to work around the null value.

At this point, I'm also going to switch my branchcode input from 'HIGH_CC' (one of our branches that's good for testing) to input parameters.  Since this report needs to be run in such a way to get the results from the JSON link, each parameter must be entered separately.  The API doesn't allow for duplicated input parameters like the reports module does.


```SQL

SELECTATCHISON
  CONCAT_WS('', 
    IF(
      COALESCE(request_queue_count.REQUEST_COUNT, 0) = 0,
      Concat_WS('',
        '<div ',
          'id="holds_queue_clear" ',
          'class="page-section" ',
          'style="text-align: center;',
        '">',
        '<h3 class="next_label_green">', /*"next_label_green" is a class we use in Next Search Catalog (see below)*/
        'Holds queue is empty',
        '</h3>',
        '</div>'
      ),
      Concat_WS('',
        '<div id="holds_queue_action" class="page-section">',
        '<h4 style="background-color: #1f9bde; border-radius: 6px; padding: 1em; text-align: center; ">',
        'Holds queue</h4>',
        '<a class="btn btn-lg next_light btn-block noprint" ', /*"next_light" is a class we use in Next Search Catalog (see below)*/
        'style="font-size: 1.5em; color: black;" ',
        'href="/cgi-bin/koha/reports/guided_reports.pl?phase=Run+this+report&reports=',
        '3084', /*Replace 3084 with the report number you use for the holds queue report (see below)*/
        '&sql_params=',
        branches.branchcode,
        '&param_name=Choose+your+library|ZBRAN&limit=500" ',
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
        '<h3 class="next_label_green">', /*"next_label_green" is a class we use in Next Search Catalog (see below)*/
        'No missing in transit items',
        '</h3>',
        '</div>'
      ),
      Concat_WS('',
        '<div id="missing_in_transit_action" class="page-section">',
        '<h4 style="background-color: #1f9bde; border-radius: 6px; padding: 1em; text-align: center; ">',
        'Missing in transit</h4>',
        '<a class="btn btn-lg next_purple btn-block noprint" ', /*"next_purple" is a class we use in Next Search Catalog (see below)*/
        'style="font-size: 1.5em; color: black;" ',
        'href="/cgi-bin/koha/reports/guided_reports.pl?phase=Run+this+report',
        '&reports=',
        '3658', /*Replace 3658 with the report number for the missing-in-transit report (see below)*/
        '&sql_params=1',
        '&sql_params=',
        branches.branchcode,
        '&param_name=Sort+by|XS_BRANCH',
        '&param_name=Choose+your+library|branches',
        '&limit=500" ',
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
        '<a class="btn btn-lg next_red btn-block noprint" ', /*"next_red" is a class we use in Next Search Catalog (see below)*/
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