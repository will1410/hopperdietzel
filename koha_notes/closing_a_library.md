## Steps to close a library

Every year I have five school libraries that close for two-and-a-half to three months.  Additionally, throughout the year we often have libraries that need to close temporarily for emergencies.  One example is Winchester Community Library that closed temporarily because they needed to replace carpet and part of a wall that was damaged when a pipe froze over the holidays late last year.

Essentially, when a library closes I need to make sure that their items are no longer available to fill requests from our other member libraries and I need to make sure that nothing will be shipped to those libraries during their closure.

Parts of what I do are built into Koha with system preferences and circulation rules, but there are some things I do with custom code.

### Home > Administration > Circulation and fine rules (smart-rules.pl)

For school closures I set the circulation rules for the schools so that items checked out at the school are due before the school year ends.  This ensures that, if the school has borrowed any materials from other member libraries, those items will be shipped back to the libraries that own those items before their school year ends.  Usually the date set is about seven days before their last day of school.

### Home > Administration > System preferences (preferences.pl)

Once the school is closed, I remove the school's branchcode from the staticholdsqueue system preference.  This prevents the items owned by the schools from appearing on any holdsqueu reports.

Then I add the branchcodes for the closed schools to opachiddenitems.  This prevents the closed library's items from appearing in teh OPAC.

### Home > Administration > Libraries (branches.pl)

This is one of the options for closing a library that I actually avoid.  It works, but I'm not happy with the way that it works for borrowers who have the closed library set as their home library.

From the "Libraries" page, you can indicate whether or not a library is a "Pickup location."  During a closure you can change their setting from "Yes" to "No."  This will prevent borrowers from having items shipped to this library during a closure.

The reason I don't like this option is that, if a borrower has the closed library set as their home library, when you change a library from "Pickup location: Yes" to "Pickup location: No" it will default that borrower's pickup location to whichever library is alphabetically at the top of the pickup locations list.  In our case this means that if a borrower whose home library is "Sabetha Middle School" places a request while "Sabetha Middle School" is closed and that borrower isn't paying attention, their request will be shipped to Atchison Public Library (which is about 45 miles east of Sabetha).

### IntranetUserJS to fix default pickup location issue 

Instead of using the "Pickup location: (Yes/No)" feature on branches.pl, I use custom jQuery so that if a closed location is selected by default, Koha will automatically re-route the item to a nearby library that is open.

```javascript

  $("#pickup option[value='CLOSED_BRANCHCODE']").attr("value","ALTERNATE_BRANCHCODE").html('CLOSED_BRANCHNAME is closed for the summer - Items will route to ALTERNATE_BRANCHNAME'); 

```