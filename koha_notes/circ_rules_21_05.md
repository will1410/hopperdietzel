# smart-rules.pl modifications

I originally did a presentation on this same topic at the koha-US conference in Coeur d'Alene Idaho in 2017.  The thing is that the circulation rules table changes with practically every version of Koha, so this code has to be updated with practically every version of Koha.  It jQuery and a little bit of CSS.

## The problem

The circulation rules matrix table on smart-rules.pl is wide.  Really wide.  Really-really wide.  Really-really-really wide.  And it's getting wider all the time.  I have 3 screens on my work computer and if I go to Home > Administration > Circulation and fine rules on Koha and adjust my browser window to 4370 x 1040 I can see the full circulation rules matrix.  That's an insanely wide browser window.  It completely fills two full screens and even bleeds a little bit over onto the third screen.  It's crazy.

But there are a whole bunch of things on this screen that I really don't need to see in order to manage the circulation rules for my libraries.  I don't really need the left hand navigation controls.  I also don't need several columns in the table itself.

## The solution

Back in 2015 I created the jQuery and CSS you'll find below in order to hide several columns and to remove the left-hand navigation area.  If I don't want to see the left hand navigation, I've got a button here that will hide that area.  If I don't want to see a column, I can click on the head of the column to collapse its content.  If there are columns I never use, I can collapse them by default.  When I'm trying to look at things on the screen my eyes have a hard time following the rows across the page, so if you hover the mouse over a row, it highlights the row.  And if I click on a column, it moves to the bottom of the table so I have an easy time seeing what edits I might be making to that column.  And if I click on the foot of the table, the rows will sort by the values in the column I sort on.

This is code that needs to be upgraded for virtually every Koha upgrade because any time a new column gets added to the circulation rules (which seems to be in almost every new release of Koha) the column counts need to be updated.

## The code

All of the jQuery I use for the changes I want will only affect smart-rules.pl and I want to wait for them to take effect after the circulation rules table has loaded so the first thing I'm going to do is to write jQuery that executes all of these functions only after the rules table has loaded.

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

This one step all by itself gets this page down to 3840x1040 and confines the table to less than 2 full screens.

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

        //Optional for full rule display - this is commented out right now -- I'll come back to it later
        //$('.hiderule').removeClass();

        //Now that the column header on this table is "sticky," this function is required to force the column header to resize when you remove the content -- without this function, the column header won't line up with the column content when you scroll up or down the page
        $(window).trigger('resize');

      //This line ends the click function
      });

  });

```

### Highlight row on hover

I'm over 50, so when I try read a row across two computer screens, it's really easy for my eyes to get lost.  I added this very simple code so that when I hover the mouse over a row, it highlights in orange.  The best part about this is that the .highlighted-row class is already a part of Koha.  All I have to do is create a function that adds .highlighted-row to a row when I move the mouse over it and takes it away when I move the mouse off of it.



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

```javascript

//BEGIN changes to smart-rules.pl
  $('#default-circulation-rules').on('init.dt', function() {

    //Click on row to move it to bottom
    //Creates the click function
      $('#default-circulation-rules tr:contains(Edit)').click(function() {

        //Takes "this" row that you've clicked on and "insert"s it "Before" the editing row - i.e. at the bottom of the table
        $(this).insertBefore('#default-circulation-rules #edit_row');

      //Ends the click function
      });

  });

```

### Click on the footer to sort the table

Sometimes it's helpful to see what the other rules with matching values are, so it would be nice to sort the table.  This next batch of code sorts the table when you click on the footer.

```javascript

//BEGIN changes to smart-rules.pl
  $('#default-circulation-rules').on('init.dt', function() {

    //BEGIN Sort circulation rules by clicking on footer
      //This creates the function
      $('#default-circulation-rules tfoot tr th').click(function() {
        var table = $(this).parents('table').eq(0);
        var rows = table.find('tbody tr').toArray().sort(comparer($(this).index()));
        this.asc = !this.asc;
        if (!this.asc) {
          rows = rows.reverse();
        }
        for (var i = 0; i < rows.length; i++) {
          table.append(rows[i]);
        }
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
      $('#default-circulation-rules .fixed_sort sorting_asc').insertBefore('tfoot');

  });

```
