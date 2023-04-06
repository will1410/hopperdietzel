# Library contact sheet

We have 54 "branches" in our Koha and a courier system that delivers materials between our libraries.  Staff at 1 library frequently need to contact staff at other libraries.  For years we've maintained a library directory on our system's home page at https://www.nekls.org/

The problem that staff have had with this is that, if you need to contact someone, you need to leave Koha, go to a different website, search through the directory (which includes all 117 of our member libraries - not just the ones using Koha) and search through the member directory to find the library information you need.  It was clunky and awkward and the information that was in the directory did not always match the information in Koha because the library informaiton from the directory is not linked to Koha in any way, shape, or form.

So, in 2017 I created a report that gathered all of the library contact information from the branches table in Koha and laid it out in a table that could be posted into the  IntranetCirculationHomeHTML system preference.  Since this report took some time to run I went ahead and set its cache period for 12 hours.  That way it wouldn't re-run every time the page loaded.

Over time I added some information beyond contact information.  Specifically we had several months where many libraries were working with third party vendors and they were frequently asking me "What was our circulation in previous 12 months?," "How many items does my library own?," and "How many patrons do I have right now?"  By adding to this report I could answer most of these questions with "Go look at your library informaiton on the circulation page."  The report got slower, but it still ran in about 30-40 seconds and it cached for 12 hours, so it wasn't really a problem.

Then in February of 2023 we did a MariaDB upgrade that changed the way the report ran.  Instead of running in 30-40 seconds, it crashed after 5 minutes.  This meant that the report never cached.  This meant that every time someone opened the circulation page, the report tried to run.  This meant that Koha crashed.

The solution was to either monkey around with the settings on MariaDB or to abandon the report as a report.  Since people had come to rely on having that library contact information on the circulation page, I decided the best way to deal with the situation was to re-write the table using the Rest API rather than a report.  This meant two things.  First, it meant that the table would be live.  If I updated something in a library record in Koha, there would no longer be a 12 hour delay in the table update.  Second, it meant that I couldn't include information beyond what's in the library record.  I couldn't have the contact sheet answer the "How many items does my library own?" question any longer.

Here are the steps to re-creat what I've one on my system:

## Change labels on branches.pl

The first part of my process in managing library contact information in Koha is to modify the labels on the "New library/Modify library" pages at **Home > Administration > Libraries > New library** and **Home > Administration > Libraries > Modify library**.

For example, the label on the New/modify page for branches.branchaddress1 is "Address line 1:"  For our system this field is always used for a library's mailing address, so I use jQuery to update that label to "Mailing address:"  "Library address 2:" becomes "Street address/Physical address:"  And "Library address 3:" becomes "Director/ILL contact:"

The full set of labels, their CSS selector, and the database field they relate to in Koha 22.05 are:

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
$('CSS Selector from column B').html('New label text:');
```

So for Next Search Catalog, the jQuery to change "Address line 1:" to "Mailing address:" is:

```javascript
$('#admin_branches.admin label[for="branchaddress1"]').html('Mailing address:');
```

Changing "Country:" to "KLE code:" is:

```javascript
$('#admin_branches.admin label[for="branchcountry"]').html('KLE code:');
```

## Other things I do with the data on branches.pl

Two other things that I currently do with the data in a library record are related to how I've used the report and now the API to display data I want to share in a way that looks good in the table.

For "Address line 3:" that I've renamed "Director/ILL contact:" I separate add the director's name and e-mail address; followed by a space, a pipe, and a space (i.e. " | "); followed by the name of that library's primary ILL contact and e-mail address (if they have a dedicated ILL contact); followed again by a space, pipe, and a space; followed by that library's accredation type.

The pipes allow me to use a search/replace function when I'm building the table so that the pipes become line breaks in the final table output.

The final thing I do on branches.pl is to add an IMG tag to the OPAC information for each library that links to that library's logo (or the Next Search Catalog log if they don't have their own logo).

For example, I enter the logo for the Baldwin City library into the "Opac info" field as:

```html
<p><img src="https://baldwin.mykansaslibrary.org/wp-content/uploads/B.C.L.Rainbow.Logo_.10.2020.3.png" alt="" width="150" height="54" /></p>
```

This way, when the API builds the final table, I can display the library's logo in the contact label.

## Adding a table header to the IntranetCirculationHomeHTML system preference 

In order to have the API take the library information and add it to a table, I need a table somewhere on IntranetCirculationHomeHTML.  To do this I put this HTML somewhere in the IntranetCirculationHomeHTML system preference:

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

    <tbody>
    </tbody>

  </table>

</div>
```

### Step-by-step walk through

The first thing I do is to build a div to hold the data and I'm going give it an id of  "libtable."  This will help me identify the table when I want to do things with it later.

```html
<div id="libtable">

</div>

```

Next I want to create the actual table and I'm going to give it an id of "library_table" and put it inside of the div I just created.

```html
<div id="libtable">
  
  <table id="library_table" class="table table-hover table-bordered">

  </table>

</div>
```
Then I want to add a header and a footer to the table.  HTML includes a "th" element for header elements that adds style to those elements, but in order to get the informaiton in the footer to be styled similarly to the header, it's easiest to add css to make the footer act and look like the header.

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

Finally I add the actual table body tags to the html.  This is where the actual table with display when the code is finished.

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

    <tbody>
    </tbody>

  </table>

</div>
```

