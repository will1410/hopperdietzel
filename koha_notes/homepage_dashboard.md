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
  hold_fill_targetss.Count_itemnumber
FROM
  branches LEFT JOIN
  (
    SELECT
      hold_fill_targets.source_branchcode,
      Count(DISTINCT hold_fill_targets.itemnumber) AS Count_itemnumber
    FROM
      hold_fill_targets
    GROUP BY
      hold_fill_targets.source_branchcode
  ) hold_fill_targetss 
    ON hold_fill_targetss.source_branchcode = branches.branchcode
WHERE
  branches.branchcode = 'NEKLS'

```

Next I needed a basic report that gets me the missing in transit count.  For our 50 library consortium, we consider "Missing-in-transit" to be anything that has been in transit for more than 7 days.  And unlike the built in "Transfers to receive" report at Home > Circulation > Transfers to receive (circ/transferstoreceive.pl), we run a custom report that shows us which items are being shipped to a specific library, from a specific library, and owned by a specific library that have been in transit for more than 7 days.

In order to cover my requirements of from; to; and owning branches, the "WHERE" section of this report becomes more complex because I want all of the possible matches to the library I'm logged in at.

The basic report I need here is:

```SQL

SELECT
  Count(DISTINCT branchtransfers.itemnumber) AS Count_itemnumber,
  branchtransfers.tobranch,
  branchtransfers.frombranch,
  items.homebranch
FROM
  branchtransfers JOIN
  items ON branchtransfers.itemnumber = items.itemnumber
WHERE
  (branchtransfers.datearrived IS NULL AND
    branchtransfers.datecancelled IS NULL AND
    branchtransfers.datesent < CurDate() - INTERVAL 7 DAY AND
    branchtransfers.tobranch = 'NEKLS') OR
  (branchtransfers.datearrived IS NULL AND
    branchtransfers.datecancelled IS NULL AND
    branchtransfers.datesent < CurDate() - INTERVAL 7 DAY AND
    branchtransfers.frombranch = 'NEKLS') OR
  (branchtransfers.datearrived IS NULL AND
    branchtransfers.datecancelled IS NULL AND
    branchtransfers.datesent < CurDate() - INTERVAL 7 DAY AND
    items.homebranch = 'NEKLS')
GROUP BY
  branchtransfers.tobranch,
  branchtransfers.frombranch,
  items.homebranch

```

And finally, I need a basic report that gets me the hold request cancellation count.  This is a pretty easy report to write because this data is stored in a table called "hold_cancellation_requests."

```SQL

SELECT
  cancellation_count.Count_hold_cancellation_request_id
FROM
  branches LEFT JOIN
  (
    SELECT
      reserves.branchcode,
      Count(DISTINCT hold_cancellation_requests.hold_cancellation_request_id) AS
      Count_hold_cancellation_request_id
    FROM
      hold_cancellation_requests JOIN
      reserves ON hold_cancellation_requests.hold_id = reserves.reserve_id
    GROUP BY
      reserves.branchcode
  ) cancellation_count 
    ON cancellation_count.branchcode = branches.branchcode
WHERE
  branches.branchcode = 'NEKLS'

```

### Step 1: Combine holds queue and request cancellation reports

Two of these reports, the request queue count and the holds cancellation count, both rely on the "branches" table, so they are easy to combine.

Since each of these reports has a sub-query, all I have to do is put both subqueries into the same report and join them both on branches.  This report will get me a holds count and a request cancellation count for the same library in one step.

```SQL

SELECT
  hold_count.Count_itemnumber,
  cancellation_count.Count_hold_cancellation_request_id
FROM
  branches LEFT JOIN
  (
    SELECT
      hold_fill_targets.source_branchcode,
      Count(DISTINCT hold_fill_targets.itemnumber) AS Count_itemnumber
    FROM
      hold_fill_targets
    GROUP BY
      hold_fill_targets.source_branchcode
  ) hold_count 
    ON hold_count.source_branchcode = branches.branchcode 
  LEFT JOIN
  (
    SELECT
      reserves.branchcode,
      Count(DISTINCT hold_cancellation_requests.hold_cancellation_request_id) AS
      Count_hold_cancellation_request_id
    FROM
      hold_cancellation_requests JOIN
      reserves ON hold_cancellation_requests.hold_id = reserves.reserve_id
    GROUP BY
      reserves.branchcode
  ) cancellation_count 
    ON cancellation_count.branchcode = branches.branchcode
WHERE
  branches.branchcode = 'NEKLS'
GROUP BY
  hold_count.Count_itemnumber,
  cancellation_count.Count_hold_cancellation_request_id

```

### Step 3: Add the missing in transit report

Adding the missing in transit report is more complicated because of the 3 different possible fields for branchcodes, but less complicated because I'm ont linking this sub-query to anything else in the overall query.

This almost gets me the three basic numbers I need.  What I want to do, though, is to make sure that if the value of one of these numbers is null, I want to substitute a zero, so I'll throw in a Coalesce to get me zeros instead of nulls.

```SQL

SELECT
  Coalesce(hold_count.Count_itemnumber, 0) AS HOLDS_QUEUE,
  Coalesce(Sum(missing_in_transit.Count_itemnumber), 0) AS MISSING_IN_TRANSIT,
  Coalesce(cancellation_count.Count_hold_cancellation_request_id, 0) AS HOLD_CANCELLATIONS
FROM
  branches LEFT JOIN
  (
    SELECT
      hold_fill_targets.source_branchcode,
      Count(DISTINCT hold_fill_targets.itemnumber) AS Count_itemnumber
    FROM
      hold_fill_targets
    GROUP BY
      hold_fill_targets.source_branchcode
  ) hold_count 
    ON hold_count.source_branchcode = branches.branchcode LEFT JOIN
  (
    SELECT
      reserves.branchcode,
      Count(DISTINCT hold_cancellation_requests.hold_cancellation_request_id) AS
      Count_hold_cancellation_request_id
    FROM
      hold_cancellation_requests JOIN
      reserves ON hold_cancellation_requests.hold_id = reserves.reserve_id
    GROUP BY
      reserves.branchcode
  ) cancellation_count 
    ON cancellation_count.branchcode = branches.branchcode,
  (
    SELECT
      Count(DISTINCT branchtransfers.itemnumber) AS Count_itemnumber,
      branchtransfers.tobranch,
      branchtransfers.frombranch,
      items.homebranch
    FROM
      branchtransfers JOIN
      items ON branchtransfers.itemnumber = items.itemnumber
    WHERE
      (branchtransfers.datearrived IS NULL AND
        branchtransfers.datecancelled IS NULL AND
        branchtransfers.datesent < CurDate() - INTERVAL 7 DAY AND
        branchtransfers.tobranch = 'NEKLS') OR
      (branchtransfers.datearrived IS NULL AND
        branchtransfers.datecancelled IS NULL AND
        branchtransfers.datesent < CurDate() - INTERVAL 7 DAY AND
        branchtransfers.frombranch = 'NEKLS') OR
      (branchtransfers.datearrived IS NULL AND
        branchtransfers.datecancelled IS NULL AND
        branchtransfers.datesent < CurDate() - INTERVAL 7 DAY AND
        items.homebranch = 'NEKLS')
    GROUP BY
      branchtransfers.tobranch,
      branchtransfers.frombranch,
      items.homebranch
  ) missing_in_transit
WHERE
  branches.branchcode = 'NEKLS'
GROUP BY
  hold_count.Count_itemnumber,
  cancellation_count.Count_hold_cancellation_request_id

```

### Step 4: HTML and Concatenate 3 columns to 1 column



