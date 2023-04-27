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

- Home > Administration > System preferences > IntranetUserJS (preferences.pl) 

  *AND* 

- Home > Administration > System preferences > OPACUserJS (preferences.pl) 

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
### 

