//document ready function - building our house (client side)

function generateRandomData(){
  fetch('/rest/create-random-session', {
    method: 'POST'})
    .then(response => response.json())
    .then(data => {
      const toast = $(`<div class="toast" style="position: absolute; top: 20px; right: 20px;" data-delay="2000">
      <div class="toast-header">
          <strong class="mr-auto">Information</strong>
          <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </button>
      </div>
      <div class="toast-body">
          Created new session "${data.session.name}" for user "${data.user.name}"
      </div>
  </div>`)
      $('#toast-container').append(toast);
      toast.toast('show');
    });
}

$(function () {
  $("#add-random-data").on('click', generateRandomData);

  fetch('/rest/users')
    .then(response => response.json())
    .then(data => {
      const tBody = $('#dynamic-body');
      data.forEach(p => {
        const actualRow = $(`<tr class="accordion-toggle">
			<th scope="row">${p.userid}</th>
			<td>${p.name}</td>
			<td>${p.age}</td>
      <td>
        <button class="btn btn-primary btn-sm" type="button" data-toggle="collapse" data-target="#sessions-${p.userid}" aria-expanded="false" aria-controls="sessions-${p.userid}">Show</button>
      </td>
      </tr>`);
        tBody.append(actualRow);
        const hiddenRow = $(`<tr><td colspan="5" class="hiddenRow" style="padding:0px">
      <div class="collapse" id="sessions-${p.userid}">
      <h4>User: ${p.name} Session Data</h4>
					            	<ol class="session-data"></ol>
					        	</div> 
      </td></tr>`);

        hiddenRow.on('show.bs.collapse', function (e) {
          if (e.target.id.startsWith("sessions")) {
            $(this).find(`#${e.target.id} .session-data`).html(`<div class="spinner-border" role="status">
          <span class="sr-only">Loading...</span>
        </div>`);
          } else {
            $(this).find(`#${e.target.id} .details-data`).html(`<div class="spinner-border" role="status">
          <span class="sr-only">Loading...</span>
        </div>`);
          }

        })
        hiddenRow.on('shown.bs.collapse', function (e) {
          if (e.target.id.startsWith("sessions")) {
            const ol = $(this).find('.session-data');
            fetch(`/rest/users/${p.userid}/sessions`)
              .then(response => response.json())
              .then(data => {
                ol.empty();
                data.forEach(p2 => {
                  const li = $('<li></li>');
                  const strong = $('<strong></strong>');
                  const span = $(`<span class="badge badge-secondary details-toggle">Details</span>`);
                  span.on('click', function () {
                    $(`#details-${p2.sessionid}`).collapse("toggle");
                    fetch(`/rest/usersessions/${p2.sessionid}/details`)
                      .then(response => response.json())
                      .then(data3 => {
                        const innerOl = $(`#details-${p2.sessionid} .details-data`);
                        innerOl.empty();
                        if (data3.length > 0) {
                          data3.forEach(p3 => {
                            innerOl.append(`<li>ID: ${p3.sessiondataid} - Parameters: ${p3.parameter1}, ${p3.parameter2}, ${p3.parameter3}</li>`)
                          })
                        }else{
                          innerOl.append('<li>No detailed data</li>')
                        }
                      });
                  })
                  strong.append(`${p2.name} (ID: ${p2.sessionid})`);
                  strong.append(span);
                  li.append(strong);
                  li.append(`<div class="collapse" id="details-${p2.sessionid}">
                <ul class="details-data"></ul>
              </div>`)
                  ol.append(li);
                })
              });
          }
        });
        tBody.append(hiddenRow)
      });
    });
});