# Repurposing Quote of the Day

At my library we've been creating and updating a lot of training content and moving that content to Aspen Discovery.  It occurred to me that it would be nice to highlight some of the pages we've created somewhere in Koha.  My library already has a jQuery created link to our basic cataloging training in the space below the breadcrumbs on every page in Koha.  That wouldn't be a bad place to put content like this, but that means that someone has to manually go in to the IntranetUserJS system preference every time we want to change the link.  Similaly, I could put it into a news item on the left hand side of the page that requires going in to the news tool and creating a news article and schedule it for each link I wanted to highlight.  I thought, "wouldn't it be nice if there was a way to bulk-upload news items?"

Then it occured to me that there is a tool that I could bulk-upload content to.  The Quote of the day feature.  There are some issues to overcome, but we're not using it for daily quotes, so this seemed like something that could be repurposed for a new use.  This is the process I went through to turn "Quote of the Day" into "Training Tip of the Day" in Koha.

1. First I turned on the quote of the day feature.

    Go to **Home > Administration > System preferences** (/cgi-bin/koha/admin/preferences.pl?tab=opac) the scroll to Features, then QuoteOfTheDay.

    Once there, change the dropdown to staff interface.  This will put the Quote of the day at the bottom of the news column on the Koha home page.

2. Since I didn't like this location for Quote of the day, I wrote this jQuery to move it between the big buttons and above IntranetmainUserblock.  This content goes into your system's IntranetUserJS system preference.

    ```javascript 
    $(document).ready(function() {

      //Move quote of the day to space above intranetmainuserblock
        $('#area-quote').prependTo('#IntranetmainUserblock');

    });
    ```

3. Next, I want to style the quote of the day to match the content on the rest of my site.  In my case I add these pieces to the code from step 1.

    ```javascript 
      //Style quote of the day to match my site's design and centers it in the div
        $('#area-quote, #area-quote .newsitem').css({"background": "#d7ebff", 'color': 'black', 'text-align': 'center', "border-radius": "6px"});

      //Style the quote of the day text to be visible with my background color
        $('#area-quote h3').css({'color': 'black'});
    ```

4. I want "Quote of the day" to read "Training tip of the day."  Adding this code makes that change:

    ```javascript
      //Change "Quote" of the day to "Training tip" of the day
        $('#area-quote h3').each(function () {
          $(this).html($(this).html().replace('Quote', 'Training tip'));
        });
    ```

5. I'm not happy with the text size, so adding these pieces make the text bigger:

    ```javascript 
      //Embiggen quote font size
        $('#daily-quote-text').css({"font-size": "2em"});

      //Embiggen quote source - but not as much as quote
        $('#daily-quote-source').css({"font-size": "1.5em"});
    ```

6. Finally, I want to be able to add HTML to the content in the quote of the day.  Without the ability to render the quote as HTML, there are no links and, therefore, no reason to do any of this.  Getting this content into HTML requires two pieces.

    First, I have a long-standing function in my IntranetUserJS called **toHtml**.

    ```javascript
      //Creates IntranetuserJS.toHtml function
        //Used by IntranetuserJS.html_borrower_messages
        $.fn.toHtml=function(){
          return $(this).html($(this).text());
        };
    ```

    With this in your system, if you have any text that you want render as HTML, you just add .toHtml() to that text.

    In this case, I want to add it to the Quote section of the Quote of the day feature.  This code takes care of that:

    ```javascript
      //Render HTML in the quotes if you want hyperlinks
        $('#daily-quote-text').toHtml();
    ```

7. When you add it all up, it looks like this:

    ```javascript
    $(document).ready(function() {

      //Move quote of the day to space above intranetmainuserblock
        $('#area-quote').prependTo('#IntranetmainUserblock');

      //Style quote of the day to match my site's design and centers it in the div
        $('#area-quote, #area-quote .newsitem').css({"background": "#d7ebff", 'color': 'black', 'text-align': 'center', "border-radius": "6px"});

      //Style the quote of the day text to be visible with my background color
        $('#area-quote h3').css({'color': 'black'});

      //Change "Quote" of the day to "Training tip" of the day
        $('#area-quote h3').each(function () {
          $(this).html($(this).html().replace('Quote', 'Training tip'));
        });

      //Embiggen quote font size
        $('#daily-quote-text').css({"font-size": "2em"});

      //Embiggen quote source - but not as much as quote
        $('#daily-quote-source').css({"font-size": "1.5em"});

      //Creates IntranetuserJS.toHtml function
        //Used by IntranetuserJS.html_borrower_messages
        $.fn.toHtml=function(){
          return $(this).html($(this).text());
        };

      //Render HTML in the quotes if you want hyperlinks
        $('#daily-quote-text').toHtml();

    });
    ```

8. All that's left now is to actually add content to the Quote of the day feature in Koha.  ByWater Solutions did a training page on this feature that you can find on their website at [Using Koha's Quote of the Day Feature](https://bywatersolutions.com/education/using-kohas-quote-of-the-day-feature).

    Using those instructions, you should be able to create training links you can upload in a batch to Koha.