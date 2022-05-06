# smart-rules.pl modifications

I originally did a presentation on this same topic at the koha-US conference in Coeur d'Alene Idaho in 2017.  The thing is that the circulation rules table changes with practically every version of Koha, so this code has to be updated with practically every version of Koha.  It jQuery and a little bit of CSS.

## The problem

The circulation rules matrix table on smart-rules.pl is wide.  Really wide.  Really-really wide.  Really-really-really wide.  And it's getting wider all the time.  I have 3 screens on my work computer and if I go to Home > Administration > Circulation and fine rules on Koha and adjust my browser window to 4370 x 1030 I can see the full circulation rules matrix.  That's an insanely wide browser window.  It completely fills two full screens and even bleeds a little bit over onto the third screen.  It's crazy.

But there are a whole bunch of things on this screen that I really don't need to see in order to manage the circulation rules for my libraries.  I don't really need the left hand navigation controls.  I also don't need several columns in the table itself.

## The solution

Back in 2015 I created the jQuery and CSS you'll find below in order to hide several columns and to remove the left-hand navigation area.  If I don't want to see the left hand navigation, I've got a button here that will hide that area.  If I don't want to see a column, I can click on the head of the column to collapse its content.  If there are columns I never use, I can collapse them by default.  When I'm trying to look at things on the screen my eyes have a hard time following the rows across the page, so if you hover the mouse over a row, it highlights the row.  And if I click on a column, it moves to the bottom of the table so I have an easy time seeing what edits I might be making to that column.  And if I click on the foot of the table, the rows will sort by the values in the column I sort on.

This is code that needs to be upgraded for virtually every Koha upgrade because any time a new column gets added to the circulation rules (which seems to be in almost every new release of Koha) the column counts need to be updated.

***Special note***

I use Firefox with the browser extension "Window Resizer" which can be found at  [My Browser Addon's website](https://mybrowseraddon.com/window-resizer.html){:target="_blank"}

I also frequently use the "What is my browser window size" tool at [RapidTables](https://www.rapidtables.com/web/tools/window-size.html){:target="_blank"} to figure out where my browser window is and what it's doing.

## The code

All of the jQuery I use for the changes I want will only affect smart-rules.pl and I want to wait for them to take effect after the circulation rules table has loaded so the first thing I'm going to do is to write jQuery that executes all of these functions only after the rules table has loaded.

***IntranetUserJS***

```javascript

//BEGIN changes to smart-rules.pl
  //This function tells the browser to wait on starting the function until the datatable finishes loading
  $('#default-circulation-rules').on('init.dt', function() {

    //All of the changes I want on this page are going to go in between these curly brackets

  //This line ends the function that starts after the datatable loads
  });

```

### Show full width button

The first thing I'm going to do is create a button that collapses the space to the left of the table that has the links out to the other parts of the system preferences menu.  I've made comments on each line in the code below.

This one step all by itself gets this page down to 3840x1030 and confines the table to less than 2 full screens.

***IntranetUserJS***

```javascript

//BEGIN changes to smart-rules.pl
  $('#default-circulation-rules').on('init.dt', function() {

    //BEGIN Create button to expand collapsed rule columns

      //This line creates a button labeled "Show full width" and puts it at the top of the column
      $('#admin_smart-rules #navmenu').parent().prepend('<a href="#default-circulation-rules"><button id="allshows" type="button" style="margin: 5px">Show full width</button></a>');

      //This section adds a click function to the button so that when you click it, something happens
      $('#allshows').click(function() {

        //This hides the content that's in the column (#navmenu) as well as the button created in the first part of this code (#allshows)
        $('#navmenu, #allshows').hide();

        //This removes the .col-sm-push-2 class from the div that the #navmenu content is displayed in -- if you don't remove this class, you only remove the content without resizing the layout of the page
        $('.row .col-sm-10.col-sm-push-2').removeClass('col-sm-push-2');

        //Now that the column header on this table is "sticky," this function is required to force the column header to resize when you remove the content -- without this function, the column header won't line up with the column content when you scroll up or down the page
        $(window).trigger('resize');

      //This line ends the click function
      });

  });

```

### Highlight row on hover

I'm over 50, so when I try read a row across two computer screens, it's really easy for my eyes to get lost.  I added this very simple code so that when I hover the mouse over a row, it highlights in orange.  The best part about this is that the .highlighted-row class is already a part of Koha.  All I have to do is create a function that adds .highlighted-row to a row when I move the mouse over it and takes it away when I move the mouse off of it.

***IntranetUserJS***

```javascript

//BEGIN changes to smart-rules.pl
  $('#default-circulation-rules').on('init.dt', function() {

    //BEGIN Highlight row on hover
    //This creates the "hover" function
      $('#default-circulation-rules tr').hover(

        //The first function tells the browser what to do when the hover starts
        function() {

          //This adds the "highlighted-row" class to the row when the mouse moves in
          $(this).addClass('highlighted-row');

        //This curly bracket ends the first function
        },

        //This second function tells the browser what to do when the hover ends
        function() {

          //And this removes that class when the mouse moves out
          $(this).removeClass('highlighted-row');

        //This curly bracket ends the second function
        }

      //This parenthesis ends the .hover action
      );

  });

```

### Click on a row to move it to the bottom

This is another one that helps my eyes, but it also has a secondary purpose.  If you move the row to the bottom of the table, that's another way to make it easier on your eyes.  It also has the advantage when you're editing a row to be able to see what the previous values were.  The edit row populates with the old values as soon as you click "Edit" but if you mess up and want to reference the row after an abortive attempt at an edit, this puts the row you're editing right above the edits you're making.

***IntranetUserJS***

```javascript

//BEGIN changes to smart-rules.pl
  $('#default-circulation-rules').on('init.dt', function() {

    //Click on row to move it to bottom
    //Creates the click function
      $('#default-circulation-rules tr:contains(Edit)').click(function() {

        //Takes "this" row that you've clicked on and "insert"s it "Before" the editing row - i.e. at the bottom of the table
        $(this).insertBefore('#default-circulation-rules #edit_row');

        //Trigger a window resize to fix problem with "sticky" header
        $(window).trigger('resize');

      //Ends the click function
      });

  });

```

### Click on the footer to sort the table

Sometimes it's helpful to see what the other rules with matching values are, so it would be nice to sort the table.  This next batch of code sorts the table when you click on the footer.

***IntranetUserJS***

```javascript

//BEGIN changes to smart-rules.pl
  $('#default-circulation-rules').on('init.dt', function() {

    //BEGIN Sort circulation rules by clicking on footer

      //This creates the click function to sort the table
      $('#default-circulation-rules tfoot tr th').click(function() {

        //This creates a variable for the table
        var table = $(this).parents('table').eq(0);

        //This creates a variable for each row and uses the "comparer" function to create the sort
        var rows = table.find("tbody tr").toArray().sort(comparer($(this).index()));

        //Causes a sort if the row is not in the sort order and reverses if it already is
        this.asc = !this.asc;
        if (!this.asc) {
          rows = rows.reverse();
        }
        for (var i = 0; i < rows.length; i++) {
          table.append(rows[i]);
        }

        //Forces the edit row to stay at the bottom of the table no matter where the sort wants to put it
        $("#default-circulation-rules #edit_row").insertBefore("tfoot");

        //Trigger a window resize to fix problem with "sticky" header
        $(window).trigger('resize');

      //Closes the click function
      });

      //Creates the "comparer" function used in the previous part of this code
      function comparer(index) {
        return function(a, b) {
          var valA = getCellValue(a, index),
          valB = getCellValue(b, index);
          return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB);
        };
      }

      //Creates the "getCellValue" function used by the "comparer" function
      function getCellValue(row, index) {
        return $(row).children('td').eq(index).text();
      }

  });

```
### Collapse columns when the header is clicked

There are many columns we don't use in our system.  The following code allows you to collapse a column if you don't want to see it but it requires that you put some code into  IntranetUserCSS.

***IntranetUserCSS***

```css

/* -Administration › Circulation and fine rules- hides columns in circulation rules (requires accompanying jQuery) */
/* This code establishes a class called "hiderule" and gives td-s and th-s with a hiderule class a very narrow profile and moves any text in that class 9999 pixels to the left of the screen i.e. makes the text invisible for all intents and purposes */
  th.hiderule, td.hiderule {
    min-width: 15px;
    max-width: 15px;
    text-indent: -9999px;
  }

```

***IntranetUserJS***

```javascript

//BEGIN changes to smart-rules.pl
  $('#default-circulation-rules').on('init.dt', function() {

    //BEGIN Hide unneeded columns in circulation rules by clicking on header (--requires corresponding css--)

      //Adds the word "Hide" to the header of each column
      $('#default-circulation-rules thead th').append('<br /><br /><span>Hide<br />Column</span>');

      //Adds a click function to the cells of the header
      $('#default-circulation-rules thead th').click(function() {

        //Creates a variable to index the head cell just clicked on
        var index = (this.cellIndex + 1);

        //Creates a variable that identifies all of the cells in the table with the matching index
        var cells = $('#default-circulation-rules tr > :nth-child(' + index + ')');

        //Toggles the "hiderule" class on the cells identified in the last step
        cells.toggleClass('hiderule');

        //Replaces all of the text in the head cell with a "+" symbol or with "Hide column" depending on the toggle state of the hiderule class
        if ($(this).hasClass('hiderule')) {
          $(this).find('span').html('+');
        } else {
          $(this).find('span').html('Hide<br />Column');
        }

        //Trigger a window resize to fix problem with "sticky" header
        $(window).trigger('resize');

      });

  });

```

### Pre-collapse columns you never use

There are some columns we never use at our libraries.  Anything to do with suspensions or rental charges or article requests, for example, are not currently things we use, so why even have them visible to begin with?  This code pre-collapses columns.

This code is set up with the code to hide *all* columns in Koha 21.05 but I've put comment markers at the beginning of each line **except** the ones I actually want to use.  To pre-collapse a column, just remove the // from in front of the dollar sign for the column you want to collapse.

Note that there is also a line at the very end that adds the "+" symbol to the pre-collapsed columns.

***IntranetUserJS***

```javascript

//BEGIN changes to smart-rules.pl
  $('#default-circulation-rules').on('init.dt', function() {

    //Hide 'Patron category' row by default
      //$('#default-circulation-rules th:nth-child(1), #default-circulation-rules td:nth-child(1)').addClass('hiderule');
    //Hide 'Item type' row by default
      //$('#default-circulation-rules th:nth-child(2), #default-circulation-rules td:nth-child(2)').addClass('hiderule');
    //Hide 'Actions (1)' row by default
      //$('#default-circulation-rules th:nth-child(3), #default-circulation-rules td:nth-child(3)').addClass('hiderule');
    //Hide 'Note' row by default
      //$('#default-circulation-rules th:nth-child(4), #default-circulation-rules td:nth-child(4)').addClass('hiderule');
    //Hide 'Current checkouts allowed' row by default
      //$('#default-circulation-rules th:nth-child(5), #default-circulation-rules td:nth-child(5)').addClass('hiderule');
    //Hide 'Current on-site checkouts allowed' row by default
      //$('#default-circulation-rules th:nth-child(6), #default-circulation-rules td:nth-child(6)').addClass('hiderule');
    //Hide 'Loan period' row by default
      //$('#default-circulation-rules th:nth-child(7), #default-circulation-rules td:nth-child(7)').addClass('hiderule');
    //Hide 'Days mode' row by default
      $('#default-circulation-rules th:nth-child(8), #default-circulation-rules td:nth-child(8)').addClass('hiderule');
    //Hide 'Unit' row by default
      //$('#default-circulation-rules th:nth-child(9), #default-circulation-rules td:nth-child(9)').addClass('hiderule');
    //Hide 'Hard due date' row by default
      //$('#default-circulation-rules th:nth-child(10), #default-circulation-rules td:nth-child(10)').addClass('hiderule');
    //Hide 'Decreased loan period for high holds (day)' row by default
      $('#default-circulation-rules th:nth-child(11), #default-circulation-rules td:nth-child(11)').addClass('hiderule');
    //Hide 'Fine amount' row by default
      //$('#default-circulation-rules th:nth-child(12), #default-circulation-rules td:nth-child(12)').addClass('hiderule');
    //Hide 'Fine charging interval' row by default
      //$('#default-circulation-rules th:nth-child(13), #default-circulation-rules td:nth-child(13)').addClass('hiderule');
    //Hide 'When to charge' row by default
      //$('#default-circulation-rules th:nth-child(14), #default-circulation-rules td:nth-child(14)').addClass('hiderule');
    //Hide 'Fine grace period' row by default
      //$('#default-circulation-rules th:nth-child(15), #default-circulation-rules td:nth-child(15)').addClass('hiderule');
    //Hide 'Overdue fines cap (amount)' row by default
      //$('#default-circulation-rules th:nth-child(16), #default-circulation-rules td:nth-child(16)').addClass('hiderule');
    //Hide 'Cap fine at replacement price' row by default
      $('#default-circulation-rules th:nth-child(17), #default-circulation-rules td:nth-child(17)').addClass('hiderule');
    //Hide 'Suspension in days (day)' row by default
      $('#default-circulation-rules th:nth-child(18), #default-circulation-rules td:nth-child(18)').addClass('hiderule');
    //Hide 'Max. suspension duration (day)' row by default
      $('#default-circulation-rules th:nth-child(19), #default-circulation-rules td:nth-child(19)').addClass('hiderule');
    //Hide 'Suspension charging interval' row by default
      $('#default-circulation-rules th:nth-child(20), #default-circulation-rules td:nth-child(20)').addClass('hiderule');
    //Hide 'Renewals allowed (count)' row by default
      //$('#default-circulation-rules th:nth-child(21), #default-circulation-rules td:nth-child(21)').addClass('hiderule');
    //Hide 'Renewal period' row by default
      //$('#default-circulation-rules th:nth-child(22), #default-circulation-rules td:nth-child(22)').addClass('hiderule');
    //Hide 'No renewal before' row by default
      $('#default-circulation-rules th:nth-child(23), #default-circulation-rules td:nth-child(23)').addClass('hiderule');
    //Hide 'Automatic renewal' row by default
      $('#default-circulation-rules th:nth-child(24), #default-circulation-rules td:nth-child(24)').addClass('hiderule');
    //Hide 'No automatic renewal after' row by default
      $('#default-circulation-rules th:nth-child(25), #default-circulation-rules td:nth-child(25)').addClass('hiderule');
    //Hide 'No automatic renewal after (hard limit)' row by default
      $('#default-circulation-rules th:nth-child(26), #default-circulation-rules td:nth-child(26)').addClass('hiderule');
    //Hide 'Holds allowed (total)' row by default
      //$('#default-circulation-rules th:nth-child(27), #default-circulation-rules td:nth-child(27)').addClass('hiderule');
    //Hide 'Holds allowed (daily)' row by default
      //$('#default-circulation-rules th:nth-child(28), #default-circulation-rules td:nth-child(28)').addClass('hiderule');
    //Hide 'Holds per record (count)' row by default
      //$('#default-circulation-rules th:nth-child(29), #default-circulation-rules td:nth-child(29)').addClass('hiderule');
    //Hide 'On shelf holds allowed' row by default
      //$('#default-circulation-rules th:nth-child(30), #default-circulation-rules td:nth-child(30)').addClass('hiderule');
    //Hide 'OPAC item level holds' row by default
      //$('#default-circulation-rules th:nth-child(31), #default-circulation-rules td:nth-child(31)').addClass('hiderule');
    //Hide 'Article requests' row by default
      $('#default-circulation-rules th:nth-child(32), #default-circulation-rules td:nth-child(32)').addClass('hiderule');
    //Hide 'Rental discount (%)' row by default
      $('#default-circulation-rules th:nth-child(33), #default-circulation-rules td:nth-child(33)').addClass('hiderule');
    //Hide 'Actions (2)' row by default
      //$('#default-circulation-rules th:nth-child(34), #default-circulation-rules td:nth-child(34)').addClass('hiderule');


    //Replace the text with a + sign on pre-hidden columns
     $("#default-circulation-rules > thead > tr > th.hiderule > span").html("+");

  });

```

### Automatically adjust for super-huge screen size

Finally, since I do have a 3 monitor setup on my office computer, I have the following code that automatically removes the left hand navigation aides and un-collapses all of the columns and resizes the window when I open the rules page when my browser is set to a super-wide display.

***IntranetUserJS***

```javascript

//BEGIN changes to smart-rules.pl
  $('#default-circulation-rules').on('init.dt', function() {

    //BEGIN expand when super large or multi screen sized page is loaded

      //Creates a set of functions that happen when the browser size is greater than 2500 pixels wide
      if ($(window).width() > 2500) {

        //Removes the left hand navigation content and button
        $('#navmenu, #allshows').hide();

        //Adjusts the position of the table
        $('.row .col-sm-10.col-sm-push-2').removeClass('col-sm-push-2');

        //Removes the hiderule class from all the cells it's been applied to
        $('.hiderule').removeClass();

        //Triggers the window re-size to fix the sticky header problem
        $(window).trigger('resize');

      //This curly bracket ends the function
      }

  });

```

### Recap without the comments

Here is the full code without all of the comments

***IntranetUserCSS***

```css

/* -Administration › Circulation and fine rules- hides columns in circulation rules (requires accompanying jQuery) */
  th.hiderule, td.hiderule {
    min-width: 15px;
    max-width: 15px;
    text-indent: -9999px;
  }

```

***IntranetUserJS***

```javascript

//BEGIN changes to smart-rules.pl
  $('#default-circulation-rules').on('init.dt', function() {

    //BEGIN Create button to remove the left hand navigation area
      $('#admin_smart-rules #navmenu').parent().prepend('<a href="#default-circulation-rules"><button id="allshows" type="button" style="margin: 5px">Show full width</button></a>');
      $('#allshows').click(function() {
        $('#navmenu, #allshows').hide();
        $('.row .col-sm-10.col-sm-push-2').removeClass('col-sm-push-2');
        $(window).trigger('resize');
      });

    //BEGIN Highlight row on hover
      $('#default-circulation-rules tr').hover(
        function() {
          $(this).addClass('highlighted-row');
        },
        function() {
          $(this).removeClass('highlighted-row');
        }
      );

    //Click on row to move it to bottom
      $('#default-circulation-rules tr:contains(Edit)').click(function() {
        $(this).insertBefore('#default-circulation-rules #edit_row');
        $(window).trigger('resize');
      });

    //BEGIN Sort circulation rules by clicking on footer
      $('#default-circulation-rules tfoot tr th').click(function() {
        var table = $(this).parents('table').eq(0);
        var rows = table.find("tbody tr").toArray().sort(comparer($(this).index()));
        this.asc = !this.asc;
        if (!this.asc) {
          rows = rows.reverse();
        }
        for (var i = 0; i < rows.length; i++) {
          table.append(rows[i]);
        }
        $("#default-circulation-rules #edit_row").insertBefore("tfoot");
        $(window).trigger('resize');
      });
      function comparer(index) {
        return function(a, b) {
          var valA = getCellValue(a, index),
          valB = getCellValue(b, index);
          return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB);
        };
      }
      function getCellValue(row, index) {
        return $(row).children('td').eq(index).text();
      }

    //BEGIN Hide unneeded columns in circulation rules by clicking on header (--requires corresponding css--)
      $('#default-circulation-rules thead th').append('<br /><br /><span>Hide<br />Column</span>');
      $('#default-circulation-rules thead th').click(function() {
        var index = (this.cellIndex + 1);
        var cells = $('#default-circulation-rules tr > :nth-child(' + index + ')');
        cells.toggleClass('hiderule');
        if ($(this).hasClass('hiderule')) {
          $(this).find('span').html('+');
        } else {
          $(this).find('span').html('Hide<br />Column');
        }
        $(window).trigger('resize');
      });

    //Hide 'Patron category' row by default
      //$('#default-circulation-rules th:nth-child(1), #default-circulation-rules td:nth-child(1)').addClass('hiderule');
    //Hide 'Item type' row by default
      //$('#default-circulation-rules th:nth-child(2), #default-circulation-rules td:nth-child(2)').addClass('hiderule');
    //Hide 'Actions (1)' row by default
      //$('#default-circulation-rules th:nth-child(3), #default-circulation-rules td:nth-child(3)').addClass('hiderule');
    //Hide 'Note' row by default
      //$('#default-circulation-rules th:nth-child(4), #default-circulation-rules td:nth-child(4)').addClass('hiderule');
    //Hide 'Current checkouts allowed' row by default
      //$('#default-circulation-rules th:nth-child(5), #default-circulation-rules td:nth-child(5)').addClass('hiderule');
    //Hide 'Current on-site checkouts allowed' row by default
      //$('#default-circulation-rules th:nth-child(6), #default-circulation-rules td:nth-child(6)').addClass('hiderule');
    //Hide 'Loan period' row by default
      //$('#default-circulation-rules th:nth-child(7), #default-circulation-rules td:nth-child(7)').addClass('hiderule');
    //Hide 'Days mode' row by default
      $('#default-circulation-rules th:nth-child(8), #default-circulation-rules td:nth-child(8)').addClass('hiderule');
    //Hide 'Unit' row by default
      //$('#default-circulation-rules th:nth-child(9), #default-circulation-rules td:nth-child(9)').addClass('hiderule');
    //Hide 'Hard due date' row by default
      //$('#default-circulation-rules th:nth-child(10), #default-circulation-rules td:nth-child(10)').addClass('hiderule');
    //Hide 'Decreased loan period for high holds (day)' row by default
      $('#default-circulation-rules th:nth-child(11), #default-circulation-rules td:nth-child(11)').addClass('hiderule');
    //Hide 'Fine amount' row by default
      //$('#default-circulation-rules th:nth-child(12), #default-circulation-rules td:nth-child(12)').addClass('hiderule');
    //Hide 'Fine charging interval' row by default
      //$('#default-circulation-rules th:nth-child(13), #default-circulation-rules td:nth-child(13)').addClass('hiderule');
    //Hide 'When to charge' row by default
      //$('#default-circulation-rules th:nth-child(14), #default-circulation-rules td:nth-child(14)').addClass('hiderule');
    //Hide 'Fine grace period' row by default
      //$('#default-circulation-rules th:nth-child(15), #default-circulation-rules td:nth-child(15)').addClass('hiderule');
    //Hide 'Overdue fines cap (amount)' row by default
      //$('#default-circulation-rules th:nth-child(16), #default-circulation-rules td:nth-child(16)').addClass('hiderule');
    //Hide 'Cap fine at replacement price' row by default
      $('#default-circulation-rules th:nth-child(17), #default-circulation-rules td:nth-child(17)').addClass('hiderule');
    //Hide 'Suspension in days (day)' row by default
      $('#default-circulation-rules th:nth-child(18), #default-circulation-rules td:nth-child(18)').addClass('hiderule');
    //Hide 'Max. suspension duration (day)' row by default
      $('#default-circulation-rules th:nth-child(19), #default-circulation-rules td:nth-child(19)').addClass('hiderule');
    //Hide 'Suspension charging interval' row by default
      $('#default-circulation-rules th:nth-child(20), #default-circulation-rules td:nth-child(20)').addClass('hiderule');
    //Hide 'Renewals allowed (count)' row by default
      //$('#default-circulation-rules th:nth-child(21), #default-circulation-rules td:nth-child(21)').addClass('hiderule');
    //Hide 'Renewal period' row by default
      //$('#default-circulation-rules th:nth-child(22), #default-circulation-rules td:nth-child(22)').addClass('hiderule');
    //Hide 'No renewal before' row by default
      $('#default-circulation-rules th:nth-child(23), #default-circulation-rules td:nth-child(23)').addClass('hiderule');
    //Hide 'Automatic renewal' row by default
      $('#default-circulation-rules th:nth-child(24), #default-circulation-rules td:nth-child(24)').addClass('hiderule');
    //Hide 'No automatic renewal after' row by default
      $('#default-circulation-rules th:nth-child(25), #default-circulation-rules td:nth-child(25)').addClass('hiderule');
    //Hide 'No automatic renewal after (hard limit)' row by default
      $('#default-circulation-rules th:nth-child(26), #default-circulation-rules td:nth-child(26)').addClass('hiderule');
    //Hide 'Holds allowed (total)' row by default
      //$('#default-circulation-rules th:nth-child(27), #default-circulation-rules td:nth-child(27)').addClass('hiderule');
    //Hide 'Holds allowed (daily)' row by default
      //$('#default-circulation-rules th:nth-child(28), #default-circulation-rules td:nth-child(28)').addClass('hiderule');
    //Hide 'Holds per record (count)' row by default
      //$('#default-circulation-rules th:nth-child(29), #default-circulation-rules td:nth-child(29)').addClass('hiderule');
    //Hide 'On shelf holds allowed' row by default
      //$('#default-circulation-rules th:nth-child(30), #default-circulation-rules td:nth-child(30)').addClass('hiderule');
    //Hide 'OPAC item level holds' row by default
      //$('#default-circulation-rules th:nth-child(31), #default-circulation-rules td:nth-child(31)').addClass('hiderule');
    //Hide 'Article requests' row by default
      $('#default-circulation-rules th:nth-child(32), #default-circulation-rules td:nth-child(32)').addClass('hiderule');
    //Hide 'Rental discount (%)' row by default
      $('#default-circulation-rules th:nth-child(33), #default-circulation-rules td:nth-child(33)').addClass('hiderule');
    //Hide 'Actions (2)' row by default
      //$('#default-circulation-rules th:nth-child(34), #default-circulation-rules td:nth-child(34)').addClass('hiderule');

    //Replace the text with a + sign on pre-hidden columns
     $("#default-circulation-rules > thead > tr > th.hiderule > span").html("+");

    //BEGIN expand when super large or multi screen sized page is loaded
      if ($(window).width() > 2500) {
        $('#navmenu, #allshows').hide();
        $('.row .col-sm-10.col-sm-push-2').removeClass('col-sm-push-2');
        $('.hiderule').removeClass();
        $(window).trigger('resize');
      }

  });

```
