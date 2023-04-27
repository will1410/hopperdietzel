## Steps to close a library

Every year I have five school libraries that close for two-and-a-half to three months.  Additionally, throughout the year we often have libraries that need to close temporarily for emergencies.  One example is Winchester Community Library that closed temporarily because they needed to replace carpet and part of a wall that was damaged when a pipe froze over the holidays late last year.

Essentially, when a library closes I need to make sure that their items are no longer available to fill requests from our other member libraries and I need to make sure that nothing will be shipped to those libraries during their closure.  And if the closure is an unplanned or ememergency closure, I need to take some additional steps to make sure that their patrons don't end up with unexpected overdues.

Parts of what I do are built into Koha with system preferences and circulation rules, but there are some things I do with custom code.

### Step 1 - setting hard due dates for a pre-planned closure

- This step is accomplished at Home > Administration > Circulation and fine rules (smart-rules.pl)

For school closures I set the circulation rules for the schools so that items checked out at the school are due before the school year ends.  This ensures that, if the school has borrowed any materials from other member libraries, those items will be shipped back to the libraries that own those items before their school year ends.  Usually the date we set as their hard due date is about seven days before their last day of school.

### Step 2: option A - shutting down the closed library's holds queue

- This step is accomplished at Home > Administration > System preferences (preferences.pl)

Once a library is closed, I remove that library's branchcode from the StaticHoldsQueueWeight system preference.  This prevents the items owned by the closed library from being added to the holds queue.


### Step 2: option B - shutting down the closed library's holds queue

- This step is accomplished at Home > Tools > BRANCHNAME calendar (holidays.pl)

If the sytem preference HoldsQueueSkipClosed is set to "open" then you can use the calendar tool to prevent items from appearing on the holds queue at a closed library.  All you have to do is mark the closed dates on the calendar.

But this method will only work if HoldsQueueSkipClosed is set to "open."

### Step 3: option A - Preventing new requests from being placed for pickup at the closed library

- This step is accomplished at Home > Administration > Libraries (branches.pl)

From the "Libraries" page, you can indicate whether or not a library is a "Pickup location."  During a closure you can change their "Pickup location" setting from "Yes" to "No."  This will remove the closed library from the list of pickup location options.

### Step 3: option B - Preventing new requests from being placed for pickup at the closed library

- This step is accomplished at Home > Administration > System preferences > IntranetUserJS (preferences.pl) 

  *AND* 

- This step is accomplished at Home > Administration > System preferences > OPACUserJS (preferences.pl) 

I don't use Step 3: option A.  If a borrower has the closed library set as their home library, when you change a library from "Pickup location: Yes" to "Pickup location: No" it will default that borrower's pickup location to whichever library is alphabetically at the top of the pickup locations list.  In our case this means that if a borrower whose home library is "Sabetha Middle School" places a request while "Sabetha Middle School" is closed for the summer and that borrower isn't paying attention, their request will be shipped to Atchison Public Library (which is about 45 miles east of Sabetha).  Then I have the Atchison Public Library director calling me asking "Why are these things coming to my library?  This (teacher/student/staff member) doesn't even live here.  What's going on?"

Instead of using the "Pickup location: (Yes/No)" feature on branches.pl, I use custom jQuery so that if a closed location is selected when the library is closed, Koha will automatically re-route the item to a nearby library that is open.

  - IntranetUserJS

  ```javascript

    $("#pickup option[value='CLOSED_BRANCHCODE']").attr("value","ALTERNATE_BRANCHCODE").html('CLOSED_BRANCHNAME is closed for the summer - requested items will route to ALTERNATE_BRANCHNAME'); 

  ```

  - OPACUserJS

  ```javascript

    $("option[value='CLOSED_BRANCHCODE']").attr("value","ALTERNATE_BRANCHCODE").html('CLOSED_BRANCHNAME is closed for the summer - requested items will route to ALTERNATE_BRANCHNAME'); 

  ```
### Step 4: part I - Re-route items in transit to a different location 

- This step is accomplished at Home > Administration > System preferences > IntranetUserJS (preferences.pl)

We have a statewide courier system that moves materials between libraries.  Each library has a courier code that we store in the library record in Koha in the "Country" field.  If a library is closed for a long period of time, items that are owned by the closed library that were checked out at other locations may end up in courier limbo.  If, for example, the Winchester Community Library is closed for remodelling after a broken pipe and an item owned by Winchester is shipped from Bonner Springs Public Library to Winchester during that closure, the couriers will just let those Winchester items stack up at the warehouse that services Winchester Community Library.  This is one of the easiest ways for items in transit to end up on the "Missing in transit" list.  When items sit in a courier warehouse for more than a few days, they are more likely to disappear, so I like to have them shipped to our office to wait until the closed library reopens.  The Winchester closure we had this year is a great example of the potential pitfalls of letting things sit in the warehouse.  They are serviced by our system's courier hub in Topeka and during the Winchester library closure, the warehouse where our Topeka courier hub is burnt to the ground.  Fortunately, about 98% of the items that were en route from other member libraries to Winchester had been re-routed to our offices at NEKLS, so only a few things owned by Winchester were lost in the fire, but this is one example of why I don't like having library items sitting around the courier warehouse for extended periods of time.

So, part of my solution to this is to change the on-screen message that appears in the modal when an item is being transfered using jQuery.  What this jQuery is doing is swapping the name of the closed library with the name of the library where I want the items to route to.  It is essential that the CLOSED_LIBRARY_BRANCHNAME matches the closed library's name in the library record exactly in order for this to work properly.

  - IntranetUserJS

  ```javascript 

    $('#wrongtransferform, #item-transfer-modal').each(function() { 
      var html = $(this).html(); 
      $(this).html(html.replace('CLOSED_LIBRARY_BRANCHNAME', 'DESTINATIO_LIBRARY_BRANCHNAME')); 
    }); 

  ```

  ### Step 4: part II - Re-route items in transit to a different location 

  The second part of this process involves libraries with receipt printers.  I addition to changing the destination on the screen, I also need to have it change in the notices and slips modlue on TRANSFERSLIP and HOLD_SLIP.

  How you deal with this situation is going to depend on whether you're still using the bespoke Koha double angle bracket syntax for your notices and slips or if you're using Template Toolkit.

  We use Template toolkit so I need to re-write the TRANSFERSLIP and HOLD_SLIP destination library information to:

  ```html

  [% IF branch.branchname == "CLOSED_LIBRARY_BRANCHNAME" %]

  <!-- Shipped to information -->
  <div classs="grp-4">
    <h1>
      DESTINATION_LIBRARY_COURIER_CODE
    </h1>
  </div>

  <p>&nbsp;</p>

  <div classs="grp-2">
    <p>Ship to:</p>
    <p classs="grp-1">
      <strong>
        DESTINATION_LIBRARY_BRANCHNAME<br />
        DESTINATION_LIBRARY_ADDRESS<br />
        DESTINATION_LIBRARY_CITY_STATE_AND_ZIPCODE
      </strong>
    </p>
  </div>

  [% ELSE %]

  <!-- Shipped to information -->
  <div classs="grp-4">
    <h1>
      [% branch.branchnotes %]
    </h1>
  </div>

  <p>&nbsp;</p>

  <div classs="grp-2">
    <p>Ship to:</p>
    <p classs="grp-1">
      <strong>
        [% branch.branchname %]<br />
        [% branch.branchaddress1 %]<br />
        [% branch.branchcity %], [% branch.branchstate %] [% branch.branchzip %]
      </strong>
    </p>
  </div>

  [% END %]

  ```

