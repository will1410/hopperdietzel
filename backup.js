//Change "All" to "All borrowers"
  $('#default-circulation-rules tr td:nth-child(1) em:contains("All")').html('All borrowers');

//BEGIN Highligh rows containing "All"
  $('#default-circulation-rules tr td:nth-child(1):contains("All"), #default-circulation-rules tr td:nth-child(2):contains("All")').css('background', '#ffb3ff');




//BEGIN Hide unneeded columns in circulation rules by clicking on header (--requires corresponding css--)
  $("#default-circulation-rules thead th").append("<br /><br /><span>Hide<br />Column</span>");
  $('#default-circulation-rules thead th').click(function() {
    var index = (this.cellIndex + 1);
    var cells = $('#default-circulation-rules tr > :nth-child(' + index + ')');
    cells.toggleClass('hiderule');
    if ($(this).hasClass('hiderule')) {
      $(this).find('span').html('+');
    } else {
      $(this).find('span').html('Hide<br />Column');
    }
    if ($('table tr > th:not(.collapsed)').length)
      $('table').removeClass('collapsed');
    else
      $('table').addClass('collapsed');
  });


//Hide 'Patron category' row by default
  //$('#default-circulation-rules th:nth-child(1), #default-circulation-rules td:nth-child(1)').addClass('hiderule');
//Hide 'Item type' row by default
  //$('#default-circulation-rules th:nth-child(2), #default-circulation-rules td:nth-child(2)').addClass('hiderule');
//Hide 'Actions (1)' row by default
  //$('#default-circulation-rules th:nth-child(3), #default-circulation-rules td:nth-child(3)').addClass('hiderule');
//Hide 'Note' row by default
  //$('#default-circulation-rules th:nth-child(4), #default-circulation-rules td:nth-child(4)').addClass('hiderule');
//Hide 'Current checkouts allowed' row by default
  //$('#default-circulation-rules th:nth-child(5), #default-circulation-rules td:nth-child(5)').addClass('hiderule');
//Hide 'Current on-site checkouts allowed' row by default
  //$('#default-circulation-rules th:nth-child(6), #default-circulation-rules td:nth-child(6)').addClass('hiderule');
//Hide 'Loan period' row by default
  //$('#default-circulation-rules th:nth-child(7), #default-circulation-rules td:nth-child(7)').addClass('hiderule');
//Hide 'Days mode' row by default
  $('#default-circulation-rules th:nth-child(8), #default-circulation-rules td:nth-child(8)').addClass('hiderule');
//Hide 'Unit' row by default
  //$('#default-circulation-rules th:nth-child(9), #default-circulation-rules td:nth-child(9)').addClass('hiderule');
//Hide 'Hard due date' row by default
  //$('#default-circulation-rules th:nth-child(10), #default-circulation-rules td:nth-child(10)').addClass('hiderule');
//Hide 'Decreased loan period for high holds (day)' row by default
  $('#default-circulation-rules th:nth-child(11), #default-circulation-rules td:nth-child(11)').addClass('hiderule');
//Hide 'Fine amount' row by default
  //$('#default-circulation-rules th:nth-child(12), #default-circulation-rules td:nth-child(12)').addClass('hiderule');
//Hide 'Fine charging interval' row by default
  //$('#default-circulation-rules th:nth-child(13), #default-circulation-rules td:nth-child(13)').addClass('hiderule');
//Hide 'When to charge' row by default
  //$('#default-circulation-rules th:nth-child(14), #default-circulation-rules td:nth-child(14)').addClass('hiderule');
//Hide 'Fine grace period' row by default
  //$('#default-circulation-rules th:nth-child(15), #default-circulation-rules td:nth-child(15)').addClass('hiderule');
//Hide 'Overdue fines cap (amount)' row by default
  //$('#default-circulation-rules th:nth-child(16), #default-circulation-rules td:nth-child(16)').addClass('hiderule');
//Hide 'Cap fine at replacement price' row by default
  $('#default-circulation-rules th:nth-child(17), #default-circulation-rules td:nth-child(17)').addClass('hiderule');
//Hide 'Suspension in days (day)' row by default
  $('#default-circulation-rules th:nth-child(18), #default-circulation-rules td:nth-child(18)').addClass('hiderule');
//Hide 'Max. suspension duration (day)' row by default
  $('#default-circulation-rules th:nth-child(19), #default-circulation-rules td:nth-child(19)').addClass('hiderule');
//Hide 'Suspension charging interval' row by default
  $('#default-circulation-rules th:nth-child(20), #default-circulation-rules td:nth-child(20)').addClass('hiderule');
//Hide 'Renewals allowed (count)' row by default
  //$('#default-circulation-rules th:nth-child(21), #default-circulation-rules td:nth-child(21)').addClass('hiderule');
//Hide 'Renewal period' row by default
  //$('#default-circulation-rules th:nth-child(22), #default-circulation-rules td:nth-child(22)').addClass('hiderule');
//Hide 'No renewal before' row by default
  $('#default-circulation-rules th:nth-child(23), #default-circulation-rules td:nth-child(23)').addClass('hiderule');
//Hide 'Automatic renewal' row by default
  $('#default-circulation-rules th:nth-child(24), #default-circulation-rules td:nth-child(24)').addClass('hiderule');
//Hide 'No automatic renewal after' row by default
  $('#default-circulation-rules th:nth-child(25), #default-circulation-rules td:nth-child(25)').addClass('hiderule');
//Hide 'No automatic renewal after (hard limit)' row by default
  $('#default-circulation-rules th:nth-child(26), #default-circulation-rules td:nth-child(26)').addClass('hiderule');
//Hide 'Holds allowed (total)' row by default
  //$('#default-circulation-rules th:nth-child(27), #default-circulation-rules td:nth-child(27)').addClass('hiderule');
//Hide 'Holds allowed (daily)' row by default
  //$('#default-circulation-rules th:nth-child(28), #default-circulation-rules td:nth-child(28)').addClass('hiderule');
//Hide 'Holds per record (count)' row by default
  //$('#default-circulation-rules th:nth-child(29), #default-circulation-rules td:nth-child(29)').addClass('hiderule');
//Hide 'On shelf holds allowed' row by default
  //$('#default-circulation-rules th:nth-child(30), #default-circulation-rules td:nth-child(30)').addClass('hiderule');
//Hide 'OPAC item level holds' row by default
  //$('#default-circulation-rules th:nth-child(31), #default-circulation-rules td:nth-child(31)').addClass('hiderule');
//Hide 'Article requests' row by default
  $('#default-circulation-rules th:nth-child(32), #default-circulation-rules td:nth-child(32)').addClass('hiderule');
//Hide 'Rental discount (%)' row by default
  $('#default-circulation-rules th:nth-child(33), #default-circulation-rules td:nth-child(33)').addClass('hiderule');
//Hide 'Actions (2)' row by default
  //$('#default-circulation-rules th:nth-child(34), #default-circulation-rules td:nth-child(34)').addClass('hiderule');


//Replace the text with a + sign on pre-hidden columns
 $("#default-circulation-rules > thead > tr > th.hiderule > span").html("+");

//BEGIN expand when super large or multi screen sized page is loaded
  if ($(window).width() > 1920) {
    $("#navhide, #navmenu, #allshows").hide();
    $(".hiderule").removeClass();
    $(".row .col-sm-10.col-sm-push-2").removeClass("col-sm-push-2");
    $(window).trigger('resize');
  }

//BEGIN expand when window is resized for super large or multi-screen
  $( window ).resize(function() {
    if ($(window).width() > 1920) {
      $("#navhide, #navmenu, #allshows").hide();
      $(".hiderule").removeClass();
      $(".row .col-sm-10.col-sm-push-2").removeClass("col-sm-push-2");
    }
  });

//BEGIN Sort circulation rules by clicking on footer
  $('#default-circulation-rules tfoot tr th').click(function() {
    var table = $(this).parents('table').eq(0);
    var rows = table.find("tbody tr").toArray().sort(comparer($(this).index()));
    this.asc = !this.asc;
    if (!this.asc) {
      rows = rows.reverse();
    }
    for (var i = 0; i < rows.length; i++) {
      table.append(rows[i]);
    }
  });
  function comparer(index) {
    return function(a, b) {
      var valA = getCellValue(a, index),
      valB = getCellValue(b, index);
      return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB);
    };
  }
  function getCellValue(row, index) {
    return $(row).children('td').eq(index).text();
  }
  $("#default-circulation-rules #edit_row").insertBefore("tfoot");
