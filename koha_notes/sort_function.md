# Sort unsorted drop-downs

Every now and then you will come across a drop-down menu in Koha that doesn't sort alphabetically.  Usually what's happening is that there are two parts to the drop-down menu - a value and a description.  The description is the part you see, but the value is the piece of data that gets sent to the database when you submit whatever form the drop-down is a part of.  Sometimes the problem is that the drop-down menu is being sorted alphabetically by the value rather than by the description.  Some values are numeric, and some values come from Koha's authorized values table.

If you come across a drop-down in Koha that is not sorted alphabetically, I would recommend the following:

1. Open a ticket in Bugzilla saying "This drop-down menu doesn't sort alphabetically"
2. Add this function to your IntranetUserJS system preference:

```javascript
$(document).ready(function () {
  
  //Special function
    //BEGIN creates sortMenus function - helps sort some non-sorted menus and dropdowns 
      function sortMenus (itembyID) { 
        $('#'+itembyID+'').html($('#'+itembyID+'').find('option').sort(function(x, y) { 
          return $(x).text().toUpperCase() > $(y).text().toUpperCase() ? 1 : -1; 
        })); 
      }

});

```

This creates a function that you can add to any dropdown menu that will force that drop-down to sort alphabetically.

3. The last step is to find a selector for the drop-down menu you want to sort and to add the sort function to that drop-down.

In my case, I know that I the patron attributes drop-down in the batch patron modification tool does not sort alphabetically.  So to add the sortMenus function to that drop-down, I need the ID of the page with the drop-down and I need the ID of the drop-down menu.  In this example, the page ID is "tools_modborrowers" and the drop-down ID is #patron_attributes

The code I need is:

~~~javascript
  //Sort batch patron modification patron attribute drop-down
    if ( $('#tools_modborrowers').length ) { 
      sortMenus('patron_attributes');
      $('#patron_attributes').find('option:first').prop('selected', true);
    }
~~~

The first part is a javascript if/then statement and it's just checking to see if we're on the right page.  If the page is "#tools_modborrowers," then the sortMenus function will be called.

The second line is calling up the sortMenus function and applying it to the "patron_attributes" drop-down list.

And the final line is selecting the first option on the top of this list (if you don't add this, when the page loads, the bottom option on the list will be selected by default).

The final code looks like this:

~~~javascript
$(document).ready(function () {
  
  //Special function
    //BEGIN creates sortMenus function - helps sort some non-sorted menus and dropdowns 
      function sortMenus (itembyID) { 
        $('#'+itembyID+'').html($('#'+itembyID+'').find('option').sort(function(x, y) { 
          return $(x).text().toUpperCase() > $(y).text().toUpperCase() ? 1 : -1; 
        })); 
      }
  
  //Sort batch patron modification patron attribute drop-down
    if ( $('#tools_modborrowers').length ) { 
      sortMenus('patron_attributes');
      $('#patron_attributes').find('option:first').prop('selected', true);
    }
    
});
~~~