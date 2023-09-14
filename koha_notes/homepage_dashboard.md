# Home page dashboard alerts

## Holds queue count (déjà vu)

In the koha-US video ["TTEOT Training Video - S3E9 - jQuery/SQL/CSS: Hold Queue Notifications"](https://www.youtube.com/watch?v=PC4CVUMLriY) which has a corresponding web page at [Adding holds queue count to the home Page](https://hopperdietzel.org/koha_notes/holds_queue_count) I explained how to add a holds queue count and a report to the home page in Koha.

Basically, whenever you load the home page in Koha, a report runs that grabs the holds queue count for the library you're logged in at and then adds that number to a button on the home page screen.  Then, clicking that button runs a holds queue report for that library and the video and web page above can walk you through that process.

With the addition of patron self-cancelled holds in Koha 22.11, the question came up, can we do something similar to alert staff when there's a pending hold shelf cancellation request.

Additionally, I've had staff that want our built-in Missing-in-transit report to display more prominently, so I decided to throw that in as well.

So, here it is, some jQuery, a report, and some CSS that put a Holds queue count, a Missing-in-transit count, and a Holds shelf cancellation requests count all on the home page in Koha.

## SQL

I'm going to go through these steps one-by-one


### Step 1: Basic SQL reports

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

Next I need a basic report that gets me the hold request cancellation count.  This is a pretty easy report to write because this data is stored in a table called "hold_cancellation_requests."

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

Finally I needed a basic report that gets me the missing in transit count.  

For our 50 library consortium, we consider "Missing-in-transit" to be anything that has been in transit for more than 7 days.  And unlike the built in "Transfers to receive" report at Home > Circulation > Transfers to receive (circ/transferstoreceive.pl), we run a custom report that shows us which items are being shipped to a specific library, from a specific library, and owned by a specific library that have been in transit for more than 7 days.

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

### Step 2: Combine holds queue and request cancellation reports

After I wrote the basic reports, I needed to start combining them so I could get all of the data I wanted as 1 result.

The first two reports both rely on the "branches" table, so they are easy to combine.

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

Finally I need to add in the report for the missing-in-transit data.

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

The final step of the SQL is to turn these 3 separate pieces of data into 1 big piece of HTML.  To do that I'm going to use SQL's concat functions.

I'll start this process by creating one CONCAT to adjust the results so they display in 1 column instead of 3, then I'll concat the data I want from each column in the existing SQL into separate chunks of HTML.  Also, just as a personal preference, I'll do everything as a "CONCAT_WS()" instead of just a normal "CONCAT()."  The advantage of this is that, if you try to use "CONCAT" and something you've includede in the concatenation results in a null value, the value of the entire "CONCAT()" statement will be null.  CONCAT_WS() merely ignores null values, so if something you want to include results in a null value, you still get a result with CONCAT_WS() where a CONCAT() statement would reuire a further COALESCE() statements in order to work around the null value.

At this point, I'm also going to switch my branchcode input from 'HIGH_CC' (one of our branches that's good for testing) to input parameters.  Since this report needs to be run in such a way to get the results from the JSON link, each parameter must be entered separately.  The API doesn't allow for duplicated input parameters like the reports module does.

I've added some comments (SQL comments are nested inside of "/*  */" comment tags) to show where I've got connections to other things in this tutorial.

This is the first piece of SQL you need to add to your Koha in order to make this package work.

```SQL

SELECT
  CONCAT_WS('', 
    IF(
      COALESCE(request_queue_count.REQUEST_COUNT, 0) = 0,
      Concat_WS('',

        /* This section puts up a label that says "Holds queue is empty" if the holds queue count is zero */

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

      /* If the holds queue count is greater than zero, this is the HTML staff will see */

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

      /* This section puts up a "No missing in transit items" message if the MIT count = 0 */

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

      /* If there are missing in transit items, this is the HTML the staff will see */

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

      /* If there are no hold cancellation requests, nothing appears on the screen */

      '',

      /* If there are hold cancellation requests, this is the HTML the staff will see */

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

### Step 5: Next Search Catalog report 3084

The "Holds queue" part of this package runs Next Search Catalog report 3084 - the "Priority holds report."

This report duplicates the same data that's in the built-in Holds queue report at circ/view_holdsqueue.pl.  But it rearranges it slightly.

This report classifies requests as "Highest priority" if a requested item is for pickup at this library or if the request is at the item level.  It classifies requests as "High priority" if the copy requested is the only copy owned by any library.  But it does not make a priority distinction if there are multiple copies available to fill a request.

The reason we use this report in Next Search Catalog is because our biggest libraries are clustered together geographically and the couriers that serve these larger libraries often don't have the space to pick up all of the requested items a library might have on a given day.  Prioritizing the items that need to be pulled helps these libraries better manage their time when getting ready for a courier pickup.

The SQL for this report is below and this is the second piece of SQL you need to add to your Koha in order to make this whole package work.  Specifically, you need to add this report to your reports module and then put the report id number in the spot in the earlier SQL where you see "3084."

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
  biblio 
    LEFT JOIN 
  (
    (hold_fill_targets LEFT JOIN 
    items ON hold_fill_targets.itemnumber = items.itemnumber) LEFT JOIN 
    biblio_metadata ON items.biblionumber = biblio_metadata.biblionumber
  ) 
    ON biblio.biblionumber = biblio_metadata.biblionumber LEFT JOIN 
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
    ON CCODES.authorised_value = items.ccode LEFT JOIN 
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
      reserves 
        ON reserves.reserve_id = hold_fill_targets.reserve_id LEFT JOIN 
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

### Step 6: Next Search Catalog report 3658

The "Missing in transit" part of this package runs Next Search Catalog report 3084 - the "Missing in transit items."

This report duplicates part of the "Transfers to recieve" report built into Koha at circ/transferstoreceive.pl.  Specifically, this report only shows items that have been in transit for more than 7 days.  But it does more.  "Transfers to recieve" only looks at transfers that your library is expecting to receive.  This report will also show you which items have been transfered from your library to another library that have been in transit for more than 7 days.  But it does more.  Since it is possible for an item owned by Library A to be in transit from Library B to Library C, this report also looks for those items that have been in tranit for more than 7 days.

This report gives you more detail about items than is built into Koha's "Transfers to receive" report.

One of the pieces that is built into this report is a simple, old fashioned "mailto" link.  If you run this report and you need to contact other libraries involved in the transfer, the button in the far right column will open your computer's default e-mail program (if you have one configured on your computer) and put all of the relevant information about the item that's missing into an e-mail asking all libraries involved in the transfer to do a shelf-check.

The SQL for this report is below and this is the third piece of SQL you need to add to your Koha in order to make this whole package work.  Specifically, you need to add this report to your reports module and then put the report id number in the spot in the earlier SQL where you see "3658."

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
    UPPER(item_info.TITLE), 
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
  ) AS MAILTO_LINK, 
  @SortOrder := <<Sort by|XS_BRANCH>> AS SORTING 
FROM 
  branchtransfers JOIN 
  branches frombranches ON branchtransfers.frombranch = frombranches.branchcode JOIN 
  branches tobranches ON branchtransfers.tobranch = tobranches.branchcode JOIN 
  (
    SELECT 
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
      biblio 
        ON items.biblionumber = biblio.biblionumber JOIN 
      biblioitems 
        ON biblioitems.biblionumber = biblio.biblionumber LEFT JOIN 
      (
        SELECT 
          authorised_values.category, 
          authorised_values.authorised_value, 
          authorised_values.lib, 
          authorised_values.lib_opac 
        FROM 
          authorised_values 
        WHERE 
          authorised_values.category = 'LOC' 
      ) perm_locs 
        ON perm_locs.authorised_value = items.permanent_location LEFT JOIN 
      (
        SELECT 
          authorised_values.category, 
          authorised_values.authorised_value, 
          authorised_values.lib, 
          authorised_values.lib_opac 
        FROM 
          authorised_values 
        WHERE 
          authorised_values.category = 'LOC' 
      ) locs 
        ON locs.authorised_value = items.location LEFT JOIN 
      itemtypes 
        ON itemtypes.itemtype = items.itype LEFT JOIN 
      (
        SELECT 
          authorised_values.category, 
          authorised_values.authorised_value, 
          authorised_values.lib, 
          authorised_values.lib_opac 
        FROM 
          authorised_values 
        WHERE 
          authorised_values.category = 'CCODE' 
      ) 
      ccodes 
        ON ccodes.authorised_value = items.ccode LEFT JOIN 
      branches home 
        ON home.branchcode = items.homebranch LEFT JOIN 
      branches holding 
        ON holding.branchcode = items.holdingbranch 
    GROUP BY 
      items.biblionumber, 
      items.itemnumber 
  ) 
  item_info 
    ON item_info.itemnumber = branchtransfers.itemnumber 
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
  CASE WHEN SORTING = '1' THEN item_info.HOME_LIBRARY END ASC, 
  CASE WHEN SORTING = '2' THEN item_info.PERM_LOCATION END ASC, 
  item_info.PERM_LOCATION, 
  item_info.ITYPE, 
  item_info.CCODE, 
  item_info.itemcallnumber, 
  item_info.author, 
  item_info.TITLE, 
  item_info.copynumber 

```

### Step 7: CSS

In order to speed up my custom designs in Koha, I've created several pieces of CSS that can are used here to add color to the buttons and labels.  This CSS is not necessary, but it can give you an idea of how we've used CSS to add the different color options mentioned in the above reports.

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

### Step 8: IntranetUserJS

For this final part, you've got two options.

No matter which option you choose, you need to change the variable "to_do_dashboard_report" from 3759 to the number Koha assigned the report in step 4.

In Next Search Catalog we've moved the alert information on the home page to the space above the left-hand news column.  If you've already moved the alert data, then you need to add this jQuery to your IntranetUserJS system preference to make the buttons appear above the alerts:

```Javascript

//Home 
  //BEGIN holds queue, MIT, and cnx requests buttons on staff interface main page 
    if ( $('#main_intranet-main').length ) { 
      var to_do_dashboard_report = "3759"; 
      $.getJSON('/cgi-bin/koha/svc/report?id=' + to_do_dashboard_report + '&phase=Run+this+report&param_name=branchcode+1&sql_params=' + loglibbc + '&param_name=branchcode+2&sql_params=' + loglibbc + '&param_name=branchcode+3&sql_params=' + loglibbc + '&param_name=branchcode+4&sql_params=' + loglibbc, function(data) { 
        $.each(data, function(index, value) { 
          var to_do_dashboard = value; 
          $('#area-pending').before(to_do_dashboard); 
        }); 
      }); 
    }

```

If you have not moved the alert information to the space above the news column, then you need to use this jQuery.

```Javascript

//Home 
  //BEGIN holds queue, MIT, and cnx requests buttons on staff interface main page 
    if ( $('#main_intranet-main').length ) { 
      var to_do_dashboard_report = "3759"; 
      $.getJSON('/cgi-bin/koha/svc/report?id=' + to_do_dashboard_report + '&phase=Run+this+report&param_name=branchcode+1&sql_params=' + loglibbc + '&param_name=branchcode+2&sql_params=' + loglibbc + '&param_name=branchcode+3&sql_params=' + loglibbc + '&param_name=branchcode+4&sql_params=' + loglibbc, function(data) { 
        $.each(data, function(index, value) { 
          var to_do_dashboard = value; 
          $('#area-news').before(to_do_dashboard); 
        }); 
      }); 
    }

```