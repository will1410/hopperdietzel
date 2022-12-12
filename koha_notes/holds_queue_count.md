## Adding holds queue count to the home Page

We have 51 libraries in Next Search Catalog and one of the responsibilities at each library is to run their holds queue report and pull items with requests on them at least once a day.  In order to do this there is the built-in holds queue report on the circulation page and we also have several other variants on the holds queue report in our reports library.

Recently it came to my attention that one of my libraries hadn't pulled any requested materials from their shelves since the end of August.

My thought was to find a way to put a holds queue counter on the home page in the staff interface so that staff would not have to run a report (built in or otherwise) in order to be reminded that there were items in their holds queue.  What I came up with is a big button above the news area on the staff interface's home page that not only tells them how many items are currently in their holds queue, but also acts as a link to our "Priority holds reqport."

1. Create a report with this SQL and note the report number to create the "Priority holds report" and note the report number

    - Our priority holds report was designed for several of our libraries where the courier often can't pick up all of the materials due to the volume of shipping.  It reports the same information as the built in holds queue report but it marks items with one of the following designations:

      - Highest priority = the request is for a borrower at this library
      - High priority = the request is for a borrower at another library *but* this is the *only* copy available to fill the request
      - "Blank" or normal = the request is for a borrower at another library and there are multiple copies available to fill the request

    - The report orders the data in order of Priority > Shelving location>Item type > Collection code > Call number > Author > Title

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
    Concat('Accessioned date: ', items.dateaccessioned),
    (Concat(
      '<br />',
      '<a class="btn btn-default noprint" href=\"/cgi-bin/koha/catalogue/detail.pl?biblionumber=',
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
    items.barcode
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
  hold_fill_targets.source_branchcode LIKE <<Choose your library|ZBRAN>>
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

2. Create a report with this SQL to create the button for the home page and note the report number

    - This report creates and styles the button that will eventually appear on the home page in the staff interface

    - This report could easily be re-written to run a different report or to point to the built-in holds queue report

    - Replace "_priority_holds_report_number_" with the number you noted in step 1

```SQL

Select
  CONCAT(
    '<a class="btn btn-lg btn-info btn-block noprint" ',
    'style="font-size: 1.75em; color: white;" ',
    'href="/cgi-bin/koha/reports/guided_reports.pl?phase=Run+this+report&reports=_priority_holds_report_number_&sql_params=',
    branches.branchcode,
    '&param_name=Choose+your+library|ZBRAN&limit=500" ',
    'target="_blank"> ',
    '<i class="fa fa-tasks"></i> Holds queue <br /><span style="font-weight: bold;">(',
    Count(Distinct request_counts.itemnumber),
    '</span> items)</a>'
  ) As COUNT
From
  branches Left Join
  (
    Select
      hold_fill_targets.source_branchcode,
      hold_fill_targets.itemnumber
    From
      hold_fill_targets
    Group By
      hold_fill_targets.source_branchcode,
      hold_fill_targets.itemnumber
  ) request_counts On request_counts.source_branchcode = branches.branchcode
Where
    branches.branchcode = <<Enter branchcode>>
Group By
    branches.branchcode

```

3. Add this jQuery to IntranetUserJS

    - This jQuery gathers the data from the report and puts it on the home page in the staff interface

    - replace "_holds_count_button_report_number_" with the number you noted in Step 2

```javascript

if ( $('#main_intranet-main').length ) {
  var queuebranch = $('.logged-in-branch-code').html().trim();
  $.getJSON('/cgi-bin/koha/svc/report?id=_holds_count_button_report_number_&phase=Run+this+report&param_name=Enter+branchcode&sql_params=' + queuebranch, function(data) {
    $.each(data, function(index, value) {
      var jsonqueue = value
      $('#container-main .col-sm-3 #area-news').prepend('<div style="background-color: #e9edf0;"><h3 style="padding: 0.3em;">Holds queue</h3>' + jsonqueue + '</div>');
    });
  });
}

```
