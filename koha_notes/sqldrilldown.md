## SQL drill downs in Koha reports 

Essentially, an SQL drill down is using Koha's reports module to create one report that contains a link that runs a different Koha report.  This is an expansion of something we talked about briefly in the [Terrific Every Other Thursday videos by koha-US](https://koha-us.org/learn/video-playlists/) Season 1, episode 5 and episode 12.

So here are two reports that I have in my system and a method for linking them together.

### Sample 1 - item count by library and item type

Here's an example of a report I created years ago that does a simple item count by library and/or item type.

Please note that this report was written for Next Search Catalog where we use the "Shelving location" to denote "Adult," "Childrens," or "Young adult" items.  You could omit the columns for those locations or modify them to break down shelving locations differently than we do if you wanted to use this report on your system.

This report counts items at a library or with an item type you specify.

```sql

SELECT
  branchtypes.branchname,
  branchtypes.description AS "ITEM TYPE",
  itemss.Count_itemnumber AS "TOTAL ITEMS",
  adultitems.Count_itemnumber AS "ADULT ITEMS",
  juvenileitems.Count_itemnumber AS "JUVENILE ITEMS",
  yaitems.Count_itemnumber AS "YOUNG ADULT ITEMS"
FROM
  (SELECT
      branches.branchcode,
      branches.branchname,
      itemtypes.itemtype,
      itemtypes.description
    FROM
      itemtypes,
      branches) branchtypes LEFT JOIN
  (SELECT
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype) AS itype,
      Count(items.itemnumber) AS Count_itemnumber
    FROM
      items
    GROUP BY
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype)) itemss ON itemss.homebranch =
      branchtypes.branchcode AND
      itemss.itype = branchtypes.itemtype LEFT JOIN
  (SELECT
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype) AS itype,
      Count(items.itemnumber) AS Count_itemnumber
    FROM
      items
    WHERE
      (items.permanent_location LIKE '%ADULT%' OR
        items.permanent_location = 'CART' OR
        items.permanent_location = 'CATALOGING' OR
        items.permanent_location = 'PROC' OR
        items.permanent_location IS NULL)
    GROUP BY
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype)) adultitems ON
      adultitems.homebranch = branchtypes.branchcode AND
      adultitems.itype = branchtypes.itemtype LEFT JOIN
  (SELECT
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype) AS itype,
      Count(items.itemnumber) AS Count_itemnumber
    FROM
      items
    WHERE
      items.permanent_location LIKE "%CHILD%"
    GROUP BY
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype)) juvenileitems ON
      juvenileitems.homebranch = branchtypes.branchcode AND
      juvenileitems.itype = branchtypes.itemtype LEFT JOIN
  (SELECT
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype) AS itype,
      Count(items.itemnumber) AS Count_itemnumber
    FROM
      items
    WHERE
      items.permanent_location LIKE "%YA%"
    GROUP BY
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype)) yaitems ON
      yaitems.homebranch = branchtypes.branchcode AND
      yaitems.itype = branchtypes.itemtype
WHERE
  branchtypes.branchcode LIKE <<Choose your library and leave item type as "All"|branches:all>> AND
  branchtypes.itemtype LIKE <<Or leave library as "All" and choose an item type|itemtypes:all>>
GROUP BY
  branchtypes.branchname,
  branchtypes.description
ORDER BY
  branchtypes.branchname,
  branchtypes.description
LIMIT 500

```

### Sample 2 - Shelflist report

If you've watched the [Terrific Every Other Thursday videos by koha-US](https://koha-us.org/learn/video-playlists/) then you may remember Season 1, episode 24, where I spoke about using alternative authorized values in reports (and in bibliogrpahic frameworks).  One of the reports that I highlighted briefly in that video is my "Flexible shelflist report."

Flexible Shelflist is a report that creates a shelf list for all of the items at a library and it's got tons of non-standard runtime parameters based on custom authorized values I've created in Next Search catalog. If you wanted to use this report on your system, you would need to modify the runtime parameters to match your own runtime parameters.

Here is that report as it appears on my system:

```sql

SELECT
  Concat(
    '<a class="btn btn-default" href=\"/cgi-bin/koha/catalogue/detail.pl?biblionumber=',
    items.biblionumber,
    '\" target="_blank">Go to title</a>'
  ) AS LINK_TO_TITLE,
  biblio.biblionumber AS BIBLIO_NUMBER,
  items.itemnumber AS ITEM_NUMBER,
  Concat('-', items.barcode, '-') AS BARCODE,
  items.homebranch,
  items.holdingbranch,
  perm_locs.lib AS PERMANENT_LOCATION,
  current_locs.lib AS LOCATION,
  itemtypes.description AS ITYPE,
  ccodes.lib AS CCODE,
  items.itemcallnumber,
  biblio.author,
  Concat_Ws(" ",
    biblio.title,
    ExtractValue(biblio_metadata.metadata, '//datafield[@tag="245"]/subfield[@code="h"]'),  
    ExtractValue(biblio_metadata.metadata, '//datafield[@tag="245"]/subfield[@code="b"]'),  
    ExtractValue(biblio_metadata.metadata, '//datafield[@tag="245"]/subfield[@code="p"]'),  
    ExtractValue(biblio_metadata.metadata, '//datafield[@tag="245"]/subfield[@code="n"]')
  ) AS FULL_TITLE,
  biblioitems.publicationyear,
  biblioitems.isbn,
  ExtractValue(biblio_metadata.metadata, '//datafield[@tag="022"]/subfield[@code="a"]') AS ISSN,
  ExtractValue(biblio_metadata.metadata, '//datafield[@tag="024"]/subfield[@code="a"]') AS UPC,
  items.dateaccessioned,
  items.datelastborrowed,
  items.datelastseen,
  items.issues,
  items.renewals,
  Sum((Coalesce(items.issues, 0)) + (Coalesce(items.renewals, 0))) AS
  CHECKOUTS_PLUS_RENEWALS,
  If(items.onloan IS NULL, 'No', 'Yes') AS CHECKED_OUT_NOW,
  not_loans.lib AS NOT_FOR_LOAN,
  If(Sum(Coalesce(items.damaged, 0) + Coalesce(items.itemlost, 0) +
  Coalesce(items.withdrawn, 0)) = 0, 'No', 'Yes') AS STATUS_PROBLEMS,
  Concat_Ws('',
    If(Coalesce(damageds.lib, 0) = '', '', Concat(damageds.lib, ' (', Date_Format(items.damaged_on, "%Y.%m.%d"), ') / ')),
    If(Coalesce(losts.lib, 0) = '', '', Concat(losts.lib, ' (', Date_Format(items.itemlost_on, "%Y.%m.%d"), ') / ')),
    If(Coalesce(withdrawns.lib, 0) = '', '', Concat(withdrawns.lib, ' (', Date_Format(items.withdrawn_on, "%Y.%m.%d"), ')'))
  ) AS STATUSSES,
  items.itemnotes,
  items.itemnotes_nonpublic,
  items.copynumber,
  items.replacementprice,
  localcounts.Count_itemnumber AS LOCAL_COPIES,
  systemcounts.Count_itemnumber AS SYSTEM_COPIES,
  Concat(
    '<a class="btn btn-default"',
    'href=\"/cgi-bin/koha/cataloguing/additem.pl?op=edititem&biblionumber=',
    items.biblionumber,
    '&itemnumber=',
    items.itemnumber,
    '#edititem\"',
    'target="_blank">Edit item</a>'
  ) AS EDIT_ITEM
FROM
  biblio JOIN
  biblio_metadata ON biblio_metadata.biblionumber = biblio.biblionumber JOIN
  items ON items.biblionumber = biblio.biblionumber LEFT JOIN
  (SELECT
      authorised_values.category,
      authorised_values.authorised_value,
      authorised_values.lib,
      authorised_values.lib_opac
    FROM
      authorised_values
    WHERE
      authorised_values.category = 'LOC') perm_locs ON
      perm_locs.authorised_value = items.permanent_location LEFT JOIN
  (SELECT
      authorised_values.category,
      authorised_values.authorised_value,
      authorised_values.lib,
      authorised_values.lib_opac
    FROM
      authorised_values
    WHERE
      authorised_values.category = 'LOC') current_locs ON
      current_locs.authorised_value = items.location LEFT JOIN
  itemtypes ON itemtypes.itemtype = items.itype LEFT JOIN
  (SELECT
      authorised_values.category,
      authorised_values.authorised_value,
      authorised_values.lib,
      authorised_values.lib_opac
    FROM
      authorised_values
    WHERE
      authorised_values.category = 'CCODE') ccodes ON ccodes.authorised_value =
      items.ccode JOIN
  biblioitems ON biblioitems.biblionumber = biblio.biblionumber LEFT JOIN
  (SELECT
      authorised_values.category,
      authorised_values.authorised_value,
      authorised_values.lib,
      authorised_values.lib_opac
    FROM
      authorised_values
    WHERE
      authorised_values.category = 'NOT_LOAN') not_loans ON
      not_loans.authorised_value = items.notforloan LEFT JOIN
  (SELECT
      authorised_values.category,
      authorised_values.authorised_value,
      authorised_values.lib,
      authorised_values.lib_opac
    FROM
      authorised_values
    WHERE
      authorised_values.category = 'damaged') damageds ON
      damageds.authorised_value = items.damaged LEFT JOIN
  (SELECT
      authorised_values.category,
      authorised_values.authorised_value,
      authorised_values.lib,
      authorised_values.lib_opac
    FROM
      authorised_values
    WHERE
      authorised_values.category = 'lost') losts ON losts.authorised_value =
      items.itemlost LEFT JOIN
  (SELECT
      authorised_values.category,
      authorised_values.authorised_value,
      authorised_values.lib,
      authorised_values.lib_opac
    FROM
      authorised_values
    WHERE
      authorised_values.category = 'withdrawn') withdrawns ON
      withdrawns.authorised_value = items.withdrawn LEFT JOIN
  (SELECT
      items.biblionumber,
      items.homebranch,
      Count(items.itemnumber) AS Count_itemnumber
    FROM
      items
    WHERE
      items.homebranch LIKE <<Item home library|ZBRAN>>
    GROUP BY
      items.biblionumber,
      items.homebranch) localcounts ON localcounts.biblionumber =
      items.biblionumber AND
      localcounts.homebranch = items.homebranch LEFT JOIN
  (SELECT
      items.biblionumber,
      Count(items.itemnumber) AS Count_itemnumber
    FROM
      items
    GROUP BY
      items.biblionumber) systemcounts ON systemcounts.biblionumber =
      items.biblionumber
WHERE
  items.homebranch LIKE <<Item home library|ZBRAN>> AND
  Coalesce(items.permanent_location, "-") LIKE <<Item permanent shelving location|LLOC>> AND
  Coalesce(items.itype, "PUNC") LIKE <<Item type|LITYPES>> AND
  Coalesce(items.ccode, "XXX") LIKE <<Item collection code|LCCODE>> AND
  Coalesce(items.itemcallnumber, "-") LIKE Concat(<<Enter first part of call number or a % symbol>>, "%") AND
  Coalesce(not_loans.lib_opac, "-") LIKE <<Not for loan status|LNOT_LOAN>> AND
  (If(
    Coalesce(Year(Coalesce(items.dateaccessioned)), '1999') < '2000',
    '2000-01-02',
    items.dateaccessioned
  ) BETWEEN <<Item added between date1|date>> AND <<and date2|date>>) AND
  If(items.onloan IS NULL, 'No', 'Yes') LIKE '%' AND
  (If(
    Coalesce(Year(Coalesce(items.datelastborrowed)), '1999') < '2000',
    '2000-01-02',
    items.datelastborrowed
  ) BETWEEN <<Item last borrowed between date1|date>> AND <<and  date2|date>>) AND
  (If(
    Coalesce(Year(Coalesce(items.datelastseen)), '1999') < '2000',
    '2000-01-02',
    items.datelastseen
  ) BETWEEN <<Item last seen between date1|date>> AND <<and   date2|date>>) AND
  localcounts.Count_itemnumber >= 0 AND
  systemcounts.Count_itemnumber >= 0
GROUP BY
  biblio.biblionumber,
  items.itemnumber
HAVING
  CHECKOUTS_PLUS_RENEWALS <= <<With X or fewer checkouts|ZNUMBERS>> AND
  CHECKED_OUT_NOW LIKE <<Display checked out items|ZYES_NO>> AND
  STATUS_PROBLEMS LIKE <<Display lost, missing, and withdrawn items|ZYES_NO>> AND
  LOCAL_COPIES >= <<With X or more copies at this library|YNUMBER>> AND
  SYSTEM_COPIES >= <<With X or more copies at throughout the catalog|YNUMBER>>
ORDER BY
  items.homebranch,
  PERMANENT_LOCATION,
  ITYPE,
  CCODE,
  items.itemcallnumber,
  biblio.author,
  FULL_TITLE

```

### Teaching the first report to run the second report

The first step in linking the two reports is to run the second one to get the URL.  In this case I ran the report doing a full shelflist for our library in Atchison, KS.

This is the URL:

/cgi-bin/koha/reports/guided_reports.pl?reports=2731&phase=Run+this+report&param_name=Item+home+library%7CZBRAN&sql_params=ATCHISON&param_name=Item+permanent+shelving+location%7CLLOC&sql_params=%25&param_name=Item+type%7CLITYPES&sql_params=%25&param_name=Item+collection+code%7CLCCODE&sql_params=%25&param_name=Enter+first+part+of+call+number+or+a+%25+symbol&sql_params=%25&param_name=Not+for+loan+status%7CLNOT_LOAN&sql_params=%25&param_name=Item+added+between+date1%7Cdate&sql_params=01%2F01%2F2000&param_name=and+date2%7Cdate&sql_params=07%2F25%2F2022&param_name=Item+last+borrowed+between+date1%7Cdate&sql_params=01%2F01%2F2000&param_name=and++date2%7Cdate&sql_params=07%2F25%2F2022&param_name=Item+last+seen+between+date1%7Cdate&sql_params=01%2F01%2F2000&param_name=and+++date2%7Cdate&sql_params=07%2F25%2F2022&param_name=With+X+or+fewer+checkouts%7CZNUMBERS&sql_params=999999999999&param_name=Display+checked+out+items%7CZYES_NO&sql_params=%25&param_name=Display+lost%2C+missing%2C+and+withdrawn+items%7CZYES_NO&sql_params=%25&param_name=With+X+or+more+copies+at+this+library%7CYNUMBER&sql_params=0&param_name=With+X+or+more+copies+at+throughout+the+catalog%7CYNUMBER&sql_params=0

Since this is a big long URL, I find the easy way to look at it sensibly is to add a break before each instance of the string "&param_name"

/cgi-bin/koha/reports/guided_reports.pl?reports=2731&phase=Run+this+report
&param_name=Item+home+library%7CZBRAN&sql_params=ATCHISON
&param_name=Item+permanent+shelving+location%7CLLOC&sql_params=%25
&param_name=Item+type%7CLITYPES&sql_params=%25
&param_name=Item+collection+code%7CLCCODE&sql_params=%25
&param_name=Enter+first+part+of+call+number+or+a+%25+symbol&sql_params=%25
&param_name=Not+for+loan+status%7CLNOT_LOAN&sql_params=%25
&param_name=Item+added+between+date1%7Cdate&sql_params=01%2F01%2F2000
&param_name=and+date2%7Cdate&sql_params=07%2F25%2F2022
&param_name=Item+last+borrowed+between+date1%7Cdate&sql_params=01%2F01%2F2000
&param_name=and++date2%7Cdate&sql_params=07%2F25%2F2022
&param_name=Item+last+seen+between+date1%7Cdate&sql_params=01%2F01%2F2000
&param_name=and+++date2%7Cdate&sql_params=07%2F25%2F2022
&param_name=With+X+or+fewer+checkouts%7CZNUMBERS&sql_params=999999999999
&param_name=Display+checked+out+items%7CZYES_NO&sql_params=%25
&param_name=Display+lost%2C+missing%2C+and+withdrawn+items%7CZYES_NO&sql_params=%25
&param_name=With+X+or+more+copies+at+this+library%7CYNUMBER&sql_params=0
&param_name=With+X+or+more+copies+at+throughout+the+catalog%7CYNUMBER&sql_params=0

Every tieme you see "%25" at the end of a string, that's the ASCII code for a "%" which is an SQL wildcard.  Similarly "%2f" represents a space.

For the most part the end of each line represents a runtime parameter.  The only one I set when I ran the report was "ATCHISO" to limit the results to the library in Atchison, KS.  The other parameter I'm going to manipulate is the one for the item type.  I've put comments directly into the HTML below.

I can take the URL from above and use the SQL "CONCAT" command to build a dynamic URL in the report results.

```SQL

SELECT
  branchtypes.branchname,
  branchtypes.description AS "ITEM TYPE",
  itemss.Count_itemnumber AS "TOTAL ITEMS",
  adultitems.Count_itemnumber AS "ADULT ITEMS",
  juvenileitems.Count_itemnumber AS "JUVENILE ITEMS",
  yaitems.Count_itemnumber AS "YOUNG ADULT ITEMS",
  Concat(
    '<a class="btn btn-default"',
    'href=\"',
    '/cgi-bin/koha/reports/guided_reports.pl?reports=',

    /* The report I want to run is report 2731 in my system */
    '2731',

    '&phase=Run+this+report',
    '&param_name=Item+home+library%7CZBRAN&sql_params=',

    /* substituting "branchtypes.branchcode" for "ATCHISON" the branchode I ran the report with to generate the URL */
    branchtypes.branchcode,

    '&param_name=Item+permanent+shelving+location%7CLLOC&sql_params=%25',
    '&param_name=Item+type%7CLITYPES&sql_params=',

    /* substituting "branchtypes.itemtype" for "%25" (%25 is the ASCII equivalent of the % wildcard that I ran the report with to generate the URL) */
    branchtypes.itemtype,

    '&param_name=Item+collection+code%7CLCCODE&sql_params=%25',
    '&param_name=Enter+first+part+of+call+number+or+a+%25+symbol&sql_params=%25',
    '&param_name=Not+for+loan+status%7CLNOT_LOAN&sql_params=%25',
    '&param_name=Item+added+between+date1%7Cdate&sql_params=01%2F01%2F1900',
    '&param_name=and+date2%7Cdate&sql_params=12%2F31%2F2099',
    '&param_name=Item+last+borrowed+between+date1%7Cdate&sql_params=01%2F01%2F1900',
    '&param_name=and++date2%7Cdate&sql_params=12%2F31%2F2099',
    '&param_name=Item+last+seen+between+date1%7Cdate&sql_params=01%2F01%2F1900',
    '&param_name=and+++date2%7Cdate&sql_params=12%2F31%2F2099',
    '&param_name=With+X+or+fewer+checkouts%7CZNUMBERS&sql_params=999999999999',
    '&param_name=Display+checked+out+items%7CZYES_NO&sql_params=%25',
    '&param_name=Display+lost%2C+missing%2C+and+withdrawn+items%7CZYES_NO&sql_params=%25',
    '&param_name=With+X+or+more+copies+at+this+library%7CYNUMBER&sql_params=0',
    '&param_name=With+X+or+more+copies+at+throughout+the+catalog%7CYNUMBER&sql_params=0" ',
    'target="_blank">',
    'Shelflist for these items</a>'
  ) AS SHELFLIST
FROM
  (SELECT
      branches.branchcode,
      branches.branchname,
      itemtypes.itemtype,
      itemtypes.description
    FROM
      itemtypes,
      branches) branchtypes LEFT JOIN
  (SELECT
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype) AS itype,
      Count(items.itemnumber) AS Count_itemnumber
    FROM
      items
    GROUP BY
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype)) itemss ON itemss.homebranch =
      branchtypes.branchcode AND
      itemss.itype = branchtypes.itemtype LEFT JOIN
  (SELECT
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype) AS itype,
      Count(items.itemnumber) AS Count_itemnumber
    FROM
      items
    WHERE
      (items.permanent_location LIKE '%ADULT%' OR
        items.permanent_location = 'CART' OR
        items.permanent_location = 'CATALOGING' OR
        items.permanent_location = 'PROC' OR
        items.permanent_location IS NULL)
    GROUP BY
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype)) adultitems ON
      adultitems.homebranch = branchtypes.branchcode AND
      adultitems.itype = branchtypes.itemtype LEFT JOIN
  (SELECT
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype) AS itype,
      Count(items.itemnumber) AS Count_itemnumber
    FROM
      items
    WHERE
      items.permanent_location LIKE "%CHILD%"
    GROUP BY
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype)) juvenileitems ON
      juvenileitems.homebranch = branchtypes.branchcode AND
      juvenileitems.itype = branchtypes.itemtype LEFT JOIN
  (SELECT
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype) AS itype,
      Count(items.itemnumber) AS Count_itemnumber
    FROM
      items
    WHERE
      items.permanent_location LIKE "%YA%"
    GROUP BY
      items.homebranch,
      If(items.itype IS NULL, "XXX", items.itype)) yaitems ON
      yaitems.homebranch = branchtypes.branchcode AND
      yaitems.itype = branchtypes.itemtype
WHERE
  branchtypes.branchcode LIKE <<Choose your library and leave item type as "All"|branches:all>> AND
  branchtypes.itemtype LIKE <<Or leave library as "All" and choose an item type|itemtypes:all>>
GROUP BY
  branchtypes.branchname,
  branchtypes.description
ORDER BY
  branchtypes.branchname,
  branchtypes.description
LIMIT 500

```

By using "branchtypes.branchcode" and "branchtypes.itemtype" to represent the branch and item type, when you run the report it will build the link for each row to match the branch and item type codes for the results in that row.  This means that clicking the link will run the Shelfilst report just for that library and just for that item type when it's clicked.
