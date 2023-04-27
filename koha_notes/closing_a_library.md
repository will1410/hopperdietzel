## Steps to close a library

Every year I have five school libraries that close for two-and-a-half to three months.  Additionally, throughout the year we often have libraries that need to close temporarily for emergencies.  One example is Winchester Community Library that closed temporarily because they needed to replace carpet and part of a wall that was damaged when a pipe froze over the holidays late last year.

Essentially, when a library closes I need to make sure that their items are no longer available to fill requests from our other member libraries and I need to make sure that nothing will be shipped to those libraries during their closure.

Parts of what I do are built into Koha with system preferences and circulation rules, but there are some things I do with custom code.

### Home > Administration > Circulation and fine rules (smart-rules.pl)

For school closures I set the circulation rules for the schools so that items checked out at the school are due before the school year ends.  This ensures that, if the school has borrowed any materials from other member libraries, those items will be shipped back to the libraries that own those items before their school year ends.  Usually the date set is about seven days before their last day of school.

### Home > Administration > System preferences (preferences.pl)

Once the school is closed, I remove the school's branchcode from the staticholdsqueue system preference.  This prevents the items owned by the schools from appearing on any holdsqueu reports.

Then I add the branchcodes for the closed schools to opachiddenitems.  This prevents the closed library's items from appearing in teh OPAC.

### Home > Administration > Libraries 

