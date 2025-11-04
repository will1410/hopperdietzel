# Flexible requests history

Request history is an area in Koha where there isn't one place to go where you can easily get all of the information you might want.  There's no easy way to enter a bibliographic record ID or an item barcode number that gives you access to which borrowers placed requests on that title/item, or what the in-tranist history of that request was or what happened in the action logs or any of that useful stuff.  Likewise it can be difficult to look at a borrower's account and see what exactly happened to a title or item they requested.  You can look in their requests history if that's turned on, but even if it is, questions like 'Who placed the request?' or 'Was this item ever shipped?' are unanswered by the requests history tab in a patron's record.  So this report can act as a dashboard for information about requests.

It requires a few things:

- An authorized values table with progress information
- An authorized values table with suspended request information
- An authorized values table with active request information 
- A report to get action logs by request id
- A report to get in-transit history

## Authorized values entries

### Request progress

In my Koha, this set of authorized values is called LHOLDPROG

If you add "Flexible requests history" to your Koha, you will need to add this authorized values table to your Koha

| category  | authorised_value | lib                | lib_opac           |
|-----------|------------------|--------------------|--------------------|
| LHOLDPROG | %                | All requests       | All requests       |
| LHOLDPROG | %trans%          | In transit         | In transit         |
| LHOLDPROG | %Fill%           | Filled             | Filled             |
| LHOLDPROG | %Wait%           | Waiting for pickup | Waiting for pickup |
| LHOLDPROG | %Can%            | Cancelled          | Cancelled          |
| LHOLDPROG | %active%         | Still active       | Still active       |

### Suspended request information

In my Koha, this set of authorized values is called LHOLDSUS

If you add this Flexible requests history report to your Koha, you will need to add this authorized values table to your Koha

| category | authorised_value | lib                        | lib_opac                   |
|----------|------------------|----------------------------|----------------------------|
| LHOLDSUS | %                | All requests               | All requests               |
| LHOLDSUS | Suspended        | Suspended requests         | Suspended requests         |
| LHOLDSUS | -                | All non-suspended requests | All non-suspended requests |

### Active/inactive request information

In my Koha, this set of authorized values is called LHOLDACT 

If you add "Flexible requests history" to your Koha, you will need to add this authorized values table to your Koha

| category | authorised_value | lib                | lib_opac           |
|----------|------------------|--------------------|--------------------|
| LHOLDACT | %                | All requests       | All requests       |
| LHOLDACT | Active           | Active requests    | Active requests    |
| LHOLDACT | Filled           | Filled requests    | Filled requests    |
| LHOLDACT | Cancelled        | Cancelled requests | Cancelled requests |

## Connected reports

###

In my Koha, this is report 3040

If you add "Flexible requests history" to your Koha, you would need to change the reference to report 3040 to match the report number in your Koha

```SQL
SELECT
  action_logs.action_id,
  action_logs.timestamp,
  action_logs.user,
  action_logs.module,
  action_logs.action,
  action_logs.object,
  REPLACE(
    action_logs.info, 
    ',', 
    ',<br />'
  ) AS DESCRIPTION,
  action_logs.interface,
  CONCAT(
    '<a href="/cgi-bin/koha/circ/circulation.pl?borrowernumber=', 
    action_logs.user, 
    '" target="_blank">See who created/modified/cancelled the request</a>'
  ) AS LINK
FROM
  action_logs
WHERE
  action_logs.module = "HOLDS" AND
  action_logs.object LIKE Concat('%', <<Enter request ID number>>, '%')
GROUP BY
  action_logs.action_id
ORDER BY
  action_logs.action_id
  DESC
```

### Item in-transit history 

In my Koha, this is report 2784

If you add "Flexible requests history" you would need to change the reference to report 2784 to match the report number in your Koha

```SQL
SELECT 
  requests.reserve_id, 
  Concat( 
    'Status: ', 
    requests.statuss, 
    '<br /> Progress: ', 
    If( 
      requests.cancellationdate IS NOT NULL, 
      'Cancelled', 
      If( 
        requests.found = 'T', 
        'In transit', 
        If( 
          requests.found = 'F', 
          'Finished / Filled', 
          If( 
            requests.found = 'W', 
            'Waiting for pickup', 
            'Still active' 
          ) 
        ) 
      ) 
    ) 
  ) AS STATUS, 
  Concat('Patron BC: ', borrowers.cardnumber, '<br />', 'Pickup at: ', requests.branchcode) AS PATRON_INFO, 
  Concat_Ws('<br />', 
    Concat('Requested on: ', requests.reservedate), Concat('Waiting since: ', requests.waitingdate), 
    Concat('Expires on: ', requests.expirationdate), Concat('Cancelled on: ', requests.cancellationdate), 
    Concat('Updated on: ', requests.timestamp)) AS DATES, 
  Concat_Ws( 
    '<br />', 
    If(requests.suspend <> 0, 'Suspended', '-'), 
    If( 
      requests.suspend = 0, 
      '-', 
      If( 
        requests.suspend_until IS NOT NULL, 
        Concat('until ', Date_Format(requests.suspend_until, '%Y.%m.%d')), 
        'indefinitely' 
      ) 
    ) 
  ) AS SUSPENDED, 
  requests.biblionumber AS BIBLIO_NUMBER, 
  Concat_Ws('<br />', 
    Concat( 
      'BC: ', 
      Coalesce(Coalesce(items.barcode, '-'), Coalesce(deleteditems.barcode, '-')) 
    ), 
    Concat( 
      'Home: ', 
      Coalesce(Coalesce(items.homebranch, '-'), Coalesce(deleteditems.homebranch, '-')) 
    ), 
    Concat( 
      'Location: ', 
      Coalesce(Coalesce(items.location, '-'), Coalesce(deleteditems.location, '-')) 
    ), 
    Concat( 
      'Type: ', 
      Coalesce(Coalesce(items.itype, '-'), Coalesce(deleteditems.itype, '-')) 
    ), 
    Concat( 
      'Collection: ', 
      Coalesce(Coalesce(items.ccode, '-'), Coalesce(deleteditems.ccode, '-')) 
    ), 
    Concat( 
      'Call#: ', 
      Coalesce(Coalesce(items.itemcallnumber, '-'), Coalesce(deleteditems.itemcallnumber, '-')) 
    ), 
    Concat( 
      'Author: ', 
      Coalesce(Coalesce(biblio.author, '-'), Coalesce(deletedbiblio.author, '-')) 
    ), 
    Concat( 
      'Title: ', 
      Coalesce(Coalesce(biblio.title, '-'), Coalesce(deletedbiblio.title, '-')) 
      ) 
  ) AS ITEM_INFO, 
  CONCAT_WS('<br />', 
    Concat( 
      'Action logs: ', 
      Concat( 
        '<a href="/cgi-bin/koha/reports/guided_reports.pl?id=', 
        '3040', 
        '&param_name=Enter+request+ID+number&sql_params=', 
        requests.reserve_id, 
        '&op=run', 
        '" target="_blank">see last 60 days of activity</a>' 
      ) 
    ), 
    Concat( 
      'Link to patron: ', 
      Concat('<a href="/cgi-bin/koha/circ/circulation.pl?borrowernumber=', 
      requests.borrowernumber, 
      '" target="_blank">go to the borrower"s record</a>' 
      ) 
    ), 
    Concat( 
      'Link to title: ', 
      Concat('<a href="/cgi-bin/koha/catalogue/detail.pl?biblionumber=', 
      requests.biblionumber, 
      '" target="_blank">go to the bibliographic record</a>' 
      ) 
    ), 
    Concat( 
      'Link to item: ', 
      Concat('<a href="/cgi-bin/koha/catalogue/moredetail.pl?itemnumber=', 
      items.itemnumber, 
      '&biblionumber=', 
      biblio.biblionumber, 
      '" target="_blank">go to the item record</a>' 
      ) 
    ), 
    Concat( 
      'Item in transit history: ', 
      Concat('<a href="/cgi-bin/koha/reports/guided_reports.pl?id=', 
        '2784', 
        '&param_name=Enter+item+barcode+number&sql_params=', 
        items.barcode, 
        '&op=run', 
        '" target="_blank">see item transit history</a>' 
      ) 
    ) 
) AS LINKS 
FROM 
  borrowers 
  JOIN (SELECT 
        reserves.reserve_id, 
        reserves.borrowernumber, 
        reserves.reservedate, 
        reserves.biblionumber, 
        reserves.branchcode, 
        reserves.notificationdate, 
        reserves.reminderdate, 
        reserves.cancellationdate, 
        reserves.reservenotes, 
        reserves.priority, 
        reserves.found, 
        reserves.timestamp, 
        reserves.itemnumber, 
        reserves.waitingdate, 
        reserves.expirationdate, 
        reserves.lowestPriority, 
        reserves.suspend, 
        reserves.suspend_until, 
        reserves.itemtype, 
        If(reserves.reserve_id IS NOT NULL, 'Active', '-') AS statuss 
      FROM 
        reserves 
      UNION 
      SELECT 
        old_reserves.reserve_id, 
        old_reserves.borrowernumber, 
        old_reserves.reservedate, 
        old_reserves.biblionumber, 
        old_reserves.branchcode, 
        old_reserves.notificationdate, 
        old_reserves.reminderdate, 
        old_reserves.cancellationdate, 
        old_reserves.reservenotes, 
        old_reserves.priority, 
        old_reserves.found, 
        old_reserves.timestamp, 
        old_reserves.itemnumber, 
        old_reserves.waitingdate, 
        old_reserves.expirationdate, 
        old_reserves.lowestPriority, 
        old_reserves.suspend, 
        old_reserves.suspend_until, 
        old_reserves.itemtype, 
        If(old_reserves.cancellationdate IS NOT NULL, 'Cancelled', 'Finished / Filled') AS statuss 
      FROM 
        old_reserves) requests ON borrowers.borrowernumber = requests.borrowernumber 
  LEFT JOIN items ON requests.itemnumber = items.itemnumber 
  LEFT JOIN deleteditems ON requests.itemnumber = deleteditems.itemnumber 
  LEFT JOIN biblio ON requests.biblionumber = biblio.biblionumber 
  LEFT JOIN deletedbiblio ON requests.biblionumber = deletedbiblio.biblionumber 
WHERE 
  requests.branchcode LIKE <<Choose pickup library|branches:all>> AND 
  requests.statuss LIKE <<Choose request status|LHOLDACT>> AND 
  If( 
    requests.cancellationdate IS NOT NULL, 
    'Cancelled', 
    If( 
      requests.found = 'T', 'In transit', 
      If( 
        requests.found = 'F', 'Finished', 
        If( 
          requests.found = 'W', 
          'Waiting for pickup', 
          'Still active' 
        ) 
      ) 
    ) 
  ) LIKE <<Choose request progress|LHOLDPROG>> AND 
  If(requests.suspend <> 0, 'Suspended', '-') LIKE <<Choose suspended status|LHOLDSUS>> AND 
  borrowers.cardnumber LIKE Concat('%', <<Enter library card number or a % symbol>>, '%') AND 
  requests.biblionumber LIKE Concat('%', <<Enter title biblio number or a % symbol>>, '%') AND 
  Coalesce( 
    Coalesce(items.barcode, '-'), Coalesce(deleteditems.barcode, '-') 
  ) LIKE Concat('%', <<Enter item barcode number or a % symbol>>, '%') 
GROUP BY 
  requests.reserve_id 
ORDER BY 
  requests.timestamp DESC 
```