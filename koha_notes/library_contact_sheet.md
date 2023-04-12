# Library contact sheet

We have 54 "branches" in our Koha and a courier system that delivers materials between our libraries.  Staff at 1 library frequently need to contact staff at other libraries.  For years we've maintained a library directory on our system's home page at https://www.nekls.org/

The problem that staff have had with this is that, if you need to contact someone, you need to leave Koha, go to a different website, search through the directory (which includes all 117 of our member libraries - not just the ones using Koha) and search through the member directory to find the library information you need.  It was clunky and awkward and the information that was in the directory did not always match the information in Koha because the library informaiton from the directory is not linked to the Koha library information in any way, shape, or form.

So, in 2017 I created a report that gathered all of the library contact information from the branches table in Koha and laid it out in a table that could be posted into the  IntranetCirculationHomeHTML system preference.  Since this report took some time to run I went ahead and set its cache period for 12 hours.  That way it wouldn't re-run every time the page loaded.  It would load once in the morning and then be cached for 12 hours.  This meant that if I made any changed to a library record in Koha, the changes wouldn't be visible until the next day.

Over time I added some information beyond contact information.  Specifically we had several months where many libraries were working with a third party vendor and they were frequently asking me "What was our circulation in previous 12 months?," "How many items does my library own?," and "How many patrons do I have right now?"  By adding to this report I could answer most of these questions with "Go look at your library informaiton on the circulation page."  The report got slower, but it still ran in about 30-40 seconds and it cached for 12 hours, so it wasn't really a problem.

Then in February of 2023 we did a MariaDB upgrade that changed the way the report ran.  Instead of running in 30-40 seconds, it crashed after 5 minutes.  This meant that the report never cached.  This meant that every time someone opened the circulation page, the report tried to run.  When 7 or 8 libraires opened in the morning and tried to go to the circulation page, this meant that Koha crashed.

The solution was to either monkey around with the settings on MariaDB or to abandon the report as a report.  Since people had come to rely on having that library contact information on the circulation page, I decided the best way to deal with the situation was to re-write the table using the Rest API rather than a report.  This meant two things.  First, it meant that the table would be live.  If I updated something in a library record in Koha, there would no longer be a 12 hour delay in the table update.  Second, it meant that I couldn't include information beyond what's in the library record.  I couldn't have the contact sheet answer the "How many items does my library own?" question or other related questions any more.  That seemed like something that was worth sacrificing.

Here are the steps I took to create a library contact table on the circulation page in Next Search Catalog:

## Change labels on branches.pl

The first part of my process in managing library contact information in Koha is to modify the labels on the "New library/Modify library" pages.  The URL for this page sends you to some variation of branche.pl, or to describe it using the Koha breadcrumbs, these pages are **Home > Administration > Libraries > New library** and **Home > Administration > Libraries > Modify library**.

As an example of the types of changes I make to these pages, the label on the New/modify page for branches.branchaddress1 is "Address line 1:"  For our system this field is always used for a library's mailing address, so I use jQuery to update that label to "Mailing address:"  "Library address 2:" becomes "Street address/Physical address:"  And "Library address 3:" becomes "Director/ILL contact:"

The full set of labels, their CSS selectors, and the database fields they relate to in Koha 22.05 are:

| Standard Koha label | CSS selector | Database field | Next Search Catalog |
|--|--|--|--|
| Library code: | #admin_branches.admin label[for="branchcode"] | branches.branchcode |  |
| Name: | #admin_branches.admin label[for="branchname"] | branches.branchname |  |
| Address line 1: | #admin_branches.admin label[for="branchaddress1"] | branches.branchaddress1 | Mailing address: |
| Address line 2: | #admin_branches.admin label[for="branchaddress2"] | branches.branchaddress2 | Street address/Physical address: |
| Address line 3: | #admin_branches.admin label[for="branchaddress3"] | branches.branchaddress3 | Director/ILL contact: |
| City: | #admin_branches.admin label[for="branchcity"] | branches.branchcity |  |
| State: | #admin_branches.admin label[for="branchstate"] | branches.branchstate |  |
| ZIP/Postal code: | #admin_branches.admin label[for="branchzip"] | branches.branchzip |  |
| Country: | #admin_branches.admin label[for="branchcountry"] | branches.branchcountry | KLE code: |
| Phone: | #admin_branches.admin label[for="branchphone"] | branches.branchphone |  |
| Fax: | #admin_branches.admin label[for="branchfax"] | branches.branchfax |  |
| Email: | #admin_branches.admin label[for="branchemail"] | branches.branchemail |  |
| Reply-To: | #admin_branches.admin label[for="branchreplyto"] | branches.branchreplyto |  |
| Return-Path: | #admin_branches.admin label[for="branchreturnpath"] | branches.branchreturnpath |  |
| SMTP server: | #admin_branches.admin label[for="smtp_server"] | smtp_server.name |  |
| URL: | #admin_branches.admin label[for="branchurl"] | branches.branchurl |  |
| OPAC info: | #admin_branches.admin label[for="opac_info"] | branches.opac_info |  |
| IP: | #admin_branches.admin label[for="branchip"] | branches.branchip |  |
| Notes: | #admin_branches.admin label[for="branchnotes"] | branches.branchnotes |  |
| Pickup location: | #admin_branches.admin label[for="pickup_location"] | branches.pickup_location |  |
| Public: | #admin_branches.admin label[for="public"] | branches.public |  |

The formula for using jQuery to re-write any of these labels is to write 

```javascript
$('_CSS_Selector_from_column_B').html('New_label_text');
```

So for Next Search Catalog, the jQuery to change "Address line 1:" to "Mailing address:" is:

```javascript
$('#admin_branches.admin label[for="branchaddress1"]').html('Mailing address:');
```

And changing "Country:" to "KLE code:" is:

```javascript
$('#admin_branches.admin label[for="branchcountry"]').html('KLE code:');
```

## Other things I do with the data on branches.pl

Two other things that I currently do with the data in a library record are related to how I've used the report and now the API to display data I want to share in a way that looks good in the table.

For "Address line 3:" that I've renamed "Director/ILL contact:" I separate add the director's name and e-mail address; followed by a space, a pipe, and a space (i.e. ```" | "```); followed by the name of that library's primary ILL contact and e-mail address (if they have a dedicated ILL contact); followed again by a space, pipe, and a space; followed by that library's accredation type.

The pipes allow me to use a search/replace function when I'm building the table so that the pipes become line breaks in the final table output.

The final thing I do on branches.pl is to add an IMG tag to the OPAC information for each library that links to that library's logo (or the Next Search Catalog log if they don't have their own logo).

For example, I enter the logo for the Baldwin City library into the "Opac info" field as:

```html
<p><img src="https://baldwin.mykansaslibrary.org/wp-content/uploads/B.C.L.Rainbow.Logo_.10.2020.3.png" alt="" width="150" height="54" /></p>
```

This way, when the API builds the final table, I can display the library's logo in the contact table.

## Adding a table header to the IntranetCirculationHomeHTML system preference 

In order to have the API take the library information and add it to a table, I need a table somewhere on IntranetCirculationHomeHTML.  I also have some custom code in my IntranetCirculationHomeHTML that tabs the content in this preference.  How you add this code will depend on what other html you have in this system preference.

For Next Search Catalog I put this HTML somewhere in the IntranetCirculationHomeHTML system preference:

```html
<div id="libtable">

  <div id="libtable" class="dataTables_wrapper">

    <span style="padding: 10px"><input id="myInput" type="text" placeholder="Search.." style="padding: 10px"><a href="#" class="clear" rel="nofollow"><span style="padding: 10px">Clear</span></a></span>
    
    <table id="library_table" class="table table-hover table-bordered">
    
      <thead>
        <tr>
          <th scope="col">Library</th>
          <th scope="col">Contact information</th>
          <th scope="col">Staff contacts / report link</th>
          <th scope="col" class="noprint">Logo/photo</th>
        </tr>
      </thead>

      <tfoot>
        <td scope="row" style="text-align: center; font-weight: 700; background-color: #e8e8e8;">Library</td>
        <td style="text-align: center; font-weight: 700; background-color: #e8e8e8;">Contact information</td>
        <td style="text-align: center; font-weight: 700; background-color: #e8e8e8;">Staff contacts / holdings</td>
        <td style="text-align: center; font-weight: 700; background-color: #e8e8e8;" class="noprint">Logo/photo</td>
      </tfoot>  

    </table>

  </div>

</div>
```

### Step-by-step walk through

#### Step 1

The first thing I do is to build a div to hold the data and I'm going give it an id of  "libtable."  This will help me identify the table when I want to do things with it later.

```html
<div id="libtable">

</div>

```

#### Step 2

Next I want to create the actual table and I'm going to give it an id of "library_table" and put it inside of the div I just created.

```html
<div id="libtable">
  
  <table id="library_table" class="table table-hover table-bordered">

  </table>

</div>
```
#### Step 3

Then I want to add a header and a footer to the table.  HTML includes a "th" element for header elements that adds style to those elements, but in order to get the informaiton in the footer to be styled similarly to the header, it's easiest to add css to make the footer act and look like the header.  I'm adding the css inline in this example rather than adding it to the intranetusercss system preference in Koha so that it's easier to see what I'm doing in this example.

You'll also note that I'm adding a "noprint" class to the logo column which will prevent that cell from being printed if someone tries to print the table from the screen.

```html
<div id="libtable">
  
  <table id="library_table" class="table table-hover table-bordered">

    <thead>
      <tr>
        <th scope="col">Library</th>
        <th scope="col">Contact information</th>
        <th scope="col">Staff contacts / report link</th>
        <th scope="col" class="noprint">Logo/photo</th>
      </tr>
    </thead>

    <tfoot>
      <td scope="row" style="text-align: center; font-weight: 700; background-color: #e8e8e8;">Library</td>
      <td style="text-align: center; font-weight: 700; background-color: #e8e8e8;">Contact information</td>
      <td style="text-align: center; font-weight: 700; background-color: #e8e8e8;">Staff contacts / holdings</td>
      <td style="text-align: center; font-weight: 700; background-color: #e8e8e8;" class="noprint">Logo/photo</td>
    </tfoot>

  </table>

</div>
```

### Step 4

```html
<div id="libtable">

  <!-- I'll explain this line at the end -->
  <div id="libtable" class="dataTables_wrapper">

    <!-- I'll explain this line at the end -->
    <span style="padding: 10px"><input id="myInput" type="text" placeholder="Search.." style="padding: 10px"><a href="#" class="clear" rel="nofollow"><span style="padding: 10px">Clear</span></a></span>
    
    <table id="library_table" class="table table-hover table-bordered">
    
      <thead>
        <tr>
          <th scope="col">Library</th>
          <th scope="col">Contact information</th>
          <th scope="col">Staff contacts / report link</th>
          <th scope="col" class="noprint">Logo/photo</th>
        </tr>
      </thead>

      <tfoot>
        <td scope="row" style="text-align: center; font-weight: 700; background-color: #e8e8e8;">Library</td>
        <td style="text-align: center; font-weight: 700; background-color: #e8e8e8;">Contact information</td>
        <td style="text-align: center; font-weight: 700; background-color: #e8e8e8;">Staff contacts / holdings</td>
        <td style="text-align: center; font-weight: 700; background-color: #e8e8e8;" class="noprint">Logo/photo</td>
      </tfoot>  

    </table>

  <!-- I'll explain this line at the end -->
  </div>

</div>
```

Finally, I'm wrapping the table in a "dataTables_Wrapper" div and adding a search box.  I'll explain that bit at the end of this document.

## Adding the jQuery to IntranetUserJS 

The jQuery that calls up the data from the API and plugs it into the table follows:

```javascript

/* ========== Contact sheet for circulation page ========== */ 

$(document).ready(function () { 

//Home > Circulation 
  //BEGIN - adds contact sheet to "Library contact information" tab in tabbed section of IntranetCirculationHomeHTML system preference 
    var contact_sheet_url = $(location).attr('href'); 
    if (contact_sheet_url.indexOf("circulation-home.pl") != -1) { 

      $.getJSON("/api/v1/libraries", function (data) { 

        var contact_sheet = ''; 

        $.each(data, function (key, value) { 

          var address4 = value.address2 || ''; 
          var physical_address = address4 || value.address1; 
          var fax_machine = value.fax || ''; 
          var zipcode = value.postal_code.substr(0, 5); 
          var director = value.address3.replace(" | ", "</span></p><p><span>").replace(" | ", "</span></p><p><span>").replace(" | ", "</span></p>"); 
          var report_branch = value.library_id.replace(/(DONI)\w+/, 'DONI%').replace(/(PH)\w+/, 'PH%'); 

          contact_sheet += '<tr class="filterme">'; 

          contact_sheet += '<td scope="row"><p style="font-size: 1.5em">' + value.name + '</p><p><ins>Mailing address:</ins></p><p>' + value.address1 + '<br />' + value.city + ', ' + value.state + ' ' + zipcode + '</p><p><ins>Physical address:</ins></p><p>' + physical_address + '<br />' + value.city + ', ' + value.state + '</p><p><ins>Branch code: </ins>' + value.library_id + '</p></td>'; 

          contact_sheet += '<td>'; 

          contact_sheet += '<p>Phone: ' + value.phone + '</p><p>Fax: ' + fax_machine + '</p><p>e-mail: ' + value.email + '</p><p>Courier route #: ' + value.notes + '</p><br /><p class="noprint"><a class="badge btn-sm btn-success" style="color: white;" href="' + value.url + '" target="_blank">Website</a></p>' + '</td>'; 

          contact_sheet += '<td><p><span style="font-size: 1.5em;">' + director + '</span></p><br /><p><a class="btn btn-lg btn-info noprint" style="color: white;" href="/cgi-bin/koha/reports/guided_reports.pl?reports=3716&phase=Run+this+report&param_name=Choose+your+library|ZBRAN&sql_params=' + report_branch + '" target="_blank">Current statistics report for this library</a></p></td>'; 

          contact_sheet += '<td class="noprint"><p>' + value.opac_info + '</span></p></td>'; 

          contact_sheet += '</tr>'; 

        }); 

        $('#library_table th').parent().after(contact_sheet); 

        console.log(contact_sheet); 

      }); 
    } 

    //add filter function to search the table 
    $("#myInput").on("keyup", function () { 
      var value = $(this).val().toLowerCase(); 
      $(".filtertable .filterme").filter(function () { 
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1); 
      }); 
    }); 

    $(".clear").click(function(){ 
      $("#myInput").val("").keyup(); 
      return false; 
    }); 

}); 

/* ========== END Contact sheet for circulation page ========== */ 

```
### Step-by-step walkthrough of the jQuery 

#### Step 1

```javascript

/* ========== Contact sheet for circulation page ========== */ 

$(document).ready(function () { 



}); 

/* ========== END Contact sheet for circulation page ========== */ 

```

These are the basics.  Anything between a ```/* */``` in Javascript or jQuery is a comment, so the first line and the last line are just to help keep track of what this piece of code does in your Koha.  If you don't comment your code you often run into the quesion "What does this code do?" because you will have it in your system so long you can't remember why you wrote it or what it does.

And the ```$(document).ready(function () { /*_jquery_goes_here_*/ }); ``` is the piece of code you need to wrap around any jQuery you write to make it work in Koha.

#### Step 2

```javascript

/* ========== Contact sheet for circulation page ========== */ 

$(document).ready(function () { 

  /* New section for step 2 */
  var contact_sheet_url = $(location).attr('href'); 

  if (contact_sheet_url.indexOf("circulation-home.pl") != -1) {



  }
  /* END New section for step 2 */


}); 

/* ========== END Contact sheet for circulation page ========== */ 

```

The new section for step 2 does two things.  The first creates a variable called "contact_sheet_url" based on the URL of the page you're looking at.

The second section says if "contact_sheet_url" contains the phrase "circulation-home.pl" that Javascript should execute the function that will appear between the {}.

#### Step 3

```javascript

/* ========== Contact sheet for circulation page ========== */ 

$(document).ready(function () { 

  var contact_sheet_url = $(location).attr('href'); 

  if (contact_sheet_url.indexOf("circulation-home.pl") != -1) {


    /* New section for step 3 */
    $.getJSON("/api/v1/libraries", function (data) { 



    }); 
    /* END New section for step 3 */


  }

}); 

/* ========== END Contact sheet for circulation page ========== */ 

```

The new section for step 3 tells Koha that, if we are on "circulation-home.pl" to go ahead and get the "libraries" data from the API.

The API includes two methods for getting library data. "getLibrary" requires a branchcode and gets the data for 1 single library.  "listLibraries" gets the data from all of the libraries in Koha at once.  We want the second method.


#### Step 4

```javascript

/* ========== Contact sheet for circulation page ========== */ 

$(document).ready(function () { 

  var contact_sheet_url = $(location).attr('href'); 

  if (contact_sheet_url.indexOf("circulation-home.pl") != -1) {

    $.getJSON("/api/v1/libraries", function (data) { 


      /* New section for step 4 */
      var contact_sheet = ''; 

      $.each(data, function (key, value) { 



      }); 
      /* END New section for step 4 */


    }); 
    
  }

}); 

/* ========== END Contact sheet for circulation page ========== */ 

```

The new section for step 4 does two things.  

First it creates a new variable called "contact_sheet" and then it sets that variable to a blank space.  In a couple of steps from now we'll start replacing that blank space wtih some data.

Then it says that for each row of API data for libraries, to index rows and extract their values from the api results.

#### Step 5

```javascript

/* ========== Contact sheet for circulation page ========== */ 

$(document).ready(function () { 

  var contact_sheet_url = $(location).attr('href'); 

  if (contact_sheet_url.indexOf("circulation-home.pl") != -1) {

    $.getJSON("/api/v1/libraries", function (data) { 

      var contact_sheet = ''; 

      $.each(data, function (key, value) { 

        /* New section for step 5 */
        
        //Creates a varialbe called "address4" by taking the value of address2 unless address2 is null, in which case, address4 is blank
        var address4 = value.address2 || ''; 

        //Creates a variable called "physical address" which = address4 (i.e. address2 or a blank space) unless address4 is blank, in which case it equals address1
        //This has the effect of making the physical address = the library's mailing address in cases where the library doesn't have a PO Box
        //For those who don't live in  a rural area - many people and libraries in rural areas don't get mail delivery to their homes or offices
        //in many rural parts of the USA you still have to go to the post office to pick up your mail
        var physical_address = address4 || value.address1; 

        //Creates a varialbe called "fax_machine" which is blank if the library doesn't have a separate fax number
        var fax_machine = value.fax || ''; 

        //Creates a varialbe called "zipcode" that strips the extra 4 digits from the library's zip code if it was entered as a 9 digit number
        var zipcode = value.postal_code.substr(0, 5); 

        //Creates a variable called "director" that replaces the pipes (described above) with line breaks to make the data easier to read in the table 
        var director = value.address3.replace(" | ", "</span></p><p><span>").replace(" | ", "</span></p><p><span>").replace(" | ", "</span></p>"); 

        //Craetes a varialbe called "report_branch" which allows the the branchcodes of some of our libraries to be pushed into a report 
        //(which I'll talk about later) so that the report will run for all branches of those libraries instead of one branch at a time
        var report_branch = value.library_id.replace(/(DONI)\w+/, 'DONI%').replace(/(PH)\w+/, 'PH%'); 
        
        /* END New section for step 5 */

      }); 

    }); 
    
  }

}); 

/* ========== END Contact sheet for circulation page ========== */ 

```

This section takes the values that have been indexed and acquired in step 4 and monkeys around with them.  The comments above each line in the code explains what the code here is doing.

An imporant thing to remember here is to remember how jQuery and Javascript deal with null values.  If address2 is blank and you ask jQuery to show you address2, you'll get a result that says "NaN" (i.e. Not a Number) where you may have been hoping for a simple blank space.  In order to get the blank space you're hoping for you have to tell jQuery that if address2 is null, then you want a "" instead of a "NaN" error message.

That's accomplished by saying ```var VariableName = value.fieldname || '';``` i.e. create a variable and give it a value that equals the value of the field I want OR give me a blank space is the field I want is null.

#### Step 6

```javascript

/* ========== Contact sheet for circulation page ========== */ 

$(document).ready(function () { 

  var contact_sheet_url = $(location).attr('href'); 

  if (contact_sheet_url.indexOf("circulation-home.pl") != -1) {

    $.getJSON("/api/v1/libraries", function (data) { 

      var contact_sheet = ''; 

      $.each(data, function (key, value) { 

        var address4 = value.address2 || ''; 
        var physical_address = address4 || value.address1; 
        var fax_machine = value.fax || ''; 
        var zipcode = value.postal_code.substr(0, 5); 
        var director = value.address3.replace(" | ", "</span></p><p><span>").replace(" | ", "</span></p><p><span>").replace(" | ", "</span></p>"); 
        var report_branch = value.library_id.replace(/(DONI)\w+/, 'DONI%').replace(/(PH)\w+/, 'PH%'); 
        
        /* New section for step 6 */
        contact_sheet += '<tr class="filterme">'; 

          contact_sheet += '<td scope="row"><p style="font-size: 1.5em">' + value.name + '</p><p><ins>Mailing address:</ins></p><p>' + value.address1 + '<br />' + value.city + ', ' + value.state + ' ' + zipcode + '</p><p><ins>Physical address:</ins></p><p>' + physical_address + '<br />' + value.city + ', ' + value.state + '</p><p><ins>Branch code: </ins>' + value.library_id + '</p></td>'; 

          contact_sheet += '<td>'; 

          contact_sheet += '<p>Phone: ' + value.phone + '</p><p>Fax: ' + fax_machine + '</p><p>e-mail: ' + value.email + '</p><p>Courier route #: ' + value.notes + '</p><br /><p class="noprint"><a class="badge btn-sm btn-success" style="color: white;" href="' + value.url + '" target="_blank">Website</a></p>' + '</td>'; 

          contact_sheet += '<td><p><span style="font-size: 1.5em;">' + director + '</span></p><br /><p><a class="btn btn-lg btn-info noprint" style="color: white;" href="/cgi-bin/koha/reports/guided_reports.pl?reports=3716&phase=Run+this+report&param_name=Choose+your+library|ZBRAN&sql_params=' + report_branch + '" target="_blank">Current statistics report for this library</a></p></td>'; 

          contact_sheet += '<td class="noprint"><p>' + value.opac_info + '</span></p></td>'; 

          contact_sheet += '</tr>'; 
        /* END New section for step 6 */


      }); 

    }); 
    
  }

}); 

/* ========== END Contact sheet for circulation page ========== */ 

```

This section does the bulk of the work of creating the table.  Each time you see "contact_sheet +=" the code is adding the variables from the API and the html in single quotes into the table.

"contact_sheet" is the variable created in step 4.  So the first step is to add "<tr class="filterme">" to that varialbe.  Then the next line adds the html to build the table along with the data from the api to that variable, and so on, and so on.  Each "+=" appends the HTML (i.e. the stuff in single quotes) and the variables (i.e. the stuff between the + signs) to the "contact_sheet" variable.

#### Step 7

```javascript

/* ========== Contact sheet for circulation page ========== */ 

$(document).ready(function () { 

  var contact_sheet_url = $(location).attr('href'); 

  if (contact_sheet_url.indexOf("circulation-home.pl") != -1) {

    $.getJSON("/api/v1/libraries", function (data) { 

      var contact_sheet = ''; 

      $.each(data, function (key, value) { 

        var address4 = value.address2 || ''; 
        var physical_address = address4 || value.address1; 
        var fax_machine = value.fax || ''; 
        var zipcode = value.postal_code.substr(0, 5); 
        var director = value.address3.replace(" | ", "</span></p><p><span>").replace(" | ", "</span></p><p><span>").replace(" | ", "</span></p>"); 
        var report_branch = value.library_id.replace(/(DONI)\w+/, 'DONI%').replace(/(PH)\w+/, 'PH%'); 
        

        contact_sheet += '<tr class="filterme">'; 

          contact_sheet += '<td scope="row"><p style="font-size: 1.5em">' + value.name + '</p><p><ins>Mailing address:</ins></p><p>' + value.address1 + '<br />' + value.city + ', ' + value.state + ' ' + zipcode + '</p><p><ins>Physical address:</ins></p><p>' + physical_address + '<br />' + value.city + ', ' + value.state + '</p><p><ins>Branch code: </ins>' + value.library_id + '</p></td>'; 

          contact_sheet += '<td>'; 

          contact_sheet += '<p>Phone: ' + value.phone + '</p><p>Fax: ' + fax_machine + '</p><p>e-mail: ' + value.email + '</p><p>Courier route #: ' + value.notes + '</p><br /><p class="noprint"><a class="badge btn-sm btn-success" style="color: white;" href="' + value.url + '" target="_blank">Website</a></p>' + '</td>'; 

          contact_sheet += '<td><p><span style="font-size: 1.5em;">' + director + '</span></p><br /><p><a class="btn btn-lg btn-info noprint" style="color: white;" href="/cgi-bin/koha/reports/guided_reports.pl?reports=3716&phase=Run+this+report&param_name=Choose+your+library|ZBRAN&sql_params=' + report_branch + '" target="_blank">Current statistics report for this library</a></p></td>'; 

          contact_sheet += '<td class="noprint"><p>' + value.opac_info + '</span></p></td>'; 

          contact_sheet += '</tr>'; 

        /* New section for step 7 */
        $('#library_table th').parent().after(contact_sheet); 

        console.log(contact_sheet);
        /* END New section for step 7 */


      }); 

    }); 
    
  }

}); 

/* ========== END Contact sheet for circulation page ========== */ 

```

All the steps up to this point built the variable that contains the table data.  This step does two things.

First it pushes all of the data from the "contact_sheet" varialbe into the table.

Second it puts all of that data into the console.  This step is not necessary for the final version of this code.  The reason I've logged it into the console in this code is that it gives you a good way of looking at what the code is doing, which makes it easier to troubleshoot the code while you're writing it.

#### Step 8

```javascript

/* ========== Contact sheet for circulation page ========== */ 

$(document).ready(function () { 

//Home > Circulation 
  //BEGIN - adds contact sheet to "Library contact information" tab in tabbed section of IntranetCirculationHomeHTML system preference 
    var contact_sheet_url = $(location).attr('href'); 
    if (contact_sheet_url.indexOf("circulation-home.pl") != -1) { 

      $.getJSON("/api/v1/libraries", function (data) { 

        var contact_sheet = ''; 

        $.each(data, function (key, value) { 

          var address4 = value.address2 || ''; 
          var physical_address = address4 || value.address1; 
          var fax_machine = value.fax || ''; 
          var zipcode = value.postal_code.substr(0, 5); 
          var director = value.address3.replace(" | ", "</span></p><p><span>").replace(" | ", "</span></p><p><span>").replace(" | ", "</span></p>"); 
          var report_branch = value.library_id.replace(/(DONI)\w+/, 'DONI%').replace(/(PH)\w+/, 'PH%'); 

          contact_sheet += '<tr class="filterme">'; 

          contact_sheet += '<td scope="row"><p style="font-size: 1.5em">' + value.name + '</p><p><ins>Mailing address:</ins></p><p>' + value.address1 + '<br />' + value.city + ', ' + value.state + ' ' + zipcode + '</p><p><ins>Physical address:</ins></p><p>' + physical_address + '<br />' + value.city + ', ' + value.state + '</p><p><ins>Branch code: </ins>' + value.library_id + '</p></td>'; 

          contact_sheet += '<td>'; 

          contact_sheet += '<p>Phone: ' + value.phone + '</p><p>Fax: ' + fax_machine + '</p><p>e-mail: ' + value.email + '</p><p>Courier route #: ' + value.notes + '</p><br /><p class="noprint"><a class="badge btn-sm btn-success" style="color: white;" href="' + value.url + '" target="_blank">Website</a></p>' + '</td>'; 

          contact_sheet += '<td><p><span style="font-size: 1.5em;">' + director + '</span></p><br /><p><a class="btn btn-lg btn-info noprint" style="color: white;" href="/cgi-bin/koha/reports/guided_reports.pl?reports=3716&phase=Run+this+report&param_name=Choose+your+library|ZBRAN&sql_params=' + report_branch + '" target="_blank">Current statistics report for this library</a></p></td>'; 

          contact_sheet += '<td class="noprint"><p>' + value.opac_info + '</span></p></td>'; 

          contact_sheet += '</tr>'; 

        }); 

        $('#library_table th').parent().after(contact_sheet); 

        console.log(contact_sheet); 

      }); 
    } 

    /* New section for step 8 */
    //add filter function to search the table 
    $("#myInput").on("keyup", function () { 
      var value = $(this).val().toLowerCase(); 
      $(".filtertable .filterme").filter(function () { 
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1); 
      }); 
    }); 

    $(".clear").click(function(){ 
      $("#myInput").val("").keyup(); 
      return false; 
    }); 
    /* New section for step 8 */

}); 

/* ========== END Contact sheet for circulation page ========== */ 

```

I'll explain this part of the code at the end.  This has to do with adding a search function to the table.

## Adding a link to a report

Something you may have noticed in the code is that there is link to a report.  Specifically that code is ```"/cgi-bin/koha/reports/guided_reports.pl?reports=3716&phase=Run+this+report&param_name=Choose+your+library|ZBRAN&sql_params=' + report_branch + '"```

When I had this table building from a report, I was able to fill the report with some data directly from Koha and that's part of why the report broke (trying to get too much data).  Since I can't pump that report data into the table from the API, I wrote a report and then I use the API to create a link to that report here on the table, so that if someone is looking at the table, they can click on a link to run the report for their library.

In my system that report is number 3716.  The SQL for this report is:

```sql

SELECT
  branches.branchname,
  'Current borrowers' AS STATISTIC,
  coalesce(Count(DISTINCT borrowers.borrowernumber), 0) AS Count
FROM
  branches LEFT JOIN
  borrowers ON borrowers.branchcode = branches.branchcode
WHERE
  branches.branchcode LIKE <<Choose your library|branches>>
GROUP BY
  branches.branchname
UNION
SELECT
  branches.branchname,
  'Current titles' AS STATISTIC,
  coalesce(Count(DISTINCT items.biblionumber), 0) AS Count_biblionumber
FROM
  branches LEFT JOIN
  items ON items.homebranch = branches.branchcode
WHERE
  branches.branchcode LIKE <<Choose your library|branches>>
GROUP BY
  branches.branchname
UNION
SELECT
  branches.branchname,
  'Current items' AS STATISTIC,
  coalesce(Count(DISTINCT items.itemnumber), 0) AS Count_itemnumber
FROM
  branches LEFT JOIN
  items ON items.homebranch = branches.branchcode
WHERE
  branches.branchcode LIKE <<Choose your library|branches>>
GROUP BY
  branches.branchname
UNION
SELECT
  branches.branchname,
  'Checkouts + renewals - previous 365 days' AS STATISTIC,
  coalesce(Count(*), 0)
FROM
  branches LEFT JOIN
  statistics ON statistics.branch = branches.branchcode
WHERE
  branches.branchcode LIKE <<Choose your library|branches>> AND
  (statistics.type = 'issue' OR
    statistics.type = 'renew') AND
  statistics.datetime BETWEEN CurDate() - INTERVAL 1 YEAR AND CurDate()
GROUP BY
  branches.branchname
UNION
SELECT
  branches.branchname,
  'Unique borrowers - previous 365 days' AS STATISTIC,
  coalesce(Count(DISTINCT statistics.borrowernumber), 0) AS Count_borrowernumber
FROM
  branches LEFT JOIN
  statistics ON statistics.branch = branches.branchcode
WHERE
  branches.branchcode LIKE <<Choose your library|branches>> AND
  (statistics.type = 'issue' OR
    statistics.type = 'renew') AND
  statistics.datetime BETWEEN CurDate() - INTERVAL 1 YEAR AND CurDate()
GROUP BY
  branches.branchname
ORDER BY
  branchname

```

To add this report to your contact sheet you would need to add the report to Koha and then get the report ID number that Koha assigns to that report in your system and replace that number in the URL that is being built by this jQuery (i.e. ```"/cgi-bin/koha/reports/guided_reports.pl?reports=_yourReportNumberHere_&phase=Run+this+report&param_name=Choose+your+library|branches&sql_params=' + report_branch + '"```)

## Adding a search box to the table

The last piece of this I mentioned briefly twice before includes the following pieces of HTML and jQuery:

```html

<div id="libtable" class="dataTables_wrapper">

  <span style="padding: 10px"><input id="myInput" type="text" placeholder="Search.." style="padding: 10px"><a href="#" class="clear" rel="nofollow"><span style="padding: 10px">Clear</span></a></span>

</div>


```

```javascript

    //add filter function to search the table 
    $("#myInput").on("keyup", function () { 
      var value = $(this).val().toLowerCase(); 
      $(".filtertable .filterme").filter(function () { 
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1); 
      }); 
    }); 

    $(".clear").click(function(){ 
      $("#myInput").val("").keyup(); 
      return false; 
    }); 


```

The HTML gets wrapped around the <table> element and it adds a search box and a "Clear" element right at the top of the table.

The jQuery element adds a search function to the search box so that, when you type a string into the search box, the rows in the table that do not contain that string will be hidden from the table.

On my Koha this means that if I want the contact information for "Winchester Public Library," instead of scrolling all the way to the bottom of the table, I can just type "Winchester" into the search box and the only rows of the table I'll see are the rows that include the word "Winchester."  Clicking on the "Clear" button resets the table back to its full length.

This search/filter function is based on code by Christopher Brannon available at <a href="https://wiki.koha-community.org/wiki/JQuery_Library#Add_a_filter_to_the_patron_various_tables_in_staff_interface" target="_blank">https://wiki.koha-community.org/wiki/JQuery_Library#Add_a_filter_to_the_patron_various_tables_in_staff_interface</a>

## Conclusion

As always, the content of this page is freely available for you to use in your Koha and I hope you are able to use it and change it to work for your library.