OPAC

DefaultHoldExpirationdate 

//BEGIN Set newly placed holds in OPAC to expire after one year if not filled
  var url = $(location).attr('href');
  if (url.indexOf('opac-reserve.pl') != -1) {
    var holdtodate = new Date();
    var day = ("0" + holdtodate.getDate()).slice(-2);
    var month = ("0" + (holdtodate.getMonth() + 1)).slice(-2);
    var year = ("0" + (holdtodate.getFullYear() + 1)).slice(-4);
    var holdtill = (month) + "/" + (day) + "/" + (year);
    $('#hold-request-form .flatpickr.futuredate.flatpickr-input').val(holdtill);
    $('.toggle-hold-options').hide();
    $('.hold-options').show();
    $('.clear-date').remove();
  }


Staff 

//BEGIN Set newly placed holds in staff client to expire after one year if not filled
  var url = $(location).attr('href');
  if (url.indexOf('request.pl') != -1) {
    var holdtodate = new Date();
    var day = ("0" + holdtodate.getDate()).slice(-2);
    var month = ("0" + (holdtodate.getMonth() + 1)).slice(-2);
    var year = ("0" + (holdtodate.getFullYear() + 1)).slice(-4);
    var holdtill = (month) + "/" + (day) + "/" + (year);
    $('#circ_request #expiration_date').val(holdtill);
  }

  var win_request=$('#circ_request #pickup option[selected="selected"]').val();
  if (win_request == 'WESTWOOD') {
    console.log(win_request);
    $('#reserve_date').val('03/12/2023');
  }

$('#circ_request #pickup').parent().change( function() {
  
  var ide = $('#select2-pickup-container').text();
  if (ide == 'Westwood High School') {
  $('#reserve_date').val('03/12/2023').attr('readonly','true');
  
  $('#reserve_date').flatpickr({
    minDate: new Date("03/12/2023") 
  });

  } else {

  $('#reserve_date').val('');
  $('#reserve_date').removeAttr('readonly');
  $('#reserve_date').removeAttr('data-flatpickr-mindate');

  }

});