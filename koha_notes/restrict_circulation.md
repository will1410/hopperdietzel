# Restrict patron circulation by borrower category and home library


## The problem

All of our member libraries are are members of the Kansas Library Express (KLE) courier system and the Kansas Interlibrary loan Council's statewide ILL program (KICnet), but they all handle how they track the items they loan to KICnet and ship through KLE differently.  Some libraries track their KIcnet lending by writing down information in a spiral notebook they keep in a drawer at the circulation desk (the library that does this only handles 2-3 ILLs per year), while others create one ILL account in Koha and check all of the items they loan to KICnet out on that card (these libraries loan ~5 items a month to KICnet), while the bigger libraries have a separate library card for each library they loan to (these librarie loan 10-25 items a month to KICnet).  All of the ILL library cards belong to a borrower category called "ILL."

The issue we have often comes with the bigger libraries and their separate cards for each library they loan to.  If LIBRARY-A creates an ILL card for Dodge City and LIBRARY-B uses that card when they send something to Dodge City that can anger LIBRARY-A because it messes up LIBRARY-A's workflow.

Our consortium is built on the principal of 1 card per user.  Any patron from any of our 50 libraries can use their card at any other library in the system, but we want to make an exception for borrowers in the "ILL" borrower category but there currently isn't a way built into Koha to do that.

Until there is a way Koha can manage this, the question comes up, can this type of restriction be created with Javascript or jQuery?


## The solution

The answer to that question is, yes.

In order to restrict circulation on accounts with the ILL borrower category, we need Koha to be able to recognize three things; the library staff are logged in at, the borrower's home library, and the borrower's category.  All of these things are available on the pages in a borrower's account where staff can check out and renew items, so it is possible to use a combination of Javascript and jQuery to remove the elements from the page that allow checkouts and renewals to happen.  It's actually not that difficult.

In the next X sections I'll walk through the bits and pieces you can add to your IntranetUserJS system preference to make this happen.


### Set some variables

My solution uses 2 variables that I have set up in my IntranetUserJS system preference.  I apply these variables to every page in the staff interface at Next Search Catalog.  By setting up these variables (and about a half-dozen others) I automatically have some variables that I can use again and again in IntranetUserJS that are essentially on standby for whenever I want to use them.

In this case I use variables I call "borroer_home" and "borrower_short_home".  The code is:

```javascript
//creates "borroer_home" and "borrower_short_home" variables
  var borrower_home_raw = $('.patronlibrary').text().split(': ');
  var borrower_home = borrower_home_raw[1] || "no_borrower";
  var borrower_short_home = borrower_home.substring(0, 5);
  console.log("borrower_home: " + borrower_home); 
  console.log("borrower_short_home: " + borrower_short_home) 
```

Here is a detailed explanation of what's going on:

```javascript
var borrower_home_raw = $('.patronlibrary').text().split(': ');
```

This line creates a variable called "borrower_home_raw" by looking on the page to find the class "patronlibrary".  This class is found on the borrower pages in the left hand column and the rendered HTML includes the text "Home library: _LIBRARYNAME_".  Because this object always contains the words "Home library:" and we don't want that text in the final variable, it splits the field into two segments where it sees the ": ".  Javascript will call these two segments "borrower_home_raw[0]" and "borrower_home_raw[1]".  borrower_home_raw[0] will always have the value "Home library" and borrower_home_raw[1] will have the name of the borrower's home library as it appears in the library data in Koha.


```javascript
var borrower_home = borrower_home_raw[1] || "no_borrower";
```

This line takes the second part of the .patronlibrary text isolated above and gives it a new name - borrower_home.  It also sets a condition where, if Koha isn't on a page that has borrower information, the phrase "no_borrower" is substituted where there would otherwise be an error message.

```javascript
var borrower_short_home = borrower_home.substring(0, 5);
```

This line takes the second part of the .patronlibrary text isolated above, cuts off all but the first 5 letters, then give it a new name - borrower_short_home.

The reason I do this is because I have 50 libraries and some of them are grouped together.  Specifically I have one school district with 4 libraries and one library district with 4 branches.  All of the school libraries and the library district have names that starts with the same words - "Prairie Hills . . . " and "Doniphan County . . . ".  When I'm working with things in Javascript or jQuery and I have situations where I need the 4 Doniphan County libraries to all act like the same library, I can use this variable so that the borrowers from "Doniphan County, Elwood City" and the borrowers at "Doniphan County, Wahtena" all appear in jQuery as "Donip".  In the case of restricting our ILL borrowers to staff at their home library, this gives staff at all four Doniphan County Libraries the ability to circulate to all Doniphan County borrowers because the staff at all 4 of those libraries can work with all of the Doniphan County borrowers whose home library starts with "Donip".

```javascript
console.log("borrower_home: " + borrower_home); 
console.log("borrower_home: " + borrower_short_home); 
```

Logging the final variables to the console is not necessary.  I do this for all of the variables I create because it makes things a lot easier to troubleshoot when the code doesn't work the way I expect it to.


### Create code using those variables

```javascript
//Limit circulation access to ILL accounts to the ILL account's home library 
  $('#circ_circulation, #pat_moremember').each(function() { 
    var restricted_borrower_category = "ILL";
    console.log('restricted_borrower_category', restricted_borrower_category);
    if ($('.logged-in-branch-name:not(:contains(' + borrower_short_home + '))', this).length && $('.patroninfo .patroncategory:contains(' + restricted_borrower_category + ')', this).length) { 
      $('#circ_circulation_issue > *, #patronlists, #finesholdsissues, #menu li:contains("Batch check out")').hide();
      $('#circ_circulation_issue, #patron-information').before('<h1 class="next_label_yellow">Circulation on this account is limited to staff at ' + borrower_home + '</h1>');
    } 
  }); 
```

This is the code and here is what each part id doing:

```javascript
  $('#circ_circulation, #pat_moremember').each(function() { 

  });
```

These lines wrap around the others and tell Koha to only run this code on the pages with the "#circ_circulation" or "#pat_moremember" IDs.  #circ_circulation is the ID for the check-out page and #pat_moremember is the ID for the borrower's "Details" page, so this line makes it so this code only runs on those pages.

```javascript
    var restricted_borrower_category = "ILL";
```

This line estableshes a variable.  This is the part of the code you have to change.  At our library, the category we restrict is named "ILL".  When you add this code to your system, you need to include the name of the category you're going to restrict

```javascript
    if ($('.logged-in-branch-name:not(:contains(' + borrower_short_home + '))', this).length && $('.patroninfo .patroncategory:contains(' + restricted_borrower_category + ')', this).length) { 
    
    }
```

These lines tell Koha to look for a specific situation where the logged in library -.logged-in-branch-name- does not match the borrower's home library -borrower_short_home-  __AND__
the borrower's borrower category -.patroninfo .patroncategory- matches the restricted category established in the variable established above -restricted_borrower_category-.  If __BOTH__ of those conditions are met, then Koha will execute the jQuery commands you put between the two brackets.  If one of the conditions is not met, the code won't run and nothing will happen.

```javascript
      $('#circ_circulation_issue > *, #patronlists, #finesholdsissues, #menu li:contains("Batch check out")').hide();
```

This line hides the parts of the pages involved that we want to hide:

  "#circ_circulation_issue > *" = the check-out box and all of its bits and pieces on the check-out page 

  "#patronlists" = the current check-outs, holds, claims returned, and restrictions tables on the bottom of the __check-out__ page

  "#finesholdsissues" the current check-outs, holds, claims returned, and restrictions tables on the bottom of the __details__ page

  "#menu li:contains("Batch check out")" = the batch check-out page

```javascript
      $('#circ_circulation_issue, #patron-information').before('<h1 class="next_label_yellow">Circulation on this account is limited to staff at ' + borrower_home + '</h1>');
```

This line tells Koha to substitute an HTML message on the page indicating that the page is restricted.  The 'class="next_label_yellow"' segment tells Koha to add some style to the HTML so that it matches other similar messages on our system.


### Bonus CSS

If you want to use that CSS it's:

```css
  .next_label_yellow {
    background: #efe18f;
    color: black;
    padding-left: .75em;
    padding-top: .25em;
    padding-right: .75em;
    padding-bottom: .25em;
    border-radius: 16px;
    display: inline-block;
    font-weight: normal;
    line-height: 1.5;
    margin-bottom: 0;
    text-align: center;
    vertical-align: middle;
    white-space: nowrap;
  }
```


### Potential question

When people look at this, I can envision a potential question - what if I have more than 1 borrower category I want to restrict?

Currently this code operates by extracting the borrower category name from the .patronbriefinfo panel on the left hand side of the page on the circulation.pl and moremember.pl pages in Koha.  Therefore if all of the borrowers you wanted to restrict had a common word in their descriptions (something like "restricted"), then all you would have to do is change the restricted_borrower_category variable from "ILL" to "Restricted".  That would be the simplest way - not to modify this code, but to modify the description field in the borrower categories you want to restrict.

Alternatively it would be possible to re-write this code so that rather than 1 variable controlled by restricted_borrower_category, you could set an array that includes the descriptions of all of the categories you wish to restrict.  Then you'd have to create a new vunction that checks to see if the information in .patroncategory matches one of the categorie codes in that array.  Then you'd need a logical switch that says If a match exists, then restrict; but if no match exists, then allow.  That seems doable, but I have not written that code because it does not apply to our situation in Next Search Catalog.


## The complete code

Put this into your IntranetUserJS system preference:

```javascript
//creates "borroer_home" and "borrower_short_home" variables
  var borrower_home_raw = $('.patronlibrary').text().split(': ');
  var borrower_home = borrower_home_raw[1] || "no_borrower";
  var borrower_short_home = borrower_home.substring(0, 5);
  console.log("borrower_home: " + borrower_home); 
  console.log("borrower_short_home: " + borrower_short_home) 

//Limit circulation access to ILL accounts to the ILL account's home library 
  $('#circ_circulation, #pat_moremember').each(function() { 
    var restricted_borrower_category = "ILL";
    console.log('restricted_borrower_category', restricted_borrower_category);
    if ($('.logged-in-branch-name:not(:contains(' + borrower_short_home + '))', this).length && $('.patroninfo .patroncategory:contains(' + restricted_borrower_category + ')', this).length) { 
      $('#circ_circulation_issue > *, #patronlists, #finesholdsissues, #menu li:contains("Batch check out")').hide();
      $('#circ_circulation_issue, #patron-information').before('<h1 class="next_label_yellow">Circulation on this account is limited to staff at ' + borrower_home + '</h1>');
    } 
  }); 
```

Put this in your IntranetUserCSS system preference:

```css
  .next_label_yellow {
    background: #efe18f;
    color: black;
    padding-left: .75em;
    padding-top: .25em;
    padding-right: .75em;
    padding-bottom: .25em;
    border-radius: 16px;
    display: inline-block;
    font-weight: normal;
    line-height: 1.5;
    margin-bottom: 0;
    text-align: center;
    vertical-align: middle;
    white-space: nowrap;
  }
```

Write here to add