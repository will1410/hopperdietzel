## Adding upcoming closures to the Koha home Page

Every year I remind libraries to update their calendar for the following year using the Calendar tool.  They often forget.  So I wanted to put a reminder on the home page in the staff interface that would also show them what days their library was closed for in the next 12 months.  I built a report to output the data into a table, then I created a block of HTML that I could put on the home page to hold the table data, then I created some jQuery to populate the table.

You can follow these steps to reproduce this table:

1. Create a report with this SQL in your Koha and make a note of the report number

    - The report will list 1 time only holidays -- holidays that repeat weekly -- and holidays that repeat annually

```SQL

Select
    special_holidays.branchcode As BRANCH,
    Concat_WS(
      ' - ',
      Str_To_Date(
        Concat(
          special_holidays.month,
          '/',
          special_holidays.day,
          '/',
          special_holidays.year
        ),
        '%m/%d/%Y'
      ),  
      Date_Format(
        Str_To_Date(
          Concat(
            special_holidays.month,
            '/',
            special_holidays.day,
            '/',
            special_holidays.year
          ),
        '%m/%d/%Y'
        ),
       '%W'
      )
    ) As CLOSED_DATE,
    special_holidays.title As TITLE,
    If(
      special_holidays.year Is Null,
      "X",
      special_holidays.year
    ) As FREQUENCY
From
    special_holidays
Where
    special_holidays.branchcode Like <<branchcode1>> And
    Str_To_Date(
      Concat(
        special_holidays.month,
        '/',
        special_holidays.day,
        '/',
        special_holidays.year
      ),
      '%m/%d/%Y'
    ) > Now() - Interval 1 Day
Group By
    special_holidays.id
UNION
Select
    repeatable_holidays.branchcode As BRANCH,
    CONCAT_WS(
      ' - ',
      Str_To_Date(
        Concat(
          repeatable_holidays.month,
          '/',
          repeatable_holidays.day,
          '/',
          If(
            repeatable_holidays.month >= Month(CurDate()),
            Year(CurDate()),
            Year(CurDate()) + 1
          )
        ),
        '%m/%d/%Y'
      ),
      If(
        repeatable_holidays.weekday = 0,
        ' Every Sunday',
        If(
          repeatable_holidays.weekday = 1,
          ' Every Monday',
          If(
            repeatable_holidays.weekday = 2,
            ' Every Tuesday',
            If(
              repeatable_holidays.weekday = 3,
              ' Every Wednesday',
              If(
                repeatable_holidays.weekday = 4,
                ' Every Thursday',
                If(
                  repeatable_holidays.weekday = 5,
                  ' Every Friday',
                  If(
                    repeatable_holidays.weekday = 6,
                    ' Every Saturday',
                    Date_Format(
                      Str_To_Date(
                        Concat(
                          repeatable_holidays.month,
                          '/',
                          repeatable_holidays.day,
                          '/',
                          If(
                            repeatable_holidays.month >= Month(CurDate()),
                            Year(CurDate()),
                            Year(CurDate()) + 1
                          )
                        ),
                        '%m/%d/%Y'
                      ),
                      '%W'
                    )
                  )
                )
              )
            )
          )
        )
      )
    ) As CLOSED_DATE,
    repeatable_holidays.title As TITLE,
    If(
      repeatable_holidays.weekday Is Null,
      CONCAT(
        "Repeats every year on ",
        LPAD(repeatable_holidays.month, 2, 0),
        '-',
        LPAD(repeatable_holidays.day, 2, 0)
      ) ,
      "Repeats every week"
    ) As FREQUENCY
From
    repeatable_holidays
Where
    (
      repeatable_holidays.branchcode Like <<branchcode2>> And
      Str_To_Date(
        Concat(
          repeatable_holidays.month,
          '/',
          repeatable_holidays.day,
          '/',
          If(
            repeatable_holidays.month >= Month(CurDate()),
            Year(CurDate()),
            Year(CurDate()) + 1
          )
        ),
        '%m/%d/%Y'
      ) > Now() - Interval 1 Day
    )
    Or
    (
      repeatable_holidays.branchcode Like <<branchcode3>> And
      Str_To_Date(
        Concat(
          repeatable_holidays.month,
          '/',
          repeatable_holidays.day,
          '/',
          If(
            repeatable_holidays.month >= Month(CurDate()),
            Year(CurDate()),
            Year(CurDate()) + 1
          )
        ), '%m/%d/%Y'
      ) Is Null
    )
Group By
    repeatable_holidays.id
Order By
    BRANCH,
    CLOSED_DATE

```

2. Add this html to your IntranetmainUserblock system preference

    - All this HTML is doing is really creating a space for the table data to go

```html

<h2>Upcoming closures at your library</h2>

  <div id="closures">
    <p><br />This is a list of the upcoming closures at your library in the next 12 months.</p>

    <table id="closures_table" class="table table-hover table-bordered">
      <thead>
        <tr>
          <th>Branch Code</th>
          <th>Closed date</th>
          <th>Title</th>
          <th>Frequency</th>
        </tr>
      </thead>
      <tbody>
        <!-- this is the spot where the table data will go -->
      </tbody>
    </table>
    <p>You can add whatever instructional text you'd like in this area.</p>
  </div>


```

3. Add this jQuery to IntranetUserJS

    - remove '_closure_report_number_' and put the report number from step 1 in its place
    - The jQuery runs the report, and collects the data from the report as a JSON array
    - Once the jQuery has the JSON data it appends the data to the table header created in the HTML and formats it as a batch of table rows
    - This jQuery will automatically fill in the branchcode data for the report so that the table will always populate with only the closure dates for the logged in library

```javascript

//HOME
  //Populate upcoming closures table
  if ($('#area-userblock').length) {
    $.getJSON("/cgi-bin/koha/svc/report?id=_closure_report_number_&param_name=branchcode1&sql_params=" + ($(".logged-in-branch-code").html().trim()) + "&param_name=branchcode2&sql_params=" + ($(".logged-in-branch-code").html().trim()) + "&param_name=branchcode3&sql_params=" + ($(".logged-in-branch-code").html().trim()), function(data1) {
      $.each(data1, function(index, value) {
        var json = value;
        var closure_row;
        closure_row = $('<tr/>');
        $.each(json, function(index, value) {
          closure_row.append("<td>" + value + "</td>");
        });
        $('#closures_table').append(closure_row);
      });
    });
  }

```

This is what it looks like on the koha-US test site
