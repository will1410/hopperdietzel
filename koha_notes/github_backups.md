## Using GitHub to backup data from Koha

At the 2018 KohaCon in Portland, Oregon, Joy Nelson and I were talking about data and how she had used the term "data lakes" in a presentation she had done.  I told her that I was using GitHub as a "data pond" for storing things that I wanted to back up outside of Koha.  Here's the exact situation I was trying to deal with.

In 2016 I started working for Northeast Kansas Library System and one of the things I inherited in the Koha that NEKLS is using for our shared catalog was over 1800 reports.  The way that we ended up with 1800 reports is simple.  Next Search Catalog used to have 4 or 5 people managing Koha on behalf of the 40+ member libraries.  A staff member from one of the libraries (let's say ATCHISON) would call the NEKLS office and speak to Jim and ask "Could you write a report that shows me all of the items at our library that have never checked out" and Jim would write that report (or ask ByWater Solutions to write that report for him).  The report would get added to Koha and Jim would give it a name like "Report for ATCHISON."  Then, a week later a different library (let's say OTTAW) would call the office and speak to Heather and ask "Could you write a report that shows me all of the items at our library that have never checked out" and Heather would write that report and give it a title like "Report for OTTAWA."  So when I arrived at NEKLS, I inherited 1800 reports that mostly had no notes and no titles that said anything about what the report did and were written by 5 or 6 different people.

My solution was to go through the reports table and look for any reports that had not been run in a significantly long time and then I'd delete them.  I also tried to give names to existing reports and to write descriptions that made sense.  I'm not joking when I say that one of the reports I deleted was called "Not sure" and had a description of "?"  I never did figure out what that one was supposed to have done.

Invariably what happened is that I would delete a report that hadn't been run in 2 years and that didn't make any sense and then 2 days later I would get a phone call from someone saying "What happened to my super special report that Liz wrote for me in 2009?  I need to run that report every time we have a month that has an 'R' and five Tuesdays in it.  Do you know what happened to my super-special report?"  Then I'd have to go and figure out how to re-write that report.

Like many ideas I come up with, my path to solving the problem I was having was to write a report.  I figured that I could write a Koha report that gathers all of the SQL I have stored in Koha and put that data into a csv file.  Then, I could use a visual basic macro in Excel to take the data from my new report and save the data I was collecting into text files that I could open and easily understand and share with other people.  And the venue I found for storing that data outside of Koha was by creating, not a big data lake, but a smaller data pond using GitHub.

I started off with backing up SQL reports once a month or so, then I added Notices and Slips not too long afterwards because we have over 1000 notices at NEKLS.  Most recently I added system preferences.  And these backups have changed over time.  In addition to backing up all of my raw SQL I now also back up my authorised values tables along with my SQL data.

You can find two of these repositories at:

[SQL](https://github.com/northeast-kansas-library-system/nextkansas.sql)

[Notices and slips](https://github.com/northeast-kansas-library-system/nextkansas-notices-and-slips)

For both of these repositories, if you scroll down to the readme.md files, you'll find the instructions for how to run these backups.

My system preference backups are not accessible to the public, though.  System preferences contain some confidential information.  Specifically in my case there is some confidential usernames and passwords in the enhanced content preferences.

Instead of including a link to those instructions, I'm including those instructions here:

```



```
